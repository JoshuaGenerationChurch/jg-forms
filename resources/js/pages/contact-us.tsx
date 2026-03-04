import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { FormEvent } from 'react';
import { GlobalFooter } from '@/components/global-footer';
import { GlobalHeader } from '@/components/global-header';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SharedData } from '@/types';

export default function ContactUsPage() {
    const { props } = usePage<SharedData>();
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        recentlySuccessful,
    } = useForm({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post('/contact-us', {
            preserveScroll: true,
            onSuccess: () => {
                reset('subject', 'message');
            },
        });
    };

    return (
        <>
            <Head title="Contact us">
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="flex min-h-screen flex-col bg-[#f3f5f7]">
                <GlobalHeader
                    homeHref="/forms"
                    contactHref="/contact-us"
                    showContactUs={false}
                    variant="public"
                />

                <main className="mx-auto flex w-full max-w-6xl flex-1 border-x border-slate-200 px-6">
                    <div className="mx-auto w-full max-w-5xl py-8">
                        <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Contact us
                            </h1>
                            <p className="mt-2 text-sm text-slate-600">
                                Send a message to the JoshGen forms team.
                            </p>

                            {props.flash?.success || recentlySuccessful ? (
                                <div className="mt-4 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                    {props.flash?.success ??
                                        'Thanks. Your message has been sent.'}
                                </div>
                            ) : null}

                            <form
                                onSubmit={handleSubmit}
                                className="mt-6 space-y-4"
                            >
                                <div className="space-y-1">
                                    <Label htmlFor="contact-name">Name</Label>
                                    <Input
                                        id="contact-name"
                                        value={data.name}
                                        onChange={(event) =>
                                            setData('name', event.target.value)
                                        }
                                        autoComplete="name"
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="contact-email">Email</Label>
                                    <Input
                                        id="contact-email"
                                        type="email"
                                        value={data.email}
                                        onChange={(event) =>
                                            setData('email', event.target.value)
                                        }
                                        autoComplete="email"
                                        required
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="contact-subject">
                                        Subject
                                    </Label>
                                    <Input
                                        id="contact-subject"
                                        value={data.subject}
                                        onChange={(event) =>
                                            setData(
                                                'subject',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError message={errors.subject} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="contact-message">
                                        Message
                                    </Label>
                                    <textarea
                                        id="contact-message"
                                        value={data.message}
                                        onChange={(event) =>
                                            setData(
                                                'message',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        rows={6}
                                        className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    />
                                    <InputError message={errors.message} />
                                </div>

                                <div className="pt-2">
                                    <Button type="submit" disabled={processing}>
                                        {processing
                                            ? 'Sending...'
                                            : 'Send message'}
                                    </Button>
                                </div>
                            </form>

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
                    contactHref="/contact-us"
                    loginHref="/login"
                    showContactUs={false}
                    showLoginButton
                    variant="public"
                />
            </div>
        </>
    );
}
