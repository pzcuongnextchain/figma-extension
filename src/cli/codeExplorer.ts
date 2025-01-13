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

      // If we have incomplete content and this chunk starts with a new file
      if (
        state.incompleteContent &&
        chunk.trim().startsWith('{"fileContent":')
      ) {
        console.log("Incomplete content found, storing it...");
        console.log("Pending contents:", state.pendingContents);
        // Store the incomplete content with its file name
        const lastFileName = Object.keys(state.pendingContents)[0];
        if (lastFileName) {
          state.pendingContents[lastFileName] = state.incompleteContent;
        }
        state.incompleteContent = "";
        state.accumulatedData = chunk;
      } else {
        state.accumulatedData += chunk;
      }

      // Try to parse as complete JSON
      try {
        await fs.writeFile(
          "C:/Users/PC/Desktop/Figma Extraction Plugin/figma-plugin-starter/state.json",
          state.accumulatedData,
        );
        const parsedData = JSON.parse(state.accumulatedData);
        if (Array.isArray(parsedData)) {
          for (const entry of parsedData) {
            if (entry.fileName && entry.fileContent) {
              // Check if we have pending content for this file
              const pendingContent = state.pendingContents[entry.fileName];
              const finalContent = pendingContent
                ? pendingContent + entry.fileContent
                : entry.fileContent;

              allFiles.push({
                fileName: entry.fileName,
                content: finalContent,
              });

              // Clear pending content for this file
              delete state.pendingContents[entry.fileName];
            }
          }
          state.accumulatedData = "";
          continue;
        }
      } catch (e) {
        // If parsing failed, try to extract any incomplete file content
        const fileContentMatch = state.accumulatedData.match(
          /"fileContent"\s*:\s*"([^"]*)$/,
        );
        if (fileContentMatch) {
          state.incompleteContent = fileContentMatch[1];
        }

        // Extract the file name if possible
        const fileNameMatch = state.accumulatedData.match(
          /"fileName"\s*:\s*"([^"]+)"/,
        );
        if (fileNameMatch && state.incompleteContent) {
          state.pendingContents[fileNameMatch[1]] = state.incompleteContent;
        }

        if (done) {
          throw e;
        }
      }

      if (done) {
        // Handle any remaining incomplete content
        if (Object.keys(state.pendingContents).length > 0) {
          for (const [fileName, content] of Object.entries(
            state.pendingContents,
          )) {
            allFiles.push({
              fileName,
              content,
            });
          }
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
