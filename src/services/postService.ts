import type {
  ComponentAnalysisData,
  ExportData,
  NodeData,
} from "../types/common.type";
import { axiosInstance } from "./axiosConfig";

interface GeminiResponse {
  success: boolean;
  response: any;
}

export class PostService {
  static async componentAnalysis(
    exportData: ExportData,
    frameImages?: Array<{
      id: string;
      name: string;
      base64ImageWithoutMime: string;
    }>,
    insights?: string,
  ): Promise<ReadableStream> {
    try {
      const analysisData =
        frameImages?.map((frame) => ({
          components: exportData.components,
          // componentSets: exportData.componentSets,
          documents: exportData.documents.filter((doc) => doc.id === frame.id),
          base64Image: frame.base64ImageWithoutMime,
        })) ?? [];

      const response = await axiosInstance.post(
        "/gemini/component-analysis",
        {
          data: analysisData,
          insights,
        },
        {
          responseType: "stream",
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error sending data to Gemini:", error);
      throw error;
    }
  }

  static async generateCode(
    components: any[],
    exportData: ExportData,
    base64Image: string,
  ): Promise<GeminiResponse> {
    try {
      const response = await axiosInstance.post<GeminiResponse>(
        "/gemini/code-generation",
        {
          components,
          documents: exportData.documents,
          base64Image,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error generating code:", error);
      throw error;
    }
  }

  static async generateCodeStream(
    components: any[],
    exportData: ExportData,
    base64Image: string,
  ): Promise<ReadableStream> {
    try {
      const response = await axiosInstance.post(
        "/gemini/code-generation",
        {
          components,
          documents: exportData.documents,
          base64Image,
        },
        {
          responseType: "stream",
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error generating code:", error);
      throw error;
    }
  }

  static async saveGenerationData(
    components: Array<{
      frameId: string;
      frameName: string;
      analysis: ComponentAnalysisData[];
    }>,
    documents: NodeData[],
    frameImages?: Array<{ id: string; base64ImageWithoutMime: string }>,
    insights?: string,
  ): Promise<{ response: { id: string } }> {
    try {
      const payload = {
        data: components
          .map((component, index) => {
            const frameDocuments = documents.filter(
              (doc) => doc.id === component.frameId,
            );
            const base64Image = frameImages?.[index]?.base64ImageWithoutMime;

            if (frameDocuments.length > 0 && base64Image) {
              return {
                documents: frameDocuments,
                base64Image,
              };
            }
            return null;
          })
          .filter(Boolean),
        components: components.flatMap((component) => component.analysis),
        insights,
      };

      const response = await axiosInstance.post(
        "/gemini/code-generation/save",
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error saving generation data:", error);
      throw error;
    }
  }

  static async getGenerationStream(generationId: string, signal?: AbortSignal) {
    return fetch(
      `${axiosInstance.defaults.baseURL}/gemini/code-generation/${generationId}`,
      {
        method: "GET",
        signal,
      },
    );
  }

  static async streamChatResponse(
    message: string,
    generationId: string,
  ): Promise<Response> {
    if (!generationId) {
      throw new Error("Generation ID is required for chat continuation");
    }

    try {
      return this.continueCodeGeneration(generationId, message);
    } catch (error) {
      console.error("Error streaming chat response:", error);
      throw error;
    }
  }

  static async continueCodeGeneration(
    generationId: string,
    message: string,
  ): Promise<Response> {
    if (!generationId) {
      throw new Error("Generation ID is required");
    }

    try {
      return fetch(
        `${axiosInstance.defaults.baseURL}/gemini/code-generation/${generationId}/continue`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        },
      );
    } catch (error) {
      console.error("Error continuing code generation:", error);
      throw error;
    }
  }

  static async saveSchemaAnalysis(
    components: Array<{
      frameId: string;
      frameName: string;
      analysis: ComponentAnalysisData[];
    }>,
    documents: NodeData[],
    frameImages?: Array<{ id: string; base64ImageWithoutMime: string }>,
  ): Promise<{ response: { id: string } }> {
    try {
      const payload = {
        data: components
          .map((component, index) => {
            const frameDocuments = documents.filter(
              (doc) => doc.id === component.frameId,
            );
            const base64Image = frameImages?.[index]?.base64ImageWithoutMime;

            if (frameDocuments.length > 0 && base64Image) {
              return {
                documents: frameDocuments,
                base64Image,
              };
            }
            return null;
          })
          .filter(Boolean),
        components: components.flatMap((component) => component.analysis),
        isSchema: true,
      };

      const response = await axiosInstance.post(
        "/gemini/code-generation/save",
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error saving schema analysis data:", error);
      throw error;
    }
  }

  static async getSchemaStream(schemaId: string, signal?: AbortSignal) {
    return fetch(
      `${axiosInstance.defaults.baseURL}/gemini/code-generation/${schemaId}/schema`,
      {
        method: "GET",
        signal,
      },
    );
  }

  static async continueSchemaGeneration(
    schemaId: string,
    message: string,
  ): Promise<Response> {
    if (!schemaId) {
      throw new Error("Schema ID is required");
    }

    try {
      return fetch(
        `${axiosInstance.defaults.baseURL}/gemini/code-generation/${schemaId}/schema`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        },
      );
    } catch (error) {
      console.error("Error continuing schema generation:", error);
      throw error;
    }
  }

  static async analyzeSchema(
    components: Array<{
      frameId: string;
      frameName: string;
      analysis: ComponentAnalysisData[];
    }>,
    documents: NodeData[],
    frameImages?: Array<{ id: string; base64ImageWithoutMime: string }>,
    insight?: string,
  ): Promise<{ response: { id: string } }> {
    try {
      const payload = {
        data: components
          .map((component, index) => {
            const frameDocuments = documents.filter(
              (doc) => doc.id === component.frameId,
            );
            const base64Image = frameImages?.[index]?.base64ImageWithoutMime;

            if (frameDocuments.length > 0 && base64Image) {
              return {
                documents: frameDocuments,
                base64Image,
              };
            }
            return null;
          })
          .filter(Boolean),
        components: components.flatMap((component) => component.analysis),
        insight,
      };

      const response = await axiosInstance.post(
        "/gemini/code-generation/save",
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error analyzing schema:", error);
      throw error;
    }
  }

  static openSchemaExplorer(id: string) {
    const url = new URL(window.location.origin + "/schema-explorer");
    url.searchParams.set("id", id);
    window.open(url.toString(), "_blank");
  }

  static async saveSchemaAnalysisData(
    images: Array<{ id: string; base64ImageWithoutMime: string }>,
    parsedExportData: {
      documents: {
        id: string;
        type?: string;
        text?: string;
        children?: any[];
      }[];
    },
  ): Promise<{ response: { id: string } }> {
    try {
      const extractText = (doc: any): string[] => {
        console.log("Processing document:", {
          type: doc.type,
          text: doc.text,
          hasChildren: !!doc.children,
          childrenCount: doc.children?.length,
        });

        const texts: string[] = [];

        // Extract text if it's a TEXT node
        if (doc.type === "TEXT" && doc.text) {
          console.log("Found TEXT node:", doc.text);
          texts.push(doc.text);
        }

        // Recursively extract text from children
        if (doc.children && Array.isArray(doc.children)) {
          doc.children.forEach((child: any) => {
            const childTexts = extractText(child);
            console.log("Child texts:", childTexts);
            texts.push(...childTexts);
          });
        }

        return texts;
      };

      console.log("Input documents:", parsedExportData.documents);

      const payload = {
        data: images
          .map((image) => {
            const matchingDocs = parsedExportData.documents.filter(
              (doc) => doc.id === image.id,
            );

            console.log("Matching docs for image", image.id, ":", matchingDocs);

            const extractedTexts = matchingDocs.flatMap((doc) =>
              extractText(doc),
            );
            console.log("Extracted texts:", extractedTexts);

            return {
              documents: extractedTexts,
              base64Image: image.base64ImageWithoutMime,
            };
          })
          .filter((item) => item.base64Image.length > 0),
        components: [],
        isSchema: true,
      };

      const response = await axiosInstance.post(
        "/gemini/code-generation/save",
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error saving schema analysis data:", error);
      throw error;
    }
  }

  static openSchemaExplorerInNewTab(id: string) {
    const url = new URL("http://localhost:5173/schema-explorer");
    url.searchParams.set("id", id);
    window.open(url.toString(), "_blank");
  }

  static async getComponentInsight(
    exportData: ExportData,
    frameImages?: Array<{
      id: string;
      name: string;
      base64ImageWithoutMime: string;
    }>,
  ): Promise<string> {
    try {
      const analysisData =
        frameImages?.map((frame) => ({
          // components: exportData.components,
          documents: exportData.documents.filter((doc) => doc.id === frame.id),
          base64Image: frame.base64ImageWithoutMime,
        })) ?? [];

      const response = await fetch(
        `${axiosInstance.defaults.baseURL}/gemini/code-generation/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: analysisData }),
          signal: AbortSignal.timeout(60000),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error("Error getting component insight:", error);
      throw error;
    }
  }
}
