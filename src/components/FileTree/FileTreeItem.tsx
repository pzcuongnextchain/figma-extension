import { Box, ListItem, ListItemText, Typography } from "@mui/material";
import React, { useState } from "react";
import { FileTreeItemProps } from "../../types/explorer";

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  level = 0,
  onFileClick,
  selectedPath,
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = Object.keys(node.children).length > 0;

  const handleClick = () => {
    if (node.isFile) {
      onFileClick(node.path, node.content);
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <>
      <ListItem
        button
        onClick={handleClick}
        selected={selectedPath === node.path}
        sx={{
          pl: level * 2 + 2,
          py: 0.5,
          minHeight: 36,
          "&:hover": {
            bgcolor: "action.hover",
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
                    transform: expanded ? "rotate(90deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                >
                  ›
                </Box>
              )}
              <Typography
                variant="body2"
                sx={{
                  color: node.isFile ? "text.primary" : "text.secondary",
                  fontWeight: node.isFile ? 400 : 500,
                }}
              >
                {node.name}
              </Typography>
            </Box>
          }
          secondary={node.isFile && !node.content ? "Loading..." : null}
        />
      </ListItem>
      {hasChildren && expanded && (
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
              />
            ))}
        </Box>
      )}
    </>
  );
};
