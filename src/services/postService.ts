import type { ExportData } from "../data/types";
import { axiosInstance } from "./axiosConfig";

interface GeminiResponse {
  success: boolean;
  response: any;
}

export class PostService {
  static async sendToGemini(
    exportData: ExportData,
    base64Image: string,
  ): Promise<GeminiResponse> {
    try {
      const response = await axiosInstance.post<GeminiResponse>("/gemini", {
        ...exportData,
        base64Image,
      });
      return response.data;
    } catch (error) {
      console.error("Error sending data to Gemini:", error);
      throw error;
    }
  }
}
