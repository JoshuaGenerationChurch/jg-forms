import { Head, Link } from '@inertiajs/react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
        'idle',
    );
    const copyResetTimer = useRef<number | null>(null);

    const resetCopyState = () => {
        if (copyResetTimer.current !== null) {
            window.clearTimeout(copyResetTimer.current);
        }

        copyResetTimer.current = window.setTimeout(() => {
            setCopyState('idle');
            copyResetTimer.current = null;
        }, 2000);
    };

    const fallbackCopy = (text: string): boolean => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        let success = false;
        try {
            success = document.execCommand('copy');
        } catch {
            success = false;
        }

        document.body.removeChild(textarea);
        return success;
    };

    const handleCopyFormsLink = async () => {
        const formsPath = '/forms';
        const formsUrl =
            typeof window !== 'undefined'
                ? `${window.location.origin}${formsPath}`
                : formsPath;

        setCopyState('idle');

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(formsUrl);
                setCopyState('copied');
                resetCopyState();
                return;
            }

            if (fallbackCopy(formsUrl)) {
                setCopyState('copied');
                resetCopyState();
                return;
            }

            setCopyState('error');
            resetCopyState();
        } catch {
            if (fallbackCopy(formsUrl)) {
                setCopyState('copied');
                resetCopyState();
                return;
            }

            setCopyState('error');
            resetCopyState();
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard">
                <meta name="robots" content="noindex,nofollow" />
            </Head>
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sidebar-border/70 bg-white p-4 dark:border-sidebar-border dark:bg-sidebar">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Public Forms Dashboard
                        </h2>
                        <p className="text-sm text-slate-700">
                            Share this page with people who need to access your
                            forms.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild>
                            <Link href="/forms">
                                <ExternalLink className="size-4" />
                                Open Forms Dashboard
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCopyFormsLink}
                            className="relative min-w-[150px] justify-center overflow-hidden"
                        >
                            <span
                                className={`inline-flex items-center gap-2 transition-all duration-200 ${
                                    copyState !== 'idle'
                                        ? '-translate-y-1 opacity-0'
                                        : 'translate-y-0 opacity-100'
                                }`}
                            >
                                <Copy className="size-4" />
                                Copy Forms Link
                            </span>
                            <span
                                className={`pointer-events-none absolute inset-0 flex items-center justify-center gap-2 transition-all duration-200 ${
                                    copyState !== 'idle'
                                        ? 'translate-y-0 opacity-100'
                                        : 'translate-y-1 opacity-0'
                                }`}
                            >
                                {copyState === 'error' ? (
                                    <Copy className="size-4" />
                                ) : (
                                    <Check className="size-4" />
                                )}
                                {copyState === 'error'
                                    ? 'Copy failed'
                                    : 'Copied'}
                            </span>
                        </Button>
                    </div>
                </div>
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
                <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
