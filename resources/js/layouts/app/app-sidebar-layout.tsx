import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { GlobalFooter } from '@/components/global-footer';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const page = usePage();
    const isSignedInDashboard = /^\/dashboard(?:\/|\?|$)/.test(page.url);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="min-h-screen overflow-x-hidden"
            >
                {!isSignedInDashboard ? (
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                ) : null}
                {children}
                <GlobalFooter homeHref="/dashboard" showContactUs={false} />
            </AppContent>
        </AppShell>
    );
}
