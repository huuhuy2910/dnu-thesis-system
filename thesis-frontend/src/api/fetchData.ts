const envBaseRaw = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5180"
).toString();
const ensureScheme = (value: string) => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `http://${value}`;
};

const envBase = ensureScheme(envBaseRaw.trim());
const normalizedBase = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;
const apiBase = `${normalizedBase}/api`;

// Helper function to get full avatar URL
export function getAvatarUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) {
    return path; // Already absolute URL
  }
  // Relative path, prepend base URL
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

type BodyInitCompatible = BodyInit | object | undefined;

type FetchDataOptions = Omit<RequestInit, "body" | "signal"> & {
  body?: BodyInitCompatible;
  timeoutMs?: number;
  signal?: AbortSignal;
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
  const { body, headers, timeoutMs, signal, ...rest } = options;
  const url = resolveUrl(path);

  // inject default user headers from localStorage if available
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("app_user");
      if (raw) {
        const u = JSON.parse(raw as string) as {
          userCode?: string;
          role?: string;
        };
        const extra: Record<string, string> = {};
        if (u?.role) extra["X-User-Role"] = u.role;
        if (u?.userCode) extra["X-User-Code"] = u.userCode;
        // merge into provided headers (headers param may be undefined)
        options.headers = mergeHeaders(extra, headers) as HeadersInit;
      }
    }
  } catch {
    // ignore parsing errors; do not block requests
  }

  const controller = new AbortController();
  const ms = typeof timeoutMs === "number" && timeoutMs > 0 ? timeoutMs : 20000;
  let abortTimer: ReturnType<typeof setTimeout> | undefined;
  const linkedAbort = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener("abort", linkedAbort, { once: true });
    }
  }

  if (ms !== Number.POSITIVE_INFINITY) {
    abortTimer = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    }, ms);
  }

  const init: RequestInit = {
    ...rest,
    headers: mergeHeaders({ "Content-Type": "application/json" }, headers),
    signal: controller.signal,
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

  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "AbortError" || error.name === "TimeoutError")
    ) {
      throw new FetchDataError(
        `Request to ${url} aborted: ${error.message}`,
        408,
        error.name,
        null
      );
    }
    if ((error as Error).name === "AbortError") {
      throw new FetchDataError(
        `Request to ${url} aborted`,
        408,
        (error as Error).name,
        null
      );
    }
    throw error;
  } finally {
    if (abortTimer !== undefined) {
      clearTimeout(abortTimer);
    }
    if (signal) {
      signal.removeEventListener("abort", linkedAbort);
    }
  }

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
