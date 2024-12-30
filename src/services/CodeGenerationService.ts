import type { ExportData } from "../types/common.type";
import { axiosInstance } from "./axiosConfig";
import { BaseService } from "./base/BaseService";

interface GeminiResponse {
  success: boolean;
  response: any;
}

export class CodeGenerationService extends BaseService {
  static async generate(
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

  static async getStream(generationId: string, signal?: AbortSignal) {
    return this.fetchStream(`/gemini/code-generation/${generationId}`, {
      signal,
    });
  }

  static async continue(
    generationId: string,
    message: string,
  ): Promise<Response> {
    if (!generationId) throw new Error("Generation ID is required");

    return this.postStream(`/gemini/code-generation/${generationId}/continue`, {
      message,
    });
  }

  static openInNewTab(id: string) {
    const url = new URL("http://localhost:5173/code-explorer");
    url.searchParams.set("id", id);
    window.open(url.toString(), "_blank");
  }
}
