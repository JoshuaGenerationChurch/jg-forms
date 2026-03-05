import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    FileText,
    Folder,
    Inbox,
    LayoutGrid,
    Mail,
    UserPlus,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem, SharedData } from '@/types';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { props } = usePage<SharedData>();
    const isWorkFormsAdmin = Boolean(props.workForms?.isAdmin);
    const canManageInvitations = Boolean(props.workForms?.canManageInvitations);

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];

    if (isWorkFormsAdmin) {
        mainNavItems.push(
            {
                title: 'Forms',
                href: '/admin/forms',
                icon: FileText,
            },
            {
                title: 'Forms Entries',
                href: '/admin/forms/entries',
                icon: Inbox,
            },
            {
                title: 'Email Templates',
                href: '/admin/forms/email-templates',
                icon: Mail,
            },
        );

        if (canManageInvitations) {
            mainNavItems.push({
                title: 'Invitations',
                href: '/admin/invitations',
                icon: UserPlus,
            });
        }
    }

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="[&_[data-sidebar=sidebar]]:border [&_[data-sidebar=sidebar]]:border-slate-200/80 [&_[data-sidebar=sidebar]]:bg-gradient-to-b [&_[data-sidebar=sidebar]]:from-white [&_[data-sidebar=sidebar]]:to-slate-100/80 [&_[data-sidebar=sidebar]]:shadow-sm"
        >
            <SidebarHeader className="border-b border-slate-200/80 px-2.5 pb-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-auto p-0 hover:bg-transparent data-[active=true]:bg-transparent"
                        >
                            <Link href={dashboard()} prefetch>
                                <AppLogo expand />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-1 py-2">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200/80 bg-white/40 backdrop-blur-sm">
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
