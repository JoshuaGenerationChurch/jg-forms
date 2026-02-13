import { Head, Link } from '@inertiajs/react';
import { ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type EntrySummary = {
    id: number;
    createdAt: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    eventName: string | null;
    requestSummary: string | null;
    requestTypes: string[];
};

type Props = {
    entries: EntrySummary[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Work Request Entries',
        href: '/work-request/entries',
    },
];

export default function WorkRequestEntriesIndex({ entries }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Work Request Entries" />

            <div className="bg-[#f3f5f7]">
                <div className="mx-auto w-full max-w-6xl px-6 py-8">
                    <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold text-slate-900">
                                    Work Request Entries
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Review previously submitted requests.
                                </p>
                            </div>
                            <Button asChild>
                                <Link href="/work-request">
                                    <FileText className="size-4" />
                                    New Work Request
                                </Link>
                            </Button>
                        </div>

                        {entries.length === 0 ? (
                            <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                                <p className="text-sm text-slate-600">
                                    No entries yet. Submit your first work
                                    request.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-8 space-y-2">
                                {entries.map((entry) => (
                                    <Link
                                        key={entry.id}
                                        href={`/work-request/entries/${entry.id}`}
                                        className="block rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0 space-y-2">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {entry.eventName?.trim() ||
                                                        entry.requestSummary?.trim() ||
                                                        `Entry #${entry.id}`}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {entry.requestTypes.length >
                                                    0 ? (
                                                        entry.requestTypes.map(
                                                            (type) => (
                                                                <span
                                                                    key={type}
                                                                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                                                                >
                                                                    {type}
                                                                </span>
                                                            ),
                                                        )
                                                    ) : (
                                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                                                            General request
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span>
                                                    {entry.createdAt
                                                        ? new Date(
                                                              entry.createdAt,
                                                          ).toLocaleString()
                                                        : 'Unknown date'}
                                                </span>
                                                <ArrowRight className="size-4" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
