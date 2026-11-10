import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppToaster from "@/components/AppToaster";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import { es } from "@/lib/i18n/es";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// JV-1 (C3): "Jarvis" on the home page; the other pages fill in %s from their own layout ("Tablero · Jarvis").
// The icon is app/icon.svg (Next picks it up by its file name).
export const metadata: Metadata = {
  title: {
    default: es.meta.appName,
    template: `%s · ${es.meta.appName}`,
  },
  description: es.meta.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {/* JV-1 (C1): any page can ask "are you sure?" with useConfirm() */}
        <ConfirmProvider>{children}</ConfirmProvider>
        {/* Notificaciones flotantes profesionales en toda la app */}
        <AppToaster />
      </body>
    </html>
  );
}

