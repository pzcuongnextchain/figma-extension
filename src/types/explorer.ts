export interface FileContent {
  fileName: string;
  fileContent: string | null;
}

export interface FileNode {
  name: string;
  path: string;
  children: { [key: string]: FileNode };
  content: string | null;
  isFile: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FileTreeItemProps {
  node: FileNode;
  level?: number;
  onFileClick: (fileName: string, content: string | null) => void;
  selectedPath: string | null;
  isFileUpdated?: (fileName: string) => boolean;
}

export interface CodeExplorerProps {
  generationId?: string;
}

export interface FileViewerProps {
  selectedFile: FileContent | null;
  getLanguage: (fileName: string) => string;
  files: FileContent[];
  isFileUpdated?: (fileName: string) => boolean;
}

export interface FileListProps {
  files: FileContent[];
  selectedFile: FileContent | null;
  onFileClick: (fileName: string, content: string | null) => void;
  isFileUpdated?: (fileName: string) => boolean;
}

export interface ChatBoxProps {
  value: string;
  isStreaming: boolean;
  showContinue?: boolean;
  uncompleteContent?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent, message?: string) => void;
}
