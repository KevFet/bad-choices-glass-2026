import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bad Choices | Future Edition 2026",
  description: "Multilateral Social Experiment - High-End Aesthetic",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bad Choices",
  },
};

export const viewport: Viewport = {
  themeColor: "#030014",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Force Tailwind via CDN as requested by USER */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  playfair: ['var(--font-playfair)', 'serif'],
                  geist: ['var(--font-geist)', 'sans-serif'],
                },
                colors: {
                  background: "#030014",
                  deep: "#050505",
                  liquid: {
                    indigo: "#4F46E5",
                    magenta: "#701A75",
                  },
                },
                borderRadius: {
                  '3xl': '24px',
                  '4xl': '32px',
                  '5xl': '40px',
                },
              }
            }
          }
        `}} />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,900&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="antialiased selection:bg-indigo-500/30 font-geist">
        <div className="deep-liquid" aria-hidden="true" />
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
