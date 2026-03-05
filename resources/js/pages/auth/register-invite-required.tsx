import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';

export default function RegisterInviteRequired() {
    return (
        <AuthLayout
            title="Invitation required"
            description="Registration is invite-only for this platform."
        >
            <Head title="Invitation required" />

            <div className="space-y-3 rounded-lg border border-white/30 bg-white/20 p-4 text-sm text-white/90">
                <p>
                    To create an account, use the invitation link sent to your
                    email.
                </p>
                <p>
                    If you need access, contact a platform administrator or use
                    the Contact us page.
                </p>
                <p>
                    Already registered?{' '}
                    <TextLink
                        href={login()}
                        className="font-semibold text-white hover:text-white/90"
                    >
                        Log in
                    </TextLink>
                </p>
            </div>
        </AuthLayout>
    );
}
