import { Box, Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import { ChatBox } from "../components/Chat/ChatBox";
import { SchemaEditor } from "../components/SchemaEditor/SchemaEditor";
import { SchemaService } from "../services/SchemaService";
import { SchemaData, SchemaViewer } from "./SchemaViewer";

export const SchemaExplorer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatValue, setChatValue] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [schemaJson, setSchemaJson] = useState("");
  const urlParams = new URLSearchParams(window.location.search);
  const generationId = urlParams.get("id");
  const [schemaData, setSchemaData] = useState<SchemaData | null>(null);

  useEffect(() => {
    if (generationId) {
      fetchSchemaData(generationId);
    }
  }, [generationId]);

  const handleJsonChange = (value: string) => {
    setSchemaJson(value);
    try {
      const parsed = JSON.parse(value);
      setSchemaData(parsed);
      setJsonError(null);
    } catch (error) {
      setJsonError("Invalid JSON format");
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(schemaJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setSchemaJson(formatted);
      setJsonError(null);
    } catch (error) {
      setJsonError("Invalid JSON format");
    }
  };

  const fetchSchemaData = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await SchemaService.getSchemaStream(id);
      await processStreamResponse(response);
    } catch (error) {
      console.error("Error fetching schema data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processStreamResponse = async (response: Response) => {
    const reader = response.body!.getReader();
    let accumulatedData = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      accumulatedData += chunk;

      try {
        const parsedData = JSON.parse(accumulatedData);
        if (parsedData.tables && Array.isArray(parsedData.tables)) {
          setSchemaData(parsedData);
          setSchemaJson(JSON.stringify(parsedData, null, 2));
        }
      } catch (error) {
        // If JSON parsing fails, continue accumulating data
        continue;
      }
    }
  };

  const handleChatSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!chatValue.trim() || !generationId || isStreaming) return;

    setIsStreaming(true);
    try {
      const response = await SchemaService.continueSchemaGeneration(
        generationId,
        chatValue,
      );
      await processStreamResponse(response);
      setChatValue("");
    } catch (error) {
      console.error("Error in chat:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <Grid container sx={{ height: "100vh" }}>
      <Grid
        item
        xs={3}
        sx={{
          height: "100vh",
          borderRight: 1,
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 80,
            // overflow: "auto",
            p: 2,
          }}
        >
          <SchemaEditor
            value={schemaJson}
            onChange={handleJsonChange}
            error={jsonError}
            onFormat={handleFormatJson}
          />
        </Box>
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <ChatBox
            value={chatValue}
            onChange={(e) => setChatValue(e.target.value)}
            onSubmit={handleChatSubmit}
            isStreaming={isStreaming}
          />
        </Box>
      </Grid>

      <Grid item xs={9} sx={{ height: "100vh" }}>
        {isLoading ? (
          <Box sx={{ p: 2 }}>Loading schema...</Box>
        ) : (
          <SchemaViewer data={schemaData} />
        )}
      </Grid>
    </Grid>
  );
};
