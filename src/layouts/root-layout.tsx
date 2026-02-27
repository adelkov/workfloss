import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export function RootLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-dvh overflow-hidden">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
