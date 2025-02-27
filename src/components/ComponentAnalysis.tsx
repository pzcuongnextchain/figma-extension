import AddIcon from "@mui/icons-material/Add";
import CodeIcon from "@mui/icons-material/Code";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { CodeGenerationService } from "../services/CodeGenerationService";

import type {
  ComponentAnalysisData,
  ComponentProp,
  FrameExportData,
} from "../types/common.type";

interface ComponentAnalysisProps {
  components: Array<{
    frameId: string;
    frameName: string;
    analysis: ComponentAnalysisData[];
  }>;
  exportData: FrameExportData;
  frameImages: Array<{
    id: string;
    name: string;
    base64: string;
    base64ImageWithoutMime: string;
  }>;
  insight: {
    analyzedData: string;
    base64Image: string;
  }[];
}

export function ComponentAnalysis({
  components: initialComponents,
  exportData,
  frameImages,
  insight,
}: ComponentAnalysisProps) {
  const [components, setComponents] = useState(initialComponents);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [command, setCommand] = useState<string>("");

  // Reset command when components change
  useEffect(() => {
    setCommand("");
  }, [initialComponents]);

  useEffect(() => {
    setComponents(initialComponents);
  }, [initialComponents]);

  // Scroll to command when it's generated
  useEffect(() => {
    if (command) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [command]);

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
    if (!exportData || !frameImages) {
      console.error("Missing required data for analysis");
      return;
    }

    setIsGenerating(true);
    try {
      const analyzedComponents = components.map(
        (component) => component.analysis[0],
      );

      console.log(frameImages);

      // Create insight array with frame images
      const insightWithImages = frameImages.map((frame) => ({
        analyzedData: "", // Empty string as we're focusing on images
        base64Image: frame.base64ImageWithoutMime,
      }));

      const data = await CodeGenerationService.saveGenerationData(
        exportData,
        analyzedComponents,
        insightWithImages, // Use the new insight array with images
      );

      setCommand(`pzcuong189 generate ${data.response.id}`);
    } catch (error) {
      console.error("Error preparing analysis:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCommand = async () => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = command;
      textarea.style.position = "fixed";
      textarea.style.left = "-999999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      {/* <Typography variant="h6" fontWeight="bold" paddingTop={2}>
        Component List
      </Typography> */}

      {components.map((component, index) => (
        <Card key={component.frameId} sx={{ mb: 2, width: "100%" }}>
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
          disabled
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

      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess(false)}
        message="Command copied to clipboard"
      />

      {command && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              CLI Command
            </Typography>
            <TextField
              fullWidth
              value={command}
              InputProps={{
                readOnly: true,
                sx: {
                  fontFamily: "monospace",
                  bgcolor: "action.hover",
                  "& .MuiInputAdornment-root": {
                    marginRight: -0.5,
                  },
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleCopyCommand}
                      size="small"
                      sx={{
                        padding: "4px",
                        "& .MuiSvgIcon-root": {
                          fontSize: "1rem",
                        },
                      }}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
          </CardContent>
        </Card>
      )}

      <div ref={bottomRef} />
    </Stack>
  );
}
