import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { ComponentAnalysisData, ExportData } from "../data/types";
import { PostService } from "../services/postService";

interface ComponentAnalysisProps {
  components: ComponentAnalysisData[];
  exportData?: ExportData;
  base64Image?: string;
}

export function ComponentAnalysis({
  components: initialComponents,
  exportData,
  base64Image,
}: ComponentAnalysisProps) {
  const [components, setComponents] = useState(initialComponents);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [components.length]);

  const handleDelete = (index: number) => {
    const updatedComponents = [...components];
    updatedComponents.splice(index, 1);
    setComponents(updatedComponents);
  };

  const handleEdit = (index: number) => {
    setEditingId(index);
  };

  const handleSave = (
    index: number,
    updatedComponent: ComponentAnalysisData,
  ) => {
    setComponents(
      components.map((comp, i) => (i === index ? updatedComponent : comp)),
    );
    setEditingId(null);
  };

  const handleAddComponent = () => {
    const newComponent: ComponentAnalysisData = {
      componentName: "Your Component Name",
      componentType: "Component Type",
      componentProps: [
        { description: "Description of the prop", title: "Prop Name" },
        { description: "Description of the prop", title: "Prop Name" },
      ],
    };
    setComponents([...components, newComponent]);
  };

  const handleGenerateCode = async () => {
    if (!exportData || !base64Image) {
      console.error("Missing required data for code generation");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await PostService.generateCode(
        components,
        exportData,
        base64Image,
      );
      console.log("Generated code:", response);
    } catch (error) {
      console.error("Error generating code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        paddingTop={2}
      >
        <Typography variant="h6" fontWeight="bold">
          Component Analysis
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddComponent}
        >
          Add Component
        </Button>
      </Stack>

      {components.map((component, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  {editingId === index ? (
                    <input
                      value={component.componentName}
                      onChange={(e) => {
                        const updated = {
                          ...component,
                          componentName: e.target.value,
                        };
                        handleSave(index, updated);
                      }}
                    />
                  ) : (
                    <Typography variant="h6">
                      {component.componentName}
                    </Typography>
                  )}
                  <Chip
                    label={component.componentType}
                    size="small"
                    color="primary"
                  />
                </Stack>
                <Stack direction="row" spacing={1}>
                  {editingId === index ? (
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleSave(index, component)}
                    >
                      <SaveIcon />
                    </IconButton>
                  ) : (
                    <>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(index)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </Stack>
              </Stack>

              {component.componentProps.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Props:
                  </Typography>
                  <Stack spacing={1}>
                    {component.componentProps.map((prop, propIndex) => (
                      <Box key={propIndex}>
                        {editingId === index ? (
                          <Stack spacing={1}>
                            <input
                              value={prop.title}
                              onChange={(e) => {
                                const updatedProps = [
                                  ...component.componentProps,
                                ];
                                updatedProps[propIndex] = {
                                  ...prop,
                                  title: e.target.value,
                                };
                                const updated = {
                                  ...component,
                                  componentProps: updatedProps,
                                };
                                handleSave(index, updated);
                              }}
                            />
                            <input
                              value={prop.description}
                              onChange={(e) => {
                                const updatedProps = [
                                  ...component.componentProps,
                                ];
                                updatedProps[propIndex] = {
                                  ...prop,
                                  description: e.target.value,
                                };
                                const updated = {
                                  ...component,
                                  componentProps: updatedProps,
                                };
                                handleSave(index, updated);
                              }}
                            />
                            <input
                              value={prop.example}
                              onChange={(e) => {
                                const updatedProps = [
                                  ...component.componentProps,
                                ];
                                updatedProps[propIndex] = {
                                  ...prop,
                                  example: e.target.value,
                                };
                                const updated = {
                                  ...component,
                                  componentProps: updatedProps,
                                };
                                handleSave(index, updated);
                              }}
                            />
                          </Stack>
                        ) : (
                          <>
                            <Typography variant="subtitle2" color="primary">
                              {prop.title}
                            </Typography>
                            <Typography variant="body2">
                              {prop.description}
                            </Typography>
                            <Typography variant="body2">
                              {prop.example}
                            </Typography>
                          </>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="contained"
        color="primary"
        onClick={handleGenerateCode}
        disabled={isGenerating}
        sx={{ mt: 2 }}
      >
        {isGenerating ? "Generating..." : "Generate Code"}
      </Button>

      <div ref={bottomRef} />
    </Stack>
  );
}
