import type { NextConfig } from "next";

// GitHub project pages live at /<repo>/. User sites and custom domains live at /.
// Set NEXT_PUBLIC_BASE_PATH to override detection, including an empty string.
function detectBasePath(): string {
  if (process.env.NEXT_PUBLIC_BASE_PATH !== undefined) {
    return process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/$/, "");
  }
  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
  if (repo && !repo.endsWith(".github.io")) return `/${repo}`;
  return "";
}

const basePath = detectBasePath();

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  allowedDevOrigins: ["127.0.0.1"],
  ...(basePath ? { basePath } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
