import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/base-path";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: BASE_PATH,
  // lib/logger.ts writes to ./logs at runtime, so build tracing copies any
  // existing log files (including deploy/logs) into the standalone output.
  // Regenerating deploy/ from that output would then overwrite the deployed
  // app's logs with local ones.
  outputFileTracingExcludes: {
    "/**": ["./logs/**/*", "./deploy/**/*"],
  },
  outputFileTracingIncludes: {
    "/**/*": ['./node_modules/next/dist/server/dev/browser-logs/**/*'],
    "/*": ['./node_modules/next/dist/server/dev/browser-logs/**/*']
  },
  experimental: {
    serverActions: {
      // Default is 1 MB; the selfie (base64) is posted through a server action.
      bodySizeLimit: "30mb",
    },
  },
  env: {
    // Face detection engine for the selfie flow (see lib/actions/faceCheck.ts).
    // Declared here so a default is always inlined at build time — otherwise an
    // unset variable is read at runtime and both engines end up in the bundle.
    NEXT_PUBLIC_FACE_ENGINE: process.env.NEXT_PUBLIC_FACE_ENGINE ?? "tfjs",
  },
};

export default nextConfig;
