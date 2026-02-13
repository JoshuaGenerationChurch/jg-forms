import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
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
    isActive: boolean;
    entryCount: number;
};

type Props = {
    forms: AdminForm[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Forms', href: '/admin/forms' },
];

export default function AdminFormsIndex({ forms }: Props) {
    const [formToDelete, setFormToDelete] = useState<AdminForm | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        if (!formToDelete) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/admin/forms/${formToDelete.slug}`, {
            onSuccess: () => {
                setFormToDelete(null);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Forms">
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="bg-[#f3f5f7]">
                <div className="mx-auto w-full max-w-6xl px-6 py-8">
                    <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Forms
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage available forms.
                        </p>

                        <div className="mt-8 space-y-3">
                            {forms.map((form) => (
                                <div
                                    key={form.slug}
                                    className="rounded-lg border border-slate-200 bg-white p-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-900">
                                                {form.title}
                                            </p>
                                            <p className="mt-2 text-xs text-slate-500">
                                                URL: {form.url}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Status:{' '}
                                                {form.isActive
                                                    ? 'Active'
                                                    : 'Inactive'}{' '}
                                                • Entries: {form.entryCount}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button variant="outline" asChild>
                                                <Link
                                                    href={`/admin/forms/${form.slug}`}
                                                >
                                                    <Eye className="size-4" />
                                                    View
                                                </Link>
                                            </Button>
                                            <Button variant="outline" asChild>
                                                <Link
                                                    href={`/admin/forms/${form.slug}/edit`}
                                                >
                                                    <Pencil className="size-4" />
                                                    Edit
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                type="button"
                                                onClick={() =>
                                                    setFormToDelete(form)
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <DeleteConfirmDialog
                open={formToDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setFormToDelete(null);
                    }
                }}
                onConfirm={handleDelete}
                title={
                    formToDelete
                        ? `Delete "${formToDelete.title}"?`
                        : 'Delete form?'
                }
                description="This action cannot be undone."
                confirmLabel="Delete form"
                processing={isDeleting}
            />
        </AppLayout>
    );
}
