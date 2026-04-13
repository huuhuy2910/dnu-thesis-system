import type { ApiResponse, ApiWarning } from "../types/api";

type MaybeApiResponse<T = unknown> = ApiResponse<T> | null | undefined;

type ApiEnvelopeWarning =
  | ApiWarning
  | string
  | {
      type?: string;
      Type?: string;
      message?: string;
      Message?: string;
      code?: string;
      Code?: string;
    };

const normalizeEnvelopeWarning = (
  warning: ApiEnvelopeWarning,
): ApiWarning | null => {
  if (typeof warning === "string") {
    const message = warning.trim();
    if (!message) {
      return null;
    }

    return {
      type: "warning",
      code: "WARNING",
      message,
    };
  }

  const warningObject = warning as {
    type?: string;
    Type?: string;
    message?: string;
    Message?: string;
    code?: string;
    Code?: string;
  };

  const message = String(
    warningObject.message ??
      warningObject.Message ??
      warningObject.code ??
      warningObject.Code ??
      "",
  ).trim();
  if (!message) {
    return null;
  }

  const code = String(warningObject.code ?? warningObject.Code ?? "WARNING").trim();
  const type = String(warningObject.type ?? warningObject.Type ?? "warning").trim();

  return {
    type: type || "warning",
    code: code || "WARNING",
    message,
  };
};

export const readEnvelopeData = <T,>(
  response: MaybeApiResponse<unknown>,
): T | null => (response?.data ?? response?.Data ?? null) as T | null;

export const readEnvelopeSuccess = (
  response: MaybeApiResponse<unknown>,
): boolean => Boolean(response?.success ?? response?.Success);

export const readEnvelopeMessage = (
  response: MaybeApiResponse<unknown>,
): string | null =>
  (response?.message ?? response?.Message ?? null) as string | null;

export const readEnvelopeErrors = (
  response: MaybeApiResponse<unknown>,
): Record<string, string[]> | null =>
  (response?.errors ?? response?.Errors ?? null) as Record<string, string[]> | null;

export const readEnvelopeWarnings = (
  response: MaybeApiResponse<unknown>,
): ApiWarning[] =>
  ((response?.warnings ?? response?.Warnings ?? []) as ApiEnvelopeWarning[])
    .map(normalizeEnvelopeWarning)
    .filter((item): item is ApiWarning => Boolean(item));

export const readEnvelopeAllowedActions = (
  response: MaybeApiResponse<unknown>,
): string[] =>
  (response?.allowedActions ?? response?.AllowedActions ?? []) as string[];

export const readEnvelopeHttpStatus = (
  response: MaybeApiResponse<unknown>,
): number => Number(response?.httpStatusCode ?? response?.HttpStatusCode ?? 200);

export const readEnvelopeTotalCount = (
  response: MaybeApiResponse<unknown>,
): number => Number(response?.totalCount ?? response?.TotalCount ?? 0);

export const readEnvelopeIdempotencyReplay = (
  response: MaybeApiResponse<unknown>,
): boolean => Boolean(response?.idempotencyReplay ?? response?.IdempotencyReplay);

export const readEnvelopeConcurrencyToken = (
  response: MaybeApiResponse<unknown>,
): string | null =>
  (response?.concurrencyToken ?? response?.ConcurrencyToken ?? null) as
    | string
    | null;

export const readEnvelopeErrorMessages = (
  response: MaybeApiResponse<unknown>,
): string[] => {
  const errors = readEnvelopeErrors(response);
  if (!errors) {
    return [];
  }

  return Object.values(errors)
    .flat()
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
};

export const readEnvelopeWarningMessages = (
  response: MaybeApiResponse<unknown>,
): string[] =>
  readEnvelopeWarnings(response)
    .map((warning) => warning.message.trim())
    .filter(Boolean);

export const toCompatResponse = <TData,>(
  response: MaybeApiResponse<unknown>,
  data: TData,
): ApiResponse<TData> => ({
  success: readEnvelopeSuccess(response),
  code: response?.code ?? response?.Code ?? null,
  httpStatusCode: readEnvelopeHttpStatus(response),
  title: response?.title ?? response?.Title ?? null,
  message: readEnvelopeMessage(response),
  data,
  totalCount: Array.isArray(data) ? data.length : readEnvelopeTotalCount(response),
  isRedirect: Boolean(response?.isRedirect ?? response?.IsRedirect),
  redirectUrl: response?.redirectUrl ?? response?.RedirectUrl ?? null,
  errors: readEnvelopeErrors(response),
  warnings: readEnvelopeWarnings(response),
  traceId: response?.traceId ?? response?.TraceId,
  idempotencyReplay: readEnvelopeIdempotencyReplay(response),
  concurrencyToken: readEnvelopeConcurrencyToken(response),
  allowedActions: readEnvelopeAllowedActions(response),
});

export const pickCaseInsensitiveValue = <T,>(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
  fallback: T,
): T => {
  if (!source) {
    return fallback;
  }

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key] as T;
    }

    const normalizedKey = key.toLowerCase();
    const matched = Object.keys(source).find(
      (name) => name.toLowerCase() === normalizedKey,
    );

    if (matched && source[matched] !== undefined && source[matched] !== null) {
      return source[matched] as T;
    }
  }

  return fallback;
};
