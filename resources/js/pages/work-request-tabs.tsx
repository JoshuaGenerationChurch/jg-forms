import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GlobalFooter } from '@/components/global-footer';
import { GlobalHeader } from '@/components/global-header';
import { Button } from '@/components/ui/button';
import {
    ContactDetails,
    DigitalMedia,
    type DirectoryOptions,
    EventDetails,
    EventRegistration,
    hasErrors,
    initialFormData,
    NatureOfRequest,
    PrintMedia,
    Signage,
    validatePage,
    withRequiredRegistrationInfoFields,
    WorkRequestTabStepper,
} from '@/components/work-request';
import type { FormData, ValidationErrors } from '@/components/work-request';
import {
    DEFAULT_RECAPTCHA_ACTION,
    executeRecaptcha,
    recaptchaEnabled,
} from '@/lib/recaptcha';

type DirectoryResponse = {
    hubs?: unknown;
    venues?: unknown;
    congregations?: unknown;
};

const emptyDirectoryOptions: DirectoryOptions = {
    hubs: [],
    venues: [],
    congregations: [],
};

function sanitizeDirectoryList(values: unknown): string[] {
    if (!Array.isArray(values)) {
        return [];
    }

    const cleanValues = values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    return Array.from(new Set(cleanValues));
}

export default function WorkRequestTabs() {
    const [stepIndex, setStepIndex] = useState(0);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitState, setSubmitState] = useState<
        'idle' | 'success' | 'error'
    >('idle');
    const [directoryOptions, setDirectoryOptions] = useState<DirectoryOptions>(
        emptyDirectoryOptions,
    );
    const [isDirectoryLoading, setIsDirectoryLoading] = useState(true);
    const [directoryWarning, setDirectoryWarning] = useState<string | null>(
        null,
    );

    useEffect(() => {
        if (submitState !== 'success') {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.visit('/forms');
        }, 1500);

        return () => window.clearTimeout(timeout);
    }, [submitState]);

    useEffect(() => {
        let cancelled = false;

        const loadDirectoryOptions = async () => {
            setIsDirectoryLoading(true);
            setDirectoryWarning(null);

            try {
                const response = await fetch(
                    '/work-request/digital-media-options',
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error(
                        `Failed to load options: ${response.status}`,
                    );
                }

                const payload = (await response.json()) as DirectoryResponse;
                const nextOptions: DirectoryOptions = {
                    hubs: sanitizeDirectoryList(payload.hubs),
                    venues: sanitizeDirectoryList(payload.venues),
                    congregations: sanitizeDirectoryList(payload.congregations),
                };

                if (cancelled) {
                    return;
                }

                setDirectoryOptions(nextOptions);

                if (
                    nextOptions.hubs.length === 0 ||
                    nextOptions.venues.length === 0 ||
                    nextOptions.congregations.length === 0
                ) {
                    setDirectoryWarning(
                        'Some JG directory options are currently unavailable. Please try again.',
                    );
                }
            } catch {
                if (!cancelled) {
                    setDirectoryOptions(emptyDirectoryOptions);
                    setDirectoryWarning(
                        'Could not load JG directory options. Please refresh and try again.',
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsDirectoryLoading(false);
                }
            }
        };

        void loadDirectoryOptions();

        return () => {
            cancelled = true;
        };
    }, []);

    const updateFormData = useCallback(
        <K extends keyof FormData>(key: K, value: FormData[K]) => {
            if (submitState !== 'idle') {
                setSubmitState('idle');
            }

            setFormData((prev) => {
                const next = { ...prev, [key]: value } as FormData;
                const requiresDigital =
                    next.includesDatesVenue || next.includesRegistration;

                if (requiresDigital) {
                    next.includesGraphics = true;
                    next.includesGraphicsDigital = true;
                }

                next.infoToCollect = withRequiredRegistrationInfoFields(
                    next.infoToCollect,
                );

                return next;
            });

            // Clear any errors that are related to the updated field.
            setErrors((prev) => {
                if (!prev || Object.keys(prev).length === 0) return prev;

                const next: ValidationErrors = { ...prev };
                delete next[String(key)];

                const prefix = `${String(key)}.`;
                for (const k of Object.keys(next)) {
                    if (k.startsWith(prefix)) {
                        delete next[k];
                    }
                }

                // Clear nature-of-request derived errors when toggling request checkboxes.
                if (String(key).startsWith('includes')) {
                    delete next.natureOfRequest;
                    delete next.graphicsType;
                }

                // Clear Digital Media derived error when any digital field changes.
                if (String(key).startsWith('digital')) {
                    delete next.digitalFormats;
                }

                const isSignageField =
                    String(key).startsWith('signage') ||
                    String(key).startsWith('sharkfin') ||
                    String(key).startsWith('temporaryFence') ||
                    String(key).startsWith('toilets') ||
                    String(key).startsWith('moms') ||
                    String(key).startsWith('toddlers') ||
                    String(key).startsWith('firstAid') ||
                    String(key).startsWith('internal') ||
                    String(key).startsWith('external') ||
                    String(key).startsWith('sandwichBoards') ||
                    String(key).startsWith('permanentExternalBuildingSigns') ||
                    String(key).startsWith('otherSignage');

                if (isSignageField) {
                    delete next.signageSelection;
                }

                if (String(key) === 'signageScope') {
                    delete next.signageHubs;
                    delete next.signageCongregations;
                }

                if (String(key) === 'printScope') {
                    delete next.printHubs;
                    delete next.printCongregations;
                }

                if (String(key) === 'printTypes') {
                    delete next.printA5Qty;
                    delete next.printA6Qty;
                    delete next.printA3Qty;
                    delete next.printA4Qty;
                    delete next.printCardsQty;
                    delete next.printCoffeeCupSleevesQty;
                    delete next.printVisitorCoffeeVoucherCardQty;
                    delete next.printOther;
                    delete next.printOtherQty;
                }

                return next;
            });
        },
        [submitState],
    );

    // Determine which pages should be visible based on form data
    const visiblePages = useMemo(() => {
        const pages: string[] = ['contact', 'nature'];

        if (formData.includesDatesVenue) {
            pages.push('event');
        }

        if (formData.includesRegistration) {
            pages.push('quicket');
        }

        if (formData.includesGraphicsDigital) {
            pages.push('digital');
        }

        if (formData.includesGraphicsPrint) {
            pages.push('print');
        }

        if (formData.includesSignage) {
            pages.push('signage');
        }

        return pages;
    }, [formData]);

    const steps = useMemo(() => {
        const allPages = [
            {
                id: 'contact',
                title: 'Contact Details',
                content: (
                    <ContactDetails
                        formData={formData}
                        updateFormData={updateFormData}
                        errors={errors}
                        directoryOptions={directoryOptions}
                        isDirectoryLoading={isDirectoryLoading}
                        directoryWarning={directoryWarning}
                    />
                ),
            },
            {
                id: 'nature',
                title: 'Request',
                content: (
                    <NatureOfRequest
                        formData={formData}
                        updateFormData={updateFormData}
                        errors={errors}
                    />
                ),
            },
            {
                id: 'event',
                title: 'Event Details',
                content: (
                    <EventDetails
                        formData={formData}
                        updateFormData={updateFormData}
                        errors={errors}
                        directoryOptions={directoryOptions}
                        isDirectoryLoading={isDirectoryLoading}
                        directoryWarning={directoryWarning}
                    />
                ),
            },
            {
                id: 'quicket',
                title: 'Event Registration',
                content: (
                    <EventRegistration
                        formData={formData}
                        updateFormData={updateFormData}
                        errors={errors}
                    />
                ),
            },
            {
                id: 'digital',
                title: 'Digital Media',
                content: (
                    <DigitalMedia
                        formData={formData}
                        updateFormData={updateFormData}
                        errors={errors}
                    />
                ),
            },
            {
                id: 'print',
                title: 'Print Media',
                content: (
                    <PrintMedia
                        formData={formData}
                        updateFormData={updateFormData}
                        errors={errors}
                        directoryOptions={directoryOptions}
                        isDirectoryLoading={isDirectoryLoading}
                        directoryWarning={directoryWarning}
                    />
                ),
            },
            {
                id: 'signage',
                title: 'Signage',
                content: (
                    <Signage
                        formData={formData}
                        updateFormData={updateFormData}
                        errors={errors}
                    />
                ),
            },
        ];

        return allPages.filter((page) => visiblePages.includes(page.id));
    }, [
        directoryOptions,
        directoryWarning,
        errors,
        formData,
        isDirectoryLoading,
        updateFormData,
        visiblePages,
    ]);

    const validationState = (() => {
        if (steps.length === 0) {
            return { allValid: true, maxEnabledIndex: 0 };
        }

        for (let i = 0; i < steps.length; i++) {
            const pageErrors = validatePage(steps[i].id, formData);
            if (hasErrors(pageErrors)) {
                return { allValid: false, maxEnabledIndex: i };
            }
        }

        return { allValid: true, maxEnabledIndex: steps.length - 1 };
    })();

    const { allValid, maxEnabledIndex } = validationState;
    const totalSteps = steps.length;
    const safeStepIndex = Math.min(
        stepIndex,
        maxEnabledIndex,
        Math.max(0, totalSteps - 1),
    );
    const currentStep = steps[safeStepIndex];

    const handleSelectTab = useCallback(
        (index: number) => {
            if (!steps[index]) return;

            // If the tab is locked, jump to the first invalid step and show its errors.
            if (index > maxEnabledIndex) {
                const firstInvalid = steps[maxEnabledIndex];
                if (!firstInvalid) return;

                const pageErrors = validatePage(firstInvalid.id, formData);
                setErrors(pageErrors);
                setStepIndex(maxEnabledIndex);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            setErrors({});
            setStepIndex(index);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        [formData, maxEnabledIndex, steps],
    );

    const isLastStep = safeStepIndex === totalSteps - 1;

    const handleNext = useCallback(() => {
        if (isLastStep) return;
        if (!currentStep) return;

        const pageErrors = validatePage(currentStep.id, formData);
        setErrors(pageErrors);

        if (hasErrors(pageErrors)) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setStepIndex((index) => Math.min(steps.length - 1, index + 1));
    }, [currentStep, formData, isLastStep, steps.length]);

    const handleSubmit = useCallback(async () => {
        if (!isLastStep) return;
        if (!currentStep) return;

        const pageErrors = validatePage(currentStep.id, formData);
        setErrors(pageErrors);

        if (hasErrors(pageErrors)) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        let recaptchaToken: string | null = null;

        if (recaptchaEnabled()) {
            try {
                recaptchaToken = await executeRecaptcha(
                    DEFAULT_RECAPTCHA_ACTION,
                );
            } catch {
                setSubmitState('error');
                setErrors((prev) => ({
                    ...prev,
                    recaptcha:
                        'Spam protection could not load. Please refresh and try again.',
                }));
                return;
            }
        }

        router.post(
            '/work-request/entries',
            {
                formSlug: 'work-request',
                payload: formData,
                recaptchaToken,
            },
            {
                preserveScroll: true,
                onStart: () => setIsSubmitting(true),
                onSuccess: () => {
                    setSubmitState('success');
                    setErrors({});
                    setStepIndex(0);
                    setFormData(initialFormData);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },
                onError: (serverErrors) => {
                    setSubmitState('error');
                    setErrors((serverErrors ?? {}) as ValidationErrors);
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    }, [currentStep, formData, isLastStep]);

    const handlePrevious = useCallback(() => {
        setErrors({});
        setStepIndex((index) => Math.max(0, index - 1));
    }, []);

    const stepperSteps = useMemo(
        () => steps.map(({ id, title }) => ({ id, title })),
        [steps],
    );

    return (
        <>
            <Head title="Work Request">
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
                            <div>
                                <h1 className="text-2xl font-semibold text-slate-900">
                                    Work Request Form
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Tab navigation enabled (gated). You can move
                                    forward only after completing earlier steps.
                                </p>
                                {submitState === 'success' ? (
                                    <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                        Work request submitted successfully.
                                    </p>
                                ) : null}
                                {submitState === 'error' ? (
                                    <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                        We could not submit your request. Please
                                        review the form and try again.
                                    </p>
                                ) : null}
                                {errors.recaptcha ? (
                                    <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                        {errors.recaptcha}
                                    </p>
                                ) : null}
                                <WorkRequestTabStepper
                                    steps={stepperSteps}
                                    currentIndex={safeStepIndex}
                                    maxEnabledIndex={maxEnabledIndex}
                                    allValid={allValid}
                                    onSelect={handleSelectTab}
                                    hasError={hasErrors(errors)}
                                />
                            </div>

                            <div role="tabpanel" className="mt-8">
                                {currentStep?.content}
                            </div>

                            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    <Button variant="outline" asChild>
                                        <Link href="/forms">
                                            <ArrowLeft className="size-4" />
                                            Back to forms
                                        </Link>
                                    </Button>
                                    {safeStepIndex > 0 && (
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={handlePrevious}
                                        >
                                            Previous
                                        </Button>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Button
                                        type="button"
                                        onClick={
                                            isLastStep
                                                ? handleSubmit
                                                : handleNext
                                        }
                                        disabled={isSubmitting}
                                    >
                                        {isLastStep
                                            ? isSubmitting
                                                ? 'Submitting...'
                                                : 'Submit Request'
                                            : 'Next'}
                                    </Button>
                                    <Button variant="outline" type="button">
                                        <Save className="size-4" />
                                        Save and Continue Later
                                    </Button>
                                </div>
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
