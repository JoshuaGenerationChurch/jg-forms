import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { GlobalFooter } from '@/components/global-footer';
import { GlobalHeader } from '@/components/global-header';
import { Button } from '@/components/ui/button';

type PublicForm = {
    slug: string;
    title: string;
    description: string;
    url: string;
};

type Props = {
    forms: PublicForm[];
};

export default function FormsIndex({ forms }: Props) {
    return (
        <>
            <Head title="Forms">
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
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Forms
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Use this shared page to access available forms.
                            </p>

                            <div className="mt-8 grid gap-4 md:grid-cols-2">
                                {forms.map((form) => (
                                    <div
                                        key={form.slug}
                                        className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300"
                                    >
                                        <h2 className="text-base font-medium text-slate-900">
                                            {form.title}
                                        </h2>
                                        <div className="mt-4">
                                            <Button asChild>
                                                <Link href={form.url}>
                                                    Open form
                                                    <ArrowRight className="size-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
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
