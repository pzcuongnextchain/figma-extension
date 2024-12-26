import { Button, Stack, Typography } from "@mui/material";

interface EmptyStateProps {
  onSelectLayers: () => void;
}

export function EmptyState({ onSelectLayers }: EmptyStateProps) {
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
      <Button variant="outlined" onClick={onSelectLayers}>
        Select layers to analyze
      </Button>
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
