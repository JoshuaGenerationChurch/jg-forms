import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Check, Copy, Mail, Shield } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import DeleteConfirmDialog from '@/components/forms/delete-confirm-dialog';
import AdminPageContent from '@/components/layouts/admin-page-content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

type Invitation = {
    id: number;
    email: string;
    roleName: string;
    status: string;
    expiresAt: string | null;
    invitedAt: string | null;
    acceptedAt: string | null;
    revokedAt: string | null;
};

type Props = {
    roles: string[];
    invitations: Invitation[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Admin Invitations', href: '/admin/invitations' },
];

export default function AdminInvitationsIndex({ roles, invitations }: Props) {
    const { props } = usePage<SharedData>();
    const inviteLink =
        typeof props.flash?.inviteLink === 'string'
            ? props.flash.inviteLink
            : '';
    const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
        'idle',
    );
    const copyResetTimer = useRef<number | null>(null);
    const [inviteToRevoke, setInviteToRevoke] = useState<Invitation | null>(
        null,
    );

    const defaultRole = useMemo(() => {
        if (roles.includes('forms-admin')) {
            return 'forms-admin';
        }

        return roles[0] ?? 'forms-admin';
    }, [roles]);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        roleName: defaultRole,
        expiresInDays: 7,
    });

    const pendingCount = invitations.filter(
        (invitation) => invitation.status === 'Pending',
    ).length;

    const resetCopyState = () => {
        if (copyResetTimer.current !== null) {
            window.clearTimeout(copyResetTimer.current);
        }

        copyResetTimer.current = window.setTimeout(() => {
            setCopyState('idle');
            copyResetTimer.current = null;
        }, 2000);
    };

    const handleCopyInviteLink = async () => {
        if (!inviteLink) {
            return;
        }

        setCopyState('idle');

        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopyState('copied');
            resetCopyState();
        } catch {
            setCopyState('error');
            resetCopyState();
        }
    };

    const submitInvitation = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post('/admin/invitations', {
            preserveScroll: true,
            onSuccess: () => {
                reset('email');
            },
        });
    };

    const revokeInvitation = () => {
        if (!inviteToRevoke) {
            return;
        }

        router.delete(`/admin/invitations/${inviteToRevoke.id}`, {
            preserveScroll: true,
            onSuccess: () => setInviteToRevoke(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Invitations" />

            <AdminPageContent>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900">
                                Admin Invitations
                            </h1>
                            <p className="text-sm text-slate-600">
                                Invite-only registration for admin and future
                                role users.
                            </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                            Pending invites: {pendingCount}
                        </div>
                    </div>

                    <form
                        onSubmit={submitInvitation}
                        className="mt-4 grid gap-3 md:grid-cols-4"
                    >
                        <div className="md:col-span-2">
                            <Label htmlFor="invite-email">Email</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                value={data.email}
                                onChange={(event) =>
                                    setData('email', event.target.value)
                                }
                                placeholder="person@joshgen.org"
                                required
                            />
                            {errors.email ? (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.email}
                                </p>
                            ) : null}
                        </div>

                        <div>
                            <Label>Role</Label>
                            <Select
                                value={data.roleName}
                                onValueChange={(value) =>
                                    setData('roleName', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.roleName ? (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.roleName}
                                </p>
                            ) : null}
                        </div>

                        <div>
                            <Label htmlFor="invite-expiry">
                                Expires (days)
                            </Label>
                            <Input
                                id="invite-expiry"
                                type="number"
                                min={1}
                                max={30}
                                value={data.expiresInDays}
                                onChange={(event) =>
                                    setData(
                                        'expiresInDays',
                                        Number(event.target.value) || 7,
                                    )
                                }
                            />
                            {errors.expiresInDays ? (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.expiresInDays}
                                </p>
                            ) : null}
                        </div>

                        <div className="md:col-span-4">
                            <Button type="submit" disabled={processing}>
                                <Mail className="size-4" />
                                {processing ? 'Sending...' : 'Send Invitation'}
                            </Button>
                        </div>
                    </form>

                    {inviteLink ? (
                        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                            <p className="text-sm text-emerald-800">
                                Invitation created. Copy link:
                            </p>
                            <p className="mt-1 break-all text-xs text-emerald-900">
                                {inviteLink}
                            </p>
                            <div className="mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCopyInviteLink}
                                    className="min-w-[120px]"
                                >
                                    {copyState === 'copied' ? (
                                        <>
                                            <Check className="size-4" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="size-4" />
                                            Copy Link
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h2 className="text-sm font-semibold text-slate-800">
                        Recent Invitations
                    </h2>
                    <div className="mt-3 space-y-2">
                        {invitations.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
                                No invitations yet.
                            </p>
                        ) : (
                            invitations.map((invitation) => (
                                <div
                                    key={invitation.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {invitation.email}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {invitation.roleName} • expires{' '}
                                            {invitation.expiresAt
                                                ? new Date(
                                                      invitation.expiresAt,
                                                  ).toLocaleString()
                                                : 'n/a'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                                            <Shield className="size-3" />
                                            {invitation.status}
                                        </span>
                                        {invitation.status === 'Pending' ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setInviteToRevoke(
                                                        invitation,
                                                    )
                                                }
                                            >
                                                Revoke
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </AdminPageContent>

            <DeleteConfirmDialog
                open={inviteToRevoke !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setInviteToRevoke(null);
                    }
                }}
                onConfirm={revokeInvitation}
                title={
                    inviteToRevoke
                        ? `Revoke invite for ${inviteToRevoke.email}?`
                        : 'Revoke invite?'
                }
                description="This link will stop working immediately."
                confirmLabel="Revoke invitation"
            />
        </AppLayout>
    );
}
