import { Box, List, Paper, Typography } from "@mui/material";
import React from "react";
import { FileListProps } from "../../types/explorer";
import { FileTreeItem } from "./FileTreeItem";
import { createFileTree } from "./utils";

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedFile,
  onFileClick,
  isFileUpdated,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 120,
        display: "flex",
        flexDirection: "column",
        borderRadius: 0,
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h6">
          Files {files.length > 0 ? `(${files.length})` : ""}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", p: 2, pt: 1 }}>
        {files.length > 0 ? (
          <List disablePadding>
            <FileTreeItem
              node={createFileTree(files)}
              onFileClick={onFileClick}
              selectedPath={selectedFile?.fileName || null}
              isFileUpdated={isFileUpdated}
            />
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            No files available
          </Typography>
        )}
      </Box>
    </Paper>
  );
};
