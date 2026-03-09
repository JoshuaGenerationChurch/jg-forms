import { Head } from '@inertiajs/react';
import { EasterServiceTimesForm } from '@/components/forms/easter-service-times-form';
import { GlobalFooter } from '@/components/global-footer';
import { GlobalHeader } from '@/components/global-header';
import { PublicFormContainer } from '@/components/public-form-container';

export default function EasterHolidaysFormPage() {
    return (
        <>
            <Head title="Easter Weekend Service Times">
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="flex min-h-screen flex-col bg-[#f3f5f7]">
                <GlobalHeader
                    homeHref="/forms"
                    showContactUs
                    variant="public"
                />

                <PublicFormContainer>
                    <EasterServiceTimesForm />
                </PublicFormContainer>

                <GlobalFooter
                    homeHref="/forms"
                    showContactUs
                    variant="public"
                />
            </div>
        </>
    );
}
