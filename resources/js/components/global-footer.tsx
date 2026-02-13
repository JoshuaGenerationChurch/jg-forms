import { cn } from '@/lib/utils';

type GlobalFooterProps = {
    homeHref?: string;
    showContactUs?: boolean;
    variant?: 'default' | 'public';
};

export function GlobalFooter({
    showContactUs = true,
    variant = 'default',
}: GlobalFooterProps) {
    const isPublic = variant === 'public';

    return (
        <footer
            className={cn(
                'px-6',
                isPublic
                    ? 'mt-auto'
                    : 'mt-auto border-t border-slate-200 bg-white py-6',
            )}
        >
            <div
                className={cn(
                    'mx-auto w-full max-w-6xl px-6 py-6',
                    isPublic
                        ? 'border-x border-t border-slate-200 bg-white'
                        : '',
                )}
            >
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center text-sm text-slate-700">
                    <a
                        href="https://za.joshgen.org/terms-and-conditions/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-slate-900"
                    >
                        Terms & Conditions
                    </a>
                    <a
                        href="https://za.joshgen.org/privacy-policy/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-slate-900"
                    >
                        Privacy Policy
                    </a>
                    {showContactUs ? (
                        <a
                            href="#"
                            onClick={(event) => event.preventDefault()}
                            className="hover:text-slate-900"
                        >
                            Contact us
                        </a>
                    ) : null}
                    <span className="text-slate-600">
                        Copyright 2025 Joshua Generation Church
                    </span>
                </div>
            </div>
        </footer>
    );
}
