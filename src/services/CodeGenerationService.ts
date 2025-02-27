import { ComponentAnalysisData, FrameExportData } from "../types/common.type";
import { BaseService } from "./base/BaseService";

interface GenerationResponse {
  response: { id: string };
}

export class CodeGenerationService extends BaseService {
  static async saveGenerationData(
    frameExportData: FrameExportData,
    analyzedComponents: ComponentAnalysisData[],
    insights: { analyzedData: string; base64Image: string }[],
  ): Promise<GenerationResponse> {
    return this.post<GenerationResponse>("/code-generation/save", {
      components: analyzedComponents,
      data: frameExportData,
      insights,
    });
  }

  static openInExplorer(id: string): void {
    const url = new URL(this.CODE_EXPLORER_URL);
    url.searchParams.set("id", id);
    window.open(url.toString(), "_blank");
  }
}
