import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alliance Dental Clinic",
  description: "Diş klinikası — Bakı. Onlayn görüş qeydiyyatı.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az">
      <body className={`${inter.variable} font-sans bg-brand-white text-brand-slate antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
