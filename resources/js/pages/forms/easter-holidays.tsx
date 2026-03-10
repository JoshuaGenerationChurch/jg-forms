import { Head } from '@inertiajs/react';
import {
    EasterServiceTimesForm,
    type EasterServiceTimesFormData,
} from '@/components/forms/easter-service-times-form';
import { GlobalFooter } from '@/components/global-footer';
import { GlobalHeader } from '@/components/global-header';
import { PublicFormContainer } from '@/components/public-form-container';

type EasterHolidaysPageProps = {
    editEntry?: {
        id: number;
        formData: EasterServiceTimesFormData;
    } | null;
};

export default function EasterHolidaysFormPage({
    editEntry = null,
}: EasterHolidaysPageProps) {
    return (
        <>
            <Head title="Easter Weekend Service Times">
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="flex min-h-screen flex-col bg-[#f3f5f7]">
                <GlobalHeader
                    homeHref={null}
                    logoClickable={false}
                    showContactUs
                    variant="public"
                />

                <PublicFormContainer>
                    <EasterServiceTimesForm
                        isEditMode={Boolean(editEntry)}
                        entryId={editEntry?.id ?? null}
                        initialData={editEntry?.formData}
                    />
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
