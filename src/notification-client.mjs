const configuredUrl = process.env.NOTIFICATION_SERVICE_URL?.trim();
const baseUrl = configuredUrl ? configuredUrl.replace(/\/+$/, "") : null;
const timeoutMs = Number.parseInt(process.env.NOTIFICATION_SERVICE_TIMEOUT_MS ?? "2500", 10);

export class NotificationServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "NotificationServiceError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  if (!baseUrl) throw new NotificationServiceError("Notification Service chưa được cấu hình.", 503);

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const message = error?.name === "TimeoutError"
      ? "Notification Service phản hồi quá thời gian."
      : "Không thể kết nối Notification Service.";
    throw new NotificationServiceError(message, 503);
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new NotificationServiceError(result.error ?? "Notification Service trả về lỗi.", response.status);
  }
  return result.data ?? result;
}

export async function checkNotificationHealth() {
  if (!baseUrl) return { status: "disabled", service: "tikto-notification", latencyMs: null };
  const startedAt = performance.now();
  try {
    const result = await request("/health");
    return {
      status: result.status === "ok" ? "ok" : "degraded",
      service: result.service ?? "tikto-notification",
      backend: result.backend ?? "unknown",
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch {
    return {
      status: "down",
      service: "tikto-notification",
      backend: "unknown",
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }
}

export const listNotifications = () => request("/notifications");
export const createNotification = (input) => request("/notifications", { method: "POST", body: JSON.stringify(input) });
export const cancelNotification = (id) => request(`/notifications/${encodeURIComponent(id)}`, { method: "DELETE" });

export function notificationConfiguration() {
  return { enabled: Boolean(baseUrl), url: baseUrl, timeoutMs };
}
