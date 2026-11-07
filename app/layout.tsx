import type { Metadata } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/instrument-serif/400.css";

import { ThemeProvider } from "@/components/theme-provider";
import { PwaRuntime } from "@/components/pwa-runtime";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SpendWise",
    template: "%s | SpendWise",
  },
  description:
    "SpendWise is a modern budgeting experience for tracking spending, protecting savings, and building calmer money habits.",
  applicationName: "SpendWise",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SpendWise",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <PwaRuntime />
          {children}
          <Toaster position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
