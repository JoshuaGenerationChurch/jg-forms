import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
                Platform
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1.5">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="rounded-xl border border-transparent px-3 py-2 text-[14px] font-medium text-slate-700 shadow-none transition-all duration-200 hover:border-sky-200 hover:bg-white hover:text-sky-700 hover:shadow-sm data-[active=true]:border-sky-200 data-[active=true]:bg-gradient-to-r data-[active=true]:from-sky-100 data-[active=true]:to-blue-50 data-[active=true]:text-sky-700 data-[active=true]:shadow-sm"
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
