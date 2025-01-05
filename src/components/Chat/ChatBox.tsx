import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Box, Button, TextField } from "@mui/material";
import React from "react";
import { ChatBoxProps } from "../../types/explorer";

export const ChatBox: React.FC<ChatBoxProps> = ({
  value,
  isStreaming,
  showContinue,
  uncompleteContent,
  onChange,
  onSubmit,
}) => {
  const handleContinue = (e: React.MouseEvent) => {
    e.preventDefault();

    const continueMessage = `The previous response was incomplete due to length limitations. To continue the generation, please follow these instructions:

Do not repeat any previously generated content, including the file header or content prior to the interruption.
Begin from the point where the previous response was cut off. For example, if the last line was const a = 1; and it was cut off, you should begin with that exact line, e.g., const a = 1; const b = 2;.
Maintain consistency in format, style, and structure as seen in the previous content.
If there are additional files to generate, proceed to the next one after completing the interrupted file.
The last part of the interrupted file was: ${uncompleteContent}`;

    const syntheticEvent = {
      preventDefault: () => {},
      target: e.target,
    } as React.SyntheticEvent<Element, Event>;

    onSubmit(syntheticEvent, continueMessage);
  };

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
        <Button
          variant="contained"
          color="warning"
          startIcon={<PlayArrowIcon />}
          onClick={handleContinue}
          sx={{ mb: 1 }}
          fullWidth
        >
          Continue Generation
        </Button>
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
