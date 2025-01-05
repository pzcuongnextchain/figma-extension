import { FrameExportData } from "../types/common.type";
import { BaseService } from "./base/BaseService";

export class ComponentAnalysisService extends BaseService {
  static async analyze(
    exportData: FrameExportData,
    // insight: string,
  ): Promise<Response> {
    return this.postStream("/component-analysis", {
      data: exportData,
      // insight,
    });
  }

  static async getInsight(exportData: FrameExportData) {
    // return this.postStream("/code-generation/analyze", {
    //   data: exportData,
    // });
    return await this.post("/code-generation/analyze", {
      data: exportData,
    });
  }
}
