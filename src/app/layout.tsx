import type { Metadata } from "next";
import { Geist, Geist_Mono, Amiri, Noto_Sans_Bengali } from "next/font/google";
import Script from "next/script";
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
        <Script
          id="strip-extension-attrs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var isExtAttr=function(n){return n.indexOf("bis_")===0||n.indexOf("__processed_")===0;};
  var strip=function(el){
    var a=el.attributes,i=a.length;
    while(i--){if(isExtAttr(a[i].name))el.removeAttribute(a[i].name);}
  };
  var sweep=function(){
    var els=document.querySelectorAll("*"),i=els.length;
    while(i--)strip(els[i]);
    strip(document.documentElement);
  };
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",sweep);
  }else{sweep();}
  new MutationObserver(function(ms){
    for(var i=0;i<ms.length;i++){
      var m=ms[i];
      if(m.type==="attributes"&&isExtAttr(m.attributeName))strip(m.target);
    }
  }).observe(document.documentElement,{subtree:true,attributes:true});
})();`,
          }}
        />
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
