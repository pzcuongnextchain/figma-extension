import fs from "fs/promises";
import path from "path";
import { CodeExplorerService } from "../services/CodeExplorerService.js";
import { AIModel, BaseService } from "../services/base/BaseService.js";

export async function processGenerationAndUpdateFiles(
  generationId: string,
  model?: AIModel,
) {
  const state = {
    accumulatedData: "",
    incompleteContent: "",
    pendingContents: {} as Record<string, string>,
  };

  try {
    if (model) {
      BaseService.setModel(model);
    }

    console.log("Fetching generation data...");
    const response =
      await CodeExplorerService.getGenerationStream(generationId);

    try {
      await processStreamAndUpdateFiles(response, state);
    } catch (error) {
      console.log("Continuing generation...");
      const continueMessage = `The previous response was incomplete due to length limitations. To continue the generation, please follow these instructions:
        Do not repeat any previously generated content, including the file header or content prior to the interruption.
        Begin from the point where the previous response was cut off. 
        Maintain consistency in format, style, and structure as seen in the previous content.
        If there are additional files to generate, proceed to the next one after completing the interrupted file.
        The last part of the interrupted file was: ${state.incompleteContent}
      `;
      const response = await CodeExplorerService.streamChatResponse(
        continueMessage,
        generationId,
      );
      await processStreamAndUpdateFiles(response, state);
      console.error("Error processing generation:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error processing generation:", error);
    throw error;
  }
}

async function processStreamAndUpdateFiles(
  response: Response,
  state: {
    accumulatedData: string;
    incompleteContent: string;
    pendingContents: Record<string, string>;
  },
) {
  const reader = response.body!.getReader();
  const allFiles: { fileName: string; content: string }[] = [];

  try {
    while (true) {
      const { value, done } = await reader.read();
      const chunk = new TextDecoder().decode(value);

      // Clean up the chunk if it starts with a new file entry while we have incomplete data
      if (
        state.accumulatedData.includes('"fileContent":') &&
        chunk.startsWith('{"fileContent":')
      ) {
        // Extract and save the incomplete content
        const fileContentIndex =
          state.accumulatedData.lastIndexOf('"fileContent":');
        if (fileContentIndex !== -1) {
          const incompleteContent = state.accumulatedData
            .slice(fileContentIndex)
            .replace('"fileContent":', "")
            .replace(/^[\s"]+/, "")
            .trim();
          state.incompleteContent = incompleteContent;

          // Reset accumulated data to start fresh with the new chunk
          state.accumulatedData = "";
        }
      }

      state.accumulatedData += chunk;
      console.log("Current accumulated data:", state.accumulatedData);

      // Try to parse as complete JSON first
      try {
        const parsedData = JSON.parse(state.accumulatedData);
        if (Array.isArray(parsedData)) {
          for (const entry of parsedData) {
            if (entry.fileName && entry.fileContent) {
              // If we have incomplete content from previous chunk, combine it
              const finalContent = state.incompleteContent
                ? state.incompleteContent + entry.fileContent
                : entry.fileContent;

              allFiles.push({
                fileName: entry.fileName,
                content: finalContent,
              });
              state.incompleteContent = ""; // Reset incomplete content
            }
          }
        }
        // Clear accumulated data if successfully parsed
        state.accumulatedData = "";
        continue;
      } catch (e) {
        const lastChar =
          state.accumulatedData[state.accumulatedData.length - 1];
        console.log("Last char:", lastChar);
        if (done && lastChar === "]") {
          throw e;
        }
        // Not valid JSON yet, continue accumulating
      }

      if (done) {
        // Handle any remaining incomplete content
        if (state.incompleteContent) {
          console.log("Remaining incomplete content:", state.incompleteContent);
        }

        // Write all accumulated files
        if (allFiles.length > 0) {
          await Promise.all(
            allFiles.map((file) =>
              updateFileOnDisk(file.fileName, file.content),
            ),
          );
          console.log(`Successfully created ${allFiles.length} files`);
        }
        break;
      }

      // Trim processed data if we find a complete entry
      const lastCompleteEntry = state.accumulatedData.lastIndexOf('"}');
      if (lastCompleteEntry > -1) {
        const nextFileStart = state.accumulatedData.indexOf(
          '{"fileContent":',
          lastCompleteEntry,
        );
        if (nextFileStart > -1) {
          state.accumulatedData = state.accumulatedData.slice(nextFileStart);
        } else {
          state.accumulatedData = state.accumulatedData.slice(
            lastCompleteEntry + 2,
          );
        }
      }
    }
  } catch (error) {
    console.error("Error processing stream:", error);
    throw error;
  }
}

async function updateFileOnDisk(fileName: string, content: string) {
  try {
    const currentDir = process.cwd();
    const filePath = path.join(currentDir, fileName);
    const dirPath = path.dirname(filePath);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, content, "utf8");
    console.log(`File written successfully: ${filePath}`);
  } catch (error) {
    console.error(`Error updating file ${fileName}:`, error);
    console.error("Content that failed:", content);
    throw error;
  }
}
