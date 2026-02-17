import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    ChevronDown,
    Eye,
    Pencil,
    Trash2,
    X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
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
    requestTypes: string[];
};

type Props = {
    form: AdminForm;
    entries: AdminEntry[];
};

const REQUEST_TYPE_FILTER_OPTIONS = [
    { label: 'All Request Types', value: 'all' },
    { label: 'Event Logistics', value: 'Event logistics' },
    { label: 'Registration Form', value: 'Registration form' },
    { label: 'Digital Media', value: 'Digital media' },
    { label: 'Print Media', value: 'Print media' },
    { label: 'Signage', value: 'Signage' },
];

function formatEntryDate(dateValue: string | null): string {
    if (!dateValue) {
        return 'Unknown date';
    }

    const parsedDate = new Date(dateValue);
    const datePart = parsedDate.toLocaleDateString();
    const timePart = parsedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    return `${datePart} at ${timePart}`;
}

export default function AdminFormEntries({ form, entries }: Props) {
    const [entryToDelete, setEntryToDelete] = useState<AdminEntry | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [firstNameFilter, setFirstNameFilter] = useState('');
    const [lastNameFilter, setLastNameFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [requestTypeFilter, setRequestTypeFilter] = useState('all');
    const [entryDateSort, setEntryDateSort] = useState<'newest' | 'oldest'>(
        'newest',
    );
    const dateFromInputRef = useRef<HTMLInputElement | null>(null);
    const dateToInputRef = useRef<HTMLInputElement | null>(null);

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

    const openDatePicker = (input: HTMLInputElement | null) => {
        if (!input) {
            return;
        }

        if (typeof input.showPicker === 'function') {
            input.showPicker();
            return;
        }

        input.focus();
    };

    const filteredEntries = useMemo(() => {
        const normalizedFirstNameFilter = firstNameFilter.trim().toLowerCase();
        const normalizedLastNameFilter = lastNameFilter.trim().toLowerCase();
        const normalizedRequestTypeFilter = requestTypeFilter.toLowerCase();

        const matchingEntries = entries.filter((entry) => {
            const normalizedFirstName = (entry.firstName ?? '').toLowerCase();
            const normalizedLastName = (entry.lastName ?? '').toLowerCase();
            const createdAtDate = entry.createdAt?.slice(0, 10) ?? '';
            const normalizedEntryRequestTypes = entry.requestTypes.map((type) =>
                type.toLowerCase(),
            );

            const matchesFirstName =
                normalizedFirstNameFilter === '' ||
                normalizedFirstName.includes(normalizedFirstNameFilter);
            const matchesLastName =
                normalizedLastNameFilter === '' ||
                normalizedLastName.includes(normalizedLastNameFilter);
            const matchesDateFrom =
                dateFrom === '' ||
                (createdAtDate !== '' && createdAtDate >= dateFrom);
            const matchesDateTo =
                dateTo === '' || (createdAtDate !== '' && createdAtDate <= dateTo);
            const matchesRequestTypes =
                requestTypeFilter === 'all' ||
                normalizedEntryRequestTypes.includes(normalizedRequestTypeFilter);

            return (
                matchesFirstName &&
                matchesLastName &&
                matchesDateFrom &&
                matchesDateTo &&
                matchesRequestTypes
            );
        });

        matchingEntries.sort((entryA, entryB) => {
            const timestampA = entryA.createdAt
                ? Date.parse(entryA.createdAt)
                : Number.NaN;
            const timestampB = entryB.createdAt
                ? Date.parse(entryB.createdAt)
                : Number.NaN;
            const hasTimestampA = Number.isFinite(timestampA);
            const hasTimestampB = Number.isFinite(timestampB);

            if (!hasTimestampA && !hasTimestampB) {
                return 0;
            }

            if (!hasTimestampA) {
                return 1;
            }

            if (!hasTimestampB) {
                return -1;
            }

            return entryDateSort === 'newest'
                ? timestampB - timestampA
                : timestampA - timestampB;
        });

        return matchingEntries;
    }, [
        dateFrom,
        dateTo,
        entries,
        entryDateSort,
        firstNameFilter,
        lastNameFilter,
        requestTypeFilter,
    ]);

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
                                <h1 className="text-2xl font-semibold text-slate-900">
                                    {form.title} Entries
                                </h1>
                            </div>
                            <Button variant="outline" asChild>
                                <Link href="/admin/forms/entries">
                                    <ArrowLeft className="size-4" />
                                    Back to forms entries
                                </Link>
                            </Button>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                            <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-600">
                                    Request Type
                                </span>
                                <div className="relative">
                                    <select
                                        className="h-10 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 pr-16 text-sm text-slate-900"
                                        value={requestTypeFilter}
                                        onChange={(event) =>
                                            setRequestTypeFilter(
                                                event.target.value,
                                            )
                                        }
                                    >
                                        {REQUEST_TYPE_FILTER_OPTIONS.map(
                                            (option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    {requestTypeFilter !== 'all' ? (
                                        <button
                                            type="button"
                                            aria-label="Clear Request Type"
                                            className="absolute top-1/2 right-8 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-700"
                                            onClick={() =>
                                                setRequestTypeFilter('all')
                                            }
                                        >
                                            <X className="size-4" />
                                        </button>
                                    ) : null}
                                    <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-slate-500" />
                                </div>
                            </label>

                            <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-600">
                                    First Name
                                </span>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-900"
                                        placeholder="First name"
                                        value={firstNameFilter}
                                        onChange={(event) =>
                                            setFirstNameFilter(event.target.value)
                                        }
                                    />
                                    {firstNameFilter !== '' ? (
                                        <button
                                            type="button"
                                            aria-label="Clear First Name"
                                            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-700"
                                            onClick={() => setFirstNameFilter('')}
                                        >
                                            <X className="size-4" />
                                        </button>
                                    ) : null}
                                </div>
                            </label>

                            <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-600">
                                    Last Name
                                </span>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-900"
                                        placeholder="Last name"
                                        value={lastNameFilter}
                                        onChange={(event) =>
                                            setLastNameFilter(event.target.value)
                                        }
                                    />
                                    {lastNameFilter !== '' ? (
                                        <button
                                            type="button"
                                            aria-label="Clear Last Name"
                                            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-700"
                                            onClick={() => setLastNameFilter('')}
                                        >
                                            <X className="size-4" />
                                        </button>
                                    ) : null}
                                </div>
                            </label>

                            <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-600">
                                    Date From
                                </span>
                                <div className="relative">
                                    <input
                                        ref={dateFromInputRef}
                                        type="date"
                                        className="h-10 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 pr-16 text-sm text-slate-900 [color-scheme:light] outline-none focus-visible:border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-400 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0"
                                        value={dateFrom}
                                        onChange={(event) =>
                                            setDateFrom(event.target.value)
                                        }
                                    />
                                    {dateFrom !== '' ? (
                                        <button
                                            type="button"
                                            aria-label="Clear Date From"
                                            className="absolute top-1/2 right-8 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-700"
                                            onClick={() => setDateFrom('')}
                                        >
                                            <X className="size-4" />
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        aria-label="Open Date From picker"
                                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-500 transition hover:text-slate-700"
                                        onClick={() =>
                                            openDatePicker(dateFromInputRef.current)
                                        }
                                    >
                                        <CalendarDays className="size-4" />
                                    </button>
                                </div>
                            </label>

                            <label className="space-y-1">
                                <span className="text-xs font-medium text-slate-600">
                                    Date To
                                </span>
                                <div className="relative">
                                    <input
                                        ref={dateToInputRef}
                                        type="date"
                                        className="h-10 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 pr-16 text-sm text-slate-900 [color-scheme:light] outline-none focus-visible:border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-400 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0"
                                        value={dateTo}
                                        onChange={(event) =>
                                            setDateTo(event.target.value)
                                        }
                                    />
                                    {dateTo !== '' ? (
                                        <button
                                            type="button"
                                            aria-label="Clear Date To"
                                            className="absolute top-1/2 right-8 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-700"
                                            onClick={() => setDateTo('')}
                                        >
                                            <X className="size-4" />
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        aria-label="Open Date To picker"
                                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-500 transition hover:text-slate-700"
                                        onClick={() =>
                                            openDatePicker(dateToInputRef.current)
                                        }
                                    >
                                        <CalendarDays className="size-4" />
                                    </button>
                                </div>
                            </label>
                        </div>

                        <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            First Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Last Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 uppercase"
                                                onClick={() =>
                                                    setEntryDateSort((value) =>
                                                        value === 'newest'
                                                            ? 'oldest'
                                                            : 'newest',
                                                    )
                                                }
                                            >
                                                Entry Date
                                                <span
                                                    aria-hidden
                                                    className="text-slate-500"
                                                >
                                                    {entryDateSort === 'newest'
                                                        ? '↓'
                                                        : '↑'}
                                                </span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Request Types
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {filteredEntries.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-10 text-center text-sm text-slate-500"
                                            >
                                                {entries.length === 0
                                                    ? 'No entries submitted yet for this form.'
                                                    : 'No entries match the selected filters.'}
                                            </td>
                                        </tr>
                                    ) : null}

                                    {filteredEntries.map((entry) => (
                                        <tr key={entry.id}>
                                            <td className="px-4 py-4 align-top text-sm text-slate-900">
                                                {entry.firstName?.trim() || 'N/A'}
                                            </td>
                                            <td className="px-4 py-4 align-top text-sm text-slate-900">
                                                {entry.lastName?.trim() || 'N/A'}
                                            </td>
                                            <td className="px-4 py-4 align-top text-sm text-slate-700">
                                                {formatEntryDate(entry.createdAt)}
                                            </td>
                                            <td className="px-4 py-4 align-top">
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
                                            </td>
                                            <td className="px-4 py-4 align-top">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button variant="outline" asChild>
                                                        <Link
                                                            href={`/admin/forms/entries/${form.slug}/${entry.id}`}
                                                        >
                                                            <Eye className="size-4" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" asChild>
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
                                                            setEntryToDelete(entry)
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
