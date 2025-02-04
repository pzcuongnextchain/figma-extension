import _ from "lodash";
import { DesignGeneratorService } from "../services/DesignGeneratorService";
import {
  FIGMA_BUTTON_TYPE,
  FIGMA_MESSAGE_TYPE,
  FrameExportData,
  NodeData,
} from "../types/common.type";
import { DesignSystem, designSystem } from "../types/design.type";

figma.showUI(__html__, {
  width: 500,
  height: 700,
  themeColors: true,
});

figma.ui.onmessage = async (msg) => {
  if (msg.type === FIGMA_BUTTON_TYPE.EXPORT) {
    const selection = figma.currentPage.selection;
    const data = await processSelectedNodes(selection);

    const frameImages = await Promise.all(
      selection.map(async (node) => {
        if (node.type === "FRAME") {
          try {
            const bytes = await node.exportAsync({
              format: "PNG",
              constraint: { type: "SCALE", value: 2 },
            });
            return {
              id: node.id,
              name: node.name,
              base64: `data:image/png;base64,${figma.base64Encode(bytes)}`,
              base64ImageWithoutMime: figma.base64Encode(bytes),
            };
          } catch (error) {
            console.error(`Error exporting frame ${node.name}:`, error);
            return null;
          }
        }
        return null;
      }),
    ).then((results) => results.filter(Boolean));

    figma.ui.postMessage({
      type: FIGMA_MESSAGE_TYPE.EXPORT_DATA,
      data: JSON.stringify(data, null, 2),
      images: frameImages,
    });
  }

  if (msg.type === FIGMA_BUTTON_TYPE.EXPORT_SCHEMA) {
    const selection = figma.currentPage.selection;
    const data = await processSelectedNodes(selection);

    const frameImages = await Promise.all(
      selection.map(async (node) => {
        if (node.type === "FRAME") {
          try {
            const bytes = await node.exportAsync({
              format: "JPG",
              constraint: { type: "SCALE", value: 1 },
            });
            return {
              id: node.id,
              name: node.name,
              base64: `data:image/png;base64,${figma.base64Encode(bytes)}`,
            };
          } catch (error) {
            console.error(`Error exporting frame ${node.name}:`, error);
            return null;
          }
        }
        return null;
      }),
    ).then((results) => results.filter(Boolean));

    figma.ui.postMessage({
      type: FIGMA_MESSAGE_TYPE.EXPORT_SCHEMA_DATA,
      data: JSON.stringify(data, null, 0),
      images: frameImages,
    });
  }

  if (msg.type === FIGMA_BUTTON_TYPE.COPY) {
    // const selection = figma.currentPage.selection;
    // const data = processSelectedNodes(selection);
    // figma.ui.postMessage({
    //   type: FIGMA_MESSAGE_TYPE,
    //   data: JSON.stringify(data, null, 2),
    // });
    // figma.notify("Data copied to clipboard");
  }

  if (msg.type === "generate-design") {
    try {
      const request = msg.request;
      const mainFrame = await DesignGeneratorService.generateDesign(
        request,
        designSystem as DesignSystem,
      );

      // Notify the UI that generation is complete
      figma.ui.postMessage({ type: "generation-complete" });

      // Select and zoom to the new frame
      await figma.setCurrentPageAsync(mainFrame.parent as PageNode);
      figma.viewport.scrollAndZoomIntoView([mainFrame]);
    } catch (error) {
      console.error("Error generating design:", error);
      figma.ui.postMessage({
        type: "generation-error",
        error: (error as Error).message,
      });
    }
  }
};

figma.on("selectionchange", async () => {
  const selection = figma.currentPage.selection;
  const hasSelection = selection.length > 0;
  let frameImages: { id: string; name: string; base64: string }[] = [];

  if (hasSelection) {
    frameImages = (await Promise.all(
      selection.map(async (node) => {
        if (node.type === "FRAME") {
          try {
            const bytes = await node.exportAsync({
              format: "PNG",
              constraint: { type: "SCALE", value: 1 },
            });
            return {
              id: node.id,
              name: node.name,
              base64: `data:image/png;base64,${figma.base64Encode(bytes)}`,
              base64ImageWithoutMime: figma.base64Encode(bytes),
            };
          } catch (error) {
            console.error(`Error exporting frame ${node.name}:`, error);
            return null;
          }
        }
        return null;
      }),
    ).then((results) => results.filter(Boolean))) as {
      id: string;
      name: string;
      base64: string;
    }[];
  }

  if (hasSelection && frameImages.length > 0) {
    figma.ui.postMessage({
      type: FIGMA_MESSAGE_TYPE.SELECTION_CHANGE,
      hasSelection,
      frameImages,
    });
  } else {
    figma.notify("Please select a frame");
    figma.ui.postMessage({
      type: FIGMA_MESSAGE_TYPE.SELECTION_CHANGE,
      hasSelection: false,
    });
  }
});

async function processSelectedNodes(
  selection: readonly SceneNode[],
): Promise<FrameExportData[]> {
  let data: FrameExportData[] = [];

  if (selection.length > 0) {
    selection.forEach(async (node) => {
      if (node.type === "FRAME") {
        const json = (await node.exportAsync({
          format: "JSON_REST_V1",
        })) as { components: any; componentSets: any; document: any };
        const bytes = await node.exportAsync({
          format: "PNG",
          constraint: { type: "SCALE", value: 1 },
        });
        const base64Image = figma.base64Encode(bytes);
        const { document } = json;
        const processedDocument = processNode(document);
        data.push({
          frameData: {
            document: processedDocument,
          },
          base64Image,
        });
      }
    });
  } else {
    figma.notify("Please select at least one frame");
  }

  return data;
}

function processNode(node: SceneNode): NodeData {
  const nodeData = _.cloneDeep(node) as unknown as NodeData;

  const removeKeys = [
    "overrides",
    "id",
    "componentId",
    "absoluteBoundingBox",
    "absoluteRenderBounds",
    "constraints",
  ];
  removeKeys.forEach((key) => {
    delete nodeData[key as keyof NodeData];
  });

  if (Array.isArray(nodeData.fills) && nodeData.fills.length === 1) {
    const fill = nodeData.fills[0];
    if (
      fill.color &&
      fill.color.r === 1 &&
      fill.color.g === 1 &&
      fill.color.b === 1 &&
      fill.color.a === 1
    ) {
      delete nodeData.fills;
    }
  }

  if (
    nodeData.backgroundColor &&
    nodeData.backgroundColor.r === 0 &&
    nodeData.backgroundColor.g === 0 &&
    nodeData.backgroundColor.b === 0 &&
    nodeData.backgroundColor.a === 0
  ) {
    delete nodeData.backgroundColor;
  }

  Object.keys(nodeData).forEach((key) => {
    if (
      Array.isArray(nodeData[key as keyof NodeData]) &&
      nodeData[key as keyof NodeData].length === 0
    ) {
      delete nodeData[key as keyof NodeData];
    }
  });

  if ("children" in node && Array.isArray(node.children)) {
    if (node.children.length > 0) {
      nodeData.children = node.children.map((child) => processNode(child));
    } else {
      delete nodeData.children;
    }
  }

  return nodeData;
}
