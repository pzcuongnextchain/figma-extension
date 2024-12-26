import {
  ComponentData,
  ComponentSetData,
  NodeData,
  Override,
} from "../../data/types";

export function processNode(node: SceneNode): NodeData {
  const nodeData: NodeData = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  if ("scrollBehavior" in node) {
    nodeData.scrollBehavior = node.scrollBehavior as string;
  }

  if (node.type === "INSTANCE") {
    nodeData.componentId = (node as any).componentId;
    nodeData.overrides = extractOverrides(node as InstanceNode);
  }

  if ("children" in node) {
    nodeData.children = (node as FrameNode).children.map((child) =>
      processNode(child),
    );
  }

  if (node.type === "VECTOR") {
    const vectorNode = node as VectorNode;
    nodeData.blendMode = vectorNode.blendMode;
    nodeData.fills = vectorNode.fills as any[];
    nodeData.strokes = vectorNode.strokes as any[];
    nodeData.strokeWeight = vectorNode.strokeWeight as number;
    nodeData.strokeAlign = vectorNode.strokeAlign;
    nodeData.absoluteBoundingBox = vectorNode.absoluteBoundingBox;
    nodeData.absoluteRenderBounds = vectorNode.absoluteRenderBounds;
    nodeData.constraints = vectorNode.constraints;
    nodeData.effects = vectorNode.effects as any[];
    nodeData.interactions = vectorNode.reactions as any[];
  }

  return nodeData;
}

function extractOverrides(instance: InstanceNode): Override[] {
  return instance.overrides.map((override) => ({
    id: override.id,
    overriddenFields: override.overriddenFields,
  }));
}

export async function processComponents(): Promise<{
  [key: string]: ComponentData;
}> {
  await figma.loadAllPagesAsync();
  const components: { [key: string]: ComponentData } = {};

  const allComponents = figma.root.findAllWithCriteria({
    types: ["COMPONENT"],
  });
  for (const component of allComponents) {
    components[component.id] = {
      key: component.key,
      name: component.name,
      description: component.description || "",
      remote: component.remote,
      //   documentationLinks: component.documentationLinks.map((link) => link.url),
    };
  }

  return components;
}

export async function processComponentSets(): Promise<{
  [key: string]: ComponentSetData;
}> {
  await figma.loadAllPagesAsync();
  const componentSets: { [key: string]: ComponentSetData } = {};

  const allComponentSets = figma.root.findAllWithCriteria({
    types: ["COMPONENT_SET"],
  });
  for (const componentSet of allComponentSets) {
    componentSets[componentSet.id] = {
      key: componentSet.key,
      name: componentSet.name,
      description: componentSet.description || "",
      remote: componentSet.remote,
    };
  }

  return componentSets;
}
