import { Head, Link } from '@inertiajs/react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

type MetricCards = {
    totalForms: number;
    activeForms: number;
    inactiveForms: number;
    totalEntries: number;
};

type FormSummary = {
    slug: string;
    title: string;
    isActive: boolean;
    entryCount: number;
};

type RecentEntry = {
    id: number;
    formSlug: string;
    eventName: string | null;
    congregation: string | null;
    createdAt: string | null;
};

type Props = {
    metrics: MetricCards;
    formsSummary: FormSummary[];
    recentEntries: RecentEntry[];
};

export default function Dashboard({ metrics, formsSummary, recentEntries }: Props) {
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
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                            Total Forms
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {metrics.totalForms}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                            Active Forms
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-700">
                            {metrics.activeForms}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                            Inactive Forms
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {metrics.inactiveForms}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                            Total Entries
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {metrics.totalEntries}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h3 className="text-sm font-semibold text-slate-800">
                            Forms Overview
                        </h3>
                        <div className="mt-3 space-y-2">
                            {formsSummary.map((form) => (
                                <div
                                    key={form.slug}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {form.title}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {form.slug}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {form.entryCount}
                                        </p>
                                        <p
                                            className={`text-xs ${
                                                form.isActive
                                                    ? 'text-emerald-700'
                                                    : 'text-slate-500'
                                            }`}
                                        >
                                            {form.isActive
                                                ? 'Active'
                                                : 'Inactive'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h3 className="text-sm font-semibold text-slate-800">
                            Recent Entries
                        </h3>
                        <div className="mt-3 space-y-2">
                            {recentEntries.length === 0 ? (
                                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
                                    No entries yet.
                                </p>
                            ) : (
                                recentEntries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="rounded-lg border border-slate-200 px-3 py-2"
                                    >
                                        <p className="text-sm font-medium text-slate-900">
                                            {entry.eventName?.trim() ||
                                                `Entry #${entry.id}`}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {entry.formSlug} •{' '}
                                            {entry.congregation || 'No congregation'}{' '}
                                            •{' '}
                                            {entry.createdAt
                                                ? new Date(
                                                      entry.createdAt,
                                                  ).toLocaleString()
                                                : 'Unknown date'}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
