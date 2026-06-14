/**
 * Fetch with AbortController timeout.
 * Prevents hanging requests by aborting after `ms` milliseconds.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeout?: number },
): Promise<Response> {
  const { timeout = 10_000, ...rest } = init ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(input, { ...rest, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}