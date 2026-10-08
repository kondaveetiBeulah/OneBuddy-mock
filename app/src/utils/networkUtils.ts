/**
 * Utility functions for detecting network errors and testing internet connectivity.
 */

/**
 * Checks whether an unknown error object corresponds to a network / internet failure.
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  if (typeof error === 'string') {
    const lower = error.toLowerCase();
    return (
      lower.includes('network') ||
      lower.includes('offline') ||
      lower.includes('internet') ||
      lower.includes('connection') ||
      lower.includes('unavailable') ||
      lower.includes('failed to fetch') ||
      lower.includes('timeout')
    );
  }

  if (typeof error === 'object') {
    const err = error as Record<string, any>;
    const code = String(err.code || err.status || '').toLowerCase();
    const msg = String(err.message || err.desc || err.error || '').toLowerCase();

    // Firebase Firestore / Auth offline error codes
    if (
      code === 'unavailable' ||
      code === 'failed-precondition' ||
      code === 'deadline-exceeded' ||
      code.includes('network') ||
      code.includes('offline')
    ) {
      return true;
    }

    // Standard JavaScript & React Native fetch error messages
    if (
      msg.includes('network request failed') ||
      msg.includes('network error') ||
      msg.includes('failed to fetch') ||
      msg.includes('client is offline') ||
      msg.includes('offline') ||
      msg.includes('no internet') ||
      msg.includes('timeout') ||
      msg.includes('connection aborted') ||
      msg.includes('econnrefused') ||
      msg.includes('enotfound')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Actively pings a fast, lightweight endpoint with a timeout to verify internet reachability.
 */
export async function checkInternetConnectivity(timeoutMs: number = 4000): Promise<boolean> {
  // If running in browser and navigator says offline, return false immediately
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' && !navigator.onLine) {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // 204 No Content ping - extremely low bandwidth & fast
    const response = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.status === 204 || response.status === 200;
  } catch (err) {
    clearTimeout(timeoutId);
    // If the ping fails or times out, check secondary fallback or return false
    return false;
  }
}
