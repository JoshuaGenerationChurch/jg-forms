import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import PasskeyRegistration from '@/components/passkey-registration';
import { webauthnApi } from '@/lib/webauthn-api';
import type { WebAuthnCredential } from '@/types/webauthn';
import { Fingerprint, Trash2, Smartphone, Monitor } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Props = {
    credentials: WebAuthnCredential[];
};

export default function Passkeys({ credentials }: Props) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this passkey?')) {
            return;
        }

        setDeletingId(id);

        try {
            const response = await fetch(webauthnApi.destroy(id).url, {
                method: webauthnApi.destroy(id).method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                router.reload();
            } else {
                throw new Error('Failed to delete passkey');
            }
        } catch (error) {
            console.error('Failed to delete passkey:', error);
            alert('Failed to delete passkey. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const getIcon = (type: string) => {
        if (
            type.toLowerCase().includes('mobile') ||
            type.toLowerCase().includes('phone')
        ) {
            return <Smartphone className="h-5 w-5" />;
        }
        return <Monitor className="h-5 w-5" />;
    };

    return (
        <div className="mx-auto max-w-4xl space-y-8 py-8">
            <Head title="Passkeys" />

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Passkeys</h1>
                <p className="mt-2 text-muted-foreground">
                    Manage your passkeys for quick and secure sign-in
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Add New Passkey
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Register a new passkey for this device
                        </p>
                    </div>

                    <PasskeyRegistration />
                </div>

                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold">Your Passkeys</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {credentials.length === 0
                                ? 'No passkeys registered yet'
                                : `${credentials.length} passkey${credentials.length === 1 ? '' : 's'} registered`}
                        </p>
                    </div>

                    {credentials.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                            <Fingerprint className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-sm text-muted-foreground">
                                You haven't registered any passkeys yet.
                                Register one to enable quick and secure sign-in.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {credentials.map((credential) => (
                                <div
                                    key={credential.id}
                                    className="flex items-center justify-between rounded-lg border p-4"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="rounded-full bg-primary/10 p-2">
                                            {getIcon(credential.type)}
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {credential.name}
                                            </p>
                                            <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                                                <p>
                                                    Added{' '}
                                                    {formatDistanceToNow(
                                                        new Date(
                                                            credential.created_at,
                                                        ),
                                                        { addSuffix: true },
                                                    )}
                                                </p>
                                                {credential.last_used_at && (
                                                    <p>
                                                        Last used{' '}
                                                        {formatDistanceToNow(
                                                            new Date(
                                                                credential.last_used_at,
                                                            ),
                                                            { addSuffix: true },
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleDelete(credential.id)
                                        }
                                        disabled={deletingId === credential.id}
                                    >
                                        {deletingId === credential.id ? (
                                            <Spinner className="h-4 w-4" />
                                        ) : (
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-lg border bg-muted/50 p-6">
                <h3 className="font-semibold">Security Tips</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>
                        • Passkeys are more secure than passwords and can't be
                        phished
                    </li>
                    <li>
                        • Each passkey is unique to this website and your device
                    </li>
                    <li>
                        • You can register multiple passkeys for different
                        devices
                    </li>
                    <li>
                        • Keep your device secure with a strong PIN, password,
                        or biometric
                    </li>
                    <li>
                        • Remove passkeys for devices you no longer use or have
                        lost
                    </li>
                </ul>
            </div>
        </div>
    );
}
