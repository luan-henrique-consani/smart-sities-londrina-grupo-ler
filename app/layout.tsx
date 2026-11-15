import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { PREFS_INIT_SCRIPT } from "@/lib/prefs";
import { ClientErrorReporter } from "@/components/ClientErrorReporter";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Prevora — inteligência preventiva urbana",
    template: "%s · Prevora",
  },
  description:
    "Prevora: plataforma de gestão preventiva de resíduos e alagamentos para a Prefeitura de Londrina (PR). Dados simulados.",
  applicationName: "Prevora",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0046AA",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans">
        <AuthProvider>{children}</AuthProvider>
        <ClientErrorReporter />
      </body>
    </html>
  );
}
