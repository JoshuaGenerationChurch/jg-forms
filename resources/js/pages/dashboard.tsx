import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    Check,
    Clock3,
    Copy,
    ExternalLink,
    Hash,
    Sparkles,
} from 'lucide-react';
import { useRef, useState } from 'react';
import AdminPageContent from '@/components/layouts/admin-page-content';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
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
    totalEntries: number;
};

type FormSummary = {
    slug: string;
    title: string;
    isActive: boolean;
    entryCount: number;
    latestEntryAt: string | null;
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

    const activeFormsPercent =
        metrics.totalForms > 0
            ? Math.round((metrics.activeForms / metrics.totalForms) * 100)
            : 0;
    const averageEntriesPerForm =
        metrics.totalForms > 0
            ? (metrics.totalEntries / metrics.totalForms).toFixed(1)
            : '0.0';
    const formsWithEntriesCount = formsSummary.filter(
        (form) => form.entryCount > 0,
    ).length;
    const formsWithEntriesPercent =
        metrics.totalForms > 0
            ? Math.round((formsWithEntriesCount / metrics.totalForms) * 100)
            : 0;
    const activeFormsEntriesCount = formsSummary
        .filter((form) => form.isActive)
        .reduce((total, form) => total + form.entryCount, 0);
    const activeFormsEntriesPercent =
        metrics.totalEntries > 0
            ? Math.round((activeFormsEntriesCount / metrics.totalEntries) * 100)
            : 0;
    const orderedForms = [...formsSummary].sort(
        (a, b) => b.entryCount - a.entryCount || a.title.localeCompare(b.title),
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard">
                <meta name="robots" content="noindex,nofollow" />
            </Head>
            <AdminPageContent>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sidebar-border/70 bg-white p-4 dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex items-start gap-3">
                        <SidebarTrigger className="mt-0.5 h-9 w-9 shrink-0 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100" />
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">
                                Public Forms Dashboard
                            </h2>
                            <p className="text-sm text-slate-700">
                                Share this page with people who need to access
                                your forms.
                            </p>
                        </div>
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
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                    Total Forms
                                </p>
                                <p className="mt-2 text-3xl font-semibold text-emerald-700">
                                    {metrics.totalForms}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                    {formsWithEntriesCount}/{metrics.totalForms}{' '}
                                    already have entries
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/70 p-2 text-emerald-600 shadow-sm">
                                <Hash className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3 h-2 w-full rounded-full bg-white/70">
                            <div
                                className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                style={{ width: `${formsWithEntriesPercent}%` }}
                            />
                        </div>
                    </div>
                    <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                    Active Forms
                                </p>
                                <p className="mt-2 text-3xl font-semibold text-blue-700">
                                    {metrics.activeForms}/{metrics.totalForms}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                    {activeFormsPercent}% currently active
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/70 p-2 text-blue-600 shadow-sm">
                                <Activity className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3 h-2 w-full rounded-full bg-white/70">
                            <div
                                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-sky-500"
                                style={{ width: `${activeFormsPercent}%` }}
                            />
                        </div>
                    </div>
                    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-indigo-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                    Total Entries
                                </p>
                                <p className="mt-2 text-3xl font-semibold text-violet-700">
                                    {metrics.totalEntries}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                    {activeFormsEntriesPercent}% from active
                                    forms • Avg {averageEntriesPerForm}/form
                                </p>
                            </div>
                            <div className="rounded-lg bg-white/70 p-2 text-violet-600 shadow-sm">
                                <BarChart3 className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3 h-2 w-full rounded-full bg-white/70">
                            <div
                                className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                style={{
                                    width: `${activeFormsEntriesPercent}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 px-4 py-3">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">
                                    Forms Overview
                                </h3>
                                <p className="text-xs text-slate-600">
                                    Performance snapshot across all forms
                                </p>
                            </div>
                            <Sparkles className="size-4 text-sky-600" />
                        </div>
                        <div className="space-y-3 p-4">
                            {orderedForms.map((form) => {
                                const shareOfTotal =
                                    metrics.totalEntries > 0
                                        ? Math.round(
                                              (form.entryCount /
                                                  metrics.totalEntries) *
                                                  100,
                                          )
                                        : 0;

                                return (
                                    <div
                                        key={form.slug}
                                        className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-600">
                                                    {form.title}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {form.slug}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                                        form.isActive
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-200 text-slate-600'
                                                    }`}
                                                >
                                                    {form.isActive
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                                    {form.entryCount} entries
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                            <span className="rounded-full bg-slate-200 px-2 py-0.5 font-medium text-slate-700">
                                                {shareOfTotal}% of total entries
                                            </span>
                                            <span className="rounded-full bg-white px-2 py-0.5 text-slate-600">
                                                Last entry:{' '}
                                                {form.latestEntryAt
                                                    ? new Date(
                                                          form.latestEntryAt,
                                                      ).toLocaleString()
                                                    : 'None yet'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-cyan-50 px-4 py-3">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">
                                    Recent Entries
                                </h3>
                                <p className="text-xs text-slate-600">
                                    Latest submissions across all forms
                                </p>
                            </div>
                            <Clock3 className="size-4 text-indigo-600" />
                        </div>
                        <div className="space-y-2 p-4">
                            {recentEntries.length === 0 ? (
                                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
                                    No entries yet.
                                </p>
                            ) : (
                                recentEntries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-sm font-semibold text-slate-600">
                                                {entry.eventName?.trim() ||
                                                    `Entry #${entry.id}`}
                                            </p>
                                            <span className="text-xs text-slate-500">
                                                {entry.createdAt
                                                    ? new Date(
                                                          entry.createdAt,
                                                      ).toLocaleString()
                                                    : 'Unknown date'}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                                                {entry.formSlug}
                                            </span>
                                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                                                {entry.congregation ||
                                                    'No congregation'}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                ID #{entry.id}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </AdminPageContent>
        </AppLayout>
    );
}
