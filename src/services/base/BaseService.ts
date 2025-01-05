export type AIModel = "openai" | "gemini";

export abstract class BaseService {
  private static currentModel: AIModel = "gemini";
  private static isNode = typeof window === "undefined";

  protected static get API_BASE_URL(): string {
    const baseUrl = this.isNode
      ? process.env.API_BASE_URL || "http://localhost:8080"
      : "http://localhost:8080";
    return `${baseUrl}/${this.currentModel}`;
  }

  protected static readonly CODE_EXPLORER_URL =
    "http://localhost:5173/code-explorer?model=" + this.currentModel;
  protected static readonly SCHEMA_EXPLORER_URL =
    "http://localhost:5173/schema-explorer?model=" + this.currentModel;

  public static setModel(model: AIModel) {
    this.currentModel = model;
    try {
      localStorage.setItem("aiModel", model);
    } catch (error) {
      console.warn("LocalStorage is not available:", error);
    }
  }

  public static getModel(): AIModel {
    try {
      return (localStorage.getItem("aiModel") as AIModel) || "openai";
    } catch (error) {
      console.warn("LocalStorage is not available:", error);
      return "openai";
    }
  }

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
