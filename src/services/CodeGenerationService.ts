import _ from "lodash";
import { ComponentAnalysisData } from "../types/common.type";
import { BaseService } from "./base/BaseService";

interface GenerationResponse {
  response: { id: string };
}

export class CodeGenerationService extends BaseService {
  static async saveGenerationData(
    components: Array<{
      frameId: string;
      frameName: string;
      analysis: ComponentAnalysisData[];
    }>,
    documents: { id: string }[],
    frameImages: Array<{ id: string; base64ImageWithoutMime: string }>,
    insights: string,
  ): Promise<GenerationResponse> {
    const componentAnalysis = _.flatMap(components, (component) =>
      component.analysis.map((analysis) => ({
        ...analysis,
      })),
    );
    const documentsWithImages = documents.map((documents) => ({
      documents,
      base64Image: frameImages.find((image) => image.id === documents.id)
        ?.base64ImageWithoutMime,
    }));
    return this.post<GenerationResponse>("/code-generation/save", {
      components: componentAnalysis,
      data: documentsWithImages,
      insights,
    });
  }

  static openInExplorer(id: string): void {
    const url = new URL(this.CODE_EXPLORER_URL);
    url.searchParams.set("id", id);
    window.open(url.toString(), "_blank");
  }
}
