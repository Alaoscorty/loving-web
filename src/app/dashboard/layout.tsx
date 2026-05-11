
'use client';

import { useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useUser, useFirestore } from "@/firebase";
import { updateUserPresence } from "@/lib/firebase-actions";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (!user || !firestore) return;

    updateUserPresence(firestore, user.uid);

    const interval = setInterval(() => {
        updateUserPresence(firestore, user.uid);
    }, 120000);

    return () => clearInterval(interval);
  }, [user, firestore]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <DashboardSidebar />
        <SidebarInset className="flex flex-col flex-1 h-full overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:hidden bg-card/80 backdrop-blur-md z-50">
            <SidebarTrigger />
            <span className="font-headline font-bold text-primary">Loving</span>
          </header>
          <main className="flex-1 overflow-y-auto w-full relative scroll-smooth">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
