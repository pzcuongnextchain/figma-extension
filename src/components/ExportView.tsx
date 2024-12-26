import { Box, Button, Stack, Typography } from "@mui/material";

interface ExportViewProps {
  framePreviewUrl: string | null;
  isLoading: boolean;
  onExport: () => void;
  onCopy: () => void;
}

export function ExportView({
  framePreviewUrl,
  isLoading,
  onExport,
  onCopy,
}: ExportViewProps) {
  return (
    <>
      <Stack
        component="header"
        spacing={2}
        alignItems="center"
        sx={{ textAlign: "center" }}
      >
        <Typography variant="h6" fontWeight="bold" paddingTop={2}>
          Component Analysis
        </Typography>
        {framePreviewUrl && (
          <Box
            sx={{
              width: "100%",
              borderRadius: 1,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <img
              src={framePreviewUrl}
              alt="Selected frame preview"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />
          </Box>
        )}
      </Stack>

      <Stack direction="row" spacing={2} justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          onClick={onExport}
          disabled={isLoading}
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </Button>
        <Button variant="outlined" color="primary" onClick={onCopy} disabled>
          Copy to Builder
        </Button>
      </Stack>
    </>
  );
}
