const envBase = (
  import.meta.env.VITE_API_BASE_URL || "http://192.168.0.102:5180/"
).toString();
const normalizedBase = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;
const apiBase = `${normalizedBase}/api`;

type BodyInitCompatible = BodyInit | object | undefined;

type FetchDataOptions = Omit<RequestInit, "body"> & {
  body?: BodyInitCompatible;
};

export class FetchDataError extends Error {
  status: number;
  statusText: string;
  data: unknown;

  constructor(
    message: string,
    status: number,
    statusText: string,
    data: unknown
  ) {
    super(message);
    this.name = "FetchDataError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase}${normalizedPath}`;
}

function resolveBody(body: BodyInitCompatible): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer
  ) {
    return body;
  }

  if (body instanceof URLSearchParams) {
    return body;
  }

  return JSON.stringify(body);
}

function mergeHeaders(
  base: HeadersInit | undefined,
  extra: HeadersInit | undefined
): HeadersInit | undefined {
  if (!base && !extra) return undefined;

  const merged = new Headers(base ?? {});
  if (extra) {
    new Headers(extra).forEach((value, key) => merged.set(key, value));
  }
  return merged;
}

export async function fetchData<TResponse = unknown>(
  path: string,
  options: FetchDataOptions = {}
): Promise<TResponse> {
  const { body, headers, ...rest } = options;
  const url = resolveUrl(path);

  const init: RequestInit = {
    ...rest,
    headers: mergeHeaders({ "Content-Type": "application/json" }, headers),
  };

  const resolvedBody = resolveBody(body);
  if (resolvedBody !== undefined) {
    init.body = resolvedBody;
    if (
      body instanceof FormData ||
      body instanceof Blob ||
      body instanceof ArrayBuffer ||
      body instanceof URLSearchParams
    ) {
      // let browser set appropriate Content-Type
      const mergedHeaders = new Headers(init.headers ?? {});
      mergedHeaders.delete("Content-Type");
      init.headers = mergedHeaders;
    }
  }

  const response = await fetch(url, init);

  const contentType = response.headers.get("content-type") ?? "";
  let parsed: unknown = null;

  try {
    if (contentType.includes("application/json")) {
      parsed = await response.json();
    } else if (contentType.includes("text/")) {
      parsed = await response.text();
    } else if (contentType.includes("application/octet-stream")) {
      parsed = await response.arrayBuffer();
    } else {
      parsed = await response.text();
    }
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    throw new FetchDataError(
      `Request to ${url} failed with status ${response.status}`,
      response.status,
      response.statusText,
      parsed
    );
  }

  return parsed as TResponse;
}
