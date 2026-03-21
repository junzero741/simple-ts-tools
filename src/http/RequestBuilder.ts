type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestConfig {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  params: Record<string, string>;
  body?: unknown;
}

abstract class BuilderBase {
  protected config: RequestConfig = {
    url: "",
    method: "GET",
    headers: {},
    params: {},
  };

  protected copyTo(target: BuilderBase, override: Partial<RequestConfig> = {}): void {
    target.config = { ...this.config, ...override };
  }

  header(key: string, value: string): this {
    this.config.headers[key] = value;
    return this;
  }

  headers(headers: Record<string, string>): this {
    this.config.headers = { ...this.config.headers, ...headers };
    return this;
  }

  param(key: string, value: string): this {
    this.config.params[key] = value;
    return this;
  }

  params(params: Record<string, string>): this {
    this.config.params = { ...this.config.params, ...params };
    return this;
  }

  body(data: unknown): this {
    this.config.body = data;
    return this;
  }
}

export class RequestBuilder extends BuilderBase {
  url(url: string): UrlBuilder {
    const next = new UrlBuilder();
    this.copyTo(next, { url });
    return next;
  }

  method(method: HttpMethod): MethodBuilder {
    const next = new MethodBuilder();
    this.copyTo(next, { method });
    return next;
  }
}

class UrlBuilder extends BuilderBase {
  method(method: HttpMethod): ReadyBuilder {
    const next = new ReadyBuilder();
    this.copyTo(next, { method });
    return next;
  }
}

class MethodBuilder extends BuilderBase {
  url(url: string): ReadyBuilder {
    const next = new ReadyBuilder();
    this.copyTo(next, { url });
    return next;
  }
}

class ReadyBuilder extends BuilderBase {
  build(): Request {
    const { url, method, headers, params, body } = this.config;

    const fullUrl = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      fullUrl.searchParams.set(key, value);
    }

    const init: RequestInit = { method, headers };

    if (body !== undefined) {
      if (!(headers["Content-Type"] || headers["content-type"])) {
        (init.headers as Record<string, string>)["Content-Type"] =
          "application/json";
      }
      init.body = JSON.stringify(body);
    }

    return new Request(fullUrl.toString(), init);
  }

  async send<T = unknown>(): Promise<T> {
    const response = await fetch(this.build());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }
}
