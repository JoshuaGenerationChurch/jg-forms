import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AdminForm = {
    slug: string;
    title: string;
    description: string;
    url: string;
    isActive: boolean;
};

type Props = {
    form: AdminForm;
};

type FormData = {
    title: string;
    description: string;
    url: string;
    isActive: boolean;
};

export default function AdminFormEdit({ form }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Forms', href: '/admin/forms' },
        { title: form.title, href: `/admin/forms/${form.slug}` },
        { title: 'Edit', href: `/admin/forms/${form.slug}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<FormData>({
        title: form.title,
        description: form.description,
        url: form.url,
        isActive: form.isActive,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(`/admin/forms/${form.slug}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${form.title}`}>
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="bg-[#f3f5f7]">
                <div className="mx-auto w-full max-w-6xl px-6 py-8">
                    <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Edit Form
                            </h1>
                            <Button variant="outline" asChild>
                                <Link href={`/admin/forms/${form.slug}`}>
                                    <ArrowLeft className="size-4" />
                                    Back to form
                                </Link>
                            </Button>
                        </div>

                        <form onSubmit={submit} className="mt-8 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="form-slug">Slug</Label>
                                <Input
                                    id="form-slug"
                                    value={form.slug}
                                    disabled
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="form-title">Title</Label>
                                <Input
                                    id="form-title"
                                    value={data.title}
                                    onChange={(event) =>
                                        setData('title', event.target.value)
                                    }
                                />
                                {errors.title ? (
                                    <p className="text-xs text-red-600">
                                        {errors.title}
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="form-description">
                                    Description
                                </Label>
                                <textarea
                                    id="form-description"
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    rows={4}
                                    value={data.description}
                                    onChange={(event) =>
                                        setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                />
                                {errors.description ? (
                                    <p className="text-xs text-red-600">
                                        {errors.description}
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="form-url">URL</Label>
                                <Input
                                    id="form-url"
                                    value={data.url}
                                    onChange={(event) =>
                                        setData('url', event.target.value)
                                    }
                                />
                                {errors.url ? (
                                    <p className="text-xs text-red-600">
                                        {errors.url}
                                    </p>
                                ) : null}
                            </div>

                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={data.isActive}
                                    onChange={(event) =>
                                        setData(
                                            'isActive',
                                            event.target.checked,
                                        )
                                    }
                                />
                                Active (show in public forms list)
                            </label>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing}>
                                    <Save className="size-4" />
                                    {processing ? 'Saving...' : 'Save changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
