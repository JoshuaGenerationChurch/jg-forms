import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import DeleteConfirmDialog from '@/components/forms/delete-confirm-dialog';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AdminForm = {
    slug: string;
    title: string;
    description: string;
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
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'active' | 'inactive'
    >('all');
    const [entriesFilter, setEntriesFilter] = useState<
        'all' | 'with-entries' | 'no-entries'
    >('all');

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

    const filteredForms = useMemo(() => {
        return forms.filter((form) => {
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && form.isActive) ||
                (statusFilter === 'inactive' && !form.isActive);

            const matchesEntries =
                entriesFilter === 'all' ||
                (entriesFilter === 'with-entries' && form.entryCount > 0) ||
                (entriesFilter === 'no-entries' && form.entryCount === 0);

            return matchesStatus && matchesEntries;
        });
    }, [entriesFilter, forms, statusFilter]);

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

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-600">
                                    Status
                                </span>
                                <select
                                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(
                                            event.target.value as
                                                | 'all'
                                                | 'active'
                                                | 'inactive',
                                        )
                                    }
                                >
                                    <option value="all">All statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </label>
                            <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-600">
                                    Entries
                                </span>
                                <select
                                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                    value={entriesFilter}
                                    onChange={(event) =>
                                        setEntriesFilter(
                                            event.target.value as
                                                | 'all'
                                                | 'with-entries'
                                                | 'no-entries',
                                        )
                                    }
                                >
                                    <option value="all">All entries</option>
                                    <option value="with-entries">
                                        With entries
                                    </option>
                                    <option value="no-entries">
                                        No entries
                                    </option>
                                </select>
                            </label>
                        </div>

                        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Form
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Entries
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {filteredForms.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-10 text-center text-sm text-slate-500"
                                            >
                                                No forms match the selected
                                                filters.
                                            </td>
                                        </tr>
                                    ) : null}

                                    {filteredForms.map((form) => (
                                        <tr key={form.slug}>
                                            <td className="px-4 py-4 text-left align-top">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {form.title}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {form.description ||
                                                        'No description'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 text-center align-middle">
                                                <div className="flex justify-center">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                                            form.isActive
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {form.isActive
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center align-middle text-sm text-slate-900">
                                                {form.entryCount}
                                            </td>
                                            <td className="px-4 py-4 align-middle">
                                                <div className="flex flex-wrap items-center justify-start gap-2">
                                                    <Button
                                                        variant="outline"
                                                        className="pl-2 pr-3"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/admin/forms/${form.slug}`}
                                                        >
                                                            <Eye className="size-4" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="pl-2 pr-3"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/admin/forms/${form.slug}/edit`}
                                                        >
                                                            <Pencil className="size-4" />
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        className="pl-2 pr-3"
                                                        type="button"
                                                        onClick={() =>
                                                            setFormToDelete(
                                                                form,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-4" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
