import { Box, Paper, Typography } from "@mui/material";
import React from "react";
import { ChatBoxProps } from "../../types/explorer";
import { ChatInput } from "./ChatInput";

export const ChatBox: React.FC<ChatBoxProps> = ({
  value,
  isStreaming,
  onChange,
  onSubmit,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
        borderTop: 1,
        borderColor: "divider",
        borderRadius: 0,
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6">Chat</Typography>
      </Box>

      <ChatInput
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        isStreaming={isStreaming}
      />
    </Paper>
  );
};
