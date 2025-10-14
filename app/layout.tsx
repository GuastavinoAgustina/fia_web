// app/layout.tsx
import type { Metadata } from "next";
import { ToastProvider } from "@/components/toast-provider";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000/admin";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "FIA-Web",
  icons: {
      icon: [
    { url: "/icon.png", type: "image/png", sizes: "64x64" },
  ],
  },
};

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
    return (
        <html lang="en" suppressHydrationWarning>
          <body className="bg-black">
                <main>
                        <ToastProvider>{children}</ToastProvider>
                </main>
          </body>
        </html>
    );
}