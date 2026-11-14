import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext configuration for Cloudflare Workers.
 *
 * The app is fully dynamic — every public route reads from Postgres at
 * request time and there is no ISR — so no incremental cache is needed. The
 * cache can be turned on later by adding an R2 bucket binding and the
 * `r2IncrementalCache` override (see the OpenNext caching guide).
 */
export default {
  ...defineCloudflareConfig(),
  buildCommand: "next build",
};
