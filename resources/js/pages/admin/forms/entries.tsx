import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Eye, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteConfirmDialog from '@/components/forms/delete-confirm-dialog';
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
    createdAt: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    eventName: string | null;
    requestSummary: string | null;
    requestTypes: string[];
};

type Props = {
    form: AdminForm;
    entries: AdminEntry[];
};

export default function AdminFormEntries({ form, entries }: Props) {
    const [entryToDelete, setEntryToDelete] = useState<AdminEntry | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        if (!entryToDelete) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/admin/forms/entries/${form.slug}/${entryToDelete.id}`, {
            onSuccess: () => {
                setEntryToDelete(null);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Forms Entries', href: '/admin/forms/entries' },
        { title: form.title, href: `/admin/forms/entries/${form.slug}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${form.title} Entries`}>
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="bg-[#f3f5f7]">
                <div className="mx-auto w-full max-w-6xl px-6 py-8">
                    <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold text-slate-900">{form.title} Entries</h1>
                                <p className="mt-1 text-sm text-slate-500">{form.description}</p>
                            </div>
                            <Button variant="outline" asChild>
                                <Link href="/admin/forms/entries">
                                    <ArrowLeft className="size-4" />
                                    Back to forms entries
                                </Link>
                            </Button>
                        </div>

                        {entries.length === 0 ? (
                            <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                                <p className="text-sm text-slate-600">No entries submitted yet for this form.</p>
                            </div>
                        ) : (
                            <div className="mt-8 space-y-2">
                                {entries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="rounded-lg border border-slate-200 bg-white p-3"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0 space-y-2">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {entry.eventName?.trim() || entry.requestSummary?.trim() || `Entry #${entry.id}`}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {entry.requestTypes.length > 0 ? (
                                                        entry.requestTypes.map((type) => (
                                                            <span
                                                                key={type}
                                                                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                                                            >
                                                                {type}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                                                            General request
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-right text-xs text-slate-500">
                                                    {entry.createdAt
                                                        ? new Date(
                                                              entry.createdAt,
                                                          ).toLocaleString()
                                                        : 'Unknown date'}
                                                </div>
                                                <div className="flex flex-wrap items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/admin/forms/entries/${form.slug}/${entry.id}`}
                                                        >
                                                            <Eye className="size-4" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/admin/forms/entries/${form.slug}/${entry.id}/edit`}
                                                        >
                                                            <Pencil className="size-4" />
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        type="button"
                                                        onClick={() =>
                                                            setEntryToDelete(
                                                                entry,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-4" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="sr-only">
                                                <span>
                                                    {entry.createdAt
                                                        ? new Date(
                                                              entry.createdAt,
                                                          ).toLocaleString()
                                                        : 'Unknown date'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DeleteConfirmDialog
                open={entryToDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setEntryToDelete(null);
                    }
                }}
                onConfirm={handleDelete}
                title={
                    entryToDelete
                        ? `Delete entry #${entryToDelete.id}?`
                        : 'Delete entry?'
                }
                description="This action cannot be undone."
                confirmLabel="Delete entry"
                processing={isDeleting}
            />
        </AppLayout>
    );
}
