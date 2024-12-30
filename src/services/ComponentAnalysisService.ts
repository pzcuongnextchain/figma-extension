import type { ExportData } from "../types/common.type";
import { axiosInstance } from "./axiosConfig";
import { BaseService } from "./base/BaseService";

export class ComponentAnalysisService extends BaseService {
  static async analyze(
    exportData: ExportData,
    frameImages?: Array<{
      id: string;
      name: string;
      base64ImageWithoutMime: string;
    }>,
  ): Promise<ReadableStream> {
    try {
      const analysisData =
        frameImages?.map((frame) => ({
          components: exportData.components,
          componentSets: exportData.componentSets,
          documents: exportData.documents.filter((doc) => doc.id === frame.id),
          base64Image: frame.base64ImageWithoutMime,
        })) ?? [];

      const response = await axiosInstance.post(
        "/gemini/component-analysis",
        analysisData,
        { responseType: "stream" },
      );
      return response.data;
    } catch (error) {
      console.error("Error analyzing components:", error);
      throw error;
    }
  }
}
