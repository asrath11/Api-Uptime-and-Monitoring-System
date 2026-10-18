import axios from "axios";
import { performance } from "node:perf_hooks";
import type { IMonitor } from "@/features/monitors/monitor.model.js";

interface CheckOutcome {
  status: "UP" | "DOWN" | "RATE_LIMITED";
  statusCode: number | null;
  responseTimeMs: number;
  error: string | null;
}

export async function performApiCheck(
  monitor: IMonitor,
): Promise<CheckOutcome> {
  const startedAt = performance.now();

  let status: CheckOutcome["status"];
  let statusCode: number | null = null;
  let error: string | null = null;

  try {
    const response = await axios({
      method: monitor.method,
      url: monitor.url,
      timeout: monitor.timeoutSeconds * 1000,
      validateStatus: () => true,
    });

    statusCode = response.status;

    if (response.status === 429) {
      status = "RATE_LIMITED";
      error = "Target API rate limit reached";
    } else if (response.status === monitor.expectedStatusCode) {
      status = "UP";
    } else {
      status = "DOWN";
      error = `Expected HTTP ${monitor.expectedStatusCode}, received HTTP ${response.status}`;
    }
  } catch (err: unknown) {
    status = "DOWN";

    error = axios.isAxiosError(err)
      ? err.code === "ECONNABORTED" || err.code === "ETIMEDOUT"
        ? "Request timed out"
        : err.message
      : "Unexpected error while checking API";
  }

  return {
    status,
    statusCode,
    responseTimeMs: Math.round(performance.now() - startedAt),
    error,
  };
}
