import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Bold,
    Check,
    ChevronDown,
    ChevronRight,
    Copy,
    Italic,
    Link2,
    List,
    ListOrdered,
    Pencil,
    Plus,
    Save,
    Send,
    Trash2,
    Underline,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import DeleteConfirmDialog from '@/components/forms/delete-confirm-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Recipient = {
    email: string;
    name: string | null;
};

type EmailTemplate = {
    id: number;
    triggerEvent: string;
    name: string;
    subject: string;
    heading: string | null;
    body: string;
    toRecipients: Recipient[];
    ccRecipients: Recipient[];
    bccRecipients: Recipient[];
    useDefaultRecipients: boolean;
    isActive: boolean;
    position: number;
};

type Placeholder = {
    key: string;
    sample: string;
};

type PlaceholderGroup = {
    id: string;
    title: string;
    description: string;
    placeholders: Placeholder[];
};

type AdminForm = {
    slug: string;
    title: string;
    description: string;
    url: string;
};

type Props = {
    form: AdminForm;
    templates: EmailTemplate[];
    defaultRecipients: Recipient[];
    placeholders: Placeholder[];
};

type TemplateFormData = {
    triggerEvent: string;
    name: string;
    subject: string;
    heading: string;
    body: string;
    toRecipients: string;
    ccRecipients: string;
    bccRecipients: string;
    useDefaultRecipients: boolean;
    isActive: boolean;
    position: number;
};

type EditorCommand = {
    icon: typeof Bold;
    label: string;
    command: string;
    value?: string;
};

const initialTemplateFormData: TemplateFormData = {
    triggerEvent: 'submission_created',
    name: '',
    subject: '[JG Forms] New submission: {{form.title}}',
    heading: '',
    body: '<p><strong>Form:</strong> {{form.title}}</p><p><strong>Entry ID:</strong> {{entry.id}}</p><p><strong>Requester:</strong> {{entry.first_name}} {{entry.last_name}}</p><p><strong>Email:</strong> {{entry.email}}</p><p><strong>View:</strong> {{form.url}}</p>',
    toRecipients: '',
    ccRecipients: '',
    bccRecipients: '',
    useDefaultRecipients: false,
    isActive: true,
    position: 0,
};

const editorCommands: EditorCommand[] = [
    { icon: Bold, label: 'Bold', command: 'bold' },
    { icon: Italic, label: 'Italic', command: 'italic' },
    { icon: Underline, label: 'Underline', command: 'underline' },
    { icon: List, label: 'Bulleted list', command: 'insertUnorderedList' },
    { icon: ListOrdered, label: 'Numbered list', command: 'insertOrderedList' },
];

const placeholderGroupMeta: Record<
    string,
    { title: string; description: string }
> = {
    contact: {
        title: 'Contact Step',
        description: 'Requester details and core profile fields.',
    },
    event: {
        title: 'Event Details',
        description: 'Event info, dates, venue and organiser details.',
    },
    registration: {
        title: 'Registration Form',
        description: 'Tickets, pricing, fields to collect and donations.',
    },
    graphicsDigital: {
        title: 'Graphics (Digital)',
        description: 'Digital graphics requests and bank/format fields.',
    },
    graphicsPrint: {
        title: 'Graphics (Print)',
        description: 'Print scope, sizes, quantities and outputs.',
    },
    signage: {
        title: 'Signage',
        description: 'Signage scope and quantity fields.',
    },
    system: {
        title: 'System / Meta',
        description: 'Form and entry metadata fields.',
    },
    other: {
        title: 'Other',
        description: 'Additional payload fields that do not match a step.',
    },
};

const placeholderGroupOrder = [
    'contact',
    'event',
    'registration',
    'graphicsDigital',
    'graphicsPrint',
    'signage',
    'system',
    'other',
];

function recipientsToString(recipients: Recipient[]): string {
    return recipients
        .map((recipient) => {
            if (recipient.name && recipient.name.trim() !== '') {
                return `"${recipient.name.trim()}" <${recipient.email}>`;
            }

            return recipient.email;
        })
        .join('; ');
}

function parseRecipientsInput(rawRecipients: string): Recipient[] {
    const chunks = rawRecipients
        .split(';')
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk !== '');

    const recipientsByEmail = new Map<string, Recipient>();

    for (const chunk of chunks) {
        const match = /^\s*"?(?<name>[^"<]+?)"?\s*<(?<email>[^>]+)>\s*$/.exec(
            chunk,
        );

        const emailCandidate = (match?.groups?.email ?? chunk)
            .trim()
            .toLowerCase();
        if (emailCandidate === '' || !emailCandidate.includes('@')) {
            continue;
        }

        const nameCandidate = (match?.groups?.name ?? '').trim();

        recipientsByEmail.set(emailCandidate, {
            email: emailCandidate,
            name: nameCandidate !== '' ? nameCandidate : null,
        });
    }

    return Array.from(recipientsByEmail.values());
}

function placeholderToken(key: string): string {
    return `{{${key}}}`;
}

function normalizePlaceholderInput(value: string): string {
    const trimmed = value.trim();
    if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
        return trimmed.slice(2, -2).trim();
    }

    return trimmed;
}

function fallbackCopyToClipboard(value: string): boolean {
    if (typeof document === 'undefined') {
        return false;
    }

    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.append(textArea);
    textArea.select();

    let copied = false;
    try {
        copied = document.execCommand('copy');
    } catch {
        copied = false;
    }

    textArea.remove();
    return copied;
}

function startsWithAny(value: string, prefixes: string[]): boolean {
    return prefixes.some((prefix) => value.startsWith(prefix));
}

function classifyPlaceholderGroup(key: string): string {
    if (key.startsWith('form.') || key.startsWith('entry.')) {
        return 'system';
    }

    const payloadKey = key.startsWith('payload.') ? key.slice(8) : key;

    if (
        [
            'firstName',
            'lastName',
            'cellphone',
            'email',
            'roleInChurch',
            'otherRole',
            'congregation',
            'termsAccepted',
            'allFields.contact',
        ].includes(payloadKey)
    ) {
        return 'contact';
    }

    if (
        [
            'includesDatesVenue',
            'theme',
            'eventName',
            'isUserOrganiser',
            'organiserFirstName',
            'organiserLastName',
            'organiserEmail',
            'organiserCell',
            'eventDuration',
            'eventStartDate',
            'eventEndDate',
            'announcementDate',
            'venueType',
            'jgVenue',
            'otherVenueName',
            'otherVenueAddress',
            'eventReach',
            'outreachCampStartDate',
            'outreachCampStartTime',
            'outreachCampEndDate',
            'outreachCampEndTime',
            'childMinding',
            'childMindingDescription',
            'allFields.event',
        ].includes(payloadKey) ||
        startsWithAny(payloadKey, [
            'eventDates.',
            'hubs.',
            'eventCongregations.',
        ])
    ) {
        return 'event';
    }

    if (
        payloadKey === 'includesRegistration' ||
        payloadKey === 'allFields.registration' ||
        startsWithAny(payloadKey, [
            'quicket',
            'ticket',
            'otherTickets.',
            'infoToCollect.',
            'otherInfoFields.',
            'allowDonations',
            'registrationClosingDate',
        ])
    ) {
        return 'registration';
    }

    if (
        [
            'includesGraphics',
            'includesGraphicsDigital',
            'graphicsWhatsApp',
            'graphicsInstagram',
            'graphicsAVSlide',
            'graphicsOther',
            'digitalGraphicType',
            'digitalBankName',
            'digitalBranchCode',
            'digitalAccountNumber',
            'digitalReference',
            'digitalOtherGraphicDescription',
            'digitalFormatWhatsapp',
            'digitalFormatAVSlide',
            'digitalFormatOther',
            'digitalOtherFormatDescription',
            'allFields.graphicsDigital',
        ].includes(payloadKey)
    ) {
        return 'graphicsDigital';
    }

    if (
        payloadKey === 'includesGraphicsPrint' ||
        payloadKey === 'allFields.graphicsPrint' ||
        startsWithAny(payloadKey, ['print'])
    ) {
        return 'graphicsPrint';
    }

    if (
        payloadKey === 'includesSignage' ||
        payloadKey === 'allFields.signage' ||
        startsWithAny(payloadKey, [
            'signage',
            'sharkfin',
            'temporaryFence',
            'toilets',
            'moms',
            'toddlers',
            'firstAid',
            'internal',
            'external',
            'sandwichBoards',
            'permanentExternal',
            'otherSignage',
        ])
    ) {
        return 'signage';
    }

    if (key.startsWith('payload.')) {
        return 'other';
    }

    return 'system';
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function toEditorHtml(value: string): string {
    const trimmed = value.trim();

    if (trimmed === '') {
        return '<p><br></p>';
    }

    if (/<[^>]+>/.test(trimmed)) {
        return value;
    }

    return value
        .split('\n')
        .map(
            (line) =>
                `<p>${line.trim() === '' ? '<br>' : escapeHtml(line)}</p>`,
        )
        .join('');
}

export default function AdminFormEmailTemplates({
    form,
    templates,
    defaultRecipients,
    placeholders,
}: Props) {
    const isWorkRequestForm = form.slug === 'work-request';
    const [editingTemplateId, setEditingTemplateId] = useState<number | null>(
        null,
    );
    const [templateToDelete, setTemplateToDelete] =
        useState<EmailTemplate | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [selectedPlaceholderKey, setSelectedPlaceholderKey] = useState(
        placeholders[0]?.key ?? '',
    );
    const [toolbarPlaceholderInput, setToolbarPlaceholderInput] = useState(
        placeholders[0]?.key ?? '',
    );
    const [editorResetCounter, setEditorResetCounter] = useState(0);
    const [openPlaceholderGroupId, setOpenPlaceholderGroupId] = useState<
        string | null | undefined
    >(undefined);
    const [selectedPlaceholderByGroup, setSelectedPlaceholderByGroup] =
        useState<Record<string, string>>({});

    const editorRef = useRef<HTMLDivElement | null>(null);
    const editorSeedBodyRef = useRef(initialTemplateFormData.body);

    const { data, setData, processing, errors, reset, post, put } =
        useForm<TemplateFormData>(initialTemplateFormData);

    const editingTemplate = useMemo(
        () => templates.find((template) => template.id === editingTemplateId),
        [editingTemplateId, templates],
    );

    const currentToRecipients = useMemo(
        () => parseRecipientsInput(data.toRecipients),
        [data.toRecipients],
    );

    const selectedDefaultRecipientEmails = useMemo(
        () => new Set(currentToRecipients.map((recipient) => recipient.email)),
        [currentToRecipients],
    );

    const activePlaceholderKey = useMemo(() => {
        const normalizedInput = normalizePlaceholderInput(toolbarPlaceholderInput)
            .toLowerCase();

        if (normalizedInput !== '') {
            const exactMatch = placeholders.find(
                (placeholder) => placeholder.key.toLowerCase() === normalizedInput,
            );
            if (exactMatch) {
                return exactMatch.key;
            }

            const containsMatch = placeholders.find((placeholder) =>
                placeholder.key.toLowerCase().includes(normalizedInput),
            );
            if (containsMatch) {
                return containsMatch.key;
            }

            return '';
        }

        return selectedPlaceholderKey || placeholders[0]?.key || '';
    }, [placeholders, selectedPlaceholderKey, toolbarPlaceholderInput]);
    const toolbarHasInput = normalizePlaceholderInput(toolbarPlaceholderInput) !== '';
    const toolbarHasNoMatch = toolbarHasInput && activePlaceholderKey === '';

    const placeholderGroups = useMemo<PlaceholderGroup[]>(() => {
        const grouped = new Map<string, Placeholder[]>();

        for (const placeholder of placeholders) {
            const groupId = classifyPlaceholderGroup(placeholder.key);
            const groupPlaceholders = grouped.get(groupId) ?? [];
            groupPlaceholders.push(placeholder);
            grouped.set(groupId, groupPlaceholders);
        }

        return placeholderGroupOrder
            .map((groupId) => {
                const groupPlaceholders = (grouped.get(groupId) ?? []).sort(
                    (a, b) => a.key.localeCompare(b.key),
                );
                if (groupPlaceholders.length === 0) {
                    return null;
                }

                const meta = placeholderGroupMeta[groupId];

                return {
                    id: groupId,
                    title: meta.title,
                    description: meta.description,
                    placeholders: groupPlaceholders,
                };
            })
            .filter((group): group is PlaceholderGroup => group !== null);
    }, [placeholders]);

    const effectiveOpenPlaceholderGroupId =
        openPlaceholderGroupId === undefined
            ? (placeholderGroups[0]?.id ?? null)
            : openPlaceholderGroupId;

    useEffect(() => {
        if (!editorRef.current) {
            return;
        }

        editorRef.current.innerHTML = toEditorHtml(editorSeedBodyRef.current);
    }, [editorResetCounter]);

    useEffect(() => {
        if (!isWorkRequestForm) {
            return;
        }

        if (data.subject !== '{{entry.auto_subject}}') {
            setData('subject', '{{entry.auto_subject}}');
        }
    }, [data.subject, isWorkRequestForm, setData]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Email Templates', href: '/admin/forms/email-templates' },
        {
            title: form.title,
            href: `/admin/forms/email-templates/${form.slug}`,
        },
    ];

    const setEditingTemplate = (template: EmailTemplate | null) => {
        if (!template) {
            setEditingTemplateId(null);
            reset();
            editorSeedBodyRef.current = initialTemplateFormData.body;
            setEditorResetCounter((value) => value + 1);
            return;
        }

        setEditingTemplateId(template.id);
        setData({
            triggerEvent: template.triggerEvent,
            name: template.name,
            subject: isWorkRequestForm
                ? '{{entry.auto_subject}}'
                : template.subject,
            heading: '',
            body: template.body,
            toRecipients: recipientsToString(template.toRecipients),
            ccRecipients: recipientsToString(template.ccRecipients),
            bccRecipients: recipientsToString(template.bccRecipients),
            useDefaultRecipients: false,
            isActive: template.isActive,
            position: template.position,
        });
        editorSeedBodyRef.current = template.body;
        setEditorResetCounter((value) => value + 1);
    };

    const updateBodyFromEditor = () => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }

        setData('body', editor.innerHTML);
    };

    const executeEditorCommand = (command: string, value?: string) => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }

        editor.focus();
        document.execCommand(command, false, value);
        updateBodyFromEditor();
    };

    const insertPlaceholderTokenInEditor = (placeholderKey?: string) => {
        const key = placeholderKey ?? activePlaceholderKey;
        if (key === '') {
            return;
        }

        setSelectedPlaceholderKey(key);
        setToolbarPlaceholderInput(key);
        executeEditorCommand('insertText', placeholderToken(key));
    };

    const handlePlaceholderGroupSelection = (
        groupId: string,
        placeholderKey: string,
    ) => {
        setSelectedPlaceholderByGroup((current) => ({
            ...current,
            [groupId]: placeholderKey,
        }));
        setSelectedPlaceholderKey(placeholderKey);
        setToolbarPlaceholderInput(placeholderKey);
    };

    const addLink = () => {
        const url = window.prompt('Enter link URL (https://...)');

        if (!url) {
            return;
        }

        executeEditorCommand('createLink', url);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const endpoint = `/admin/forms/email-templates/${form.slug}${
            editingTemplateId ? `/${editingTemplateId}` : ''
        }`;

        if (editingTemplateId) {
            put(endpoint, {
                onSuccess: () => {
                    setEditingTemplate(null);
                },
            });
            return;
        }

        post(endpoint, {
            onSuccess: () => {
                setEditingTemplate(null);
            },
        });
    };

    const deleteTemplate = () => {
        if (!templateToDelete) {
            return;
        }

        setIsDeleting(true);

        router.delete(
            `/admin/forms/email-templates/${form.slug}/${templateToDelete.id}`,
            {
                onSuccess: () => {
                    setTemplateToDelete(null);
                    if (editingTemplateId === templateToDelete.id) {
                        setEditingTemplate(null);
                    }
                },
                onFinish: () => {
                    setIsDeleting(false);
                },
            },
        );
    };

    const copyTokenToClipboard = async (key: string) => {
        const token = placeholderToken(key);
        let copied = false;

        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(token);
                copied = true;
            } else {
                copied = fallbackCopyToClipboard(token);
            }
        } catch {
            copied = fallbackCopyToClipboard(token);
        }

        if (copied) {
            setCopiedToken(key);
            window.setTimeout(() => {
                setCopiedToken((current) => (current === key ? null : current));
            }, 2200);
        }
    };

    const toggleDefaultRecipient = (
        recipient: Recipient,
        checked: boolean | 'indeterminate',
    ) => {
        const shouldInclude = checked === true;
        const recipientsByEmail = new Map(
            currentToRecipients.map((item) => [item.email, item]),
        );

        if (shouldInclude) {
            recipientsByEmail.set(recipient.email, recipient);
        } else {
            recipientsByEmail.delete(recipient.email);
        }

        setData(
            'toRecipients',
            recipientsToString(Array.from(recipientsByEmail.values())),
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${form.title} Email Templates`}>
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="w-full bg-[#edf1f5] px-2 pt-0 pb-6 md:px-4 xl:px-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" className="-ml-2" asChild>
                            <Link href="/admin/forms/email-templates">
                                <ArrowLeft className="size-4" />
                                Back
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                {editingTemplate
                                    ? editingTemplate.name
                                    : `${form.title} Email Template`}
                            </h1>
                            <p className="text-xs text-slate-500">
                                Slug: {form.slug}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" disabled>
                            <Send className="size-4" />
                            Send Test Email
                        </Button>
                        <Button
                            type="submit"
                            form="email-template-form"
                            disabled={processing}
                        >
                            <Save className="size-4" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
                    <aside className="space-y-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <h2 className="text-sm font-semibold tracking-wide text-slate-700 uppercase">
                                    Existing Templates
                                </h2>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingTemplate(null)}
                                >
                                    <Plus className="size-4" />
                                    New
                                </Button>
                            </div>

                            {templates.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    No templates created yet.
                                </p>
                            ) : (
                                <nav className="space-y-2">
                                    {templates.map((template) => {
                                        const isSelected =
                                            editingTemplateId === template.id;

                                        return (
                                            <button
                                                key={template.id}
                                                type="button"
                                                className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                }`}
                                                onClick={() =>
                                                    setEditingTemplate(template)
                                                }
                                            >
                                                <p className="text-sm font-medium text-slate-900">
                                                    {template.name}
                                                </p>
                                                {!isWorkRequestForm ? (
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {template.subject}
                                                    </p>
                                                ) : null}
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                            template.isActive
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-slate-200 text-slate-600'
                                                        }`}
                                                    >
                                                        {template.isActive
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </span>
                                                    <Pencil className="size-3.5 text-slate-500" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </nav>
                            )}
                        </div>
                    </aside>

                    <div className="space-y-5">
                        <form
                            id="email-template-form"
                            onSubmit={submit}
                            className="rounded-xl border border-slate-200 bg-white shadow-sm"
                        >
                            <div className="space-y-5 p-5 md:p-6">
                                <label className="block w-full space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <span className="text-sm font-medium text-slate-700">
                                        Email Subject
                                    </span>
                                    {isWorkRequestForm ? (
                                        <p className="text-xs text-blue-700">
                                            Auto-generated for Work Request based
                                            on selected request type(s). Subject
                                            is locked to{' '}
                                            <code>{'{{entry.auto_subject}}'}</code>.
                                        </p>
                                    ) : null}
                                    <Input
                                        className="bg-white"
                                        value={
                                            isWorkRequestForm
                                                ? '{{entry.auto_subject}}'
                                                : data.subject
                                        }
                                        onChange={(event) =>
                                            setData(
                                                'subject',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Message from JG Forms"
                                        disabled={isWorkRequestForm}
                                    />
                                    {errors.subject ? (
                                        <p className="text-xs text-red-600">
                                            {errors.subject}
                                        </p>
                                    ) : null}
                                </label>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <span className="text-sm font-medium text-slate-700">
                                            Template Name
                                        </span>
                                        <Input
                                            className="bg-white"
                                            value={data.name}
                                            onChange={(event) =>
                                                setData(
                                                    'name',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Contact Form Auto-Reply"
                                        />
                                        {errors.name ? (
                                            <p className="text-xs text-red-600">
                                                {errors.name}
                                            </p>
                                        ) : null}
                                    </label>

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">
                                                    Active
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Enable or disable this email
                                                    template.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={data.isActive}
                                                className={`relative h-6 w-11 rounded-full transition ${
                                                    data.isActive
                                                        ? 'bg-blue-600'
                                                        : 'bg-slate-300'
                                                }`}
                                                onClick={() =>
                                                    setData(
                                                        'isActive',
                                                        !data.isActive,
                                                    )
                                                }
                                            >
                                                <span
                                                    className={`absolute top-0.5 size-5 rounded-full bg-white transition ${
                                                        data.isActive
                                                            ? 'left-[22px]'
                                                            : 'left-0.5'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">
                                            Existing Recipients
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Select recipients for this specific
                                            template.
                                        </p>
                                    </div>

                                    {defaultRecipients.length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            No default recipients configured.
                                        </p>
                                    ) : (
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {defaultRecipients.map(
                                                (recipient) => (
                                                    <label
                                                        key={recipient.email}
                                                        className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-2 text-sm"
                                                    >
                                                        <Checkbox
                                                            checked={selectedDefaultRecipientEmails.has(
                                                                recipient.email,
                                                            )}
                                                            onCheckedChange={(
                                                                checked,
                                                            ) =>
                                                                toggleDefaultRecipient(
                                                                    recipient,
                                                                    checked,
                                                                )
                                                            }
                                                        />
                                                        <span className="text-slate-700">
                                                            {recipient.name
                                                                ? `${recipient.name} <${recipient.email}>`
                                                                : recipient.email}
                                                        </span>
                                                    </label>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <label className="space-y-1.5">
                                            <span className="text-sm font-medium text-slate-700">
                                                Cc Recipients
                                            </span>
                                            <Input
                                                className="bg-white"
                                                value={data.ccRecipients}
                                                onChange={(event) =>
                                                    setData(
                                                        'ccRecipients',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="design-leads@jgchurch.org"
                                            />
                                        </label>

                                        <label className="space-y-1.5">
                                            <span className="text-sm font-medium text-slate-700">
                                                Bcc Recipients
                                            </span>
                                            <Input
                                                className="bg-white"
                                                value={data.bccRecipients}
                                                onChange={(event) =>
                                                    setData(
                                                        'bccRecipients',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="audit-log@jgchurch.org"
                                            />
                                        </label>

                                        <p className="text-xs text-slate-500">
                                            Add optional carbon-copy and blind
                                            carbon-copy recipients for this
                                            template.
                                        </p>
                                    </div>

                                    <label className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <span className="text-sm font-medium text-slate-700">
                                            To Recipients (semicolon separated)
                                        </span>
                                        <textarea
                                            rows={5}
                                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                                            value={data.toRecipients}
                                            onChange={(event) =>
                                                setData(
                                                    'toRecipients',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={
                                                'dev-board@jgchurch.org; "Design Board" <design-board@jgchurch.org>'
                                            }
                                        />
                                        <p className="text-xs text-slate-500">
                                            Use semicolons to separate multiple
                                            addresses.
                                        </p>
                                        {errors.toRecipients ? (
                                            <p className="text-xs text-red-600">
                                                {errors.toRecipients}
                                            </p>
                                        ) : null}
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">
                                            Email Body
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            WYSIWYG editor with form-data slug
                                            insertion.
                                        </p>
                                    </div>

                                    <div className="rounded-md border border-slate-200">
                                        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 p-2 whitespace-nowrap">
                                            {editorCommands.map((command) => (
                                                <Button
                                                    key={command.label}
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    title={command.label}
                                                    onMouseDown={(event) => {
                                                        event.preventDefault();
                                                        executeEditorCommand(
                                                            command.command,
                                                            command.value,
                                                        );
                                                    }}
                                                >
                                                    <command.icon className="size-4" />
                                                </Button>
                                            ))}

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                title="Insert link"
                                                onMouseDown={(event) => {
                                                    event.preventDefault();
                                                    addLink();
                                                }}
                                            >
                                                <Link2 className="size-4" />
                                            </Button>

                                            <div className="mx-1 h-6 w-px bg-slate-300" />

                                            <Input
                                                list="form-template-slugs"
                                                className={`h-8 min-w-[14rem] flex-1 font-mono text-xs ${
                                                    toolbarHasNoMatch
                                                        ? 'border-amber-400 focus-visible:border-amber-500 focus-visible:ring-amber-500'
                                                        : ''
                                                }`}
                                                value={toolbarPlaceholderInput}
                                                onChange={(event) =>
                                                    setToolbarPlaceholderInput(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Search slug (e.g. payload.eventName)"
                                            />
                                            <datalist id="form-template-slugs">
                                                {placeholders.map(
                                                    (placeholder) => (
                                                        <option
                                                            key={
                                                                placeholder.key
                                                            }
                                                            value={
                                                                placeholder.key
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </datalist>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="shrink-0"
                                                onMouseDown={(event) => {
                                                    event.preventDefault();
                                                    insertPlaceholderTokenInEditor();
                                                }}
                                                disabled={
                                                    activePlaceholderKey === ''
                                                }
                                            >
                                                Insert slug
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    copyTokenToClipboard(
                                                        activePlaceholderKey,
                                                    )
                                                }
                                                disabled={
                                                    activePlaceholderKey === ''
                                                }
                                                className={`shrink-0 ${
                                                    copiedToken ===
                                                    activePlaceholderKey
                                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                        : ''
                                                }`}
                                            >
                                                {copiedToken ===
                                                activePlaceholderKey ? (
                                                    <Check className="size-4 text-emerald-600" />
                                                ) : (
                                                    <Copy className="size-4" />
                                                )}
                                                {copiedToken ===
                                                activePlaceholderKey
                                                    ? 'Copied'
                                                    : 'Copy slug'}
                                            </Button>
                                        </div>

                                        <div
                                            ref={editorRef}
                                            contentEditable
                                            suppressContentEditableWarning
                                            className="min-h-72 w-full px-3 py-3 text-sm leading-relaxed text-slate-800 outline-none [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_h1]:my-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:my-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
                                            onInput={updateBodyFromEditor}
                                        />
                                    </div>
                                    {errors.body ? (
                                        <p className="text-xs text-red-600">
                                            {errors.body}
                                        </p>
                                    ) : null}
                                </div>

                                {editingTemplate ? (
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() =>
                                                setTemplateToDelete(
                                                    editingTemplate,
                                                )
                                            }
                                        >
                                            <Trash2 className="size-4" />
                                            Delete Template
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setEditingTemplate(null)
                                            }
                                        >
                                            Cancel Edit
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        </form>

                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-sm font-semibold tracking-wide text-slate-700 uppercase">
                                Form Data Slugs
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Expand a step, choose a field slug, then copy or
                                insert it into the email body.
                            </p>

                            <div className="mt-4 space-y-3">
                                {placeholderGroups.map((group) => {
                                    const isOpen =
                                        effectiveOpenPlaceholderGroupId ===
                                        group.id;
                                    const selectedKey =
                                        selectedPlaceholderByGroup[group.id] ??
                                        group.placeholders[0]?.key ??
                                        '';
                                    const selectedPlaceholder =
                                        group.placeholders.find(
                                            (placeholder) =>
                                                placeholder.key === selectedKey,
                                        ) ?? group.placeholders[0];
                                    const selectedToken =
                                        selectedPlaceholder?.key
                                            ? placeholderToken(
                                                  selectedPlaceholder.key,
                                              )
                                            : '';
                                    const isCopied =
                                        selectedPlaceholder?.key &&
                                        copiedToken === selectedPlaceholder.key;

                                    return (
                                        <div
                                            key={group.id}
                                            className="overflow-hidden rounded-lg border border-slate-200"
                                        >
                                            <button
                                                type="button"
                                                className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
                                                onClick={() =>
                                                    setOpenPlaceholderGroupId(
                                                        isOpen
                                                            ? null
                                                            : group.id,
                                                    )
                                                }
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {group.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {group.description}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span>
                                                        {
                                                            group.placeholders
                                                                .length
                                                        }{' '}
                                                        fields
                                                    </span>
                                                    {isOpen ? (
                                                        <ChevronDown className="size-4" />
                                                    ) : (
                                                        <ChevronRight className="size-4" />
                                                    )}
                                                </div>
                                            </button>

                                            {isOpen ? (
                                                <div className="space-y-3 border-t border-slate-200 bg-white p-4">
                                                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                                                        <select
                                                            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                                                            value={selectedKey}
                                                            onChange={(event) =>
                                                                handlePlaceholderGroupSelection(
                                                                    group.id,
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        >
                                                            {group.placeholders.map(
                                                                (
                                                                    placeholder,
                                                                ) => (
                                                                    <option
                                                                        key={
                                                                            placeholder.key
                                                                        }
                                                                        value={
                                                                            placeholder.key
                                                                        }
                                                                    >
                                                                        {
                                                                            placeholder.key
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() =>
                                                                insertPlaceholderTokenInEditor(
                                                                    selectedPlaceholder?.key,
                                                                )
                                                            }
                                                            disabled={
                                                                selectedToken ===
                                                                ''
                                                            }
                                                        >
                                                            Insert slug
                                                        </Button>

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className={
                                                                isCopied
                                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                    : ''
                                                            }
                                                            onClick={() => {
                                                                if (
                                                                    selectedPlaceholder?.key
                                                                ) {
                                                                    copyTokenToClipboard(
                                                                        selectedPlaceholder.key,
                                                                    );
                                                                }
                                                            }}
                                                            disabled={
                                                                !selectedPlaceholder?.key
                                                            }
                                                        >
                                                            {isCopied ? (
                                                                <Check className="size-4 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="size-4" />
                                                            )}
                                                            {isCopied
                                                                ? 'Copied'
                                                                : 'Copy'}
                                                        </Button>
                                                    </div>

                                                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                                                        <p className="font-mono text-xs text-slate-800">
                                                            {selectedToken ||
                                                                'No slug selected'}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Example:{' '}
                                                            {selectedPlaceholder?.sample ||
                                                                '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DeleteConfirmDialog
                open={templateToDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setTemplateToDelete(null);
                    }
                }}
                onConfirm={deleteTemplate}
                title={
                    templateToDelete
                        ? `Delete "${templateToDelete.name}"?`
                        : 'Delete template?'
                }
                description="This template will no longer send emails."
                confirmLabel="Delete template"
                processing={isDeleting}
            />
        </AppLayout>
    );
}
