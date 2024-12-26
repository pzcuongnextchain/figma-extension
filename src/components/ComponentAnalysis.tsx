import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

interface ComponentProp {
  title: string;
  description: string;
  example: string;
}

interface ComponentData {
  componentName: string;
  componentType: string;
  componentProps: ComponentProp[];
}

interface ComponentAnalysisProps {
  components: ComponentData[];
}

export function ComponentAnalysis({ components }: ComponentAnalysisProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight="bold" paddingTop={2}>
        Component Analysis
      </Typography>
      {components.map((component, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6">{component.componentName}</Typography>
                <Chip
                  label={component.componentType}
                  size="small"
                  color="primary"
                />
              </Stack>

              {component.componentProps.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Props:
                  </Typography>
                  <Stack spacing={1}>
                    {component.componentProps.map((prop, propIndex) => (
                      <Box key={propIndex}>
                        <Typography variant="subtitle2" color="primary">
                          {prop.title}
                        </Typography>
                        <Typography variant="body2">
                          {prop.description}
                        </Typography>
                        <Typography variant="body2">{prop.example}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
