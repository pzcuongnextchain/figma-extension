import { Box, Paper, Typography } from "@mui/material";
import React from "react";
import { Prism, SyntaxHighlighterProps } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FileViewerProps } from "../../types/explorer";

const SyntaxHighlighter = Prism as any as React.FC<SyntaxHighlighterProps>;

export const FileViewer: React.FC<FileViewerProps> = ({
  selectedFile,
  getLanguage,
  files,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        overflow: "auto",
        borderRadius: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {selectedFile ? (
        <>
          <Box
            sx={{
              position: "sticky",
              top: 0,
              bgcolor: "background.paper",
              zIndex: 2,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="h6" sx={{ p: 1.5, pb: 1.5 }}>
              {selectedFile.fileName}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, p: 2, pt: 1.5 }}>
            {selectedFile?.fileContent ? (
              <SyntaxHighlighter
                language={getLanguage(selectedFile.fileName)}
                style={oneLight}
                customStyle={{
                  margin: 0,
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                {selectedFile.fileContent}
              </SyntaxHighlighter>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Loading file content...
              </Typography>
            )}
          </Box>
        </>
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
          {files.length > 0
            ? "Select a file to view its content"
            : "No files available"}
        </Typography>
      )}
    </Paper>
  );
};
