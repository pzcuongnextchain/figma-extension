import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { ComponentAnalysisData, FrameExportData } from "../types/common.type";
import { ComponentAnalysis } from "./ComponentAnalysis";
import { LoadingOverlay } from "./LoadingOverlay";

interface ExportViewProps {
  frameImages?: Array<{
    id: string;
    name: string;
    base64: string;
    base64ImageWithoutMime: string;
  }>;
  isLoading: boolean;
  isLoadingInsight: boolean;
  insight: { analyzedData: string; base64Image: string }[];
  exportData: FrameExportData | null;
  geminiResponse: Array<{
    frameId: string;
    frameName: string;
    analysis: ComponentAnalysisData[];
  }>;
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
  geminiResponse,
  onExport,
  onGetInsight,
  onAnalyzeSchema,
}: ExportViewProps) {
  const [components, setComponents] = useState(geminiResponse);
  const insightRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Reset components when frameImages changes (selection changes)
  useEffect(() => {
    setComponents([]);
    // Scroll to bottom when new images are loaded
    if (frameImages.length > 0) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100); // Small delay to ensure images are rendered
    }
  }, [frameImages]);

  useEffect(() => {
    setComponents(geminiResponse);
  }, [geminiResponse]);

  // Scroll to insight when new insight is received
  useEffect(() => {
    if (insight.length > 0) {
      insightRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [insight]);

  // Scroll to bottom when components change
  useEffect(() => {
    if (components.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [components]);

  return (
    <Stack spacing={2} sx={{ alignItems: "center" }}>
      <LoadingOverlay show={isLoadingInsight} />

      <Typography variant="h6" fontWeight="bold" paddingTop={2}>
        Component Analysis
      </Typography>

      {frameImages.length > 0 && (
        <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
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
              <Typography
                variant="subtitle2"
                sx={{ p: 1, textAlign: "center" }}
              >
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
      )}

      {/* <Paper
        variant="outlined"
        sx={{
          p: 2,
          width: "100%",
          minHeight: "100px",
          bgcolor: "background.default",
        }}
      >
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            fontWeight="bold"
          >
            Component Insight
          </Typography>
          <Box
            ref={insightRef}
            sx={{
              maxHeight: 200,
              overflowY: "auto",
              width: "100%",
              textAlign: "left",
            }}
          >
            {insight.length ? (
              <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                {insight.map((item) => item.analyzedData)}
              </Typography>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic", textAlign: "center" }}
              >
                🚀 Get insight about your components before analysis.
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper> */}

      {/* <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        sx={{ paddingBottom: 2 }}
        width="100%"
      >
        <Button
          variant="contained"
          color="info"
          onClick={onGetInsight}
          disabled={isLoadingInsight || !exportData}
          startIcon={<LightbulbIcon />}
        >
          {isLoadingInsight ? "Getting Insight..." : "Get Insight"}
        </Button> */}
      {/* <Button
          variant="contained"
          color="primary"
          onClick={onExport}
          disabled={isLoading || !insight}
          startIcon={<SmartButtonIcon />}
        >
          {isLoading ? "Extracting..." : "Extract Components"}
        </Button> */}
      {/* <Button
          variant="contained"
          color="secondary"
          onClick={onAnalyzeSchema}
          disabled={isLoading}
          startIcon={<SchemaIcon />}
        >
          {isLoading ? "Extracting..." : "Extract Schema"}
        </Button> */}
      {/* </Stack> */}

      {
        <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
          <ComponentAnalysis
            components={components}
            exportData={exportData!}
            frameImages={frameImages}
            insight={insight}
          />
        </Stack>
      }

      <div ref={bottomRef} />
    </Stack>
  );
}
