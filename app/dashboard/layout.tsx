import type { Metadata } from "next";
import { es } from "@/lib/i18n/es";

// JV-1 (C3): the page is a Client Component and can't export metadata, so its title lives here
export const metadata: Metadata = {
  title: es.meta.dashboardTitle,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
