import type { ComponentAnalysisData, NodeData } from "../types/common.type";
import { axiosInstance } from "./axiosConfig";
import { BaseService } from "./base/BaseService";

export class SchemaService extends BaseService {
  static async getStream(schemaId: string, signal?: AbortSignal) {
    return this.fetchStream(`/gemini/code-generation/${schemaId}/schema`, {
      signal,
    });
  }

  static async continue(schemaId: string, message: string): Promise<Response> {
    if (!schemaId) throw new Error("Schema ID is required");

    return this.postStream(`/gemini/code-generation/${schemaId}/schema`, {
      message,
    });
  }

  static async saveAnalysis(
    components: Array<{
      frameId: string;
      frameName: string;
      analysis: ComponentAnalysisData[];
    }>,
    documents: NodeData[],
    frameImages?: Array<{ id: string; base64ImageWithoutMime: string }>,
  ) {
    try {
      const payload = this.prepareAnalysisPayload(
        components,
        documents,
        frameImages,
        true,
      );
      const response = await axiosInstance.post(
        "/gemini/code-generation/save",
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error saving schema analysis:", error);
      throw error;
    }
  }

  static openInNewTab(id: string) {
    const url = new URL("http://localhost:5173/schema-explorer");
    url.searchParams.set("id", id);
    window.open(url.toString(), "_blank");
  }

  private static prepareAnalysisPayload(
    components: Array<{
      frameId: string;
      frameName: string;
      analysis: ComponentAnalysisData[];
    }>,
    documents: NodeData[],
    frameImages?: Array<{ id: string; base64ImageWithoutMime: string }>,
    isSchema = false,
  ) {
    const getAllDocumentNames = (doc: NodeData): string[] => {
      const names: string[] = [];
      if (doc.name) {
        names.push(doc.name);
      }
      if (doc.children) {
        doc.children.forEach((child) => {
          names.push(...getAllDocumentNames(child));
        });
      }
      return names;
    };

    return {
      data: components
        .map((component, index) => {
          const frameDocuments = documents
            .filter((doc) => doc.id === component.frameId)
            .flatMap((doc) => getAllDocumentNames(doc));
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
      isSchema,
    };
  }
}
