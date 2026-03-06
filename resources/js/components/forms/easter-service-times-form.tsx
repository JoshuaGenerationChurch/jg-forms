import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    selectBase,
    textareaBase,
} from '@/components/work-request/types';
import {
    googleMapsPlacesEnabled,
    loadGoogleMapsPlacesApi,
} from '@/lib/google-maps';
import {
    DEFAULT_RECAPTCHA_ACTION,
    executeRecaptcha,
    recaptchaEnabled,
} from '@/lib/recaptcha';
import { cn } from '@/lib/utils';

type ServiceNameOption = 'good_friday' | 'easter_sunday' | 'custom';
type VenueType = 'JG Venue' | 'Other';
type ThemeOption = 'Yes' | 'No';
type ServiceDayOption = 'good_friday' | 'easter_sunday';

type ServiceTime = {
    serviceNameOption: ServiceNameOption;
    customServiceName: string;
    serviceDay: '' | ServiceDayOption;
    startTime: string;
    venueType: '' | VenueType;
    jgVenue: string;
    otherVenueName: string;
    otherVenueAddress: string;
    congregationsInvolved: string[];
    graphicsLanguages: string[];
    hasSpecificTheme: '' | ThemeOption;
    themeDescription: string;
    needsSeparateGraphic: '' | ThemeOption;
    customGraphicThemeDescription: string;
};

type EasterServiceTimesFormData = {
    congregation: string;
    firstName: string;
    lastName: string;
    email: string;
    cellphone: string;
    serviceTimes: ServiceTime[];
};

type DirectoryResponse = {
    hubs?: unknown;
    venues?: unknown;
    congregations?: unknown;
};

type DirectoryOptions = {
    venues: string[];
    congregations: string[];
};

type VenueAddressAutocompleteInputProps = {
    id: string;
    value: string;
    onChange: (nextValue: string) => void;
    error?: string;
};

const emptyDirectoryOptions: DirectoryOptions = {
    venues: [],
    congregations: [],
};

const languageOptions = ['English', 'Afrikaans'];

const inputBase =
    'h-12 w-full rounded-lg border-2 border-slate-200 bg-slate-100/50 px-4 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:border-blue-400 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:focus-visible:border-red-500 aria-invalid:focus-visible:ring-red-500';

const radioTileBase =
    "relative flex cursor-pointer items-center rounded-lg border-2 border-slate-200 bg-slate-100/50 px-4 py-3 pl-11 text-sm shadow-sm transition before:absolute before:top-1/2 before:left-4 before:h-5 before:w-5 before:-translate-y-1/2 before:rounded-full before:border-2 before:border-slate-300 before:bg-white before:content-[''] after:absolute after:top-1/2 after:left-4 after:h-2 after:w-2 after:translate-x-[6px] after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:content-['']";

const radioTileSelected =
    'border-blue-400 bg-white font-semibold text-slate-900 before:border-blue-500 before:bg-blue-500 after:opacity-100';

const serviceTimeOptions = buildServiceTimeOptions();

function buildServiceTimeOptions(): Array<{ value: string; label: string }> {
    const options: Array<{ value: string; label: string }> = [];

    for (let hour = 0; hour < 24; hour += 1) {
        for (let minute = 0; minute < 60; minute += 15) {
            const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            const hour12 = ((hour + 11) % 12) + 1;
            const period = hour < 12 ? 'AM' : 'PM';
            const label = `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
            options.push({ value, label });
        }
    }

    return options;
}

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

function makeServiceBlock(serviceNameOption: ServiceNameOption): ServiceTime {
    return {
        serviceNameOption,
        customServiceName: '',
        serviceDay: '',
        startTime: '',
        venueType: '',
        jgVenue: '',
        otherVenueName: '',
        otherVenueAddress: '',
        congregationsInvolved: [],
        graphicsLanguages: [],
        hasSpecificTheme: '',
        themeDescription: '',
        needsSeparateGraphic: '',
        customGraphicThemeDescription: '',
    };
}

function VenueAddressAutocompleteInput({
    id,
    value,
    onChange,
    error,
}: VenueAddressAutocompleteInputProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const onChangeRef = useRef(onChange);
    const [autocompleteFailed, setAutocompleteFailed] = useState(
        () => !googleMapsPlacesEnabled(),
    );

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        const input = inputRef.current;
        if (!input) {
            return;
        }

        if (!googleMapsPlacesEnabled()) {
            return;
        }

        let autocomplete:
            | {
                  addListener: (
                      eventName: string,
                      handler: () => void,
                  ) => void;
                  getPlace: () => {
                      formatted_address?: string;
                      formattedAddress?: string;
                  };
              }
            | undefined;
        let mounted = true;

        void loadGoogleMapsPlacesApi()
            .then(() => {
                if (!mounted || !inputRef.current) {
                    return;
                }

                const Autocomplete = window.google?.maps?.places?.Autocomplete;
                if (!Autocomplete) {
                    throw new Error('Google Places Autocomplete unavailable');
                }

                autocomplete = new Autocomplete(inputRef.current, {
                    types: ['address'],
                    fields: ['formatted_address'],
                });

                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete?.getPlace();
                    const formattedAddress =
                        place?.formattedAddress?.trim() ??
                        place?.formatted_address?.trim() ??
                        '';

                    if (formattedAddress !== '') {
                        onChangeRef.current(formattedAddress);
                    }
                });
            })
            .catch(() => {
                if (mounted) {
                    setAutocompleteFailed(true);
                }
            });

        return () => {
            mounted = false;
            if (autocomplete && window.google?.maps?.event) {
                window.google.maps.event.clearInstanceListeners(autocomplete);
            }
        };
    }, []);

    return (
        <div className="space-y-1">
            <Input
                ref={inputRef}
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search venue address"
                className={cn(inputBase, error ? 'border-red-500' : '')}
            />
            {autocompleteFailed ? (
                <p className="text-xs text-slate-500">
                    Address autocomplete is unavailable. You can still type manually.
                </p>
            ) : null}
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
    );
}

export function EasterServiceTimesForm() {
    const formSlug = 'easter-holidays';
    const [recaptchaClientError, setRecaptchaClientError] = useState('');
    const [directoryOptions, setDirectoryOptions] = useState<DirectoryOptions>(
        emptyDirectoryOptions,
    );
    const [isDirectoryLoading, setIsDirectoryLoading] = useState(true);
    const [directoryWarning, setDirectoryWarning] = useState<string | null>(
        null,
    );

    const {
        data,
        setData,
        post,
        processing,
        errors,
        recentlySuccessful,
        transform,
    } = useForm<EasterServiceTimesFormData>({
        congregation: '',
        firstName: '',
        lastName: '',
        email: '',
        cellphone: '',
        serviceTimes: [
            makeServiceBlock('good_friday'),
            makeServiceBlock('easter_sunday'),
        ],
    });

    const recaptchaError = (errors as Record<string, string>)['recaptcha'];

    useEffect(() => {
        if (!recentlySuccessful) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.visit('/forms');
        }, 1500);

        return () => window.clearTimeout(timeout);
    }, [recentlySuccessful]);

    useEffect(() => {
        let cancelled = false;

        const loadDirectoryOptions = async () => {
            setIsDirectoryLoading(true);
            setDirectoryWarning(null);

            try {
                const response = await fetch('/work-request/digital-media-options', {
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to load options: ${response.status}`);
                }

                const payload = (await response.json()) as DirectoryResponse;
                const nextOptions: DirectoryOptions = {
                    venues: sanitizeDirectoryList(payload.venues),
                    congregations: sanitizeDirectoryList(payload.congregations),
                };

                if (cancelled) {
                    return;
                }

                setDirectoryOptions(nextOptions);

                if (
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

    const addCustomService = () => {
        setData('serviceTimes', [...data.serviceTimes, makeServiceBlock('custom')]);
    };

    const removeServiceTime = (index: number) => {
        if (index < 2) {
            return;
        }

        setData(
            'serviceTimes',
            data.serviceTimes.filter((_, itemIndex) => itemIndex !== index),
        );
    };

    const updateServiceTime = <K extends keyof ServiceTime>(
        index: number,
        field: K,
        value: ServiceTime[K],
    ) => {
        const nextServiceTimes = data.serviceTimes.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                const nextItem = { ...item, [field]: value };

                if (field === 'venueType') {
                    if (value === 'JG Venue') {
                        nextItem.otherVenueName = '';
                        nextItem.otherVenueAddress = '';
                    }

                    if (value === 'Other') {
                        nextItem.jgVenue = '';
                    }
                }

                if (field === 'hasSpecificTheme' && value === 'No') {
                    nextItem.themeDescription = '';
                }

                if (field === 'needsSeparateGraphic' && value === 'No') {
                    nextItem.customGraphicThemeDescription = '';
                }

                if (field === 'serviceNameOption' && value !== 'custom') {
                    nextItem.customServiceName = '';
                    nextItem.serviceDay = '';
                    nextItem.needsSeparateGraphic = '';
                    nextItem.customGraphicThemeDescription = '';
                }

                return nextItem;
            });

        if (field === 'serviceNameOption') {
            const nextServiceNameOption = value as ServiceNameOption;

            // Keep the first two services paired: selecting one auto-sets the other.
            if (index === 0 && nextServiceNameOption !== 'custom' && nextServiceTimes[1]) {
                const pairedOption: ServiceNameOption =
                    nextServiceNameOption === 'good_friday'
                        ? 'easter_sunday'
                        : 'good_friday';

                nextServiceTimes[1] = {
                    ...nextServiceTimes[1],
                    serviceNameOption: pairedOption,
                    customServiceName: '',
                };
            }
        }

        setData('serviceTimes', nextServiceTimes);
    };

    const toggleServiceArrayValue = (
        index: number,
        field: 'congregationsInvolved' | 'graphicsLanguages',
        value: string,
        checked: boolean | 'indeterminate',
    ) => {
        const shouldInclude = checked === true;

        setData(
            'serviceTimes',
            data.serviceTimes.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                const currentValues = item[field];

                if (shouldInclude) {
                    if (currentValues.includes(value)) {
                        return item;
                    }

                    return {
                        ...item,
                        [field]: [...currentValues, value],
                    };
                }

                return {
                    ...item,
                    [field]: currentValues.filter((entry) => entry !== value),
                };
            }),
        );
    };

    const serviceTimeError = (index: number, field: keyof ServiceTime) => {
        return errors[`serviceTimes.${index}.${field}`];
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setRecaptchaClientError('');

        let recaptchaToken: string | null = null;

        if (recaptchaEnabled()) {
            try {
                recaptchaToken = await executeRecaptcha(DEFAULT_RECAPTCHA_ACTION);
            } catch {
                setRecaptchaClientError(
                    'Spam protection could not load. Please refresh and try again.',
                );
                return;
            }
        }

        transform((values) => ({
            ...values,
            recaptchaToken,
        }));

        post('/forms/easter-holidays/entries', {
            preserveScroll: true,
            onFinish: () => {
                transform((values) => values);
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-8">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                    Easter Holidays Service Times
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Add congregation service details for Good Friday and Easter Sunday.
                </p>
                {recentlySuccessful ? (
                    <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        Submitted successfully.
                    </p>
                ) : null}
                {recaptchaClientError !== '' ? (
                    <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {recaptchaClientError}
                    </p>
                ) : null}
                {recaptchaError ? (
                    <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {recaptchaError}
                    </p>
                ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor={`${formSlug}-first-name`}>
                        Contact First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`${formSlug}-first-name`}
                        value={data.firstName}
                        onChange={(event) => setData('firstName', event.target.value)}
                        className={cn(inputBase, errors.firstName ? 'border-red-500' : '')}
                    />
                    {errors.firstName ? (
                        <p className="text-xs text-red-600">{errors.firstName}</p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`${formSlug}-last-name`}>
                        Contact Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`${formSlug}-last-name`}
                        value={data.lastName}
                        onChange={(event) => setData('lastName', event.target.value)}
                        className={cn(inputBase, errors.lastName ? 'border-red-500' : '')}
                    />
                    {errors.lastName ? (
                        <p className="text-xs text-red-600">{errors.lastName}</p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`${formSlug}-congregation`}>
                        Congregation <span className="text-red-500">*</span>
                    </Label>
                    <select
                        id={`${formSlug}-congregation`}
                        className={cn(selectBase, errors.congregation ? 'border-red-500' : '')}
                        value={data.congregation}
                        onChange={(event) => setData('congregation', event.target.value)}
                    >
                        <option value="">Select an Option</option>
                        {directoryOptions.congregations.map((congregation) => (
                            <option key={congregation} value={congregation}>
                                {congregation}
                            </option>
                        ))}
                    </select>
                    {errors.congregation ? (
                        <p className="text-xs text-red-600">{errors.congregation}</p>
                    ) : null}
                    {(isDirectoryLoading || directoryWarning) && (
                        <p className="text-xs text-slate-500">
                            {isDirectoryLoading
                                ? 'Loading JG directory options...'
                                : directoryWarning}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`${formSlug}-cellphone`}>Cellphone</Label>
                    <Input
                        id={`${formSlug}-cellphone`}
                        value={data.cellphone}
                        onChange={(event) => setData('cellphone', event.target.value)}
                        placeholder="e.g. +27 82 000 0000"
                        className={cn(inputBase, errors.cellphone ? 'border-red-500' : '')}
                    />
                    {errors.cellphone ? (
                        <p className="text-xs text-red-600">{errors.cellphone}</p>
                    ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`${formSlug}-email`}>
                        Contact Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`${formSlug}-email`}
                        type="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        placeholder="you@congregation.org"
                        className={cn(inputBase, errors.email ? 'border-red-500' : '')}
                    />
                    {errors.email ? (
                        <p className="text-xs text-red-600">{errors.email}</p>
                    ) : null}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-medium text-slate-900">
                        Service Details
                    </h2>
                </div>

                {errors.serviceTimes ? (
                    <p className="text-xs text-red-600">{errors.serviceTimes}</p>
                ) : null}

                <div className="space-y-4">
                    {data.serviceTimes.map((service, index) => {
                        const isCustomService = service.serviceNameOption === 'custom';
                        const customServiceNumber = data.serviceTimes
                            .slice(0, index + 1)
                            .filter((item) => item.serviceNameOption === 'custom').length;
                        const serviceHeading = isCustomService
                            ? `Additional Easter Event ${customServiceNumber}`
                            : service.serviceNameOption === 'good_friday'
                              ? 'Good Friday (3 April 2026)'
                              : 'Easter Sunday (5 April 2026)';
                        const fixedThemeQuestion =
                            service.serviceNameOption === 'good_friday'
                                ? 'Will your Good Friday Service have a different theme from our generic Easter Weekend theme?'
                                : 'Will your Easter Sunday Service have a different theme from our generic Easter Weekend theme?';

                        return (
                            <div
                                key={`${formSlug}-service-wrapper-${index}`}
                                className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium text-slate-800">
                                        {serviceHeading}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => removeServiceTime(index)}
                                        disabled={!isCustomService}
                                    >
                                        <Minus className="size-4" />
                                        Remove
                                    </Button>
                                </div>

                                {isCustomService ? (
                                    <>
                                        <div className="grid gap-3 md:grid-cols-2 md:items-center">
                                            <div className="space-y-2">
                                                <Label>
                                                    Service Name <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    value={service.customServiceName}
                                                    onChange={(event) =>
                                                        updateServiceTime(
                                                            index,
                                                            'customServiceName',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Enter custom service name"
                                                    className={cn(
                                                        inputBase,
                                                        serviceTimeError(index, 'customServiceName')
                                                            ? 'border-red-500'
                                                            : '',
                                                    )}
                                                />
                                                {serviceTimeError(index, 'customServiceName') ? (
                                                    <p className="text-xs text-red-600">
                                                        {serviceTimeError(index, 'customServiceName')}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>
                                                    Day <span className="text-red-500">*</span>
                                                </Label>
                                                <select
                                                    className={cn(
                                                        selectBase,
                                                        serviceTimeError(index, 'serviceDay')
                                                            ? 'border-red-500'
                                                            : '',
                                                    )}
                                                    value={service.serviceDay}
                                                    onChange={(event) =>
                                                        updateServiceTime(
                                                            index,
                                                            'serviceDay',
                                                            event.target
                                                                .value as ServiceDayOption,
                                                        )
                                                    }
                                                >
                                                    <option value="">Select an Option</option>
                                                    <option value="good_friday">Good Friday</option>
                                                    <option value="easter_sunday">Easter Sunday</option>
                                                </select>
                                                {serviceTimeError(index, 'serviceDay') ? (
                                                    <p className="text-xs text-red-600">
                                                        {serviceTimeError(index, 'serviceDay')}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:max-w-sm">
                                            <Label>
                                                Start Time <span className="text-red-500">*</span>
                                            </Label>
                                            <select
                                                value={service.startTime}
                                                onChange={(event) =>
                                                    updateServiceTime(
                                                        index,
                                                        'startTime',
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(serviceTimeError(index, 'startTime'))}
                                                className={cn(
                                                    inputBase,
                                                    serviceTimeError(index, 'startTime')
                                                        ? 'border-red-500'
                                                        : '',
                                                )}
                                            >
                                                <option value="">Select time</option>
                                                {serviceTimeOptions.map((timeOption) => (
                                                    <option
                                                        key={`${formSlug}-service-${index}-time-${timeOption.value}`}
                                                        value={timeOption.value}
                                                    >
                                                        {timeOption.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {serviceTimeError(index, 'startTime') ? (
                                                <p className="text-xs text-red-600">
                                                    {serviceTimeError(index, 'startTime')}
                                                </p>
                                            ) : null}
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-2">
                                        <Label>
                                            Start Time <span className="text-red-500">*</span>
                                        </Label>
                                        <select
                                            value={service.startTime}
                                            onChange={(event) =>
                                                updateServiceTime(
                                                    index,
                                                    'startTime',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(serviceTimeError(index, 'startTime'))}
                                            className={cn(
                                                inputBase,
                                                serviceTimeError(index, 'startTime')
                                                    ? 'border-red-500'
                                                    : '',
                                            )}
                                        >
                                            <option value="">Select time</option>
                                            {serviceTimeOptions.map((timeOption) => (
                                                <option
                                                    key={`${formSlug}-service-${index}-time-${timeOption.value}`}
                                                    value={timeOption.value}
                                                >
                                                    {timeOption.label}
                                                </option>
                                            ))}
                                        </select>
                                        {serviceTimeError(index, 'startTime') ? (
                                            <p className="text-xs text-red-600">
                                                {serviceTimeError(index, 'startTime')}
                                            </p>
                                        ) : null}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>
                                        Venue <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        {(['JG Venue', 'Other'] as const).map((value) => (
                                            <label
                                                key={`${formSlug}-service-${index}-venue-${value}`}
                                                className={cn(
                                                    radioTileBase,
                                                    service.venueType === value
                                                        ? radioTileSelected
                                                        : 'text-slate-700 hover:border-slate-300',
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`${formSlug}-service-${index}-venue`}
                                                    value={value}
                                                    checked={service.venueType === value}
                                                    className="sr-only"
                                                    onChange={(event) =>
                                                        updateServiceTime(
                                                            index,
                                                            'venueType',
                                                            event.target.value as VenueType,
                                                        )
                                                    }
                                                />
                                                {value}
                                            </label>
                                        ))}
                                    </div>
                                    {serviceTimeError(index, 'venueType') ? (
                                        <p className="text-xs text-red-600">
                                            {serviceTimeError(index, 'venueType')}
                                        </p>
                                    ) : null}
                                </div>

                                {service.venueType === 'JG Venue' ? (
                                    <div className="space-y-2">
                                        <Label>
                                            JG Venue <span className="text-red-500">*</span>
                                        </Label>
                                        <select
                                            className={cn(
                                                selectBase,
                                                serviceTimeError(index, 'jgVenue')
                                                    ? 'border-red-500'
                                                    : '',
                                            )}
                                            value={service.jgVenue}
                                            onChange={(event) =>
                                                updateServiceTime(
                                                    index,
                                                    'jgVenue',
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            <option value="">Select an Option</option>
                                            {directoryOptions.venues.map((venue) => (
                                                <option key={venue} value={venue}>
                                                    {venue}
                                                </option>
                                            ))}
                                        </select>
                                        {serviceTimeError(index, 'jgVenue') ? (
                                            <p className="text-xs text-red-600">
                                                {serviceTimeError(index, 'jgVenue')}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}

                                {service.venueType === 'Other' ? (
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>
                                                Venue Name{' '}
                                                <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                value={service.otherVenueName}
                                                onChange={(event) =>
                                                    updateServiceTime(
                                                        index,
                                                        'otherVenueName',
                                                        event.target.value,
                                                    )
                                                }
                                                className={cn(
                                                    inputBase,
                                                    serviceTimeError(
                                                        index,
                                                        'otherVenueName',
                                                    )
                                                        ? 'border-red-500'
                                                        : '',
                                                )}
                                            />
                                            {serviceTimeError(index, 'otherVenueName') ? (
                                                <p className="text-xs text-red-600">
                                                    {serviceTimeError(index, 'otherVenueName')}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>
                                                Venue Address{' '}
                                                <span className="text-red-500">*</span>
                                            </Label>
                                            <VenueAddressAutocompleteInput
                                                id={`${formSlug}-service-${index}-other-venue-address`}
                                                value={service.otherVenueAddress}
                                                onChange={(nextValue) =>
                                                    updateServiceTime(
                                                        index,
                                                        'otherVenueAddress',
                                                        nextValue,
                                                    )
                                                }
                                                error={serviceTimeError(
                                                    index,
                                                    'otherVenueAddress',
                                                )}
                                            />
                                        </div>
                                    </div>
                                ) : null}

                                <div className="space-y-2">
                                    <Label>
                                        Congregations involved{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <details className="overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100/50 shadow-sm">
                                        <summary className="cursor-pointer list-none px-4 py-3 text-sm text-slate-700 [&::-webkit-details-marker]:hidden">
                                            {service.congregationsInvolved.length > 0
                                                ? `${service.congregationsInvolved.length} selected`
                                                : 'Select congregations'}
                                        </summary>
                                        <div className="grid gap-2 border-t border-slate-200 p-3 md:grid-cols-2">
                                            {directoryOptions.congregations.map((congregation) => (
                                                <label
                                                    key={`${formSlug}-service-${index}-congregation-${congregation}`}
                                                    className="flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:border-slate-300"
                                                >
                                                    <Checkbox
                                                        checked={service.congregationsInvolved.includes(
                                                            congregation,
                                                        )}
                                                        onCheckedChange={(checked) =>
                                                            toggleServiceArrayValue(
                                                                index,
                                                                'congregationsInvolved',
                                                                congregation,
                                                                checked,
                                                            )
                                                        }
                                                    />
                                                    <span>{congregation}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </details>
                                    {directoryOptions.congregations.length === 0 ? (
                                        <p className="text-xs text-slate-500">
                                            Congregation options are currently unavailable.
                                        </p>
                                    ) : null}
                                    {serviceTimeError(
                                        index,
                                        'congregationsInvolved',
                                    ) ? (
                                        <p className="text-xs text-red-600">
                                            {serviceTimeError(
                                                index,
                                                'congregationsInvolved',
                                            )}
                                        </p>
                                    ) : null}
                                </div>

                                {isCustomService ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label>
                                                Do you need a separate graphic for this event?{' '}
                                                <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="grid gap-2 md:grid-cols-2">
                                                {(['Yes', 'No'] as const).map((value) => (
                                                    <label
                                                        key={`${formSlug}-service-${index}-separate-graphic-${value}`}
                                                        className={cn(
                                                            radioTileBase,
                                                            service.needsSeparateGraphic === value
                                                                ? radioTileSelected
                                                                : 'text-slate-700 hover:border-slate-300',
                                                        )}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`${formSlug}-service-${index}-separate-graphic`}
                                                            value={value}
                                                            checked={service.needsSeparateGraphic === value}
                                                            className="sr-only"
                                                            onChange={(event) =>
                                                                updateServiceTime(
                                                                    index,
                                                                    'needsSeparateGraphic',
                                                                    event.target.value as ThemeOption,
                                                                )
                                                            }
                                                        />
                                                        {value}
                                                    </label>
                                                ))}
                                            </div>
                                            {serviceTimeError(index, 'needsSeparateGraphic') ? (
                                                <p className="text-xs text-red-600">
                                                    {serviceTimeError(index, 'needsSeparateGraphic')}
                                                </p>
                                            ) : null}
                                        </div>

                                        {service.needsSeparateGraphic === 'Yes' ? (
                                            <div className="space-y-2">
                                                <Label>
                                                    Do you have a specific theme/topic/heart in mind for the event that will help us create a suitable graphic?{' '}
                                                    <span className="text-red-500">*</span>
                                                </Label>
                                                <textarea
                                                    className={cn(
                                                        textareaBase,
                                                        serviceTimeError(
                                                            index,
                                                            'customGraphicThemeDescription',
                                                        )
                                                            ? 'border-red-500'
                                                            : '',
                                                    )}
                                                    rows={4}
                                                    value={service.customGraphicThemeDescription}
                                                    onChange={(event) =>
                                                        updateServiceTime(
                                                            index,
                                                            'customGraphicThemeDescription',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                {serviceTimeError(
                                                    index,
                                                    'customGraphicThemeDescription',
                                                ) ? (
                                                    <p className="text-xs text-red-600">
                                                        {serviceTimeError(
                                                            index,
                                                            'customGraphicThemeDescription',
                                                        )}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Label>
                                                Graphics Language{' '}
                                                <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="grid gap-2 md:grid-cols-2">
                                                {languageOptions.map((language) => (
                                                    <label
                                                        key={`${formSlug}-service-${index}-lang-${language}`}
                                                        className="flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-slate-100/50 px-3 py-2 text-sm shadow-sm transition hover:border-slate-300"
                                                    >
                                                        <Checkbox
                                                            checked={service.graphicsLanguages.includes(
                                                                language,
                                                            )}
                                                            onCheckedChange={(checked) =>
                                                                toggleServiceArrayValue(
                                                                    index,
                                                                    'graphicsLanguages',
                                                                    language,
                                                                    checked,
                                                                )
                                                            }
                                                        />
                                                        <span>{language}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {serviceTimeError(index, 'graphicsLanguages') ? (
                                                <p className="text-xs text-red-600">
                                                    {serviceTimeError(
                                                        index,
                                                        'graphicsLanguages',
                                                    )}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>
                                                {fixedThemeQuestion}{' '}
                                                <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="grid gap-2 md:grid-cols-2">
                                                {(['Yes', 'No'] as const).map((value) => (
                                                    <label
                                                        key={`${formSlug}-service-${index}-theme-${value}`}
                                                        className={cn(
                                                            radioTileBase,
                                                            service.hasSpecificTheme === value
                                                                ? radioTileSelected
                                                                : 'text-slate-700 hover:border-slate-300',
                                                        )}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`${formSlug}-service-${index}-theme`}
                                                            value={value}
                                                            checked={service.hasSpecificTheme === value}
                                                            className="sr-only"
                                                            onChange={(event) =>
                                                                updateServiceTime(
                                                                    index,
                                                                    'hasSpecificTheme',
                                                                    event.target.value as ThemeOption,
                                                                )
                                                            }
                                                        />
                                                        {value}
                                                    </label>
                                                ))}
                                            </div>
                                            {serviceTimeError(index, 'hasSpecificTheme') ? (
                                                <p className="text-xs text-red-600">
                                                    {serviceTimeError(index, 'hasSpecificTheme')}
                                                </p>
                                            ) : null}
                                        </div>

                                        {service.hasSpecificTheme === 'Yes' ? (
                                            <div className="space-y-2">
                                                <Label>
                                                    Theme Description{' '}
                                                    <span className="text-red-500">*</span>
                                                </Label>
                                                <textarea
                                                    className={cn(
                                                        textareaBase,
                                                        serviceTimeError(index, 'themeDescription')
                                                            ? 'border-red-500'
                                                            : '',
                                                    )}
                                                    rows={4}
                                                    value={service.themeDescription}
                                                    onChange={(event) =>
                                                        updateServiceTime(
                                                            index,
                                                            'themeDescription',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Give a detailed description of your event and the theme"
                                                />
                                                {serviceTimeError(index, 'themeDescription') ? (
                                                    <p className="text-xs text-red-600">
                                                        {serviceTimeError(index, 'themeDescription')}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end">
                    <Button type="button" variant="outline" onClick={addCustomService}>
                        <Plus className="size-4" />
                        Additional Easter Event
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="outline" asChild>
                    <Link href="/forms">
                        <ArrowLeft className="size-4" />
                        Back to forms
                    </Link>
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Submitting...' : 'Submit Service Request'}
                </Button>
            </div>
        </form>
    );
}
