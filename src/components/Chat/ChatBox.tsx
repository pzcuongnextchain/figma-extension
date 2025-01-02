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
    console.log("Continue clicked, uncompleteContent:", uncompleteContent);

    const continueMessage = `The previous response was incomplete due to length limitations. 
    Start where the last file's content was interrupted, and continue generating the file from where it stopped. Ensure the format stays consistent:  
      1. Do not repeat the file header or previously generated content.  
      2. Complete the interrupted file first.  
      3. If there are more files to generate after completing the interrupted file, continue with the next file(s).  
    You are tasked with generating a React project structure and implementation details based on the following requirements:
      Project Directory and Files:
      - public: Contains static assets, such as index.html and favicon.
      - src: Main source code folder with the following subfolders:
      - components: Reusable React components utilizing Ant Design (antd).
      - pages: React Router-based pages incorporating these components.
      - hooks: Custom React hooks for shared logic.
      - context: Context API setup for global state management.
      - services: Mock API services and utility functions with sample data.
      - styles: Global and component-specific styles compatible with Tailwind CSS.
      - i18n: Localization files for multilingual support.
      - Config Files: Includes ESLint (.eslintrc.cjs) and Prettier (.prettierrc) configurations for consistent code quality and formatting.
      - Root Files: Includes README.md for project documentation, vite.config.ts for Vite setup, and package.json for dependencies and scripts.
      Output Expectations:
      - Complete folder structure with all required files.
      - Fully functional example pages demonstrating Ant Design components styled with Tailwind CSS.
      - A sample README.md file with setup instructions.
      - Components and pages must showcase dynamic mock data interaction based on image/document relationships defined in Figma designs.
      Additional Notes:
      - Ensure components generated are functional and directly usable in the corresponding pages.
      - Use mock data within services to demonstrate API integration.
      - Maintain a clean, readable format with inline comments for clarity.
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
