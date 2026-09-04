import type { Metadata } from "next";
import { Geist, Geist_Mono, Amiri, Noto_Sans_Bengali } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali", "latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Al-Noor Mosque",
    template: "%s | Al-Noor Mosque",
  },
  description:
    "Welcome to Al-Noor Mosque. Prayer times, events, announcements, and community resources.",
  keywords: [
    "mosque",
    "masjid",
    "prayer times",
    "islamic",
    "Al-Noor Mosque",
    "community",
  ],
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Al-Noor Mosque",
    description:
      "A place of peace, prayer, and community. Prayer times, events, and announcements.",
    type: "website",
    siteName: "Al-Noor Mosque",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable} ${notoSansBengali.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            },
          }}
        />
      </body>
    </html>
  );
}
