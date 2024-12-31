import { BaseService } from "./base/BaseService";

export class CodeExplorerService extends BaseService {
  static async getGenerationStream(
    id: string,
    signal?: AbortSignal,
  ): Promise<Response> {
    const response = await fetch(`${this.API_BASE_URL}/code-generation/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch generation data");
    }

    return response;
  }

  static async streamChatResponse(
    message: string,
    generationId: string,
  ): Promise<Response> {
    const response = await fetch(
      `${this.API_BASE_URL}/code-generation/${generationId}/continue`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to stream chat response");
    }

    return response;
  }
}
