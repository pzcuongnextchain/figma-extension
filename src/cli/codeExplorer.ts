import fs from "fs/promises";
import path from "path";
import { CodeExplorerService } from "../services/CodeExplorerService.js";
import { AIModel, BaseService } from "../services/base/BaseService.js";

interface GenerationState {
  accumulatedData: string;
  completedFiles: Set<string>;
  attemptCount: number;
  retryCount: number;
  requirements?: { remainingFiles: string[] };
}

const MAX_ATTEMPTS = 3;
const MAX_RETRIES = 5;
const RETRY_DELAY = 0; // 5 seconds

export async function processGenerationAndUpdateFiles(
  generationId: string,
  model?: AIModel,
) {
  const state: GenerationState = {
    accumulatedData: "",
    completedFiles: new Set<string>(),
    attemptCount: 0,
    retryCount: 0,
  };

  try {
    if (model) BaseService.setModel(model);

    let isComplete = false;
    while (!isComplete && state.attemptCount < MAX_ATTEMPTS) {
      try {
        // Reset accumulated data for each new attempt
        state.accumulatedData = "";

        if (state.attemptCount === 0) {
          console.log("🔑 Loading requirements...");

          const requirementsResponse =
            await CodeExplorerService.getRequirements(generationId);
          const requirements = await requirementsResponse.json();

          try {
            let requirementsJson = requirements.response;
            try {
              const parsed = JSON.parse(requirementsJson);
              if (typeof parsed === "string") {
                requirementsJson = parsed;
              }
            } catch (e) {
              console.log("\n⚠️ First parse failed, using original...");
              console.log(
                "🔍 Original requirements:",
                requirements.response.text,
              );
            }

            // Set the requirements in state
            state.requirements = JSON.parse(requirementsJson);
            state.requirements!.remainingFiles =
              state.requirements!.remainingFiles.map(normalizePath);
            console.log("\n📋 Requirements loaded:", state.requirements);

            // Write requirements file
            await fs.writeFile(
              "requirements.json",
              requirements.response,
              "utf8",
            );
          } catch (e) {
            console.error("\n❌ Error parsing requirements:", e);
            throw e;
          }

          const response =
            await CodeExplorerService.getGenerationStream(generationId);
          await processStreamAndUpdateFiles(response, state);
        } else {
          console.log(
            `\n🔄 Attempt ${state.attemptCount + 1} to complete generation...`,
          );

          // Add retry logic for continuation
          while (state.retryCount < MAX_RETRIES) {
            try {
              const completedFilesList = Array.from(state.completedFiles).join(
                ", ",
              );
              const remainingRequired =
                state.requirements?.remainingFiles.filter(
                  (file) => !state.completedFiles.has(file),
                ) || [];

              if (remainingRequired.length === 0) {
                console.log("\n✅ All files processed successfully!");
                isComplete = true;
                break;
              }

              const continueMessage = `Continue generating the remaining files. 
                Already completed files (DO NOT generate these again):
                ${completedFilesList}
                
                Files still needed to be generated:
                ${remainingRequired.join(", ")}
                
                Important: 
                1. Do not repeat any completed files listed above
                2. Focus on generating the missing files listed above
                3. Do not including any text, keep follow rule: <FileName=[]>fileContent</FileName>
                4. Ensure the generated code must be as same as with the design
                5. Do not include any comments or other text that is not part of the code
                6. Only generate ReactJS code, DO NOT use NextJS or any other framework
              `;

              const continuationResponse =
                await CodeExplorerService.streamChatResponse(
                  continueMessage,
                  generationId,
                );

              await processStreamAndUpdateFiles(continuationResponse, state);
              break; // Break retry loop if successful
            } catch (error) {
              console.log("\n❌ Error processing stream:", error);
              state.retryCount++;
              if (state.retryCount < MAX_RETRIES) {
                console.log(
                  `\n⏳ Retry ${state.retryCount}/${MAX_RETRIES} - Waiting ${RETRY_DELAY / 1000}s before next attempt...`,
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, RETRY_DELAY),
                );
              } else {
                throw error;
              }
            }
          }
        }

        // Check if we have a valid complete array
        if (validateAccumulatedData(state.accumulatedData)) {
          console.log("\n✅ All files processed successfully!");
          isComplete = true;
        } else {
          state.attemptCount++;
          state.retryCount = 0; // Reset retry count for new attempt
        }
      } catch (error) {
        if (error instanceof Error && error.message === "INCOMPLETE_CONTENT") {
          state.attemptCount++;
          state.retryCount = 0;
          if (state.attemptCount >= MAX_ATTEMPTS) {
            console.log("\n❌ Max attempts reached");
            throw error;
          }
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    console.error("❌ Error processing generation:", error);
    throw error;
  }
}

function normalizePath(filePath: string): string {
  // Remove leading slash and normalize path separators
  return filePath.replace(/^\/+/, "");
}

async function processStreamAndUpdateFiles(
  response: Response,
  state: GenerationState,
) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (value) {
        const chunk = decoder.decode(value);
        buffer += chunk;

        while (true) {
          const fileTagStart = buffer.indexOf("<FileName=");
          if (fileTagStart === -1) break;
          const fileTagEnd = buffer.indexOf(">", fileTagStart);
          if (fileTagEnd === -1) break;

          console.log(
            "Found file tag:",
            buffer.substring(fileTagStart, fileTagEnd + 1),
          );

          const fileName = buffer.match(
            /(?<=<FileName=["']?)([^>"']+)(?=["']?>)/,
          )?.[0];
          console.log(`\n📄 Processing file: ${fileName}`);

          const fileNameTagEnd = buffer.indexOf("</FileName>");
          if (fileNameTagEnd === -1) break;

          try {
            const normalizedFileName = normalizePath(fileName!);
            const fileContent = buffer.match(
              /(?<=<FileName=[^>]+>)(.*?)(?=<\/FileName>)/s,
            )?.[0];

            console.log("\n📄 Creating file:", normalizedFileName);

            if (!state.completedFiles.has(normalizedFileName)) {
              await updateFile(normalizedFileName, fileContent!);
              state.completedFiles.add(normalizedFileName);

              // Update remaining files in requirements
              if (state.requirements?.remainingFiles) {
                state.requirements.remainingFiles =
                  state.requirements.remainingFiles.filter(
                    (file) => normalizePath(file) !== normalizedFileName,
                  );
                console.log(
                  "\nRemaining files:",
                  state.requirements.remainingFiles,
                );
              }

              console.log(`\n✅ Successfully processed: ${normalizedFileName}`);
              console.log("Completed files:", Array.from(state.completedFiles));
            }

            // Remove the processed file content from the buffer
            buffer = buffer.substring(fileNameTagEnd + "</FileName>".length);
          } catch (e) {
            // If processing fails, remove up to the start of the failed tag to avoid infinite loop
            buffer = buffer.substring(fileTagStart + 1);
            console.log("\n⚠️ Error processing file:", e);
          }
        }
      }

      if (done) {
        // Check remaining requirements
        if (state.requirements?.remainingFiles) {
          const remainingRequired = state.requirements.remainingFiles.filter(
            (file) => !state.completedFiles.has(normalizePath(file)),
          );

          if (remainingRequired.length > 0) {
            console.log(
              "\n⚠️ Still missing required files:",
              remainingRequired,
            );
            throw new Error("INCOMPLETE_CONTENT");
          }
        }

        if (state.completedFiles.size === 0) {
          throw new Error("INCOMPLETE_CONTENT");
        }
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Helper function to validate if we have a complete JSON array
function isCompleteJsonArray(str: string): boolean {
  try {
    const cleaned = str
      .trim()
      .replace(/^```json\s*\n?/, "")
      .replace(/```$/, "")
      .trim();

    if (!cleaned.startsWith("[") || !cleaned.endsWith("]")) {
      return false;
    }

    JSON.parse(cleaned);
    return true;
  } catch (e) {
    return false;
  }
}

// Update validateAccumulatedData to handle markdown code blocks and formatted JSON
function validateAccumulatedData(data: string): boolean {
  try {
    // Clean up the input by removing markdown code block markers
    const cleanData = data
      .trim()
      .replace(/^```(json)?\s*\n?/, "") // Remove opening code block with optional newline
      .replace(/```$/, "") // Remove closing code block
      .trim();

    // Check if we have a complete array
    if (cleanData.match(/^\[\s*\n?\s*{/) && cleanData.match(/}\s*\n?\s*\]$/)) {
      JSON.parse(cleanData);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

async function updateFile(aFileName: string, content: string) {
  try {
    // console.log(`\n📝 About to write file: ${aFileName}`);
    // console.log("Content length:", content.length);
    // console.log("First 100 chars:", content.substring(0, 100));
    const filePath = path.join(process.cwd(), aFileName);
    const dirPath = path.dirname(filePath);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, content, "utf8");
    console.log(`✅ File written successfully: ${aFileName}`);
  } catch (error) {
    console.error(`❌ Error updating file ${aFileName}:`, error);
    console.error("📝 Debug - Content that failed:", content);
    throw error;
  }
}

function loadingAnimation() {
  const P = ["\\", "|", "/", "-"];
  let x = 0;
  const loader = setInterval(() => {
    process.stdout.write(`\r${P[x++]}`);
    x %= P.length;
  }, 250);

  setTimeout(() => {
    clearInterval(loader);
  }, 5000);

  return loader;
}
