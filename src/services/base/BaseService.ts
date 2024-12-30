import { axiosInstance } from "../axiosConfig";

export class BaseService {
  protected static baseURL = axiosInstance.defaults.baseURL;

  protected static async fetchStream(url: string, options?: RequestInit) {
    try {
      return await fetch(`${this.baseURL}${url}`, options);
    } catch (error) {
      console.error(`Error fetching stream from ${url}:`, error);
      throw error;
    }
  }

  protected static async postStream(url: string, body: any) {
    return this.fetchStream(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }
}
