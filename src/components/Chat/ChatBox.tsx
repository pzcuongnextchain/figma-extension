import { Box, TextField, Typography } from "@mui/material";
import React from "react";
import { ChatBoxProps } from "../../types/explorer";

export const ChatBox: React.FC<ChatBoxProps> = ({
  value,
  isStreaming,
  showContinue,
  onChange,
  onSubmit,
}) => {
  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        p: 2,
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      {showContinue && (
        <Typography
          variant="body2"
          color="warning.main"
          sx={{
            mb: 1,
            p: 1,
            bgcolor: "warning.light",
            borderRadius: 1,
          }}
        >
          Response was incomplete. Please continue the conversation.
        </Typography>
      )}
      <TextField
        fullWidth
        value={value}
        onChange={onChange}
        disabled={isStreaming}
        placeholder={isStreaming ? "Processing..." : "Type your message..."}
        variant="outlined"
        size="small"
      />
    </Box>
  );
};
