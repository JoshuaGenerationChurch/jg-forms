import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    FileText,
    Mail,
    Pencil,
    Phone,
    User,
} from 'lucide-react';
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
    eventName: string | null;
    requestTypes: string[];
    payload: Record<string, unknown> | null;
};

type Props = {
    form: AdminForm;
    entry: AdminEntry;
};

function parseYesNoValue(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value !== 'string') {
        return null;
    }

    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === 'yes' || normalizedValue === 'true' || normalizedValue === '1') {
        return true;
    }

    if (normalizedValue === 'no' || normalizedValue === 'false' || normalizedValue === '0') {
        return false;
    }

    return null;
}

function requesterIsEventOrganiser(payload: Record<string, unknown> | null): boolean {
    if (!payload) {
        return false;
    }

    const parsedValue = parseYesNoValue(payload.isUserOrganiser);

    return parsedValue === true;
}

function requestTypeBadgeClass(type: string): string {
    const normalizedType = type.trim().toLowerCase();

    if (normalizedType === 'event logistics') {
        return 'border-green-200 bg-green-200 text-green-900';
    }

    if (normalizedType === 'registration form') {
        return 'border-sky-200 bg-sky-200 text-sky-900';
    }

    if (normalizedType === 'digital media') {
        return 'border-orange-200 bg-orange-200 text-orange-900';
    }

    if (normalizedType === 'print media') {
        return 'border-cyan-200 bg-cyan-200 text-cyan-900';
    }

    if (normalizedType === 'signage') {
        return 'border-violet-200 bg-violet-200 text-violet-900';
    }

    return 'border-slate-100 bg-slate-100 text-slate-700';
}

export default function AdminFormEntryShow({ form, entry }: Props) {
    const fullName =
        [entry.firstName, entry.lastName].filter(Boolean).join(' ') || 'N/A';
    const isRequesterEventOrganiser = requesterIsEventOrganiser(entry.payload);

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
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                                    <User className="size-4 text-blue-600" />
                                    <h2 className="text-xs font-semibold tracking-[0.12em] text-slate-700 uppercase">
                                        {isRequesterEventOrganiser
                                            ? 'Requester is the Event Organiser'
                                            : 'Requester Details'}
                                    </h2>
                                </div>
                                <div className="space-y-4 p-4">
                                    <div className="space-y-1 px-1">
                                        <p className="text-2xl font-semibold leading-7 text-slate-900">
                                            {fullName}
                                        </p>
                                        <p className="text-sm font-medium text-blue-700">
                                            {entry.congregation || 'N/A'}
                                        </p>
                                    </div>

                                    <dl className="space-y-3 text-sm">
                                        <div className="flex items-center gap-2 text-slate-800">
                                            <Mail className="size-4 text-slate-500" />
                                            <dd>{entry.email || 'N/A'}</dd>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-800">
                                            <Phone className="size-4 text-slate-500" />
                                            <dd>{entry.cellphone || 'N/A'}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                                    <FileText className="size-4 text-blue-600" />
                                    <h2 className="text-xs font-semibold tracking-[0.12em] text-slate-700 uppercase">
                                        Request Summary
                                    </h2>
                                </div>
                                <dl className="space-y-3 p-4 text-sm">
                                    <div className="grid gap-1 px-4 py-3 md:grid-cols-[150px_1fr] md:items-start md:gap-3">
                                        <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                            Request types
                                        </dt>
                                        <dd>
                                            {entry.requestTypes.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {entry.requestTypes.map(
                                                        (type) => (
                                                            <span
                                                                key={type}
                                                                className={`rounded-full border px-2 py-1 text-xs ${requestTypeBadgeClass(type)}`}
                                                            >
                                                                {type}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-900">
                                                    N/A
                                                </span>
                                            )}
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
