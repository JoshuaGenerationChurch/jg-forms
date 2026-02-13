import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Pencil } from 'lucide-react';
import EntryResponseReport from '@/components/forms/entry-response-report';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AdminForm = {
    slug: string;
    title: string;
    description: string;
    url: string;
};

type AdminEntry = {
    id: number;
    formSlug: string;
    createdAt: string | null;
    updatedAt: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    cellphone: string | null;
    congregation: string | null;
    requestSummary: string | null;
    eventName: string | null;
    requestTypes: string[];
    payload: Record<string, unknown> | null;
};

type Props = {
    form: AdminForm;
    entry: AdminEntry;
};

export default function AdminFormEntryShow({ form, entry }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Forms Entries', href: '/admin/forms/entries' },
        { title: form.title, href: `/admin/forms/entries/${form.slug}` },
        {
            title: `Entry #${entry.id}`,
            href: `/admin/forms/entries/${form.slug}/${entry.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${form.title} Entry #${entry.id}`}>
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="bg-[#f3f5f7]">
                <div className="mx-auto w-full max-w-6xl px-6 py-8">
                    <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold text-slate-900">
                                    {form.title} Entry #{entry.id}
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Submitted{' '}
                                    {entry.createdAt
                                        ? new Date(
                                              entry.createdAt,
                                          ).toLocaleString()
                                        : 'Unknown'}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" asChild>
                                    <Link
                                        href={`/admin/forms/entries/${form.slug}`}
                                    >
                                        <ArrowLeft className="size-4" />
                                        Back to entries
                                    </Link>
                                </Button>
                                <Button asChild>
                                    <Link
                                        href={`/admin/forms/entries/${form.slug}/${entry.id}/edit`}
                                    >
                                        <Pencil className="size-4" />
                                        Edit entry
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="mt-8 grid gap-6 md:grid-cols-2">
                            <div className="rounded-lg border border-slate-200 p-4">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Requester
                                </h2>
                                <dl className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">Name</dt>
                                        <dd className="text-slate-900">
                                            {[
                                                entry.firstName,
                                                entry.lastName,
                                            ]
                                                .filter(Boolean)
                                                .join(' ') || 'N/A'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">
                                            Email
                                        </dt>
                                        <dd className="text-slate-900">
                                            {entry.email || 'N/A'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">
                                            Cellphone
                                        </dt>
                                        <dd className="text-slate-900">
                                            {entry.cellphone || 'N/A'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">
                                            Congregation
                                        </dt>
                                        <dd className="text-slate-900">
                                            {entry.congregation || 'N/A'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="rounded-lg border border-slate-200 p-4">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Request Summary
                                </h2>
                                <dl className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">
                                            Event Name
                                        </dt>
                                        <dd className="text-slate-900">
                                            {entry.eventName || 'N/A'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">
                                            Summary
                                        </dt>
                                        <dd className="max-w-[70%] text-right text-slate-900">
                                            {entry.requestSummary || 'N/A'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">
                                            Types
                                        </dt>
                                        <dd className="text-right text-slate-900">
                                            {entry.requestTypes.length > 0
                                                ? entry.requestTypes.join(', ')
                                                : 'N/A'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        <EntryResponseReport
                            formSlug={entry.formSlug}
                            payload={entry.payload}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
