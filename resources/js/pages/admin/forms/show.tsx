import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Pencil } from 'lucide-react';
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
    form: AdminForm;
};

export default function AdminFormShow({ form }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Forms', href: '/admin/forms' },
        { title: form.title, href: `/admin/forms/${form.slug}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${form.title} Form`}>
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="bg-[#f3f5f7]">
                <div className="mx-auto w-full max-w-6xl px-6 py-8">
                    <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h1 className="text-2xl font-semibold text-slate-900">
                                {form.title}
                            </h1>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" asChild>
                                    <Link href="/admin/forms">
                                        <ArrowLeft className="size-4" />
                                        Back to forms
                                    </Link>
                                </Button>
                                <Button asChild>
                                    <Link
                                        href={`/admin/forms/${form.slug}/edit`}
                                    >
                                        <Pencil className="size-4" />
                                        Edit form
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <dl className="mt-8 grid gap-4 md:grid-cols-2">
                            <div className="rounded-lg border border-slate-200 p-4">
                                <dt className="text-xs text-slate-500">Slug</dt>
                                <dd className="mt-1 text-sm text-slate-900">
                                    {form.slug}
                                </dd>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-4">
                                <dt className="text-xs text-slate-500">URL</dt>
                                <dd className="mt-1 text-sm text-slate-900">
                                    {form.url}
                                </dd>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-4">
                                <dt className="text-xs text-slate-500">
                                    Status
                                </dt>
                                <dd className="mt-1 text-sm text-slate-900">
                                    {form.isActive ? 'Active' : 'Inactive'}
                                </dd>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-4">
                                <dt className="text-xs text-slate-500">
                                    Entries
                                </dt>
                                <dd className="mt-1 text-sm text-slate-900">
                                    {form.entryCount}
                                </dd>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-4 md:col-span-2">
                                <dt className="text-xs text-slate-500">
                                    Description
                                </dt>
                                <dd className="mt-1 text-sm text-slate-900">
                                    {form.description || 'No description'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
