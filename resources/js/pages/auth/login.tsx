import { Form, Head, router } from '@inertiajs/react';
import { Fingerprint } from 'lucide-react';
import { useState, useEffect } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import {
    isWebAuthnSupported,
    isPlatformAuthenticatorAvailable,
    authenticateWithPasskey,
} from '@/lib/webauthn';
import { webauthnApi } from '@/lib/webauthn-api';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    const [passkeySupported, setPasskeySupported] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [passkeyError, setPasskeyError] = useState<string | null>(null);

    useEffect(() => {
        async function checkPasskeySupport() {
            if (isWebAuthnSupported()) {
                const available = await isPlatformAuthenticatorAvailable();
                setPasskeySupported(available);
            }
        }
        checkPasskeySupport();
    }, []);

    const handlePasskeyLogin = async () => {
        setPasskeyLoading(true);
        setPasskeyError(null);

        try {
            // Get challenge from server
            const optionsResponse = await fetch(webauthnApi.loginOptions.url, {
                method: webauthnApi.loginOptions.method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!optionsResponse.ok) {
                throw new Error('Failed to get authentication options');
            }

            const options = await optionsResponse.json();

            // Prompt user for passkey
            const credential = await authenticateWithPasskey(options);

            // Send credential to server
            const response = await fetch(webauthnApi.login.url, {
                method: webauthnApi.login.method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(credential),
            });

            if (response.ok) {
                router.visit('/dashboard');
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Authentication failed');
            }
        } catch (error) {
            console.error('Passkey login failed:', error);
            setPasskeyError(
                error instanceof Error
                    ? error.message
                    : 'Failed to authenticate with passkey',
            );
        } finally {
            setPasskeyLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your email and password below to log in"
        >
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        {passkeySupported && (
                            <div className="mb-2">
                                <Button
                                    type="button"
                                    onClick={handlePasskeyLogin}
                                    disabled={passkeyLoading}
                                    className="w-full border border-white/30 bg-white/20 text-white shadow-lg backdrop-blur-sm hover:bg-white/30"
                                >
                                    {passkeyLoading ? (
                                        <Spinner />
                                    ) : (
                                        <Fingerprint className="mr-2 h-5 w-5" />
                                    )}
                                    Sign in with Passkey
                                </Button>
                                {passkeyError && (
                                    <p className="mt-2 text-sm text-red-300">
                                        {passkeyError}
                                    </p>
                                )}
                            </div>
                        )}

                        {passkeySupported && (
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/20" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-transparent px-2 text-white/60">
                                        Or continue with email
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="email"
                                    className="text-sm font-medium text-white/90"
                                >
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    className="border-white/30 bg-white/40 text-white backdrop-blur-sm placeholder:text-white/60 focus-visible:border-white/50 focus-visible:ring-white/20"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label
                                        htmlFor="password"
                                        className="text-sm font-medium text-white/90"
                                    >
                                        Password
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm text-white/80 hover:text-white"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    className="border-white/30 bg-white/40 text-white backdrop-blur-sm placeholder:text-white/60 focus-visible:border-white/50 focus-visible:ring-white/20"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        tabIndex={3}
                                        className="border-white/30 bg-white/20 data-[state=checked]:bg-white data-[state=checked]:text-sage-700"
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="text-sm text-white/90"
                                    >
                                        Remember me
                                    </Label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-lg transition-all duration-200 hover:from-sage-700 hover:to-sage-800 hover:shadow-xl"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>

                        {canRegister && (
                            <div className="text-center text-sm text-white/80">
                                Don't have an account?{' '}
                                <TextLink
                                    href={register()}
                                    tabIndex={5}
                                    className="font-semibold text-white hover:text-white/90"
                                >
                                    Sign up
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
