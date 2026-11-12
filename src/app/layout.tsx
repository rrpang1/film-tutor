import type { Metadata, Viewport } from "next";
import Shell from "@/components/Shell";
import "./globals.css";
import "./ui.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "film tutor",
  description: "learn film photography, frame by frame",
  manifest: `${base}/manifest.webmanifest`,
  icons: { icon: `${base}/icon.svg`, apple: `${base}/icon-192.png` },
  appleWebApp: { capable: true, title: "film tutor", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#d3d9e0", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&family=Unbounded:wght@200;300;400&display=swap" />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
