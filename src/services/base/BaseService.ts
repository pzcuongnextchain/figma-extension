export abstract class BaseService {
  protected static readonly API_BASE_URL = "http://localhost:8080/gemini";
  protected static readonly CODE_EXPLORER_URL =
    "http://localhost:5173/code-explorer";
  protected static readonly SCHEMA_EXPLORER_URL =
    "http://localhost:5173/schema-explorer";

  protected static async post<T>(
    endpoint: string,
    data: any,
    options?: RequestInit,
  ): Promise<any> {
    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Failed to ${endpoint.slice(1)}`);
    }

    return response.json();
  }

  protected static async postStream(
    endpoint: string,
    data: any,
    options?: RequestInit,
  ): Promise<Response> {
    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Failed to ${endpoint.slice(1)}`);
    }

    return response;
  }

  protected static async getStream(
    endpoint: string,
    options?: RequestInit,
  ): Promise<Response> {
    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Failed to ${endpoint.slice(1)}`);
    }

    return response;
  }
}
