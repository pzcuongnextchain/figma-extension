import fs from "fs/promises";
import path from "path";
import { CodeExplorerService } from "../services/CodeExplorerService.js";
import { AIModel, BaseService } from "../services/base/BaseService.js";

interface GenerationState {
  accumulatedData: string;
  incompleteContent: string;
  pendingContents: Record<string, string>;
  attemptCount: number;
  lastCompleteObject: string;
  isArrayStarted: boolean;
  currentFileName: string | null;
  completedFiles: Set<string>;
}

export async function processGenerationAndUpdateFiles(
  generationId: string,
  model?: AIModel,
) {
  const state: GenerationState = {
    accumulatedData: "",
    incompleteContent: "",
    pendingContents: {},
    attemptCount: 0,
    lastCompleteObject: "",
    isArrayStarted: false,
    currentFileName: null,
    completedFiles: new Set<string>(),
  };

  try {
    if (model) {
      BaseService.setModel(model);
    }

    let isComplete = false;
    while (!isComplete && state.attemptCount < 3) {
      try {
        if (state.attemptCount === 0) {
          console.log("Fetching initial generation data...");
          const response =
            await CodeExplorerService.getGenerationStream(generationId);
          await processStreamAndUpdateFiles(response, state);

          // Check if we have a valid complete array
          if (validateAccumulatedData(state.accumulatedData)) {
            console.log("\n✅ All files processed successfully!");
            isComplete = true;
          } else {
            state.attemptCount++;
          }
        } else {
          // Only continue if we actually have incomplete content
          if (
            !state.accumulatedData.trim() ||
            state.accumulatedData.trim() === "["
          ) {
            console.log("\n✅ No more files to process!");
            isComplete = true;
            break;
          }

          console.log(
            `\n🔄 Attempt ${state.attemptCount + 1} to complete generation...`,
          );
          const continueMessage = generateContinuationMessage(state);
          console.log("\n📝 Debug - Continuation message:", continueMessage);
          const continuationResponse =
            await CodeExplorerService.streamChatResponse(
              continueMessage,
              generationId,
            );
          await processStreamAndUpdateFiles(continuationResponse, state);

          if (validateAccumulatedData(state.accumulatedData)) {
            isComplete = true;
          } else {
            state.attemptCount++;
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "INCOMPLETE_CONTENT") {
          state.attemptCount++;
          if (state.attemptCount >= 3) {
            console.log("\n❌ Max retry attempts reached");
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

async function processStreamAndUpdateFiles(
  response: Response,
  state: GenerationState,
) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (value) {
        const chunk = decoder.decode(value);
        state.accumulatedData += chunk;
        console.log("\n📦 Received chunk:", chunk);

        // Check if we have a complete array
        if (state.accumulatedData.trim().startsWith("[")) {
          state.isArrayStarted = true;

          // Try to extract and process complete objects
          const objects = extractCompleteObjects(state.accumulatedData);

          for (const obj of objects) {
            try {
              if (!state.completedFiles.has(obj.aFileName)) {
                await updateFile(obj.aFileName, obj.fileContent);
                state.completedFiles.add(obj.aFileName);
                console.log(`\n✅ Successfully processed: ${obj.aFileName}`);
              }
            } catch (e) {
              console.error(`\n❌ Error processing ${obj.aFileName}:`, e);
            }
          }

          // If we have a complete array, we're done
          if (state.accumulatedData.trim().endsWith("]")) {
            try {
              JSON.parse(state.accumulatedData);
              console.log("\n✅ Complete array processed successfully");
              return;
            } catch (e) {
              // Array is not complete yet
            }
          }
        }
      }

      if (done) {
        // Don't throw error if we have processed files but stream ended
        if (state.completedFiles.size > 0) {
          console.log("\n📝 Stream ended but files were processed");
          return;
        }

        // Only throw if we have no complete array and no processed files
        if (!state.accumulatedData.trim().endsWith("]")) {
          throw new Error("INCOMPLETE_CONTENT");
        }
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function extractCompleteObjects(
  data: string,
): Array<{ aFileName: string; fileContent: string }> {
  const objects: Array<{ aFileName: string; fileContent: string }> = [];

  // Remove the outer brackets and split by "},{"
  const content = data.trim().replace(/^\[/, "").replace(/\]$/, "").trim();

  // Split the content into potential objects
  const parts = content.split(/},\s*{/);

  for (let i = 0; i < parts.length; i++) {
    let part = parts[i];

    // Add back the curly braces that were removed by the split
    if (!part.startsWith("{")) part = "{" + part;
    if (!part.endsWith("}")) part = part + "}";

    try {
      const parsed = JSON.parse(part);
      if (parsed.aFileName && typeof parsed.fileContent === "string") {
        objects.push(parsed);
      }
    } catch (e) {
      // Skip incomplete objects
    }
  }

  return objects;
}

// Add this helper function to validate the accumulated data
function validateAccumulatedData(data: string): boolean {
  try {
    // Check if we have a complete array
    if (data.trim().startsWith("[") && data.trim().endsWith("]")) {
      JSON.parse(data);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

async function updateFile(aFileName: string, content: string) {
  try {
    console.log(`\n📝 About to write file: ${aFileName}`);
    console.log("Content length:", content.length);
    console.log("First 100 chars:", content.substring(0, 100));
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

function generateContinuationMessage(state: GenerationState): string {
  const completedFilesList = Array.from(state.completedFiles).join(", ");

  // Find the last complete object in the accumulated data
  const lastCompleteObjectIndex = findLastCompleteObjectIndex(
    state.accumulatedData,
  );

  // Get only the incomplete part (everything after the last complete object)
  const incompletePart =
    lastCompleteObjectIndex !== -1
      ? state.accumulatedData.slice(lastCompleteObjectIndex)
      : state.accumulatedData;

  return `Continue generating from this incomplete array. The incomplete part is:
    ${incompletePart}
    
    Already completed files (DO NOT generate these again):
    ${completedFilesList}
    
    Please complete this object and continue with any remaining files.
    Important: 
    1. Do not repeat any completed objects listed above
    2. Only continue from the incomplete part
    3. Make sure to properly close the array with ]`;
}

function findLastCompleteObjectIndex(data: string): number {
  let index = -1;
  let braceCount = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < data.length; i++) {
    const char = data[i];

    if (inString) {
      if (char === "\\" && !escaped) {
        escaped = true;
      } else if (char === '"' && !escaped) {
        inString = false;
      } else {
        escaped = false;
      }
      continue;
    }

    if (char === '"' && !escaped) {
      inString = true;
    } else if (char === "{") {
      braceCount++;
    } else if (char === "}") {
      braceCount--;
      if (braceCount === 0) {
        // Found a complete object
        index = i + 1;
      }
    }
  }

  return index;
}
