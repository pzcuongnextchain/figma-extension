import { ExportData } from "../types/common.type";
import { BaseService } from "./base/BaseService";

export class ComponentAnalysisService extends BaseService {
  static normalizePayload(
    exportData: ExportData,
    frameImages: Array<{ id: string; base64ImageWithoutMime: string }>,
    insight?: string,
  ) {
    const payload = exportData.documents.map((documents) => ({
      documents,
      base64Image: frameImages.find((image) => image.id === documents.id)
        ?.base64ImageWithoutMime,
    }));
    return {
      data: payload,
      insight,
    };
  }

  static async analyze(
    exportData: ExportData,
    frameImages: Array<{ id: string; base64ImageWithoutMime: string }>,
    insight: string,
  ): Promise<Response> {
    return this.postStream(
      "/component-analysis",
      this.normalizePayload(exportData, frameImages, insight),
    );
  }

  static async getInsight(
    exportData: ExportData,
    frameImages: Array<{ id: string; base64ImageWithoutMime: string }>,
  ): Promise<Response> {
    return this.postStream(
      "/code-generation/analyze",
      this.normalizePayload(exportData, frameImages),
    );
  }
}
