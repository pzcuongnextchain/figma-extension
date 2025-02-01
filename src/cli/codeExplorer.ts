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
const RETRY_DELAY = 5000; // 5 seconds

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
    if (model) {
      BaseService.setModel(model);
    }

    let isComplete = false;
    while (!isComplete && state.attemptCount < MAX_ATTEMPTS) {
      try {
        // Reset accumulated data for each new attempt
        state.accumulatedData = "";

        if (state.attemptCount === 0) {
          console.log("Fetching initial generation data...");
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
                2. Start fresh with a new array
                3. Focus on generating the missing files listed above
                4. Do not including any text, keep follow rule: [{aFileName,fileContent}]
                5. Ensure the generated code must be as same as with the design
                6. Do not include any comments or other text that is not part of the code
                7. Only generate ReactJS code, DO NOT use NextJS or any other framework
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
        console.log("\n📥 Received chunk:", chunk.substring(0, 100) + "...");

        // Try to find complete JSON objects in the buffer
        let startIdx = -1;
        const jsonMarkerIdx = buffer.indexOf("```json");

        if (jsonMarkerIdx !== -1) {
          console.log("\n🔍 Found ```json marker at:", jsonMarkerIdx);
          // Look for the actual array start after ```json
          const arrayStart = buffer.indexOf("[", jsonMarkerIdx);
          if (arrayStart !== -1) {
            console.log("📍 Found array start at:", arrayStart);
            startIdx = jsonMarkerIdx;
          }
        } else {
          startIdx = buffer.indexOf("[");
          if (startIdx !== -1) {
            console.log("\n📍 Found direct array start at:", startIdx);
          }
        }

        if (startIdx !== -1) {
          let endIdx = -1;
          let depth = 0;
          let inString = false;
          let escape = false;
          let foundArrayStart = false;

          for (let i = startIdx; i < buffer.length; i++) {
            const char = buffer[i];

            if (!foundArrayStart) {
              if (char === "[") {
                foundArrayStart = true;
                depth++;
                console.log("\n📊 Found array start, depth:", depth);
              }
              continue;
            }

            if (escape) {
              escape = false;
              continue;
            }

            if (char === "\\") {
              escape = true;
            } else if (char === '"' && !escape) {
              inString = !inString;
            } else if (!inString) {
              if (char === "[") {
                depth++;
                console.log("📊 Depth increased:", depth);
              }
              if (char === "]") {
                depth--;
                console.log("📊 Depth decreased:", depth);
                if (depth === 0) {
                  const possibleEnd = buffer.indexOf("```", i);
                  if (possibleEnd !== -1) {
                    endIdx = possibleEnd + 3;
                    console.log(
                      "\n🎯 Found end with code block at:",
                      possibleEnd,
                    );
                  } else {
                    endIdx = i + 1;
                    console.log("\n🎯 Found end at bracket:", i);
                  }
                  break;
                }
              }
            }
          }

          if (endIdx !== -1) {
            let jsonStr = buffer.substring(startIdx, endIdx);
            console.log(
              "\n Raw extracted JSON (first 100 chars):",
              JSON.stringify(jsonStr.substring(0, 100)),
            );

            // Remove markdown code block markers if present
            jsonStr = jsonStr
              .replace(/^```json\s*(\r?\n|\r)?/, "")
              .replace(/(\r?\n|\r)?\s*```$/, "")
              .trim();

            // Use JSON.stringify to show the actual string content with escapes
            console.log("\n🧹 Cleaned JSON (raw):", JSON.stringify(jsonStr));

            try {
              // Handle the case where the string might be a JSON-encoded string
              let parseableJson = jsonStr;
              try {
                // If it's a JSON string, parse it first
                if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
                  parseableJson = JSON.parse(jsonStr);
                }
              } catch (e) {
                console.log(
                  "\n⚠️ Initial string parse failed, trying direct parse...",
                );
              }

              try {
                // Now try to parse the JSON data
                const jsonData = JSON.parse(parseableJson);
                console.log("\n✅ Successfully parsed outer JSON");

                if (Array.isArray(jsonData)) {
                  for (const obj of jsonData) {
                    if (obj.aFileName && typeof obj.fileContent === "string") {
                      const normalizedFileName = normalizePath(obj.aFileName);
                      console.log("\n📄 Processing file:", normalizedFileName);
                      console.log(
                        "📄 Raw fileContent length:",
                        obj.fileContent.length,
                      );

                      if (!state.completedFiles.has(normalizedFileName)) {
                        // Handle requirements.json specially when it's the first file
                        if (
                          normalizedFileName.includes("requirements.json") ||
                          (normalizedFileName.includes("requirement.json") &&
                            state.completedFiles.size === 0)
                        ) {
                          try {
                            let requirementsJson = obj.fileContent;

                            // If the content is a string containing JSON, parse it
                            try {
                              const parsed = JSON.parse(requirementsJson);
                              if (typeof parsed === "string") {
                                requirementsJson = parsed;
                              }
                            } catch (e) {
                              // If parsing fails, use the original string
                              console.log(
                                "\n⚠️ First parse failed, using original...",
                              );
                            }

                            // Final parse to get the requirements object
                            state.requirements = JSON.parse(requirementsJson);

                            // Normalize all paths in requirements
                            state.requirements!.remainingFiles =
                              state.requirements!.remainingFiles.map(
                                normalizePath,
                              );
                            console.log(
                              "\n📋 Requirements loaded:",
                              state.requirements,
                            );
                          } catch (e) {
                            console.error(
                              "\n❌ Error parsing requirements.json:",
                              e,
                              "\nContent type:",
                              typeof obj.fileContent,
                              "\nContent length:",
                              obj.fileContent.length,
                            );
                          }
                        }

                        await updateFile(normalizedFileName, obj.fileContent);
                        state.completedFiles.add(normalizedFileName);

                        // Update remaining files in requirements
                        if (state.requirements?.remainingFiles) {
                          state.requirements.remainingFiles =
                            state.requirements.remainingFiles.filter(
                              (file) =>
                                normalizePath(file) !== normalizedFileName,
                            );
                          console.log(
                            "\nRemaining files:",
                            state.requirements.remainingFiles,
                          );
                        }

                        console.log(
                          `\n✅ Successfully processed: ${normalizedFileName}`,
                        );
                        console.log(
                          "Completed files:",
                          Array.from(state.completedFiles),
                        );
                      }
                    }
                  }
                }
              } catch (e) {
                console.log("\n⚠️ Invalid JSON data, continuing to buffer...");
              }

              // Remove processed data from buffer
              buffer = buffer.substring(endIdx);
            } catch (e) {
              console.log("\n⚠️ Error processing stream:", e);
            }
          }
        }
      }

      if (done) {
        // Check if we have requirements and if all files are completed
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
