import { Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { AIModel, BaseService } from "../services/base/BaseService";
import {
  DesignGenerationRequest,
  sampleLandingPageRequest,
} from "../types/design.type";

interface EmptyStateProps {
  onSelectLayers: () => void;
  onProcessAllLayers: () => void;
}

export function EmptyState({ onSelectLayers }: EmptyStateProps) {
  const [selectedModel, setSelectedModel] = useState<AIModel>(() =>
    BaseService.getModel(),
  );
  const [designPrompt, setDesignPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDesign = async () => {
    try {
      setIsGenerating(true);

      const request: DesignGenerationRequest = {
        ...sampleLandingPageRequest,
        // prompt: designPrompt,
      };

      parent.postMessage(
        {
          pluginMessage: {
            type: "generate-design",
            request,
          },
        },
        "*",
      );
    } catch (error) {
      console.error("Error generating design:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Stack
      component="header"
      spacing={4}
      alignItems="center"
      sx={{ textAlign: "center", maxWidth: 600, mx: "auto", p: 3 }}
    >
      {/* Generate Design Section */}
      {/* <Stack spacing={2} sx={{ width: "100%" }}>
        <Typography variant="h6" fontWeight="bold">
          Generate Figma Design
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Describe your design idea and AI will generate a suitable Figma design
          for you
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Describe the design you want to create (e.g., 'Create a modern dashboard with a sidebar, statistics cards, and a main content area with a data table')"
          value={designPrompt}
          onChange={(e) => setDesignPrompt(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={handleGenerateDesign}
          disabled={!designPrompt.trim() || isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Design"}
        </Button>
      </Stack>

      <Divider sx={{ width: "100%" }}>
        <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
          OR
        </Typography>
      </Divider> */}

      <Stack spacing={2} sx={{ width: "100%" }}>
        <Typography variant="h6" fontWeight="bold">
          Extract Code from Design
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" onClick={onSelectLayers}>
            Select Layers to Analyze
          </Button>
        </Stack>
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
