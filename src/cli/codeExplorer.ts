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
  unCompletedContent: string;
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
    unCompletedContent: "",
  };

  try {
    if (model) BaseService.setModel(model);

    let isComplete = false;
    let loadRequirements = false;
    while (!isComplete && state.attemptCount < MAX_ATTEMPTS) {
      try {
        state.accumulatedData = "";

        if (state.attemptCount === 0) {
          if (!loadRequirements) {
            console.log("🔑 Loading requirements...");

            // const requirementsResponse =
            //   await CodeExplorerService.getRequirements(generationId);
            // const requirements = await requirementsResponse.json();

            // try {
            //   let requirementsJson = requirements.response;
            //   try {
            //     const parsed = JSON.parse(requirementsJson);
            //     if (typeof parsed === "string") {
            //       requirementsJson = parsed;
            //     }
            //   } catch (e) {
            //     console.log("\n⚠️ First parse failed, using original...");
            //     console.log(
            //       "🔍 Original requirements:",
            //       requirements.response.text,
            //     );
            //   }

            //   // Set the requirements in state
            //   state.requirements = JSON.parse(requirementsJson);
            //   state.requirements!.remainingFiles =
            //     state.requirements!.remainingFiles.map(normalizePath);
            //   console.log("\n📋 Requirements loaded:", state.requirements);

            //   // Write requirements file
            //   await fs.writeFile(
            //     "requirements.json",
            //     requirements.response,
            //     "utf8",
            //   );

            //   loadRequirements = true;

            const response =
              await CodeExplorerService.getGenerationStream(generationId);
            await processStreamAndUpdateFiles(response, state);

            if (state.requirements?.remainingFiles.length === 0) {
              console.log("\n✅ All files processed successfully!");
              isComplete = true;
              break;
            }
            // } catch (e) {
            //   console.error("\n❌ Error parsing requirements:", e);
            //   throw e;
            // }
          }
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

                Uncompleted content:
                ${state.unCompletedContent}
                
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
  let currentProcessingFile = null;
  let loader = null;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (value) {
        const chunk = decoder.decode(value);
        buffer += chunk;

        while (true) {
          // First check for thinking content
          const thinkingMatch = buffer.match(/<Thinking>(.*?)<\/Thinking>/s);
          if (thinkingMatch) {
            console.log("\n🤔 Thinking:", thinkingMatch[1].trim());
            // Remove the processed thinking block
            buffer = buffer.substring(
              buffer.indexOf("</Thinking>") + "</Thinking>".length,
            );
            continue; // Continue to check for more thinking blocks
          }

          // Then check for file tags
          const fileTagStart = buffer.indexOf("<FileName=");
          if (fileTagStart === -1) break;
          const fileTagEnd = buffer.indexOf(">", fileTagStart);
          if (fileTagEnd === -1) break;

          const fileName = buffer.match(/(?<=<FileName=)[^>]+(?=>)/)?.[0];

          // Only show processing message and start loader if it's a new file
          if (currentProcessingFile !== fileName) {
            if (loader) {
              clearInterval(loader);
            }
            currentProcessingFile = fileName;
            console.log(`\n📄 Processing file: ${fileName}`);
            loader = loadingAnimation();
          }

          const fileNameTagEnd = buffer.indexOf("</FileName>");
          if (fileNameTagEnd === -1) break;

          try {
            const normalizedFileName = normalizePath(fileName!);
            const fileContent = buffer.match(
              /(?<=<FileName=[^>]+>)(.*?)(?=<\/FileName>)/s,
            )?.[0];

            if (!state.completedFiles.has(normalizedFileName)) {
              if (
                normalizedFileName?.includes("requirements.json") ||
                normalizedFileName?.includes("requirement.json")
              ) {
                console.log(
                  "\n🔍 Extracting requirements from file content...",
                );
                const requirements = JSON.parse(fileContent!);
                state.requirements = requirements;
                state.requirements!.remainingFiles =
                  state.requirements!.remainingFiles.map(normalizePath);
                console.log("\n📋 Requirements loaded:", state.requirements);
              }

              await updateFile(normalizedFileName, fileContent!);
              state.completedFiles.add(normalizedFileName);

              if (loader) {
                clearInterval(loader);
                loader = null;
              }

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
              currentProcessingFile = null;
            }

            buffer = buffer.substring(fileNameTagEnd + "</FileName>".length);
          } catch (e) {
            if (loader) {
              clearInterval(loader);
              loader = null;
            }
            console.log("\n⚠️ Error processing file:", e);
            currentProcessingFile = null;
          }
        }
      }

      if (done) {
        if (loader) {
          clearInterval(loader);
          loader = null;
        }
        // Check remaining requirements
        if (state.requirements?.remainingFiles) {
          const remainingRequired = state.requirements.remainingFiles.filter(
            (file) => !state.completedFiles.has(normalizePath(file)),
          );

          state.unCompletedContent = buffer;

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
    if (loader) {
      clearInterval(loader);
    }
    reader.releaseLock();
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
