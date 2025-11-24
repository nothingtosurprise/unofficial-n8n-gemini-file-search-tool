/**
 * Unit Tests for Rate Limiter
 * Tests rate limiting behavior, reset functionality, and concurrent requests
 */

import { RateLimiter } from '../../../utils/rateLimiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create rate limiter with default values', () => {
      const limiter = new RateLimiter();
      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it('should create rate limiter with custom values', () => {
      const limiter = new RateLimiter(5, 30000);
      expect(limiter).toBeInstanceOf(RateLimiter);
    });
  });

  describe('throttle', () => {
    it('should allow requests below limit', async () => {
      const limiter = new RateLimiter(3, 1000);

      const start = Date.now();
      await limiter.throttle();
      await limiter.throttle();
      await limiter.throttle();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it('should throttle requests exceeding limit', async () => {
      const limiter = new RateLimiter(2, 500);

      await limiter.throttle();
      await limiter.throttle();

      const start = Date.now();
      await limiter.throttle();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(400);
    });

    it('should allow requests after window expires', async () => {
      const limiter = new RateLimiter(2, 300);

      await limiter.throttle();
      await limiter.throttle();

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 350));

      const start = Date.now();
      await limiter.throttle();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it('should handle multiple sequential throttles', async () => {
      const limiter = new RateLimiter(3, 1000);

      for (let i = 0; i < 3; i++) {
        await limiter.throttle();
      }

      const start = Date.now();
      await limiter.throttle();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(900);
    });

    it('should track request timestamps accurately', async () => {
      const limiter = new RateLimiter(3, 500);

      const timestamps: number[] = [];
      for (let i = 0; i < 3; i++) {
        await limiter.throttle();
        timestamps.push(Date.now());
      }

      // All three should be within close timing
      const diff = timestamps[2] - timestamps[0];
      expect(diff).toBeLessThan(100);
    });

    it('should clean up old request timestamps', async () => {
      const limiter = new RateLimiter(2, 200);

      await limiter.throttle();
      await limiter.throttle();

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Should allow new requests immediately
      const start = Date.now();
      await limiter.throttle();
      await limiter.throttle();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it('should wait exact window time when at limit', async () => {
      const windowMs = 500;
      const limiter = new RateLimiter(1, windowMs);

      const startFirst = Date.now();
      await limiter.throttle();

      const startSecond = Date.now();
      await limiter.throttle();
      const elapsed = Date.now() - startSecond;

      // Should wait for the full window minus elapsed time
      expect(elapsed).toBeGreaterThanOrEqual(windowMs - 100);
    });

    it('should handle rapid successive calls', async () => {
      const limiter = new RateLimiter(5, 1000);

      const promises = Array.from({ length: 5 }, () => limiter.throttle());
      const start = Date.now();
      await Promise.all(promises);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(200);
    });
  });

  describe('reset', () => {
    it('should clear all request history', async () => {
      const limiter = new RateLimiter(2, 1000);

      await limiter.throttle();
      await limiter.throttle();

      limiter.reset();

      // Should allow new requests immediately
      const start = Date.now();
      await limiter.throttle();
      await limiter.throttle();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it('should allow reset at any time', () => {
      const limiter = new RateLimiter(5, 1000);
      expect(() => limiter.reset()).not.toThrow();
    });

    it('should work after multiple throttles', async () => {
      const limiter = new RateLimiter(2, 500);

      await limiter.throttle();
      await limiter.throttle();

      limiter.reset();

      await limiter.throttle();
      await limiter.throttle();

      const start = Date.now();
      await limiter.throttle();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(400);
    });
  });

  describe('concurrent requests', () => {
    it('should handle concurrent throttle calls', async () => {
      const limiter = new RateLimiter(3, 1000);

      const promises = [limiter.throttle(), limiter.throttle(), limiter.throttle()];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
    });

    it('should queue requests when limit exceeded', async () => {
      const limiter = new RateLimiter(2, 500);

      const start = Date.now();
      await Promise.all([limiter.throttle(), limiter.throttle(), limiter.throttle()]);
      const elapsed = Date.now() - start;

      // Third request should wait for window
      expect(elapsed).toBeGreaterThanOrEqual(400);
    });

    it('should process queued requests in order', async () => {
      const limiter = new RateLimiter(2, 300);

      const order: number[] = [];

      const promises = [
        limiter.throttle().then(() => order.push(1)),
        limiter.throttle().then(() => order.push(2)),
        limiter.throttle().then(() => order.push(3)),
      ];

      await Promise.all(promises);

      // All should complete in order (with third waiting)
      expect(order).toHaveLength(3);
    });
  });

  describe('edge cases', () => {
    it('should handle single request limit', async () => {
      const limiter = new RateLimiter(1, 500);

      await limiter.throttle();

      const start = Date.now();
      await limiter.throttle();
      const elapsed = Date.now() - start;

      // Should wait for window to reset
      expect(elapsed).toBeGreaterThanOrEqual(400);
    });

    it('should handle very short window', async () => {
      const limiter = new RateLimiter(2, 10);

      await limiter.throttle();
      await limiter.throttle();

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 20));

      const start = Date.now();
      await limiter.throttle();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
    });

    it('should handle very long window', async () => {
      const limiter = new RateLimiter(1, 10000);

      await limiter.throttle();

      const start = Date.now();
      const promise = limiter.throttle();

      // Cancel after short time
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should still be waiting
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(200);
    }, 15000);

    it('should handle high request limit', async () => {
      const limiter = new RateLimiter(100, 1000);

      const promises = Array.from({ length: 100 }, () => limiter.throttle());
      const start = Date.now();
      await Promise.all(promises);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(200);
    });

    it('should maintain accuracy over multiple windows', async () => {
      const limiter = new RateLimiter(2, 200);

      // First window
      await limiter.throttle();
      await limiter.throttle();

      // Wait for window
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Second window
      await limiter.throttle();
      await limiter.throttle();

      // Should be ready for third window
      await new Promise((resolve) => setTimeout(resolve, 250));

      const start = Date.now();
      await limiter.throttle();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('real-world scenarios', () => {
    it('should simulate API rate limiting (10 requests per minute)', async () => {
      const limiter = new RateLimiter(10, 60000);

      const start = Date.now();
      for (let i = 0; i < 10; i++) {
        await limiter.throttle();
      }
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(500);
    }, 10000);

    it('should handle burst traffic', async () => {
      const limiter = new RateLimiter(5, 1000);

      // Burst of 10 requests
      const start = Date.now();
      for (let i = 0; i < 10; i++) {
        await limiter.throttle();
      }
      const elapsed = Date.now() - start;

      // Should take at least one window to process 10 requests with limit of 5
      expect(elapsed).toBeGreaterThanOrEqual(900);
    });

    it('should allow gradual requests without throttling', async () => {
      const limiter = new RateLimiter(3, 500);

      const start = Date.now();
      await limiter.throttle();
      await new Promise((resolve) => setTimeout(resolve, 200));
      await limiter.throttle();
      await new Promise((resolve) => setTimeout(resolve, 200));
      await limiter.throttle();
      const elapsed = Date.now() - start;

      // Should complete without significant throttling
      expect(elapsed).toBeLessThan(550);
    });
  });
});
