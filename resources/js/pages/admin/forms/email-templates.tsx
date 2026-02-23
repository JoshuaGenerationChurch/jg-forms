import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    Copy,
    Link2,
    List,
    ListOrdered,
    Pencil,
    Plus,
    Save,
    Send,
    Trash2,
    Type,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
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

type TriggerOption = {
    value: string;
    label: string;
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
    triggerOptions: TriggerOption[];
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
    icon: typeof Type;
    label: string;
    command: string;
    value?: string;
};

const initialTemplateFormData: TemplateFormData = {
    triggerEvent: 'submission_created',
    name: '',
    subject: '[JG Forms] New submission: {{form.title}}',
    heading: 'New submission for {{form.title}}',
    body: '<p><strong>Form:</strong> {{form.title}}</p><p><strong>Entry ID:</strong> {{entry.id}}</p><p><strong>Requester:</strong> {{entry.first_name}} {{entry.last_name}}</p><p><strong>Email:</strong> {{entry.email}}</p><p><strong>View:</strong> {{form.url}}</p>',
    toRecipients: '',
    ccRecipients: '',
    bccRecipients: '',
    useDefaultRecipients: true,
    isActive: true,
    position: 0,
};

const editorCommands: EditorCommand[] = [
    { icon: Type, label: 'Bold', command: 'bold' },
    { icon: Type, label: 'Italic', command: 'italic' },
    { icon: Type, label: 'Underline', command: 'underline' },
    { icon: List, label: 'Bulleted list', command: 'insertUnorderedList' },
    { icon: ListOrdered, label: 'Numbered list', command: 'insertOrderedList' },
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
    triggerOptions,
}: Props) {
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

    const editorRef = useRef<HTMLDivElement | null>(null);

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

    const activePlaceholderKey =
        selectedPlaceholderKey || placeholders[0]?.key || '';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Email Templates', href: '/admin/forms/email-templates' },
        {
            title: form.title,
            href: `/admin/forms/email-templates/${form.slug}`,
        },
    ];

    const syncEditorFromBody = (body: string) => {
        if (!editorRef.current) {
            return;
        }

        editorRef.current.innerHTML = toEditorHtml(body);
    };

    const setEditingTemplate = (template: EmailTemplate | null) => {
        if (!template) {
            setEditingTemplateId(null);
            reset();
            window.requestAnimationFrame(() => {
                syncEditorFromBody(initialTemplateFormData.body);
            });
            return;
        }

        setEditingTemplateId(template.id);
        setData({
            triggerEvent: template.triggerEvent,
            name: template.name,
            subject: template.subject,
            heading: template.heading ?? '',
            body: template.body,
            toRecipients: recipientsToString(template.toRecipients),
            ccRecipients: recipientsToString(template.ccRecipients),
            bccRecipients: recipientsToString(template.bccRecipients),
            useDefaultRecipients: template.useDefaultRecipients,
            isActive: template.isActive,
            position: template.position,
        });

        window.requestAnimationFrame(() => {
            syncEditorFromBody(template.body);
        });
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

    const insertPlaceholderTokenInEditor = () => {
        if (activePlaceholderKey === '') {
            return;
        }

        executeEditorCommand(
            'insertText',
            placeholderToken(activePlaceholderKey),
        );
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
        if (typeof navigator === 'undefined' || !navigator.clipboard) {
            return;
        }

        const token = placeholderToken(key);

        try {
            await navigator.clipboard.writeText(token);
            setCopiedToken(key);
            window.setTimeout(() => {
                setCopiedToken((current) => (current === key ? null : current));
            }, 1200);
        } catch {
            // no-op
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
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {template.triggerEvent} •
                                                    Position {template.position}
                                                </p>
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
                                <label className="space-y-1.5">
                                    <span className="text-sm font-medium text-slate-700">
                                        Email Subject
                                    </span>
                                    <Input
                                        value={data.subject}
                                        onChange={(event) =>
                                            setData(
                                                'subject',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Message from JG Forms"
                                    />
                                    {errors.subject ? (
                                        <p className="text-xs text-red-600">
                                            {errors.subject}
                                        </p>
                                    ) : null}
                                </label>

                                <div className="rounded-lg border border-slate-200 p-4">
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

                                <div className="grid gap-4 md:grid-cols-3">
                                    <label className="space-y-1.5">
                                        <span className="text-sm font-medium text-slate-700">
                                            Template Name
                                        </span>
                                        <Input
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

                                    <label className="space-y-1.5">
                                        <span className="text-sm font-medium text-slate-700">
                                            Trigger Event
                                        </span>
                                        <select
                                            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                                            value={data.triggerEvent}
                                            onChange={(event) =>
                                                setData(
                                                    'triggerEvent',
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            {triggerOptions.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="space-y-1.5">
                                        <span className="text-sm font-medium text-slate-700">
                                            Position
                                        </span>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={data.position}
                                            onChange={(event) =>
                                                setData(
                                                    'position',
                                                    Number(
                                                        event.target.value || 0,
                                                    ),
                                                )
                                            }
                                        />
                                    </label>
                                </div>

                                <label className="space-y-1.5">
                                    <span className="text-sm font-medium text-slate-700">
                                        Heading (optional)
                                    </span>
                                    <Input
                                        value={data.heading}
                                        onChange={(event) =>
                                            setData(
                                                'heading',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>

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

                                <div className="grid gap-4 md:grid-cols-3">
                                    <label className="space-y-1.5 md:col-span-2">
                                        <span className="text-sm font-medium text-slate-700">
                                            To Recipients (semicolon separated)
                                        </span>
                                        <textarea
                                            rows={3}
                                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                                            value={data.toRecipients}
                                            onChange={(event) =>
                                                setData(
                                                    'toRecipients',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={
                                                '"Name" <email@example.com>; second@example.com'
                                            }
                                        />
                                        {errors.toRecipients ? (
                                            <p className="text-xs text-red-600">
                                                {errors.toRecipients}
                                            </p>
                                        ) : null}
                                    </label>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-sm">
                                            <Checkbox
                                                checked={
                                                    data.useDefaultRecipients
                                                }
                                                onCheckedChange={(checked) =>
                                                    setData(
                                                        'useDefaultRecipients',
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            Include all default recipients
                                        </label>

                                        <label className="space-y-1.5">
                                            <span className="text-sm font-medium text-slate-700">
                                                Cc
                                            </span>
                                            <Input
                                                value={data.ccRecipients}
                                                onChange={(event) =>
                                                    setData(
                                                        'ccRecipients',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="cc@example.com"
                                            />
                                        </label>

                                        <label className="space-y-1.5">
                                            <span className="text-sm font-medium text-slate-700">
                                                Bcc
                                            </span>
                                            <Input
                                                value={data.bccRecipients}
                                                onChange={(event) =>
                                                    setData(
                                                        'bccRecipients',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="bcc@example.com"
                                            />
                                        </label>
                                    </div>
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
                                        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
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

                                            <select
                                                value={activePlaceholderKey}
                                                onChange={(event) =>
                                                    setSelectedPlaceholderKey(
                                                        event.target.value,
                                                    )
                                                }
                                                className="h-8 min-w-72 rounded-md border border-slate-300 bg-white px-2 text-xs"
                                            >
                                                {placeholders.map(
                                                    (placeholder) => (
                                                        <option
                                                            key={
                                                                placeholder.key
                                                            }
                                                            value={
                                                                placeholder.key
                                                            }
                                                        >
                                                            {placeholder.key}
                                                        </option>
                                                    ),
                                                )}
                                            </select>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onMouseDown={(event) => {
                                                    event.preventDefault();
                                                    insertPlaceholderTokenInEditor();
                                                }}
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
                                            >
                                                {copiedToken ===
                                                activePlaceholderKey ? (
                                                    <Check className="size-4" />
                                                ) : (
                                                    <Copy className="size-4" />
                                                )}
                                                Copy slug
                                            </Button>
                                        </div>

                                        <div
                                            ref={editorRef}
                                            contentEditable
                                            suppressContentEditableWarning
                                            className="min-h-72 w-full px-3 py-3 text-sm leading-relaxed text-slate-800 outline-none"
                                            onInput={updateBodyFromEditor}
                                            dangerouslySetInnerHTML={{
                                                __html: toEditorHtml(data.body),
                                            }}
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
                                All available work-request payload slugs are
                                listed below.
                            </p>

                            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                                {placeholders.map((placeholder) => {
                                    const token = placeholderToken(
                                        placeholder.key,
                                    );
                                    const isCopied =
                                        copiedToken === placeholder.key;

                                    return (
                                        <div
                                            key={placeholder.key}
                                            className="rounded-md border border-slate-200 bg-slate-50 p-2"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-mono text-xs text-slate-800">
                                                    {token}
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2"
                                                    onClick={() =>
                                                        copyTokenToClipboard(
                                                            placeholder.key,
                                                        )
                                                    }
                                                >
                                                    {isCopied ? (
                                                        <Check className="size-4 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="size-4" />
                                                    )}
                                                </Button>
                                            </div>
                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                Example:{' '}
                                                {placeholder.sample || '—'}
                                            </p>
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
