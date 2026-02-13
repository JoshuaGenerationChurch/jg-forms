import { cn } from '@/lib/utils';

export default function AppLogo({
    className,
    expand = false,
}: {
    className?: string;
    expand?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex items-center rounded-lg bg-[#0077C0] px-2 py-1 shadow-sm',
                expand && 'w-full',
                className,
            )}
        >
            <img
                src="/brand/JG-Logo-WEB-1260x120px.png"
                alt="Joshua Generation Church"
                className={cn(
                    'h-9 w-auto max-w-[190px] object-contain group-data-[collapsible=icon]/sidebar-wrapper:hidden',
                    expand && 'w-full max-w-none object-left',
                )}
            />
            <img
                src="/brand/JG-Logo-Favicon-White-Blue.png"
                alt="Joshua Generation Church"
                className="hidden size-9 object-contain group-data-[collapsible=icon]/sidebar-wrapper:block"
            />
        </div>
    );
}
