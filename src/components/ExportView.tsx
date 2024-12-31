import LightbulbIcon from "@mui/icons-material/Lightbulb";
import SchemaIcon from "@mui/icons-material/Schema";
import SmartButtonIcon from "@mui/icons-material/SmartButton";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { ExportData } from "../types/common.type";

interface ExportViewProps {
  frameImages?: Array<{
    id: string;
    name: string;
    base64: string;
    base64ImageWithoutMime: string;
  }>;
  isLoading: boolean;
  isLoadingInsight: boolean;
  insight: string | null;
  exportData: ExportData | null;
  onExport: () => void;
  onGetInsight: () => void;
  onAnalyzeSchema: () => void;
  disableAnalyzeSchema: boolean;
}

export function ExportView({
  frameImages = [],
  isLoading,
  isLoadingInsight,
  insight,
  exportData,
  onExport,
  onGetInsight,
  onAnalyzeSchema,
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

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            width: "100%",
            minHeight: "100px",
            bgcolor: "background.default",
          }}
        >
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Component Insight
            </Typography>
            {insight ? (
              <Typography
                variant="body2"
                sx={{ whiteSpace: "pre-line", textAlign: "left" }}
              >
                {insight}
              </Typography>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic" }}
              >
                Get insight about your components before analysis. This will
                help our AI understand your components better.
              </Typography>
            )}
          </Stack>
        </Paper>
      </Stack>

      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        paddingBottom={3}
      >
        <Button
          variant="contained"
          color="info"
          onClick={onGetInsight}
          disabled={isLoadingInsight || !exportData}
          startIcon={<LightbulbIcon />}
        >
          {isLoadingInsight ? "Getting Insight..." : "Get Insight"}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onExport}
          disabled={isLoading || !insight}
          startIcon={<SmartButtonIcon />}
        >
          {isLoading ? "Analyzing..." : "Analyze Components"}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={onAnalyzeSchema}
          disabled={isLoading}
          startIcon={<SchemaIcon />}
        >
          {isLoading ? "Analyzing..." : "Analyze Schema"}
        </Button>
      </Stack>
    </>
  );
}
