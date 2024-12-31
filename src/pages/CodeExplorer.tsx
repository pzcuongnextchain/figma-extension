import SaveIcon from "@mui/icons-material/Save";
import { Box, Button, Grid } from "@mui/material";
import JSZip from "jszip";
import React, { useEffect, useRef, useState } from "react";
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatValue, setChatValue] = useState("");
  const urlParams = new URLSearchParams(window.location.search);
  const generationId = urlParams.get("id");
  const [updatedFiles, setUpdatedFiles] = useState<Set<string>>(new Set());
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const [isIncompleteResponse, setIsIncompleteResponse] = useState(false);

  const updateFile = (fileName: string, content: string) => {
    console.log("Updating file:", fileName);
    setFiles((prevFiles) => {
      const fileIndex = prevFiles.findIndex((f) => f.fileName === fileName);
      if (fileIndex === -1) {
        console.log("Adding new file:", fileName);
        return [...prevFiles, { fileName, fileContent: content }];
      } else {
        console.log("Updating existing file:", fileName);
        if (prevFiles[fileIndex].fileContent !== content) {
          setUpdatedFiles((prev) => new Set(prev).add(fileName));

          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
          }
          updateTimeoutRef.current = window.setTimeout(() => {
            setUpdatedFiles((prev) => {
              const newSet = new Set(prev);
              newSet.delete(fileName);
              return newSet;
            });
          }, 3000) as any;
        }

        const newFiles = [...prevFiles];
        newFiles[fileIndex] = {
          ...newFiles[fileIndex],
          fileContent: content,
        };
        return newFiles;
      }
    });
  };

  const isFileUpdated = (fileName: string) => {
    return updatedFiles.has(fileName);
  };

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

          await processStreamResponse(response);
        } catch (error) {
          console.error("Error fetching data:", error);
          setIsIncompleteResponse(true);
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

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const handleFileClick = (fileName: string, content: string | null) => {
    setSelectedFile({ fileName, fileContent: content });
  };

  const processStreamResponse = async (response: Response) => {
    const reader = response.body!.getReader();
    let accumulatedData = "";
    let pendingContents: Record<string, string> = {};
    let hasCompleteData = false;

    try {
      while (true) {
        const { value, done } = await reader.read();
        const chunk = new TextDecoder().decode(value);
        console.log("Received chunk:", chunk);
        accumulatedData += chunk;

        // Check for incomplete JSON content
        const isFileContentStart = accumulatedData.includes('"fileContent":');
        const hasQuoteAfterFileContent = /\"fileContent\"\s*:\s*\"[^"]*\"/.test(
          accumulatedData,
        );

        console.log("Accumulated data:", accumulatedData);
        console.log("Has complete file content:", hasQuoteAfterFileContent);

        // If we have fileContent but it's not properly closed with quotes
        if (isFileContentStart && !hasQuoteAfterFileContent) {
          console.log("Detected incomplete file content");
          setIsIncompleteResponse(true);
        }

        if (done) {
          // Additional check for incomplete JSON at the end
          try {
            JSON.parse(accumulatedData);
            if (
              !accumulatedData.endsWith("}") &&
              !accumulatedData.endsWith('"}')
            ) {
              console.log("JSON does not end properly");
              setIsIncompleteResponse(true);
            }
          } catch (e) {
            console.log("Failed to parse final JSON:", e);
            setIsIncompleteResponse(true);
          }
          break;
        }

        // Rest of your existing code for processing matches...
        const fileEntryRegex =
          /"(fileName|fileContent)"\s*:\s*"((?:[^"\\]|\\.)*?)"/g;
        let match;
        let currentFileName: string | null = null;
        let currentContent: string | null = null;

        while ((match = fileEntryRegex.exec(accumulatedData)) !== null) {
          const [_, type, value] = match;
          if (type === "fileName") {
            currentFileName = value;
            if (pendingContents[currentFileName]) {
              try {
                const fileContent = JSON.parse(
                  `"${pendingContents[currentFileName]}"`,
                );
                updateFile(currentFileName, fileContent);
                delete pendingContents[currentFileName];
                hasCompleteData = true;
              } catch (e) {
                console.error(
                  `Error processing content for ${currentFileName}:`,
                  e,
                );
              }
              currentFileName = null;
            }
          } else if (type === "fileContent") {
            currentContent = value;
            if (currentFileName) {
              try {
                const fileContent = JSON.parse(`"${currentContent}"`);
                updateFile(currentFileName, fileContent);
                hasCompleteData = true;
                currentFileName = null;
              } catch (e) {
                console.error(`Error processing content:`, e);
              }
            } else {
              const nextFileNameMatch = accumulatedData
                .slice(match.index)
                .match(/"fileName"\s*:\s*"([^"]+)"/);
              if (nextFileNameMatch) {
                const fileName = nextFileNameMatch[1];
                pendingContents[fileName] = currentContent;
              }
            }
          }
        }

        // Trim processed data
        const lastMatch = accumulatedData.lastIndexOf('"}');
        if (lastMatch > -1) {
          accumulatedData = accumulatedData.slice(lastMatch + 2);
        }
      }
    } catch (error) {
      console.error("Error processing stream:", error);
      setIsIncompleteResponse(true);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleChatSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!chatValue.trim() || !generationId) return;

    setUpdatedFiles(new Set());
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    setIsStreaming(true);
    setIsIncompleteResponse(false);

    try {
      const response = await PostService.streamChatResponse(
        chatValue,
        generationId,
      );
      await processStreamResponse(response);
      setChatValue("");
    } catch (error) {
      console.error("Error in chat:", error);
      setIsIncompleteResponse(true);
    }
  };

  const handleSaveToLocal = () => {
    // Create a zip file containing all files
    const zip = new JSZip();

    files.forEach((file) => {
      if (file.fileContent) {
        // Create folders if the file path contains directories
        const filePath = file.fileName;
        zip.file(filePath, file.fileContent);
      }
    });

    // Generate and download the zip file
    zip.generateAsync({ type: "blob" }).then((content) => {
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "generated-code.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
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
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveToLocal}
            size="small"
          >
            Save to Local
          </Button>
        </Box>
        <FileList
          files={files}
          selectedFile={selectedFile}
          onFileClick={handleFileClick}
          isFileUpdated={isFileUpdated}
        />
        <ChatBox
          value={chatValue}
          onChange={(e) => setChatValue(e.target.value)}
          onSubmit={handleChatSubmit}
          isStreaming={isStreaming}
          showContinue={isIncompleteResponse}
        />
      </Grid>

      <Grid item xs={9} sx={{ height: "100vh" }}>
        <FileViewer
          selectedFile={selectedFile}
          getLanguage={getLanguage}
          files={files}
          isFileUpdated={isFileUpdated}
        />
      </Grid>
    </Grid>
  );
};
