import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

function getSupabaseConnectSources() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!configuredUrl) {
    return [];
  }

  try {
    const url = new URL(configuredUrl);
    const websocketProtocol = url.protocol === "https:" ? "wss:" : "ws:";

    return [url.origin, `${websocketProtocol}//${url.host}`];
  } catch {
    return [];
  }
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  `connect-src 'self' ${getSupabaseConnectSources().join(" ")}${
    isDevelopment ? " ws://localhost:*" : ""
  }`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(!isDevelopment ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  ...(!isDevelopment
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
