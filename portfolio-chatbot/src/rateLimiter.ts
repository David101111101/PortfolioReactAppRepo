/**
 * Durable Object: RateLimiter
 *
 * Implements per-IP sliding window rate limiting.
 */

export class RateLimiter {
  state: DurableObjectState;
  env: Record<string, unknown>;
  requests: number[];

  constructor(state: DurableObjectState, env: Record<string, unknown>) {
    this.state = state;
    this.env = env;
    this.requests = [];
  }

  async fetch(_request: Request): Promise<Response> {
    void _request;
    const now = Date.now();

    const WINDOW_SIZE = 60 * 1000; // 1 minute window
    const MAX_REQUESTS = 10; // 10 requests per minute

    // Remove expired timestamps
    this.requests = this.requests.filter(
      (timestamp) => now - timestamp < WINDOW_SIZE
    );

    if (this.requests.length >= MAX_REQUESTS) {
      return new Response("To avoid spam please try later", { status: 429 });
    }

    this.requests.push(now);

    return new Response("OK");
  }
}