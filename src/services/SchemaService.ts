import { BaseService } from "./base/BaseService";

export class SchemaService extends BaseService {
  static async getSchemaStream(id: string): Promise<Response> {
    const response = await fetch(
      `${this.API_BASE_URL}/code-generation/${id}/schema`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch schema data");
    }

    return response;
  }

  static async continueSchemaGeneration(
    id: string,
    message: string,
  ): Promise<Response> {
    const response = await fetch(
      `${this.API_BASE_URL}/code-generation/${id}/continue`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to continue schema generation");
    }

    return response;
  }
}
