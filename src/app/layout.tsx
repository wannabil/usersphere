import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { ThemeScript } from "@/components/theme-script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "User Management System",
  description: "Advanced user management with React Query",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
        >
          <Providers>
            <Header />
            <main className="min-h-screen bg-background text-foreground">{children}</main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
