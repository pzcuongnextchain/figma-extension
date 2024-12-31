import { BaseService } from "./base/BaseService";

interface SchemaResponse {
  response: { id: string };
}

export class SchemaAnalysisService extends BaseService {
  static async saveAnalysisData(
    images: Array<{ id: string; base64ImageWithoutMime: string }>,
    exportData: { documents: { id: string }[] },
  ): Promise<SchemaResponse> {
    const payload = exportData.documents.map((documents) => ({
      documents,
      base64Image: images.find((image) => image.id === documents.id)
        ?.base64ImageWithoutMime,
    }));
    return this.post<SchemaResponse>("/code-generation/save", {
      data: payload,
    });
  }

  static openInExplorer(id: string): void {
    const url = new URL(this.SCHEMA_EXPLORER_URL);
    url.searchParams.set("id", id);
    window.open(url.toString(), "_blank");
  }
}
