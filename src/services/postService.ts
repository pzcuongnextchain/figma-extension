import type { ExportData } from "../types/common.type";
import { axiosInstance } from "./axiosConfig";

interface GeminiResponse {
  success: boolean;
  response: any;
}

export class PostService {
  static async sendToGemini(
    exportData: ExportData,
    base64Image: string,
  ): Promise<ReadableStream> {
    try {
      const response = await axiosInstance.post(
        "/gemini",
        {
          ...exportData,
          base64Image,
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
    components: any[],
    documents: any[],
    base64Image?: string,
  ): Promise<{ response: { id: string } }> {
    try {
      const response = await axiosInstance.post(
        "/gemini/code-generation/save",
        {
          components,
          documents,
          base64Image,
        },
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

  static async streamChatResponse(message: string): Promise<Response> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return response;
  }
}
