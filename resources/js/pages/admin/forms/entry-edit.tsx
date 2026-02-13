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
};

type AdminEntry = {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    cellphone: string | null;
    congregation: string | null;
    requestSummary: string | null;
    eventName: string | null;
    payloadJson: string;
};

type Props = {
    form: AdminForm;
    entry: AdminEntry;
};

type EntryFormData = {
    firstName: string;
    lastName: string;
    email: string;
    cellphone: string;
    congregation: string;
    requestSummary: string;
    eventName: string;
    payloadJson: string;
};

export default function AdminFormEntryEdit({ form, entry }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Forms Entries', href: '/admin/forms/entries' },
        { title: form.title, href: `/admin/forms/entries/${form.slug}` },
        {
            title: `Entry #${entry.id}`,
            href: `/admin/forms/entries/${form.slug}/${entry.id}`,
        },
        {
            title: 'Edit',
            href: `/admin/forms/entries/${form.slug}/${entry.id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm<EntryFormData>({
        firstName: entry.firstName ?? '',
        lastName: entry.lastName ?? '',
        email: entry.email ?? '',
        cellphone: entry.cellphone ?? '',
        congregation: entry.congregation ?? '',
        requestSummary: entry.requestSummary ?? '',
        eventName: entry.eventName ?? '',
        payloadJson: entry.payloadJson,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        put(`/admin/forms/entries/${form.slug}/${entry.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${form.title} Entry #${entry.id}`}>
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="bg-[#f3f5f7]">
                <div className="mx-auto w-full max-w-6xl px-6 py-8">
                    <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Edit Entry #{entry.id}
                            </h1>
                            <Button variant="outline" asChild>
                                <Link
                                    href={`/admin/forms/entries/${form.slug}/${entry.id}`}
                                >
                                    <ArrowLeft className="size-4" />
                                    Back to entry
                                </Link>
                            </Button>
                        </div>

                        <form onSubmit={submit} className="mt-8 space-y-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="entry-first-name">
                                        First name
                                    </Label>
                                    <Input
                                        id="entry-first-name"
                                        value={data.firstName}
                                        onChange={(event) =>
                                            setData(
                                                'firstName',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {errors.firstName ? (
                                        <p className="text-xs text-red-600">
                                            {errors.firstName}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="entry-last-name">
                                        Last name
                                    </Label>
                                    <Input
                                        id="entry-last-name"
                                        value={data.lastName}
                                        onChange={(event) =>
                                            setData('lastName', event.target.value)
                                        }
                                    />
                                    {errors.lastName ? (
                                        <p className="text-xs text-red-600">
                                            {errors.lastName}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="entry-email">Email</Label>
                                    <Input
                                        id="entry-email"
                                        type="email"
                                        value={data.email}
                                        onChange={(event) =>
                                            setData('email', event.target.value)
                                        }
                                    />
                                    {errors.email ? (
                                        <p className="text-xs text-red-600">
                                            {errors.email}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="entry-cellphone">
                                        Cellphone
                                    </Label>
                                    <Input
                                        id="entry-cellphone"
                                        value={data.cellphone}
                                        onChange={(event) =>
                                            setData(
                                                'cellphone',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {errors.cellphone ? (
                                        <p className="text-xs text-red-600">
                                            {errors.cellphone}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="entry-congregation">
                                        Congregation
                                    </Label>
                                    <Input
                                        id="entry-congregation"
                                        value={data.congregation}
                                        onChange={(event) =>
                                            setData(
                                                'congregation',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {errors.congregation ? (
                                        <p className="text-xs text-red-600">
                                            {errors.congregation}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="entry-event-name">
                                        Event name
                                    </Label>
                                    <Input
                                        id="entry-event-name"
                                        value={data.eventName}
                                        onChange={(event) =>
                                            setData(
                                                'eventName',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {errors.eventName ? (
                                        <p className="text-xs text-red-600">
                                            {errors.eventName}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="entry-request-summary">
                                    Request summary
                                </Label>
                                <textarea
                                    id="entry-request-summary"
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    rows={3}
                                    value={data.requestSummary}
                                    onChange={(event) =>
                                        setData(
                                            'requestSummary',
                                            event.target.value,
                                        )
                                    }
                                />
                                {errors.requestSummary ? (
                                    <p className="text-xs text-red-600">
                                        {errors.requestSummary}
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="entry-payload-json">
                                    Payload JSON
                                </Label>
                                <textarea
                                    id="entry-payload-json"
                                    className="w-full rounded-md border border-input bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    rows={16}
                                    value={data.payloadJson}
                                    onChange={(event) =>
                                        setData('payloadJson', event.target.value)
                                    }
                                />
                                {errors.payloadJson ? (
                                    <p className="text-xs text-red-600">
                                        {errors.payloadJson}
                                    </p>
                                ) : null}
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing}>
                                    <Save className="size-4" />
                                    {processing ? 'Saving...' : 'Save entry'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
