import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ChristmasServiceTimesForm } from '@/components/forms/christmas-service-times-form';
import { GlobalFooter } from '@/components/global-footer';
import { GlobalHeader } from '@/components/global-header';
import { Button } from '@/components/ui/button';

export default function ChristmasHolidaysFormPage() {
    return (
        <>
            <Head title="Christmas Holidays Service Times">
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="flex min-h-screen flex-col bg-[#f3f5f7]">
                <GlobalHeader
                    homeHref="/forms"
                    showContactUs
                    variant="public"
                />

                <main className="mx-auto flex w-full max-w-6xl flex-1 border-x border-slate-200 px-6">
                    <div className="mx-auto w-full max-w-5xl py-8">
                        <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
                            <ChristmasServiceTimesForm />

                            <div className="mt-6">
                                <Button variant="outline" asChild>
                                    <Link href="/forms">
                                        <ArrowLeft className="size-4" />
                                        Back to forms
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>

                <GlobalFooter
                    homeHref="/forms"
                    showContactUs
                    variant="public"
                />
            </div>
        </>
    );
}
