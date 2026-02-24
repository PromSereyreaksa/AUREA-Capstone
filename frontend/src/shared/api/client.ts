export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

interface RequestOptions {
  headers?: Record<string, string>;
}

export class HttpClient {
  public baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(options?: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add auth token if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Merge with custom headers
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    return headers;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: this.getHeaders(options),
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({
          error: { message: "Network error. Please try again." },
        }));
      throw new Error(error.error?.message || "Request failed");
    }

    return response.json();
  }

  async post<T>(
    endpoint: string,
    data: any,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(options),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({
          error: { message: "Network error. Please try again." },
        }));
      throw new Error(error.error?.message || "Request failed");
    }

    return response.json();
  }

  async put<T>(
    endpoint: string,
    data: any,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: this.getHeaders(options),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({
          error: { message: "Network error. Please try again." },
        }));
      throw new Error(error.error?.message || "Request failed");
    }

    return response.json();
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers: this.getHeaders(options),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({
          error: { message: "Network error. Please try again." },
        }));
      throw new Error(error.error?.message || "Request failed");
    }

    return response.json();
  }

  /**
   * Upload file using FormData (multipart/form-data)
   * Used for avatar uploads and other file uploads
   */
  async uploadFormData<T>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions,
  ): Promise<T> {
    // Don't set Content-Type - let browser set it with boundary for FormData
    const headers: Record<string, string> = {};
    
    // Add auth token if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Merge with custom headers (but not Content-Type)
    if (options?.headers) {
      Object.assign(headers, options.headers);
      delete headers["Content-Type"]; // Ensure Content-Type is not set
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({
          error: { message: "Network error. Please try again." },
        }));
      throw new Error(error.error?.message || "Upload failed");
    }

    return response.json();
  }
}

export const httpClient = new HttpClient();
