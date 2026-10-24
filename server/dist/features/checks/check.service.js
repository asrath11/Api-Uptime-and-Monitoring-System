import axios from "axios";
import { performance } from "node:perf_hooks";
export async function performApiCheck(monitor) {
    const startedAt = performance.now();
    let status;
    let statusCode = null;
    let error = null;
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
        }
        else if (response.status === monitor.expectedStatusCode) {
            status = "UP";
        }
        else {
            status = "DOWN";
            error = `Expected HTTP ${monitor.expectedStatusCode}, received HTTP ${response.status}`;
        }
    }
    catch (err) {
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
//# sourceMappingURL=check.service.js.map