import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@aws-sdk/s3-request-presigner",
    "@mistralai/mistralai",
    "exceljs",
  ],
}

export default nextConfig
