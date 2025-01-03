export enum FIGMA_BUTTON_TYPE {
  EXPORT = "EXPORT",
  EXPORT_SCHEMA = "EXPORT_SCHEMA",
  COPY = "COPY",
  CHECK_SELECTION = "CHECK_SELECTION",
  SELECT_LAYERS = "SELECT_LAYERS",
  PROCESS_ALL_LAYERS = "PROCESS_ALL_LAYERS",
}

export enum FIGMA_MESSAGE_TYPE {
  EXPORT_DATA = "EXPORT_DATA",
  EXPORT_SCHEMA_DATA = "EXPORT_SCHEMA_DATA",
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
  id: string | number;
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

export interface FrameExportData {
  frameData: ExportData;
  base64Image?: string;
}
export interface ExportData {
  components: { [key: string]: ComponentData };
  componentSets: { [key: string]: ComponentSetData };
  document: { [key: string]: NodeData };
}

export interface ComponentProp {
  title: string;
  description: string;
  example?: string;
}

export interface ComponentAnalysisData {
  componentName: string;
  componentType: string;
  componentProps: ComponentProp[];
}

export interface ComponentAnalysisProps {
  components: Array<{
    frameId: string;
    frameName: string;
    analysis: ComponentAnalysisData[];
  }>;
  exportData?: ExportData;
  frameImages?: Array<{
    id: string;
    base64ImageWithoutMime: string;
  }>;
}
