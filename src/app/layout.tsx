import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Bad Choices | Future Edition 2026",
  description: "Multilateral Social Experiment - High-End Aesthetic",
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
    <html lang="fr" className="bg-[#030014]">
      <head>
        {/* Force Tailwind via CDN v3 for absolute layout reliability as requested */}
        <script src="https://cdn.tailwindcss.com"></script>

        {/* Google Fonts & Custom Styles */}
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,900&family=Inter:wght@400;900&display=swap" rel="stylesheet" />

        <style dangerouslySetInnerHTML={{
          __html: `
          body {
            margin: 0;
            padding: 0;
            background-color: #030014;
            color: white;
            font-family: 'Inter', sans-serif;
            overflow-x: hidden;
          }

          /* Magma Liquid Background */
          .deep-liquid {
            position: fixed;
            inset: 0;
            z-index: -10;
            background: radial-gradient(at 10% 20%, #1E1B4B 0px, transparent 50%),
                        radial-gradient(at 80% 10%, #701A75 0px, transparent 50%);
            filter: blur(140px) saturate(2);
            animation: magma-flow 40s ease-in-out infinite alternate;
          }

          @keyframes magma-flow {
            0% { transform: scale(1) translate(0, 0); }
            50% { transform: scale(1.3) translate(-5%, 5%); }
            100% { transform: scale(1.1) translate(5%, -2%); }
          }

          .noise-overlay {
            position: fixed;
            inset: 0;
            z-index: -9;
            background-image: url("https://grainy-gradients.vercel.app/noise.svg");
            opacity: 0.04;
            pointer-events: none;
            mix-blend-mode: overlay;
          }

          .title-magazine {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-weight: 900;
            line-height: 0.85;
            text-align: center;
            letter-spacing: -0.05em;
            background: linear-gradient(to bottom, #fff, #999);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .glass-bento {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(40px);
            border-radius: 40px;
            border: 0.5px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.7);
          }

          .btn-frosted {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 0.5px solid rgba(255, 255, 255, 0.1);
            transition: all 0.5s ease;
          }
          
          .btn-frosted:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: scale(1.05);
          }
        `}} />
      </head>
      <body className="antialiased selection:bg-indigo-500/30">
        <div className="deep-liquid" aria-hidden="true" />
        <div className="noise-overlay" aria-hidden="true" />
        <div className="relative z-10 w-full min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
