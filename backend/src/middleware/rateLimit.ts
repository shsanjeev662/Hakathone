import { NextFunction, Request, Response } from "express";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string | null;
  skip?: (req: Request) => boolean;
  message?: string;
};

const buckets = new Map<string, Bucket>();

const getClientIp = (req: Request) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0];
  }

  return req.ip || req.socket.remoteAddress || "unknown";
};

const cleanupExpiredBuckets = (now: number) => {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

const setRateLimitHeaders = (
  res: Response,
  maxRequests: number,
  remaining: number,
  resetAt: number
) => {
  const resetInSeconds = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));

  res.setHeader("RateLimit-Limit", String(maxRequests));
  res.setHeader("RateLimit-Remaining", String(Math.max(0, remaining)));
  res.setHeader("RateLimit-Reset", String(resetInSeconds));
  res.setHeader("X-RateLimit-Limit", String(maxRequests));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, remaining)));
  res.setHeader("X-RateLimit-Reset", String(resetInSeconds));
};

export const createRateLimiter = ({
  windowMs,
  maxRequests,
  keyPrefix = "rate-limit",
  keyGenerator,
  skip,
  message = "Too many requests. Please try again later.",
}: RateLimitOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (skip?.(req)) {
      return next();
    }

    const keyValue = keyGenerator?.(req) ?? getClientIp(req);
    if (!keyValue) {
      return next();
    }

    const now = Date.now();
    cleanupExpiredBuckets(now);

    const key = `${keyPrefix}:${keyValue}`;
    const currentBucket = buckets.get(key);

    if (!currentBucket || currentBucket.resetAt <= now) {
      const resetAt = now + windowMs;
      buckets.set(key, { count: 1, resetAt });
      setRateLimitHeaders(res, maxRequests, maxRequests - 1, resetAt);
      return next();
    }

    currentBucket.count += 1;
    const remaining = maxRequests - currentBucket.count;
    setRateLimitHeaders(res, maxRequests, remaining, currentBucket.resetAt);

    if (currentBucket.count > maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((currentBucket.resetAt - now) / 1000)
      );

      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        error: message,
        retryAfterSeconds,
      });
    }

    return next();
  };
};

export const getRateLimitIp = (req: Request) => getClientIp(req);
