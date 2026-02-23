import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AdminFormSummary = {
    slug: string;
    title: string;
    description: string;
    emailTemplateCount: number;
    activeEmailTemplateCount: number;
};

type Props = {
    forms: AdminFormSummary[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Email Templates', href: '/admin/forms/email-templates' },
];

export default function AdminFormsEmailTemplatesIndex({ forms }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Email Templates">
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="bg-[#f3f5f7]">
                <div className="mx-auto w-full max-w-6xl px-6 py-8">
                    <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Mail className="size-6 text-slate-600" />
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Email Templates
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            Configure email templates per form, including
                            recipients, subject, and dynamic placeholders.
                        </p>

                        <div className="mt-8 space-y-3">
                            {forms.map((form) => (
                                <div
                                    key={form.slug}
                                    className="rounded-lg border border-slate-200 bg-white p-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {form.title}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {form.description ||
                                                    'No description'}
                                            </p>
                                            <p className="mt-2 text-xs text-slate-500">
                                                {form.emailTemplateCount}{' '}
                                                template
                                                {form.emailTemplateCount === 1
                                                    ? ''
                                                    : 's'}
                                                {' • '}
                                                {
                                                    form.activeEmailTemplateCount
                                                }{' '}
                                                active
                                            </p>
                                        </div>
                                        <Button variant="outline" asChild>
                                            <Link
                                                href={`/admin/forms/email-templates/${form.slug}`}
                                            >
                                                Manage templates
                                                <ArrowRight className="size-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
