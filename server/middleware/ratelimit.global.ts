import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.cachedFixedWindow(10, "10s"),
  ephemeralCache: new Map(),
  analytics: true,
});

export default eventHandler(async (e) => {
  const headers = getHeaders(e);

  const ip = headers["x-real-ip"] ?? headers["x-forwarded-for"];

  const { success, limit, remaining, reset } = await ratelimit.limit(ip ?? "anonymous");

  setHeaders(e, {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": reset.toString(),
  });

  if (!success) {
    throw createError({
      statusCode: 429,
      statusMessage: "Too Many Requests",
    });
  }
});
