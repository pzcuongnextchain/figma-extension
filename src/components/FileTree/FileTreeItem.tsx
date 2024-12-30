import { Box, ListItem, ListItemText, Typography } from "@mui/material";
import React, { useState } from "react";
import { FileTreeItemProps } from "../../types/explorer";

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  level = 0,
  onFileClick,
  selectedPath,
  isFileUpdated,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const paddingLeft = level * 16;
  const hasChildren = Object.keys(node.children).length > 0;

  const handleClick = () => {
    if (node.isFile) {
      onFileClick(node.path, node.content);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <>
      <ListItem
        button
        onClick={handleClick}
        sx={{
          pl: paddingLeft / 8,
          py: 0.5,
          minHeight: 36,
          backgroundColor:
            selectedPath === node.path ? "action.selected" : "transparent",
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
      >
        <ListItemText
          primary={
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {!node.isFile && (
                <Box
                  component="span"
                  sx={{
                    mr: 1,
                    fontSize: "1.2rem",
                    transform: isExpanded ? "rotate(90deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                >
                  ›
                </Box>
              )}
              <Typography
                variant="body2"
                sx={{
                  color: node.isFile
                    ? selectedPath === node.path
                      ? "primary.main"
                      : "text.primary"
                    : "text.secondary",
                  fontWeight: node.isFile ? 400 : 500,
                }}
              >
                {node.name}
              </Typography>
              {node.isFile && isFileUpdated?.(node.path) && (
                <Box
                  component="span"
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.25,
                    bgcolor: "success.light",
                    color: "success.contrastText",
                    borderRadius: 1,
                    fontSize: "0.65rem",
                  }}
                >
                  Updated
                </Box>
              )}
            </Box>
          }
          secondary={node.isFile && !node.content ? "Loading..." : null}
        />
      </ListItem>
      {hasChildren && isExpanded && (
        <Box>
          {Object.values(node.children)
            .sort((a, b) => {
              if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
              return a.name.localeCompare(b.name);
            })
            .map((childNode) => (
              <FileTreeItem
                key={childNode.path}
                node={childNode}
                level={level + 1}
                onFileClick={onFileClick}
                selectedPath={selectedPath}
                isFileUpdated={isFileUpdated}
              />
            ))}
        </Box>
      )}
    </>
  );
};
