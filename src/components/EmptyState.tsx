import { Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { AIModel, BaseService } from "../services/base/BaseService";

interface EmptyStateProps {
  onSelectLayers: () => void;
  onProcessAllLayers: () => void;
}

export function EmptyState({ onSelectLayers }: EmptyStateProps) {
  const [selectedModel, setSelectedModel] = useState<AIModel>(() =>
    BaseService.getModel(),
  );

  const handleModelChange = (
    event: React.MouseEvent<HTMLElement>,
    newModel: AIModel,
  ) => {
    if (newModel !== null) {
      setSelectedModel(newModel);
      BaseService.setModel(newModel);
    }
  };

  return (
    <Stack
      component="header"
      spacing={2}
      alignItems="center"
      sx={{ textAlign: "center" }}
    >
      <Typography variant="h6" fontWeight="bold" paddingTop={2}>
        Generate AI-powered components
      </Typography>

      {/* <ToggleButtonGroup
        value={selectedModel}
        exclusive
        onChange={handleModelChange}
        aria-label="AI model selection"
        size="small"
        color="primary"
      >
        <ToggleButton
          value="openai"
          aria-label="ChatGPT"
          sx={{ textTransform: "none", fontSize: "1rem" }}
        >
          ChatGPT-4o
        </ToggleButton>
        <ToggleButton
          value="gemini"
          aria-label="Gemini"
          sx={{ textTransform: "none", fontSize: "1rem" }}
        >
          Gemini 2.0
        </ToggleButton>
      </ToggleButtonGroup> */}

      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={onSelectLayers}>
          Select layers to analyze
        </Button>
      </Stack>

      <Typography
        variant="body2"
        color="primary"
        component="a"
        href="your-setup-url"
        target="_blank"
        sx={{ textDecoration: "none", cursor: "pointer" }}
      >
        How to setup your design file
      </Typography>
    </Stack>
  );
}
