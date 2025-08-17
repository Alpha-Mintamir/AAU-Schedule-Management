import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AAU Schedule Management",
  description: "University class scheduling platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header className="brand-header">
          <div className="container brand-bar">
            <a href="/" className="brand-title">AAU Schedule Management</a>
            <nav className="brand-links">
              <a href="/admin">Admin</a>
              <a href="/instructor/today">Instructor</a>
            </nav>
          </div>
        </header>
        <div className="container page-container">
          {children}
        </div>
      </body>
    </html>
  );
}
