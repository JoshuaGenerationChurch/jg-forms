import { router, useForm } from '@inertiajs/react';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { dateInputBase } from '@/components/work-request/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    googleMapsPlacesEnabled,
    loadGoogleMapsPlacesApi,
} from '@/lib/google-maps';
import {
    DEFAULT_RECAPTCHA_ACTION,
    executeRecaptcha,
    recaptchaEnabled,
} from '@/lib/recaptcha';

type ServiceNameOption = 'good_friday' | 'easter_sunday' | 'custom';
type VenueType = 'JG Venue' | 'Other';
type ThemeOption = 'Yes' | 'No';

type ServiceTime = {
    serviceNameOption: ServiceNameOption;
    customServiceName: string;
    startTime: string;
    venueType: '' | VenueType;
    jgVenue: string;
    otherVenueName: string;
    otherVenueAddress: string;
    congregationsInvolved: string[];
    graphicsLanguages: string[];
    hasSpecificTheme: '' | ThemeOption;
    themeDescription: string;
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

const serviceOptionLabels: Record<Exclude<ServiceNameOption, 'custom'>, string> = {
    good_friday: 'Good Friday (3 April 2026)',
    easter_sunday: 'Easter Sunday (5 April 2026)',
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

function makeServiceBlock(serviceNameOption: ServiceNameOption): ServiceTime {
    return {
        serviceNameOption,
        customServiceName: '',
        startTime: '',
        venueType: '',
        jgVenue: '',
        otherVenueName: '',
        otherVenueAddress: '',
        congregationsInvolved: [],
        graphicsLanguages: [],
        hasSpecificTheme: '',
        themeDescription: '',
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
    const [autocompleteFailed, setAutocompleteFailed] = useState(false);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        const input = inputRef.current;
        if (!input) {
            return;
        }

        if (!googleMapsPlacesEnabled()) {
            setAutocompleteFailed(true);
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
                className={error ? 'border-red-500' : ''}
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

                if (field === 'serviceNameOption' && value !== 'custom') {
                    nextItem.customServiceName = '';
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
                        className={`h-12 w-full rounded-md border bg-white px-3 text-sm ${errors.congregation ? 'border-red-500' : 'border-input'}`}
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
                    <Button type="button" variant="outline" onClick={addCustomService}>
                        <Plus className="size-4" />
                        Add Custom Service
                    </Button>
                </div>

                {errors.serviceTimes ? (
                    <p className="text-xs text-red-600">{errors.serviceTimes}</p>
                ) : null}

                <div className="space-y-4">
                    {data.serviceTimes.map((service, index) => {
                        const isCustomService = service.serviceNameOption === 'custom';

                        return (
                            <div
                                key={`${formSlug}-service-${index}`}
                                className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium text-slate-800">
                                        Service {index + 1}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => removeServiceTime(index)}
                                        disabled={index < 2}
                                    >
                                        <Minus className="size-4" />
                                        Remove
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        Service Name <span className="text-red-500">*</span>
                                    </Label>
                                    {isCustomService ? (
                                        <div className="space-y-2">
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
                                                className={
                                                    serviceTimeError(
                                                        index,
                                                        'customServiceName',
                                                    )
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                            />
                                            {serviceTimeError(
                                                index,
                                                'customServiceName',
                                            ) ? (
                                                <p className="text-xs text-red-600">
                                                    {serviceTimeError(
                                                        index,
                                                        'customServiceName',
                                                    )}
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {(
                                                Object.entries(serviceOptionLabels) as Array<
                                                    [
                                                        Exclude<
                                                            ServiceNameOption,
                                                            'custom'
                                                        >,
                                                        string,
                                                    ]
                                                >
                                            ).map(([value, label]) => (
                                                <label
                                                    key={`${formSlug}-service-name-${index}-${value}`}
                                                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${service.serviceNameOption === value ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-white'}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`${formSlug}-service-name-${index}`}
                                                        value={value}
                                                        checked={service.serviceNameOption === value}
                                                        onChange={(event) =>
                                                            updateServiceTime(
                                                                index,
                                                                'serviceNameOption',
                                                                event.target
                                                                    .value as Exclude<
                                                                    ServiceNameOption,
                                                                    'custom'
                                                                >,
                                                            )
                                                        }
                                                    />
                                                    {label}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {serviceTimeError(index, 'serviceNameOption') ? (
                                        <p className="text-xs text-red-600">
                                            {serviceTimeError(index, 'serviceNameOption')}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>
                                            Start Time <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                value={service.startTime}
                                                onChange={(event) =>
                                                    updateServiceTime(
                                                        index,
                                                        'startTime',
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    serviceTimeError(
                                                        index,
                                                        'startTime',
                                                    ),
                                                )}
                                                className={dateInputBase}
                                            />
                                        </div>
                                        {serviceTimeError(index, 'startTime') ? (
                                            <p className="text-xs text-red-600">
                                                {serviceTimeError(index, 'startTime')}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        Venue <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        {(['JG Venue', 'Other'] as const).map((value) => (
                                            <label
                                                key={`${formSlug}-service-${index}-venue-${value}`}
                                                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${service.venueType === value ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-white'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`${formSlug}-service-${index}-venue`}
                                                    value={value}
                                                    checked={service.venueType === value}
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
                                            className={`h-12 w-full rounded-md border bg-white px-3 text-sm ${serviceTimeError(index, 'jgVenue') ? 'border-red-500' : 'border-input'}`}
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
                                                className={
                                                    serviceTimeError(
                                                        index,
                                                        'otherVenueName',
                                                    )
                                                        ? 'border-red-500'
                                                        : ''
                                                }
                                            />
                                            {serviceTimeError(
                                                index,
                                                'otherVenueName',
                                            ) ? (
                                                <p className="text-xs text-red-600">
                                                    {serviceTimeError(
                                                        index,
                                                        'otherVenueName',
                                                    )}
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
                                    <details className="overflow-hidden rounded-md border border-slate-300 bg-white">
                                        <summary className="cursor-pointer list-none px-3 py-2 text-sm text-slate-700 [&::-webkit-details-marker]:hidden">
                                            {service.congregationsInvolved.length > 0
                                                ? `${service.congregationsInvolved.length} selected`
                                                : 'Select congregations'}
                                        </summary>
                                        <div className="grid gap-2 border-t border-slate-200 p-3 md:grid-cols-2">
                                            {directoryOptions.congregations.map((congregation) => (
                                                <label
                                                    key={`${formSlug}-service-${index}-congregation-${congregation}`}
                                                    className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
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

                                <div className="space-y-2">
                                    <Label>
                                        Graphics Language{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        {languageOptions.map((language) => (
                                            <label
                                                key={`${formSlug}-service-${index}-lang-${language}`}
                                                className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
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
                                        Does this service have a specific theme other than the generic slide?{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        {(['Yes', 'No'] as const).map((value) => (
                                            <label
                                                key={`${formSlug}-service-${index}-theme-${value}`}
                                                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${service.hasSpecificTheme === value ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-white'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`${formSlug}-service-${index}-theme`}
                                                    value={value}
                                                    checked={service.hasSpecificTheme === value}
                                                    onChange={(event) =>
                                                        updateServiceTime(
                                                            index,
                                                            'hasSpecificTheme',
                                                            event.target
                                                                .value as ThemeOption,
                                                        )
                                                    }
                                                />
                                                {value}
                                            </label>
                                        ))}
                                    </div>
                                    {serviceTimeError(index, 'hasSpecificTheme') ? (
                                        <p className="text-xs text-red-600">
                                            {serviceTimeError(
                                                index,
                                                'hasSpecificTheme',
                                            )}
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
                                            className={`w-full rounded-md border bg-white px-3 py-2 text-sm outline-none ${serviceTimeError(index, 'themeDescription') ? 'border-red-500' : 'border-input'}`}
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
                                        {serviceTimeError(
                                            index,
                                            'themeDescription',
                                        ) ? (
                                            <p className="text-xs text-red-600">
                                                {serviceTimeError(
                                                    index,
                                                    'themeDescription',
                                                )}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                    {processing ? 'Submitting...' : 'Submit Service Times'}
                </Button>
            </div>
        </form>
    );
}
