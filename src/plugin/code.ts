import {
  FIGMA_BUTTON_TYPE,
  FIGMA_MESSAGE_TYPE,
  FrameExportData,
} from "../types/common.type";
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
              format: "JPG",
              constraint: { type: "SCALE", value: 1 },
            });
            return {
              id: node.id,
              name: node.name,
              base64: `data:image/png;base64,${figma.base64Encode(bytes)}`,
              base64ImageWithoutMime: `${figma.base64Encode(bytes)}`,
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
              base64ImageWithoutMime: `${figma.base64Encode(bytes)}`,
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
      data: JSON.stringify(data, null, 2),
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
        const { components, componentSets, document } = json;
        data.push({
          frameData: {
            components,
            componentSets,
            document,
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

function processNode(node: SceneNode) {
  const nodeData = {
    id: node.id,
    name: node.name,
    type: node.type,
    children: [],
  };

  if ("children" in node) {
    nodeData.children = node.children.map(
      (child) => processNode(child) as never,
    );
  }

  return nodeData;
}
