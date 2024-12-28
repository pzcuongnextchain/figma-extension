import { Box, Typography } from "@mui/material";
import React from "react";

interface ChatInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent) => void;
  isStreaming: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  isStreaming,
}) => {
  return (
    <Box component="form" onSubmit={onSubmit} sx={{ p: 1.5 }}>
      <Box sx={{ position: "relative" }}>
        <input
          value={value}
          onChange={onChange}
          placeholder="Describe more or fix more..."
          disabled={isStreaming}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid rgba(0, 0, 0, 0.23)",
            fontSize: "14px",
            outline: "none",
          }}
        />
        {isStreaming && (
          <Box
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Processing...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
