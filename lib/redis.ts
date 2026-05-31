import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClientSingleton = () => {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
  });
};

declare const globalThis: {
  redisGlobal: ReturnType<typeof redisClientSingleton> | undefined;
} & typeof global;

const redis = globalThis.redisGlobal ?? redisClientSingleton();

// Standard error handling to ensure fail-open / resilient behavior
redis.on("error", (err) => {
  console.error("[REDIS CONNECTION ERROR]:", err);
});

export default redis;

if (process.env.NODE_ENV !== "production") {
  globalThis.redisGlobal = redis;
}
