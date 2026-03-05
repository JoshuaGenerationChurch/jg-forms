import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import AdminPageContent from '@/components/layouts/admin-page-content';
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
    backTo?: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Email Templates', href: '/admin/forms/email-templates' },
];

export default function AdminFormsEmailTemplatesIndex({
    forms,
    backTo = null,
}: Props) {
    const safeBackTo = backTo && backTo.trim() !== '' ? backTo : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Email Templates">
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <AdminPageContent>
                <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
                    {safeBackTo ? (
                        <div className="mb-4">
                            <Button variant="ghost" className="-ml-2" asChild>
                                <Link href={safeBackTo}>
                                    <ArrowLeft className="size-4" />
                                    Back
                                </Link>
                            </Button>
                        </div>
                    ) : null}

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
                                            {form.emailTemplateCount} template
                                            {form.emailTemplateCount === 1
                                                ? ''
                                                : 's'}{' '}
                                            •{' '}
                                            {
                                                form.activeEmailTemplateCount
                                            }{' '}
                                            active
                                        </p>
                                    </div>
                                    <Button variant="outline" asChild>
                                        <Link
                                            href={
                                                safeBackTo
                                                    ? `/admin/forms/email-templates/${form.slug}?backTo=${encodeURIComponent(safeBackTo)}`
                                                    : `/admin/forms/email-templates/${form.slug}`
                                            }
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
            </AdminPageContent>
        </AppLayout>
    );
}
