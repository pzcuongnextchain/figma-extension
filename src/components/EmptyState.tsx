import { Button, Stack, Typography } from "@mui/material";

interface EmptyStateProps {
  onSelectLayers: () => void;
  onProcessAllLayers: () => void;
}

export function EmptyState({
  onSelectLayers,
  onProcessAllLayers,
}: EmptyStateProps) {
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
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={onSelectLayers}>
          Select layers to analyze
        </Button>
        <Button variant="contained" onClick={onProcessAllLayers}>
          Process Ready Components
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
