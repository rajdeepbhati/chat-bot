import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FloatingChatbot } from "@/components/chat/FloatingChatbot";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Chat - Powered by GLM-4",
  description: "A modern AI chatbot interface with support for code highlighting, LaTeX math, and Mermaid diagrams.",
  keywords: ["AI", "Chat", "GLM-4", "Chatbot", "LaTeX", "Mermaid", "Code Highlighting"],
  authors: [{ name: "Z.ai Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "AI Chat",
    description: "A modern AI chatbot interface",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <FloatingChatbot />
        <Toaster />
      </body>
    </html>
  );
}
