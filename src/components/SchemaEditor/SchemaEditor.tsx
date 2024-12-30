import { Box, Button, Typography } from "@mui/material";
import React from "react";
import { Prism, SyntaxHighlighterProps } from "react-syntax-highlighter";

const SyntaxHighlighter = Prism as any as React.FC<SyntaxHighlighterProps>;

interface SchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  onFormat: () => void;
}

export const SchemaEditor: React.FC<SchemaEditorProps> = ({
  value,
  onChange,
  error,
  onFormat,
}) => {
  const editorRef = React.useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = editorRef.current!.selectionStart;
      const end = editorRef.current!.selectionEnd;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);

      // Move cursor after the inserted tab
      setTimeout(() => {
        editorRef.current!.selectionStart = start + 2;
        editorRef.current!.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <Box sx={{ height: "100%" }}>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Schema JSON</Typography>
        <Button size="small" variant="outlined" onClick={onFormat}>
          Format JSON
        </Button>
      </Box>
      <Box
        sx={{
          position: "relative",
          height: "calc(100% - 48px)",
          ".editor-overlay": {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            margin: 0,
            padding: "12px !important",
            backgroundColor: "transparent !important",
          },
          pre: {
            margin: "0 !important",
            backgroundColor: "transparent !important",
          },
        }}
      >
        <textarea
          ref={editorRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            height: "100%",
            padding: "12px",
            fontFamily: "monospace",
            fontSize: "12px",
            backgroundColor: "#fff",
            color: "#000",
            border: error ? "1px solid #f44336" : "1px solid #555",
            borderRadius: "4px",
            resize: "none",
            outline: "none",
            caretColor: "#000",
          }}
        />
        {/* <SyntaxHighlighter
          language="json"
          style={materialDark}
          className="editor-overlay"
          customStyle={{
            fontSize: "12px",
          }}
        >
          {value}
        </SyntaxHighlighter> */}
      </Box>
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};
