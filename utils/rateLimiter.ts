/**
 * Rate limiter for controlling API request frequency using a sliding window algorithm
 *
 * Tracks request timestamps and enforces maximum requests per time window.
 * Useful for preventing API rate limit violations.
 *
 * @example
 * ```typescript
 * // Create rate limiter: max 10 requests per minute
 * const limiter = new RateLimiter(10, 60000);
 *
 * // Use before each API call
 * await limiter.throttle(); // Will wait if limit exceeded
 * await makeApiCall();
 * ```
 */
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  /**
   * Creates a new rate limiter instance
   *
   * @param maxRequests - Maximum number of requests allowed in the time window (default: 10)
   * @param windowMs - Time window in milliseconds (default: 60000ms = 1 minute)
   *
   * @example
   * ```typescript
   * // Allow 10 requests per minute
   * const limiter = new RateLimiter(10, 60000);
   *
   * // Allow 100 requests per hour
   * const limiter = new RateLimiter(100, 3600000);
   * ```
   */
  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Throttles execution to enforce rate limits using a sliding window
   *
   * This method:
   * 1. Removes expired request timestamps outside the time window
   * 2. If limit reached, waits until the oldest request expires
   * 3. Records the current request timestamp
   *
   * @returns Promise that resolves when it's safe to proceed with the request
   *
   * @example
   * ```typescript
   * const limiter = new RateLimiter(10, 60000); // 10/min
   *
   * // Make rate-limited API calls
   * for (let i = 0; i < 100; i++) {
   *   await limiter.throttle(); // Automatically waits when limit reached
   *   await makeApiCall();
   * }
   * ```
   */
  async throttle(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.throttle(); // Retry after waiting
    }

    this.requests.push(Date.now());
  }

  /**
   * Resets the rate limiter by clearing all tracked request timestamps
   *
   * Useful for testing or when starting a new rate-limited operation batch.
   *
   * @example
   * ```typescript
   * const limiter = new RateLimiter();
   * await limiter.throttle();
   *
   * // Reset for new batch
   * limiter.reset();
   * ```
   */
  reset(): void {
    this.requests = [];
  }
}
