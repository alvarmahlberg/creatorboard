import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "CreatorBoard | Creator Coins Live Market Data",
  description: "Real-time top 100 creator coins by market cap with live updates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
