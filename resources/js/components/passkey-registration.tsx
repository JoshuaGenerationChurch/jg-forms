import { router } from '@inertiajs/react';
import { Fingerprint, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    isWebAuthnSupported,
    isPlatformAuthenticatorAvailable,
    registerPasskey,
} from '@/lib/webauthn';
import { webauthnApi } from '@/lib/webauthn-api';

type Props = {
    onSuccess?: () => void;
};

export default function PasskeyRegistration({ onSuccess }: Props) {
    const [deviceName, setDeviceName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [supported, setSupported] = useState(false);

    // Check support on mount
    useState(() => {
        async function checkSupport() {
            if (isWebAuthnSupported()) {
                const available = await isPlatformAuthenticatorAvailable();
                setSupported(available);
            }
        }
        checkSupport();
    });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Get registration options from server
            const optionsResponse = await fetch(
                webauthnApi.registerOptions.url,
                {
                    method: webauthnApi.registerOptions.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                },
            );

            if (!optionsResponse.ok) {
                throw new Error('Failed to get registration options');
            }

            const options = await optionsResponse.json();

            // Create credential
            const credential = await registerPasskey(options);

            // Send to server
            const response = await fetch(webauthnApi.register.url, {
                method: webauthnApi.register.method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    ...credential,
                    name: deviceName || 'My Device',
                }),
            });

            if (response.ok) {
                setSuccess(true);
                setDeviceName('');
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.reload();
                }
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Passkey registration failed:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to register passkey',
            );
        } finally {
            setLoading(false);
        }
    };

    if (!supported) {
        return (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex">
                    <X className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                            Passkeys not supported
                        </h3>
                        <p className="mt-2 text-sm text-yellow-700">
                            Your device or browser doesn't support passkeys. Try
                            using a device with Face ID, Touch ID, or Windows
                            Hello.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex">
                        <Check className="h-5 w-5 text-green-400" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">
                                Passkey registered successfully!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="deviceName">Device Name (Optional)</Label>
                    <Input
                        id="deviceName"
                        type="text"
                        value={deviceName}
                        onChange={(e) => setDeviceName(e.target.value)}
                        placeholder="My MacBook Pro"
                        disabled={loading}
                    />
                    <p className="text-sm text-muted-foreground">
                        Give this passkey a name to help you identify it later
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                    {loading ? (
                        <Spinner />
                    ) : (
                        <Fingerprint className="mr-2 h-5 w-5" />
                    )}
                    Register Passkey
                </Button>
            </form>

            <div className="rounded-lg bg-muted p-4">
                <h4 className="text-sm font-medium">About Passkeys</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• Sign in quickly with Face ID, Touch ID, or PIN</li>
                    <li>• More secure than passwords</li>
                    <li>• Protected from phishing attacks</li>
                    <li>• Works across your devices</li>
                </ul>
            </div>
        </div>
    );
}
