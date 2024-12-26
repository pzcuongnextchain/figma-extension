import { processComponentSets } from "./utils/nodeProcessor";

import _ from "lodash";
import {
  ExportData,
  FIGMA_BUTTON_TYPE,
  FIGMA_MESSAGE_TYPE,
} from "../data/types";
import { processComponents } from "./utils/nodeProcessor";
figma.showUI(__html__, {
  width: 400,
  height: 550,
  themeColors: true,
});

figma.ui.onmessage = async (msg) => {
  if (msg.type === FIGMA_BUTTON_TYPE.EXPORT) {
    const selection = figma.currentPage.selection;
    const data = await processSelectedNodes(selection);

    const bytes = await _.first(selection)!.exportAsync({
      format: "PNG",
      constraint: { type: "SCALE", value: 2 },
    });

    const base64String = figma.base64Encode(bytes);

    figma.ui.postMessage({
      type: FIGMA_MESSAGE_TYPE.EXPORT_DATA,
      data: JSON.stringify(data, null, 2),
      image: base64String,
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
  let framePreviewUrl = null;

  if (hasSelection && _.first(selection)!.type === "FRAME") {
    framePreviewUrl = await generateFramePreview(_.first(selection)!);
  }

  if (hasSelection && framePreviewUrl) {
    figma.ui.postMessage({
      type: FIGMA_MESSAGE_TYPE.SELECTION_CHANGE,
      hasSelection,
      framePreviewUrl,
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
): Promise<ExportData> {
  const data: ExportData = {
    components: await processComponents(),
    componentSets: await processComponentSets(),
    documents: [],
  };

  if (selection.length > 0) {
    selection.forEach((node) => {
      if (node.type === "FRAME") {
        data.documents.push(processNode(node));
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

async function generateFramePreview(node: SceneNode): Promise<string | null> {
  if (node.type === "FRAME") {
    try {
      const bytes = await node.exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: 2 },
      });

      const base64String = figma.base64Encode(bytes);
      return `data:image/png;base64,${base64String}`;
    } catch (error) {
      console.error("Error generating preview:", error);
      return null;
    }
  }
  return null;
}
