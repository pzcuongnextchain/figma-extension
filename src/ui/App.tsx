import { Container, Stack } from "@mui/material";
import { useEffect, useState } from "react";

import { ComponentAnalysis } from "../components/ComponentAnalysis";
import { EmptyState } from "../components/EmptyState";
import { ExportView } from "../components/ExportView";
import {
  ExportData,
  FIGMA_BUTTON_TYPE,
  FIGMA_MESSAGE_TYPE,
} from "../data/types";
import { PostService } from "../services/postService";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasSelectedFrames, setHasSelectedFrames] = useState(false);
  const [framePreviewUrl, setFramePreviewUrl] = useState<string | null>(null);
  const [geminiResponse, setGeminiResponse] = useState<any[]>([]);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  const onExport = () => {
    setIsLoading(true);
    parent.postMessage(
      { pluginMessage: { type: FIGMA_BUTTON_TYPE.EXPORT } },
      "*",
    );
  };

  const onCopy = () => {
    setIsLoading(true);
    parent.postMessage(
      { pluginMessage: { type: FIGMA_BUTTON_TYPE.COPY } },
      "*",
    );
  };

  useEffect(() => {
    window.onmessage = async (event) => {
      if (event.data.pluginMessage.type === FIGMA_MESSAGE_TYPE.EXPORT_DATA) {
        try {
          const pluginMessage = event.data.pluginMessage;
          const parsedExportData = JSON.parse(pluginMessage.data);
          const imageData = pluginMessage.image;
          setExportData(parsedExportData);
          setBase64Image(imageData);
          const geminiResponse = await PostService.sendToGemini(
            parsedExportData,
            imageData,
          );
          const parsedResponse = JSON.parse(geminiResponse.response);
          setGeminiResponse(parsedResponse);
          console.log("Gemini response:", parsedResponse);
        } catch (error) {
          console.error("Error processing export:", error);
        } finally {
          setIsLoading(false);
        }
      }
      if (
        event.data.pluginMessage.type === FIGMA_MESSAGE_TYPE.SELECTION_CHANGE
      ) {
        setHasSelectedFrames(event.data.pluginMessage.hasSelection);
        setFramePreviewUrl(event.data.pluginMessage.framePreviewUrl);
      }
    };

    parent.postMessage(
      { pluginMessage: { type: FIGMA_BUTTON_TYPE.CHECK_SELECTION } },
      "*",
    );

    return () => {
      window.onmessage = null;
    };
  }, []);

  const handleSelectLayers = () => {
    parent.postMessage(
      {
        pluginMessage: { type: FIGMA_BUTTON_TYPE.SELECT_LAYERS },
      },
      "*",
    );
  };

  return (
    <Container>
      <Stack spacing={4}>
        {!hasSelectedFrames ? (
          <EmptyState onSelectLayers={handleSelectLayers} />
        ) : (
          <>
            <ExportView
              framePreviewUrl={framePreviewUrl}
              isLoading={isLoading}
              onExport={onExport}
              onCopy={onCopy}
            />
            {geminiResponse.length > 0 && (
              <ComponentAnalysis
                components={geminiResponse}
                exportData={exportData ?? undefined}
                base64Image={base64Image ?? undefined}
              />
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}

export default App;
