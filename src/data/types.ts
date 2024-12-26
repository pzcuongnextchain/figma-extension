export enum FIGMA_BUTTON_TYPE {
  EXPORT = "EXPORT",
  COPY = "COPY",
  CHECK_SELECTION = "CHECK_SELECTION",
  SELECT_LAYERS = "SELECT_LAYERS",
}

export enum FIGMA_MESSAGE_TYPE {
  EXPORT_DATA = "EXPORT_DATA",
  SELECTION_CHANGE = "SELECTION_CHANGE",
}

export interface ComponentData {
  key: string;
  name: string;
  description: string;
  remote: boolean;
  documentationLinks?: string[];
}

export interface ComponentSetData {
  key: string;
  name: string;
  description: string;
  remote: boolean;
}

export interface Override {
  id: string;
  overriddenFields: string[];
}

export interface NodeData {
  id: string;
  name: string;
  type: string;
  scrollBehavior?: string;
  componentId?: string;
  mainComponent?: string;
  overrides?: Override[];
  children?: NodeData[];
  blendMode?: string;
  fills?: any[];
  strokes?: any[];
  strokeWeight?: number;
  strokeAlign?: string;
  absoluteBoundingBox?: any;
  absoluteRenderBounds?: any;
  constraints?: any;
  effects?: any[];
  interactions?: any[];
}

export interface ExportData {
  components: { [key: string]: ComponentData };
  componentSets: { [key: string]: ComponentSetData };
  documents: NodeData[];
}
