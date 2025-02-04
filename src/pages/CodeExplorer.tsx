import SaveIcon from "@mui/icons-material/Save";
import { Box, Button, Grid } from "@mui/material";
import JSZip from "jszip";
import React, { useEffect, useRef, useState } from "react";
import { ChatBox } from "../components/Chat/ChatBox";
import { FileList } from "../components/FileTree/FileList";
import { getLanguage } from "../components/FileTree/utils";
import { FileViewer } from "../components/FileViewer/FileViewer";
import { AIModel, BaseService } from "../services/base/BaseService";
import { CodeExplorerService } from "../services/CodeExplorerService";
import { FileContent } from "../types/explorer";

export const CodeExplorer: React.FC = () => {
  const [files, setFiles] = useState<FileContent[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const [chatValue, setChatValue] = useState("");
  const urlParams = new URLSearchParams(window.location.search);
  const generationId = urlParams.get("id");
  const [updatedFiles, setUpdatedFiles] = useState<Set<string>>(new Set());
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const [isIncompleteResponse, setIsIncompleteResponse] = useState(false);
  const [uncompleteContent, setUncompleteContent] = useState("");
  const updateFile = (aFileName: string, content: string) => {
    console.log("Updating file:", aFileName);
    setFiles((prevFiles) => {
      const fileIndex = prevFiles.findIndex((f) => f.aFileName === aFileName);
      if (fileIndex === -1) {
        console.log("Adding new file:", aFileName);
        return [...prevFiles, { aFileName, fileContent: content }];
      } else {
        console.log("Updating existing file:", aFileName);
        if (prevFiles[fileIndex].fileContent !== content) {
          setUpdatedFiles((prev) => new Set(prev).add(aFileName));
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

  const isFileUpdated = (aFileName: string) => {
    return updatedFiles.has(aFileName);
  };

  useEffect(() => {
    let abortController = new AbortController();

    const fetchData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const generationId = urlParams.get("id");
      const model = urlParams.get("model");
      BaseService.setModel(model as AIModel);

      if (generationId) {
        try {
          setIsLoading(true);
          const response = await CodeExplorerService.getGenerationStream(
            generationId,
            abortController.signal,
          );

          await processStreamResponse(response);
        } catch (error) {
          alert("Occured an error while getting generation. Please try again.");
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

  const handleFileClick = (aFileName: string, content: string | null) => {
    setSelectedFile({ aFileName, fileContent: content });
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
        accumulatedData += chunk;
        console.log(accumulatedData);

        // Check for incomplete JSON content
        const isFileContentStart = accumulatedData.includes('"fileContent":');
        const hasQuoteAfterFileContent = /\"fileContent\"\s*:\s*\"[^"]*\"/.test(
          accumulatedData,
        );

        // If we have fileContent but it's not properly closed with quotes
        if (isFileContentStart && !hasQuoteAfterFileContent) {
          setIsIncompleteResponse(true);
          // Extract only the last incomplete part
          const fileContentIndex =
            accumulatedData.lastIndexOf('"fileContent":');
          if (fileContentIndex !== -1) {
            const incompleteContent = accumulatedData
              .slice(fileContentIndex)
              .replace('"fileContent":', "")
              .replace(/^[\s"]+/, "")
              .trim();
            console.log("Streaming incomplete content:", incompleteContent);
            setUncompleteContent(incompleteContent);
          }
        }

        if (done) {
          setIsStreaming(false);
          try {
            JSON.parse(accumulatedData);
            if (!accumulatedData.endsWith("]")) {
              console.log("JSON does not end properly");
              setIsIncompleteResponse(true);
              // Extract only the last incomplete part
              const fileContentIndex =
                accumulatedData.lastIndexOf('"fileContent":');
              if (fileContentIndex !== -1) {
                const incompleteContent = accumulatedData
                  .slice(fileContentIndex)
                  .replace('"fileContent":', "")
                  .replace(/^[\s"]+/, "")
                  .trim();
                console.log("Done - incomplete content:", incompleteContent);
                setUncompleteContent(incompleteContent);
              }
            } else {
              setIsIncompleteResponse(false);
            }
          } catch (e) {
            console.log("Failed to parse final JSON:", e);
            setIsIncompleteResponse(true);
            // Extract only the last incomplete part
            const fileContentIndex =
              accumulatedData.lastIndexOf('"fileContent":');
            if (fileContentIndex !== -1) {
              const incompleteContent = accumulatedData
                .slice(fileContentIndex)
                .replace('"fileContent":', "")
                .replace(/^[\s"]+/, "")
                .trim();
              console.log("Error - incomplete content:", incompleteContent);
              setUncompleteContent(incompleteContent);
            }
          }
          break;
        }

        const fileEntryRegex =
          /"(aFileName|fileContent)"\s*:\s*"((?:[^"\\]|\\.)*?)"/g;
        let match;
        let currentFileName: string | null = null;
        let currentContent: string | null = null;

        while ((match = fileEntryRegex.exec(accumulatedData)) !== null) {
          const [_, type, value] = match;
          if (type === "aFileName") {
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
                .match(/"aFileName"\s*:\s*"([^"]+)"/);
              if (nextFileNameMatch) {
                const aFileName = nextFileNameMatch[1];
                pendingContents[aFileName] = currentContent;
              } else {
                setUncompleteContent(currentContent);
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

  const handleChatSubmit = async (event: React.FormEvent, message?: string) => {
    event.preventDefault();
    console.log("handleChatSubmit called with message:", message);
    console.log("Current chatValue:", chatValue);

    if ((!chatValue.trim() && !message) || !generationId) {
      console.log("Returning early due to empty message or no generationId");
      return;
    }

    setUpdatedFiles(new Set());
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    setIsStreaming(true);
    setIsIncompleteResponse(false);

    try {
      const messageToSend = message || chatValue;
      console.log("Sending message:", messageToSend);
      const response = await CodeExplorerService.streamChatResponse(
        messageToSend,
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
        const filePath = file.aFileName;
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
          showContinue={!isStreaming && isIncompleteResponse}
          uncompleteContent={uncompleteContent}
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
