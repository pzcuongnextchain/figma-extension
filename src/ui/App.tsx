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
  const [hasSelectedFrames, setHasSelectedFrames] = useState(false);
  const [framePreviewUrl, setFramePreviewUrl] = useState<string | null>(null);
  const [geminiResponse, setGeminiResponse] = useState<any[]>([]);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  const openCodeExplorer = (data: any) => {
    const url = new URL(window.location.href);
    url.pathname = "/";
    const dataToPass = Array.isArray(data) ? data : [];
    window.open(
      "http://localhost:5173/code-explorer?data=" + JSON.stringify(dataToPass),
      "_blank",
    );
  };

  const onExport = async () => {
    setIsLoading(true);
    try {
      parent.postMessage(
        { pluginMessage: { type: FIGMA_BUTTON_TYPE.EXPORT } },
        "*",
      );
    } catch (error) {
      console.error("Error during export:", error);
      setIsLoading(false);
    }
  };

  const onCopy = () => {
    try {
      setIsLoading(true);
      parent.postMessage(
        { pluginMessage: { type: FIGMA_MESSAGE_TYPE.EXPORT_DATA } },
        "*",
      );
    } catch (error) {
      console.error("Error copying data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const pluginMessage = event.data.pluginMessage;

      if (pluginMessage?.type === FIGMA_MESSAGE_TYPE.EXPORT_DATA) {
        try {
          const parsedExportData = JSON.parse(pluginMessage.data);
          const imageData = pluginMessage.image;
          setExportData(parsedExportData);
          setBase64Image(imageData);

          const response = await PostService.componentAnalysis(
            parsedExportData,
            imageData,
          );

          let accumulatedData = "";
          for await (const chunk of response) {
            const text = chunk;
            accumulatedData += text;

            try {
              const parsedData = JSON.parse(accumulatedData);
              if (Array.isArray(parsedData)) {
                setGeminiResponse(parsedData);
                accumulatedData = ""; // Clear the buffer after successful parse
              }
            } catch (e) {
              continue;
            }
          }
        } catch (error) {
          console.error("Error processing export data:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (pluginMessage?.type === FIGMA_MESSAGE_TYPE.SELECTION_CHANGE) {
        setHasSelectedFrames(pluginMessage.hasSelection);
        setFramePreviewUrl(pluginMessage.framePreviewUrl);
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
