import type { Metadata } from "next";
import { SystemProvider } from "@/components/app/SystemProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALLNET System",
  description: "Compliance and training management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body>
        <SystemProvider>{children}</SystemProvider>
      </body>
    </html>
  );
}
