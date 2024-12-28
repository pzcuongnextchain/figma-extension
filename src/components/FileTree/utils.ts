import { FileContent, FileNode } from "../../types/explorer";

export const createFileTree = (files: FileContent[]): FileNode => {
  const root: FileNode = {
    name: "",
    path: "",
    children: {},
    content: null,
    isFile: false,
  };

  files.forEach((file) => {
    const parts = file.fileName.split("/");
    let currentNode = root;

    parts.forEach((part, index) => {
      const currentPath = parts.slice(0, index + 1).join("/");
      if (!currentNode.children[part]) {
        currentNode.children[part] = {
          name: part,
          path: currentPath,
          children: {},
          content: index === parts.length - 1 ? file.fileContent : null,
          isFile: index === parts.length - 1,
        };
      }
      currentNode = currentNode.children[part];
    });
  });

  return root;
};

export const getLanguage = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  const languageMap: { [key: string]: string } = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
  };
  return languageMap[extension] || "text";
};
