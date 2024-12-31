import AddIcon from "@mui/icons-material/Add";
import CodeIcon from "@mui/icons-material/Code";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { CodeGenerationService } from "../services/CodeGenerationService";

import type {
  ComponentAnalysisData,
  ComponentProp,
  ExportData,
} from "../types/common.type";

interface ComponentAnalysisProps {
  components: Array<{
    frameId: string;
    frameName: string;
    analysis: ComponentAnalysisData[];
  }>;
  exportData: ExportData;
  frameImages?: Array<{
    id: string;
    name: string;
    base64: string;
    base64ImageWithoutMime: string;
  }>;
  insight: string | null;
}

export function ComponentAnalysis({
  components: initialComponents,
  exportData,
  frameImages = [],
  insight,
}: ComponentAnalysisProps) {
  const [components, setComponents] = useState(initialComponents);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setComponents(initialComponents);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialComponents]);

  const handleAddComponent = () => {
    const newComponent = {
      frameId: `frame-${Date.now()}`,
      frameName: "New Component",
      analysis: [
        {
          componentName: "NewComponent",
          componentType: "Component",
          componentProps: [],
        },
      ],
    };
    setComponents([...components, newComponent]);
  };

  const handleAddProp = (componentIndex: number) => {
    const newComponents = [...components];
    newComponents[componentIndex].analysis[0].componentProps.push({
      title: "New Prop",
      description: "Description",
      example: "Example",
    });
    setComponents(newComponents);
  };

  const handleEditComponent = (componentIndex: number) => {
    setEditingComponent(`${componentIndex}`);
  };

  const handleSaveComponent = () => {
    setEditingComponent(null);
  };

  const handleDeleteComponent = (componentIndex: number) => {
    setComponents((prev) =>
      prev.filter((_, index) => index !== componentIndex),
    );
  };

  const handleDeleteProp = (componentIndex: number, propIndex: number) => {
    const newComponents = [...components];
    newComponents[componentIndex].analysis[0].componentProps.splice(
      propIndex,
      1,
    );
    setComponents(newComponents);
  };

  const handleUpdateField = (
    componentIndex: number,
    field: keyof ComponentAnalysisData,
    value: string,
  ) => {
    const newComponents = [...components];
    if (field === "componentProps") {
      newComponents[componentIndex].analysis[0].componentProps =
        JSON.parse(value);
    } else {
      newComponents[componentIndex].analysis[0][field] = value;
    }
    setComponents(newComponents);
  };

  const handleUpdateProp = (
    componentIndex: number,
    propIndex: number,
    field: keyof ComponentProp,
    value: string,
  ) => {
    const newComponents = [...components];
    newComponents[componentIndex].analysis[0].componentProps[propIndex][field] =
      value;
    setComponents(newComponents);
  };

  const handleViewCode = async () => {
    if (!exportData || !insight) {
      console.error("Missing required data for analysis");
      return;
    }

    setIsGenerating(true);
    try {
      const data = await CodeGenerationService.saveGenerationData(
        components,
        exportData.documents,
        frameImages,
        insight,
      );

      await new Promise((resolve) => setTimeout(resolve, 5000));
      CodeGenerationService.openInExplorer(data.response.id);
    } catch (error) {
      console.error("Error preparing analysis:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight="bold" paddingTop={2}>
        Component List
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          width: "100%",
          minHeight: "100px",
          bgcolor: "background.default",
        }}
      >
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <Typography variant="subtitle2" color="text.secondary">
            Component Insight
          </Typography>
          {insight ? (
            <Typography
              variant="body2"
              sx={{ whiteSpace: "pre-line", textAlign: "left" }}
            >
              {insight}
            </Typography>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: "italic" }}
            >
              No insight available
            </Typography>
          )}
        </Stack>
      </Paper>

      {components.map((component, index) => (
        <Card key={component.frameId} sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              {component.analysis.map((analysis) => (
                <Box key={analysis.componentName}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box flex={1}>
                      {editingComponent === `${index}` ? (
                        <Stack spacing={2}>
                          <TextField
                            fullWidth
                            label="Component Name"
                            value={analysis.componentName}
                            onChange={(e) =>
                              handleUpdateField(
                                index,
                                "componentName",
                                e.target.value,
                              )
                            }
                          />
                          <TextField
                            fullWidth
                            label="Component Type"
                            value={analysis.componentType}
                            onChange={(e) =>
                              handleUpdateField(
                                index,
                                "componentType",
                                e.target.value,
                              )
                            }
                          />
                        </Stack>
                      ) : (
                        <>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {analysis.componentName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Type: {analysis.componentType}
                          </Typography>
                        </>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {editingComponent === `${index}` ? (
                        <IconButton onClick={handleSaveComponent} size="small">
                          <SaveIcon />
                        </IconButton>
                      ) : (
                        <IconButton
                          onClick={() => handleEditComponent(index)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                      <IconButton
                        onClick={() => handleDeleteComponent(index)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Box sx={{ mt: 2 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2">Props:</Typography>
                      {editingComponent === `${index}` && (
                        <Button
                          size="small"
                          onClick={() => handleAddProp(index)}
                        >
                          Add Prop
                        </Button>
                      )}
                    </Stack>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      {analysis.componentProps.map((prop, propIndex) => (
                        <Box key={propIndex} sx={{ pl: 2 }}>
                          {editingComponent === `${index}` ? (
                            <Stack spacing={1}>
                              <TextField
                                size="small"
                                label="Title"
                                value={prop.title}
                                onChange={(e) =>
                                  handleUpdateProp(
                                    index,
                                    propIndex,
                                    "title",
                                    e.target.value,
                                  )
                                }
                              />
                              <TextField
                                size="small"
                                label="Description"
                                value={prop.description}
                                onChange={(e) =>
                                  handleUpdateProp(
                                    index,
                                    propIndex,
                                    "description",
                                    e.target.value,
                                  )
                                }
                              />
                              <TextField
                                size="small"
                                label="Example"
                                value={prop.example}
                                onChange={(e) =>
                                  handleUpdateProp(
                                    index,
                                    propIndex,
                                    "example",
                                    e.target.value,
                                  )
                                }
                              />
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleDeleteProp(index, propIndex)
                                }
                                sx={{ alignSelf: "flex-end" }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Stack>
                          ) : (
                            <Typography variant="body2">
                              <strong>{prop.title}:</strong> {prop.description}
                              {prop.example && (
                                <>
                                  <br />
                                  <em>Example: {prop.example}</em>
                                </>
                              )}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ))}

      <Stack direction="row" spacing={2} justifyContent="center">
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddComponent}
        >
          Add Component
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleViewCode}
          disabled={isGenerating}
          startIcon={<CodeIcon />}
          sx={{ minWidth: 200 }}
        >
          {isGenerating ? "Generating..." : "View Code"}
        </Button>
      </Stack>

      <div ref={bottomRef} />
    </Stack>
  );
}
