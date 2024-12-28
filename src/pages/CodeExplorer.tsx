import { Box, Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import { ChatBox } from "../components/Chat/ChatBox";
import { FileList } from "../components/FileTree/FileList";
import { getLanguage } from "../components/FileTree/utils";
import { FileViewer } from "../components/FileViewer/FileViewer";
import { PostService } from "../services/postService";
import { FileContent } from "../types/explorer";

export const CodeExplorer: React.FC = () => {
  const [files, setFiles] = useState<FileContent[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    let abortController = new AbortController();

    const fetchData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const generationId = urlParams.get("id");

      if (generationId) {
        try {
          setIsLoading(true);
          const response = await PostService.getGenerationStream(
            generationId,
            abortController.signal,
          );

          const reader = response.body!.getReader();
          let accumulatedData = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            accumulatedData += chunk;

            const fileNameMatches = accumulatedData.match(
              /"fileName"\s*:\s*"([^"]+)"/g,
            );
            if (fileNameMatches) {
              fileNameMatches.forEach((match) => {
                const fileName = match.match(/"fileName"\s*:\s*"([^"]+)"/)?.[1];
                if (fileName) {
                  setFiles((prevFiles) => {
                    if (!prevFiles.some((f) => f.fileName === fileName)) {
                      return [...prevFiles, { fileName, fileContent: null }];
                    }
                    return prevFiles;
                  });
                }
              });
            }

            let startIndex = 0;
            while (true) {
              const openBracket = accumulatedData.indexOf("[", startIndex);
              if (openBracket === -1) break;

              let bracketCount = 1;
              let index = openBracket + 1;
              let complete = false;

              while (index < accumulatedData.length) {
                if (accumulatedData[index] === "[") bracketCount++;
                if (accumulatedData[index] === "]") bracketCount--;

                if (bracketCount === 0) {
                  complete = true;
                  break;
                }
                index++;
              }

              if (complete) {
                try {
                  const jsonStr = accumulatedData.substring(
                    openBracket,
                    index + 1,
                  );
                  const parsedData = JSON.parse(jsonStr);

                  if (Array.isArray(parsedData)) {
                    parsedData.forEach((item) => {
                      const fileName = item.path || item.fileName;
                      setFiles((prevFiles) => {
                        const updatedFiles = [...prevFiles];
                        const existingFileIndex = updatedFiles.findIndex(
                          (f) => f.fileName === fileName,
                        );

                        if (existingFileIndex !== -1) {
                          updatedFiles[existingFileIndex] = {
                            ...updatedFiles[existingFileIndex],
                            fileContent: item.fileContent,
                          };
                        } else {
                          updatedFiles.push({
                            fileName,
                            fileContent: item.fileContent,
                          });
                        }

                        return updatedFiles;
                      });
                    });
                  }

                  accumulatedData = accumulatedData.substring(index + 1);
                  startIndex = 0;
                } catch (e) {
                  startIndex = openBracket + 1;
                }
              } else {
                break;
              }
            }
          }
        } catch (error) {
          console.error("Error processing stream:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      abortController.abort();
    };
  }, []);

  const handleFileClick = (fileName: string, content: string | null) => {
    setSelectedFile({ fileName, fileContent: content });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsStreaming(true);

    try {
      const response = await PostService.streamChatResponse(userMessage);
      const reader = response.body!.getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        console.log(chunk); // Handle the streaming response as needed
      }
    } catch (error) {
      console.error("Error streaming chat response:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <Grid container sx={{ height: "100vh" }}>
      {isLoading && (
        <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 1200 }}>
          Loading...
        </Box>
      )}

      <Grid
        item
        xs={3}
        sx={{
          height: "100vh",
          position: "relative",
          borderRight: 1,
          borderColor: "divider",
        }}
      >
        <FileList
          files={files}
          selectedFile={selectedFile}
          onFileClick={handleFileClick}
        />
        <ChatBox
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isStreaming={isStreaming}
        />
      </Grid>

      <Grid item xs={9} sx={{ height: "100vh" }}>
        <FileViewer
          selectedFile={selectedFile}
          getLanguage={getLanguage}
          files={files}
        />
      </Grid>
    </Grid>
  );
};
