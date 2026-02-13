import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

type GlobalHeaderProps = {
    homeHref?: string;
    showContactUs?: boolean;
    variant?: 'default' | 'public';
};

export function GlobalHeader({
    homeHref = '/',
    showContactUs = true,
    variant = 'default',
}: GlobalHeaderProps) {
    const isPublic = variant === 'public';

    return (
        <header
            className={cn(
                'px-6',
                isPublic
                    ? 'sticky top-0 z-30'
                    : 'border-b border-slate-200 bg-white py-4',
            )}
        >
            <div
                className={cn(
                    'mx-auto flex w-full max-w-6xl items-center justify-between',
                    isPublic &&
                        'border-x border-slate-200 bg-gradient-to-r from-[#0077C0] via-[#0D89CF] to-[#0077C0] px-6 py-4 shadow-sm',
                )}
            >
                <Link href={homeHref}>
                    <img
                        src="/brand/JG-Logo-WEB-1260x120px.png"
                        alt="Joshua Generation Church"
                        className={cn(
                            'w-auto object-contain',
                            isPublic
                                ? 'h-14 max-w-[320px]'
                                : 'h-11 max-w-[260px]',
                        )}
                    />
                </Link>

                {showContactUs ? (
                    <a
                        href="#"
                        onClick={(event) => event.preventDefault()}
                        className={cn(
                            'text-sm font-medium transition-colors',
                            isPublic
                                ? 'text-white/90 hover:text-white'
                                : 'text-slate-700 hover:text-slate-900',
                        )}
                    >
                        Contact us
                    </a>
                ) : null}
            </div>
        </header>
    );
}
