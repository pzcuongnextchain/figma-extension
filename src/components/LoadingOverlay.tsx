import { Box, LinearProgress, Typography, alpha } from "@mui/material";
import React from "react";

interface LoadingOverlayProps {
  show: boolean;
  progress?: number;
  currentStep?: string;
}

const loadingSteps = [
  "Analyzing components structure...",
  "Extracting design patterns...",
  "Generating component insights...",
  "Finalizing analysis...",
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show }) => {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);

  React.useEffect(() => {
    if (show) {
      const interval = setInterval(() => {
        setCurrentStepIndex((prev) => (prev + 1) % loadingSteps.length);
      }, 10000);

      return () => clearInterval(interval);
    } else {
      setCurrentStepIndex(0);
    }
  }, [show]);

  if (!show) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: alpha("#fff", 0.9),
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(5px)",
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: "90%",
          textAlign: "center",
          p: 3,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Generating Insights
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 3,
            minHeight: "3em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loadingSteps[currentStepIndex]}
        </Typography>
        <LinearProgress
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: alpha("#000", 0.05),
            "& .MuiLinearProgress-bar": {
              borderRadius: 4,
            },
          }}
        />
      </Box>
    </Box>
  );
};
