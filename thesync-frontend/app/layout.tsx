import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";

import { AuthSessionRecovery } from "@/components/auth/auth-session-recovery";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TheSync Design System",
  description:
    "Design tokens, Tailwind theme variables, and shadcn/ui primitives for the TheSync frontend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full`}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col">
        <ReactQueryProvider>
          <AuthSessionRecovery />
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
