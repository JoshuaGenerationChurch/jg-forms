import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AdminFormSummary = {
    slug: string;
    title: string;
    description: string;
    entryCount: number;
    latestEntryAt: string | null;
};

type Props = {
    forms: AdminFormSummary[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Forms Entries', href: '/admin/forms/entries' },
];

export default function AdminFormsEntriesIndex({ forms }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Forms Entries">
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="bg-[#f3f5f7]">
                <div className="mx-auto w-full max-w-6xl px-6 py-8">
                    <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Forms Entries
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            View entries for each form.
                        </p>

                        <div className="mt-8 space-y-3">
                            {forms.map((form) => (
                                <div
                                    key={form.slug}
                                    className="rounded-lg border border-slate-200 bg-white p-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {form.title}
                                            </p>
                                            <p className="mt-2 text-xs text-slate-500">
                                                {form.entryCount} entr
                                                {form.entryCount === 1
                                                    ? 'y'
                                                    : 'ies'}
                                                {form.latestEntryAt
                                                    ? ` • Latest: ${new Date(form.latestEntryAt).toLocaleString()}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <Button variant="outline" asChild>
                                            <Link
                                                href={`/admin/forms/entries/${form.slug}`}
                                            >
                                                View entries
                                                <ArrowRight className="size-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
