import { Container, Stack } from "@mui/material";
import { useEffect, useState } from "react";

import { ComponentAnalysis } from "../components/ComponentAnalysis";
import { EmptyState } from "../components/EmptyState";
import { ExportView } from "../components/ExportView";
import { PostService } from "../services/postService";
import {
  ExportData,
  FIGMA_BUTTON_TYPE,
  FIGMA_MESSAGE_TYPE,
} from "../types/common.type";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [hasSelectedFrames, setHasSelectedFrames] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState<any[]>([]);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [frameImages, setFrameImages] = useState<
    Array<{
      id: string;
      name: string;
      base64: string;
      base64ImageWithoutMime: string;
    }>
  >([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const response = await PostService.componentAnalysis(
        exportData!,
        frameImages,
        insight!,
      );

      let accumulatedData = "";
      for await (const chunk of response) {
        const text = chunk;
        accumulatedData += text;

        try {
          const parsedData = JSON.parse(accumulatedData);
          if (Array.isArray(parsedData)) {
            const transformedData = parsedData.map((frameAnalysis, index) => ({
              frameId: frameImages[index]?.id || `frame-${index}`,
              frameName: frameImages[index]?.name || `Frame ${index + 1}`,
              analysis: Array.isArray(frameAnalysis)
                ? frameAnalysis
                : [frameAnalysis],
            }));

            console.log("Transformed data:", transformedData);
            setGeminiResponse(transformedData);
            setShowAnalysis(true);
            accumulatedData = "";
          }
        } catch (e) {
          console.error("Error parsing data:", e, accumulatedData);
          continue;
        }
      }
    } catch (error) {
      console.error("Error during analysis:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeSchema = async () => {
    if (frameImages.length === 0) {
      console.error("Please select frames first.");
      return;
    }

    setIsLoading(true);
    try {
      parent.postMessage(
        {
          pluginMessage: { type: FIGMA_BUTTON_TYPE.EXPORT_SCHEMA },
        },
        "*",
      );

      const waitForExportData = new Promise<{
        data: string;
        images: Array<{
          id: string;
          base64ImageWithoutMime: string;
        }>;
      }>((resolve) => {
        const messageHandler = (event: MessageEvent) => {
          const pluginMessage = event.data.pluginMessage;
          if (pluginMessage?.type === FIGMA_MESSAGE_TYPE.EXPORT_SCHEMA_DATA) {
            window.removeEventListener("message", messageHandler);
            resolve({
              data: pluginMessage.data,
              images: pluginMessage.images,
            });
          }
        };
        window.addEventListener("message", messageHandler);
      });

      const { data: exportDataString, images } = await waitForExportData;
      const parsedExportData = JSON.parse(exportDataString);

      const data = await PostService.saveSchemaAnalysisData(
        images,
        parsedExportData as { documents: { id: string }[] },
      );

      PostService.openSchemaExplorerInNewTab(data.response.id);
    } catch (error) {
      console.error("Error analyzing schema:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetInsight = async () => {
    if (!exportData) {
      console.error("Missing required data for insight");
      return;
    }

    setIsLoadingInsight(true);
    try {
      const insightText = await PostService.getComponentInsight(
        exportData,
        frameImages,
      );
      setInsight(insightText);
    } catch (error) {
      console.error("Error getting insight:", error);
    } finally {
      setIsLoadingInsight(false);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const pluginMessage = event.data.pluginMessage;

      if (pluginMessage?.type === FIGMA_MESSAGE_TYPE.EXPORT_DATA) {
        try {
          const parsedExportData = JSON.parse(pluginMessage.data);
          const imageData = pluginMessage.images;
          setExportData(parsedExportData);
          setFrameImages(imageData);
        } catch (error) {
          console.error("Error processing export data:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (pluginMessage?.type === FIGMA_MESSAGE_TYPE.SELECTION_CHANGE) {
        setHasSelectedFrames(pluginMessage.hasSelection);
        if (pluginMessage.frameImages) {
          setFrameImages(pluginMessage.frameImages);
          parent.postMessage(
            { pluginMessage: { type: FIGMA_BUTTON_TYPE.EXPORT } },
            "*",
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);

    parent.postMessage(
      { pluginMessage: { type: FIGMA_BUTTON_TYPE.CHECK_SELECTION } },
      "*",
    );

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleSelectLayers = () => {
    parent.postMessage(
      {
        pluginMessage: { type: FIGMA_BUTTON_TYPE.SELECT_LAYERS },
      },
      "*",
    );
  };

  const handleProcessAllLayers = () => {
    setIsLoading(true);
    parent.postMessage(
      { pluginMessage: { type: FIGMA_BUTTON_TYPE.PROCESS_ALL_LAYERS } },
      "*",
    );
  };

  return (
    <Container>
      <Stack spacing={4}>
        {!hasSelectedFrames ? (
          <EmptyState
            onSelectLayers={handleSelectLayers}
            onProcessAllLayers={handleProcessAllLayers}
          />
        ) : (
          <>
            {!showAnalysis ? (
              <ExportView
                frameImages={frameImages}
                isLoading={isLoading}
                isLoadingInsight={isLoadingInsight}
                insight={insight}
                exportData={exportData}
                onExport={handleAnalyze}
                onGetInsight={handleGetInsight}
                onAnalyzeSchema={handleAnalyzeSchema}
                disableAnalyzeSchema={frameImages.length === 0}
              />
            ) : (
              <ComponentAnalysis
                components={geminiResponse}
                exportData={exportData!}
                frameImages={frameImages}
                insight={insight}
              />
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}

export default App;
