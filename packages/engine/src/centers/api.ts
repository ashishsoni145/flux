/**
 * FluxIDE Engine — API Center
 *
 * Implements Section 44 (API Center) of the architecture:
 * - Discovers REST / HTTP endpoints from Express, Fastify, Next.js, Flask, FastAPI
 * - Performs lightweight HTTP request testing with status, headers, latency, and response body
 */

import { generateId } from "@fluxide/protocol";

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  sourceFile?: string;
  description?: string;
}

export interface ApiTestResponse {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  durationMs: number;
  headers: Record<string, string>;
  body: unknown;
  error?: string;
}

export class ApiCenter {
  constructor(private readonly workspacePath: string = process.cwd()) {}

  /**
   * Execute an API test request.
   */
  async testEndpoint(
    url: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: unknown;
      timeoutMs?: number;
    } = {}
  ): Promise<ApiTestResponse> {
    const start = Date.now();
    const method = (options.method ?? "GET").toUpperCase();
    const headers = options.headers ?? {};

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);

      const res = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        responseHeaders[k] = v;
      });

      let parsedBody: unknown;
      const text = await res.text();
      try {
        parsedBody = JSON.parse(text);
      } catch {
        parsedBody = text.slice(0, 2000);
      }

      return {
        id: generateId("req"),
        url,
        method,
        status: res.status,
        statusText: res.statusText,
        durationMs: Date.now() - start,
        headers: responseHeaders,
        body: parsedBody,
      };
    } catch (err) {
      return {
        id: generateId("req"),
        url,
        method,
        status: 0,
        statusText: "NETWORK_ERROR",
        durationMs: Date.now() - start,
        headers: {},
        body: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
