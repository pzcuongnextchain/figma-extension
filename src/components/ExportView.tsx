import SchemaIcon from "@mui/icons-material/Schema";
import { Box, Button, Stack, Typography } from "@mui/material";

interface ExportViewProps {
  frameImages?: Array<{
    id: string;
    name: string;
    base64: string;
    base64ImageWithoutMime: string;
  }>;
  isLoading: boolean;
  onExport: () => void;
  onAnalyzeSchema: () => void;
  disableAnalyzeSchema: boolean;
}

export function ExportView({
  frameImages = [],
  isLoading,
  onExport,
  onAnalyzeSchema,
  disableAnalyzeSchema,
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
        {frameImages.length > 0 ? (
          <Stack spacing={2} width="100%">
            {frameImages.map((image) => (
              <Box
                key={image.id}
                sx={{
                  width: "100%",
                  borderRadius: 1,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="subtitle2" sx={{ p: 1 }}>
                  {image.name}
                </Typography>
                <img
                  src={image.base64}
                  alt={`Frame preview: ${image.id}`}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No frames selected
          </Typography>
        )}
      </Stack>

      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        paddingBottom={3}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={onExport}
          disabled={isLoading}
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={onAnalyzeSchema}
          disabled={isLoading || disableAnalyzeSchema}
          startIcon={<SchemaIcon />}
        >
          {isLoading ? "Analyzing..." : "Analyze Schema"}
        </Button>
      </Stack>
    </>
  );
}
