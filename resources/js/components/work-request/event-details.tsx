import { ChevronDown, Minus, Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    googleMapsPlacesEnabled,
    loadGoogleMapsPlacesApi,
} from '@/lib/google-maps';
import {
    FieldError,
    FloatingLabelInput,
    FloatingLabelTextarea,
    RadioGroup,
    Required,
    SectionHeader,
} from './form-components';
import {
    combinePhoneNumber,
    countryCodeOptionsWithCurrent,
    phonePlaceholderByCountryCode,
    splitPhoneNumber,
} from './phone';
import { dateInputBase, selectBase } from './types';
import type { FormPageProps } from './types';

export function EventDetails({
    formData,
    updateFormData,
    errors = {},
    directoryOptions,
    isDirectoryLoading = false,
    directoryWarning = null,
}: FormPageProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIsoDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000,
    )
        .toISOString()
        .slice(0, 10);
    const organiserCellParts = splitPhoneNumber(formData.organiserCell);
    const placeAutocompleteContainerRef = useRef<HTMLDivElement | null>(null);
    const placeAutocompleteElementRef = useRef<HTMLElement | null>(null);
    const [autocompleteScriptFailed, setAutocompleteScriptFailed] =
        useState(false);
    const [useManualVenueAddressEntry, setUseManualVenueAddressEntry] =
        useState(false);
    const organiserCellCountryCodeOptions = countryCodeOptionsWithCurrent(
        organiserCellParts.countryCode,
    );
    const organiserCellInvalid = Boolean(errors.organiserCell);
    const availableHubs = directoryOptions?.hubs ?? [];
    const availableCongregations = directoryOptions?.congregations ?? [];
    const availableVenues = directoryOptions?.venues ?? [];
    const singleMultipleDayScheduleOption = 'Single/Multiple Day Event';
    const outreachCampScheduleOption = 'Outreach/Camp';
    const eventScheduleLabel =
        formData.eventDates.length > 1
            ? 'Multiple Day Event'
            : 'Single Day Event';
    const applyEventDates = (
        nextDates: Array<{ date: string; startTime: string; endTime: string }>,
    ) => {
        updateFormData('eventDates', nextDates);

        const firstDate = nextDates[0];
        const lastDate = nextDates[nextDates.length - 1];

        const derivedStartDateTime =
            firstDate?.date && firstDate?.startTime
                ? `${firstDate.date}T${firstDate.startTime}`
                : '';
        const derivedEndDateTime =
            lastDate?.date && lastDate?.endTime
                ? `${lastDate.date}T${lastDate.endTime}`
                : '';

        updateFormData(
            'eventDuration',
            nextDates.length > 1
                ? 'Multiple Day Event'
                : nextDates.length === 1
                  ? 'One Day Event'
                  : '',
        );
        updateFormData('eventStartDate', derivedStartDateTime);
        updateFormData('eventEndDate', derivedEndDateTime);
    };
    const syncOutreachCampDerivedValues = (
        startDate: string,
        startTime: string,
        endDate: string,
        endTime: string,
    ) => {
        updateFormData('eventDuration', 'Outreach / Camp');
        updateFormData(
            'eventStartDate',
            startDate !== '' && startTime !== ''
                ? `${startDate}T${startTime}`
                : '',
        );
        updateFormData(
            'eventEndDate',
            endDate !== '' && endTime !== '' ? `${endDate}T${endTime}` : '',
        );
    };

    const applyFormattedAddressFromPlace = useCallback(
        (
            place:
                | {
                      formattedAddress?: string;
                      formatted_address?: string;
                      fetchFields?: (request: {
                          fields: string[];
                      }) => Promise<void>;
                  }
                | undefined,
        ) => {
            const formattedAddress =
                place?.formattedAddress?.trim() ??
                place?.formatted_address?.trim() ??
                '';

            if (formattedAddress !== '') {
                updateFormData('otherVenueAddress', formattedAddress);
            }
        },
        [updateFormData],
    );

    const placesAutocompleteConfigured = googleMapsPlacesEnabled();
    const canUsePlacesAutocomplete =
        placesAutocompleteConfigured && !autocompleteScriptFailed;
    const shouldRenderPlacesAutocomplete =
        formData.venueType === 'Other' &&
        canUsePlacesAutocomplete &&
        !useManualVenueAddressEntry;
    const shouldRenderManualVenueAddressInput =
        formData.venueType === 'Other' &&
        (!canUsePlacesAutocomplete || useManualVenueAddressEntry);
    const placeAutocompleteElementClassName = `jg-place-autocomplete-element${
        errors.otherVenueAddress
            ? ' jg-place-autocomplete-element--invalid'
            : ''
    }`;

    useEffect(() => {
        if (!shouldRenderPlacesAutocomplete) {
            return;
        }

        const container = placeAutocompleteContainerRef.current;
        if (!container) {
            return;
        }

        let isMounted = true;
        let selectListener: ((event: Event) => void) | null = null;
        let errorListener: ((event: Event) => void) | null = null;

        void loadGoogleMapsPlacesApi()
            .then(() => {
                if (!isMounted || !container) {
                    return;
                }

                if (placeAutocompleteElementRef.current !== null) {
                    return;
                }

                const PlaceAutocompleteElement =
                    window.google?.maps?.places?.PlaceAutocompleteElement;
                if (!PlaceAutocompleteElement) {
                    throw new Error(
                        'Google Maps PlaceAutocompleteElement is unavailable.',
                    );
                }

                const autocompleteElement = new PlaceAutocompleteElement();
                autocompleteElement.setAttribute(
                    'aria-label',
                    'Search and select venue address',
                );
                autocompleteElement.setAttribute(
                    'placeholder',
                    'Search venue address',
                );
                autocompleteElement.className =
                    placeAutocompleteElementClassName;
                autocompleteElement.style.colorScheme = 'light';

                selectListener = (event: Event) => {
                    const placeEvent = event as Event & {
                        place?: {
                            formattedAddress?: string;
                            formatted_address?: string;
                            fetchFields?: (request: {
                                fields: string[];
                            }) => Promise<void>;
                        };
                        placePrediction?: {
                            toPlace?: () => {
                                formattedAddress?: string;
                                formatted_address?: string;
                                fetchFields?: (request: {
                                    fields: string[];
                                }) => Promise<void>;
                            };
                        };
                        detail?: {
                            place?: {
                                formattedAddress?: string;
                                formatted_address?: string;
                                fetchFields?: (request: {
                                    fields: string[];
                                }) => Promise<void>;
                            };
                            placePrediction?: {
                                toPlace?: () => {
                                    formattedAddress?: string;
                                    formatted_address?: string;
                                    fetchFields?: (request: {
                                        fields: string[];
                                    }) => Promise<void>;
                                };
                            };
                        };
                    };

                    const place =
                        placeEvent.place ??
                        placeEvent.detail?.place ??
                        placeEvent.placePrediction?.toPlace?.() ??
                        placeEvent.detail?.placePrediction?.toPlace?.();

                    if (!place) {
                        return;
                    }

                    if (typeof place.fetchFields === 'function') {
                        void place
                            .fetchFields({ fields: ['formattedAddress'] })
                            .then(() =>
                                applyFormattedAddressFromPlace(place),
                            )
                            .catch((error: unknown) => {
                                console.error(
                                    '[WorkRequest] Failed to fetch selected place fields',
                                    error,
                                );
                                applyFormattedAddressFromPlace(place);
                            });
                        return;
                    }

                    applyFormattedAddressFromPlace(place);
                };

                errorListener = () => {
                    setAutocompleteScriptFailed(true);
                };

                autocompleteElement.addEventListener(
                    'gmp-select',
                    selectListener,
                );
                autocompleteElement.addEventListener(
                    'gmp-placeselect',
                    selectListener,
                );
                autocompleteElement.addEventListener('gmp-error', errorListener);

                container.replaceChildren(autocompleteElement);
                placeAutocompleteElementRef.current = autocompleteElement;

                setAutocompleteScriptFailed(false);
            })
            .catch((error: unknown) => {
                if (!isMounted) {
                    return;
                }

                // Surface the underlying Google Maps failure in the browser console
                // (referrer restrictions, API restrictions, billing, etc.).
                console.error(
                    '[WorkRequest] Google Places autocomplete failed to load',
                    error,
                );
                setAutocompleteScriptFailed(true);
            });

        return () => {
            isMounted = false;

            if (placeAutocompleteElementRef.current) {
                if (selectListener) {
                    placeAutocompleteElementRef.current.removeEventListener(
                        'gmp-select',
                        selectListener,
                    );
                    placeAutocompleteElementRef.current.removeEventListener(
                        'gmp-placeselect',
                        selectListener,
                    );
                }

                if (errorListener) {
                    placeAutocompleteElementRef.current.removeEventListener(
                        'gmp-error',
                        errorListener,
                    );
                }

                placeAutocompleteElementRef.current.remove();
            }

            placeAutocompleteElementRef.current = null;
            container.replaceChildren();
        };
    }, [
        applyFormattedAddressFromPlace,
        placeAutocompleteElementClassName,
        shouldRenderPlacesAutocomplete,
    ]);

    useEffect(() => {
        if (placeAutocompleteElementRef.current) {
            placeAutocompleteElementRef.current.className =
                placeAutocompleteElementClassName;
        }
    }, [placeAutocompleteElementClassName]);

    const venueAddressAutocompleteMessage =
        formData.venueType !== 'Other'
            ? null
            : !placesAutocompleteConfigured
              ? 'Address autocomplete is unavailable because the Google Maps API key is not configured.'
            : autocompleteScriptFailed
                ? 'Address autocomplete could not load. You can still type the venue address manually.'
                : null;

    return (
        <div className="space-y-6">
            <SectionHeader title="Event Details" />

            {/* Event Name/Title */}
            <div>
                <p className="text-xs text-slate-500">
                    This will be the official title for your event on all
                    platforms.
                </p>
                <div className="mt-2">
                    <FloatingLabelInput
                        id="event-name"
                        label="Event Name/Title"
                        required
                        value={formData.eventName}
                        onChange={(e) =>
                            updateFormData('eventName', e.target.value)
                        }
                        error={errors.eventName}
                    />
                </div>
            </div>

            {/* Are you the Event Organiser? */}
            <div>
                <Label className="text-sm font-medium text-slate-700">
                    Are you the Event Organiser? <Required />
                </Label>
                <RadioGroup
                    name="is-user-organiser"
                    options={['Yes', 'No']}
                    columns={2}
                    value={formData.isUserOrganiser}
                    onChange={(value) => {
                        updateFormData('isUserOrganiser', value);
                        // Auto-populate if Yes
                        if (value === 'Yes') {
                            updateFormData(
                                'organiserFirstName',
                                formData.firstName,
                            );
                            updateFormData(
                                'organiserLastName',
                                formData.lastName,
                            );
                            updateFormData('organiserEmail', formData.email);
                            updateFormData('organiserCell', formData.cellphone);
                        }
                    }}
                    error={errors.isUserOrganiser}
                />
            </div>

            {/* Organiser Details - Show if No */}
            {formData.isUserOrganiser === 'No' && (
                <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-700">
                        Event Organiser Details
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                        <FloatingLabelInput
                            id="organiser-first-name"
                            label="Event Organiser First Name"
                            required
                            value={formData.organiserFirstName}
                            onChange={(e) =>
                                updateFormData(
                                    'organiserFirstName',
                                    e.target.value,
                                )
                            }
                            error={errors.organiserFirstName}
                            labelBackgroundClassName="bg-slate-50"
                        />

                        <FloatingLabelInput
                            id="organiser-last-name"
                            label="Event Organiser Last Name"
                            required
                            value={formData.organiserLastName}
                            onChange={(e) =>
                                updateFormData(
                                    'organiserLastName',
                                    e.target.value,
                                )
                            }
                            error={errors.organiserLastName}
                            labelBackgroundClassName="bg-slate-50"
                        />

                        <FloatingLabelInput
                            id="organiser-email"
                            label="Email"
                            required
                            type="email"
                            value={formData.organiserEmail}
                            onChange={(e) =>
                                updateFormData('organiserEmail', e.target.value)
                            }
                            error={errors.organiserEmail}
                            labelBackgroundClassName="bg-slate-50"
                        />

                        <div>
                            <Label
                                htmlFor="organiser-cell-local-number"
                                className="text-sm font-medium text-slate-700"
                            >
                                Cell Number <Required />
                            </Label>
                            <div className="mt-2 grid grid-cols-[minmax(12rem,14rem)_minmax(0,1fr)] gap-2">
                                <div className="relative">
                                    <select
                                        id="organiser-cell-country-code"
                                        aria-label="Organiser cell number country code"
                                        className={`h-12 w-full appearance-none rounded-lg border-2 bg-slate-100/50 pr-12 pl-4 text-sm text-slate-900 shadow-sm transition focus-visible:border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:outline-none ${organiserCellInvalid ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`}
                                        value={organiserCellParts.countryCode}
                                        onChange={(e) =>
                                            updateFormData(
                                                'organiserCell',
                                                combinePhoneNumber(
                                                    e.target.value,
                                                    organiserCellParts.localNumber,
                                                ),
                                            )
                                        }
                                    >
                                        {organiserCellCountryCodeOptions.map(
                                            (option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-slate-500" />
                                </div>
                                <input
                                    id="organiser-cell-local-number"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel-national"
                                    aria-invalid={organiserCellInvalid}
                                    className={`h-12 rounded-lg border-2 bg-slate-100/50 px-4 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:outline-none ${organiserCellInvalid ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`}
                                    placeholder={phonePlaceholderByCountryCode(
                                        organiserCellParts.countryCode,
                                    )}
                                    value={organiserCellParts.localNumber}
                                    onChange={(e) =>
                                        updateFormData(
                                            'organiserCell',
                                            combinePhoneNumber(
                                                organiserCellParts.countryCode,
                                                e.target.value,
                                            ),
                                        )
                                    }
                                />
                            </div>
                            <FieldError error={errors.organiserCell} />
                        </div>
                    </div>
                </div>
            )}

            {/* Organiser Details - Show if Yes (read-only display) */}
            {formData.isUserOrganiser === 'Yes' && (
                <div className="space-y-2 rounded-lg border border-sage-200 bg-sage-50 p-4">
                    <p className="text-sm font-medium text-slate-700">
                        Event Organiser Details
                    </p>
                    <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                        <div>
                            <span className="font-medium">Name:</span>{' '}
                            {formData.firstName} {formData.lastName}
                        </div>
                        <div>
                            <span className="font-medium">Email:</span>{' '}
                            {formData.email}
                        </div>
                        <div>
                            <span className="font-medium">Cell:</span>{' '}
                            {formData.cellphone}
                        </div>
                    </div>
                </div>
            )}

            {/* Event Schedule */}
            <div>
                <Label className="text-sm font-medium text-slate-700">
                    Event Schedule <Required />
                </Label>
                <p className="mt-1 text-xs text-slate-500">
                    Choose the schedule type first, then complete the required
                    date and time fields for that selection.
                </p>
                <RadioGroup
                    name="event-schedule-type"
                    options={[
                        singleMultipleDayScheduleOption,
                        outreachCampScheduleOption,
                    ]}
                    columns={2}
                    value={formData.eventScheduleType}
                    onChange={(value) => {
                        updateFormData('eventScheduleType', value);

                        if (value === singleMultipleDayScheduleOption) {
                            updateFormData('outreachCampStartDate', '');
                            updateFormData('outreachCampStartTime', '');
                            updateFormData('outreachCampEndDate', '');
                            updateFormData('outreachCampEndTime', '');

                            if (formData.eventDates.length === 0) {
                                applyEventDates([
                                    { date: '', startTime: '', endTime: '' },
                                ]);
                                return;
                            }

                            applyEventDates(formData.eventDates);
                            return;
                        }

                        updateFormData('eventDates', []);
                        syncOutreachCampDerivedValues(
                            formData.outreachCampStartDate,
                            formData.outreachCampStartTime,
                            formData.outreachCampEndDate,
                            formData.outreachCampEndTime,
                        );
                    }}
                    error={errors.eventScheduleType}
                />

                {formData.eventScheduleType ===
                    singleMultipleDayScheduleOption && (
                    <div className="mt-3 space-y-3">
                        <div className="flex items-center justify-end gap-3">
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                {eventScheduleLabel}
                            </span>
                        </div>
                        {formData.eventDates.map((dateEntry, index) => (
                            <div
                                key={index}
                                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                            >
                                <div className="flex items-end gap-4">
                                    <div className="flex-1">
                                        <Label className="text-xs text-slate-600">
                                            Start Date
                                        </Label>
                                        <input
                                            type="date"
                                            min={todayIsoDate}
                                            className={dateInputBase}
                                            value={dateEntry.date}
                                            onChange={(e) => {
                                                const newDates = [
                                                    ...formData.eventDates,
                                                ];
                                                newDates[index] = {
                                                    ...newDates[index],
                                                    date: e.target.value,
                                                };
                                                applyEventDates(newDates);
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-xs text-slate-600">
                                            Start Time
                                        </Label>
                                        <input
                                            type="time"
                                            className={dateInputBase}
                                            value={dateEntry.startTime}
                                            onChange={(e) => {
                                                const newDates = [
                                                    ...formData.eventDates,
                                                ];
                                                newDates[index] = {
                                                    ...newDates[index],
                                                    startTime: e.target.value,
                                                };
                                                applyEventDates(newDates);
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-xs text-slate-600">
                                            End Time
                                        </Label>
                                        <input
                                            type="time"
                                            className={dateInputBase}
                                            value={dateEntry.endTime}
                                            onChange={(e) => {
                                                const newDates = [
                                                    ...formData.eventDates,
                                                ];
                                                newDates[index] = {
                                                    ...newDates[index],
                                                    endTime: e.target.value,
                                                };
                                                applyEventDates(newDates);
                                            }}
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        type="button"
                                        onClick={() => {
                                            const newDates =
                                                formData.eventDates.filter(
                                                    (_, i) => i !== index,
                                                );
                                            applyEventDates(newDates);
                                        }}
                                        disabled={
                                            formData.eventDates.length <= 1
                                        }
                                    >
                                        <Minus className="size-4 text-red-600" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {formData.eventDates.length === 0 ? (
                            <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() =>
                                    applyEventDates([
                                        {
                                            date: '',
                                            startTime: '',
                                            endTime: '',
                                        },
                                    ])
                                }
                            >
                                <Plus className="mr-2 size-4" />
                                Add Event Schedule
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() =>
                                    applyEventDates([
                                        ...formData.eventDates,
                                        {
                                            date: '',
                                            startTime: '',
                                            endTime: '',
                                        },
                                    ])
                                }
                            >
                                <Plus className="mr-2 size-4" />
                                Add Another Schedule
                            </Button>
                        )}

                        <FieldError error={errors.eventDates} />
                    </div>
                )}

                {formData.eventScheduleType === outreachCampScheduleOption && (
                    <div className="mt-3">
                        <p className="text-xs text-slate-500">
                            Provide the full outreach/camp range: start
                            date/time and end date/time.
                        </p>
                        <div className="mt-2 grid gap-4 md:grid-cols-2">
                            <div>
                                <Label className="text-xs text-slate-600">
                                    Start Date
                                </Label>
                                <input
                                    type="date"
                                    min={todayIsoDate}
                                    className={dateInputBase}
                                    value={formData.outreachCampStartDate}
                                    onChange={(e) => {
                                        const nextStartDate = e.target.value;
                                        updateFormData(
                                            'outreachCampStartDate',
                                            nextStartDate,
                                        );
                                        syncOutreachCampDerivedValues(
                                            nextStartDate,
                                            formData.outreachCampStartTime,
                                            formData.outreachCampEndDate,
                                            formData.outreachCampEndTime,
                                        );
                                    }}
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-slate-600">
                                    Start Time
                                </Label>
                                <input
                                    type="time"
                                    className={dateInputBase}
                                    value={formData.outreachCampStartTime}
                                    onChange={(e) => {
                                        const nextStartTime = e.target.value;
                                        updateFormData(
                                            'outreachCampStartTime',
                                            nextStartTime,
                                        );
                                        syncOutreachCampDerivedValues(
                                            formData.outreachCampStartDate,
                                            nextStartTime,
                                            formData.outreachCampEndDate,
                                            formData.outreachCampEndTime,
                                        );
                                    }}
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-slate-600">
                                    End Date
                                </Label>
                                <input
                                    type="date"
                                    min={todayIsoDate}
                                    className={dateInputBase}
                                    value={formData.outreachCampEndDate}
                                    onChange={(e) => {
                                        const nextEndDate = e.target.value;
                                        updateFormData(
                                            'outreachCampEndDate',
                                            nextEndDate,
                                        );
                                        syncOutreachCampDerivedValues(
                                            formData.outreachCampStartDate,
                                            formData.outreachCampStartTime,
                                            nextEndDate,
                                            formData.outreachCampEndTime,
                                        );
                                    }}
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-slate-600">
                                    End Time
                                </Label>
                                <input
                                    type="time"
                                    className={dateInputBase}
                                    value={formData.outreachCampEndTime}
                                    onChange={(e) => {
                                        const nextEndTime = e.target.value;
                                        updateFormData(
                                            'outreachCampEndTime',
                                            nextEndTime,
                                        );
                                        syncOutreachCampDerivedValues(
                                            formData.outreachCampStartDate,
                                            formData.outreachCampStartTime,
                                            formData.outreachCampEndDate,
                                            nextEndTime,
                                        );
                                    }}
                                />
                            </div>
                        </div>
                        <FieldError error={errors.outreachCampStartDate} />
                        <FieldError error={errors.outreachCampEndDate} />
                    </div>
                )}
            </div>

            {/* Announcement Date */}
            <div>
                <Label
                    htmlFor="announcement-date"
                    className="text-sm font-medium text-slate-700"
                >
                    Announcement Date <Required />
                </Label>
                <p className="mt-1 text-xs text-slate-500">
                    Must be at least 1 week before the event start date
                </p>
                <input
                    id="announcement-date"
                    type="date"
                    min={todayIsoDate}
                    aria-invalid={Boolean(errors.announcementDate)}
                    className={`${dateInputBase} ${
                        errors.announcementDate
                            ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500'
                            : ''
                    }`}
                    value={formData.announcementDate}
                    onChange={(e) =>
                        updateFormData('announcementDate', e.target.value)
                    }
                />
                <FieldError error={errors.announcementDate} />
            </div>

            {/* Venue */}
            <div>
                <Label className="text-sm font-medium text-slate-700">
                    Venue <Required />
                </Label>
                <RadioGroup
                    name="venue-type"
                    options={['JG Venue', 'Other']}
                    columns={2}
                    value={formData.venueType}
                    onChange={(value) => {
                        updateFormData('venueType', value);
                        if (value !== 'Other') {
                            setUseManualVenueAddressEntry(false);
                        }
                    }}
                    error={errors.venueType}
                />
            </div>

            {/* JG Venue Dropdown */}
            {formData.venueType === 'JG Venue' && (
                <div>
                    <Label
                        htmlFor="jg-venue"
                        className="text-sm font-medium text-slate-700"
                    >
                        Select JG Venue <Required />
                    </Label>
                    <select
                        id="jg-venue"
                        aria-invalid={Boolean(errors.jgVenue)}
                        className={`${selectBase} ${
                            errors.jgVenue
                                ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500'
                                : ''
                        }`}
                        value={formData.jgVenue}
                        onChange={(e) =>
                            updateFormData('jgVenue', e.target.value)
                        }
                    >
                        <option value="">Select a JG Venue</option>
                        {availableVenues.map((venue) => (
                            <option key={venue} value={venue}>
                                {venue}
                            </option>
                        ))}
                    </select>
                    <FieldError error={errors.jgVenue} />
                </div>
            )}

            {/* Other Venue - Name and Address */}
            {formData.venueType === 'Other' && (
                <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <FloatingLabelInput
                        id="other-venue-name"
                        label="Venue Name"
                        required
                        value={formData.otherVenueName}
                        onChange={(e) =>
                            updateFormData('otherVenueName', e.target.value)
                        }
                        error={errors.otherVenueName}
                        labelBackgroundClassName="bg-slate-50"
                    />

                    {shouldRenderPlacesAutocomplete && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <Label className="text-sm font-medium text-slate-700">
                                    Venue Address <Required />
                                </Label>
                                <button
                                    type="button"
                                    className="text-xs font-medium text-blue-600 hover:underline"
                                    onClick={() =>
                                        setUseManualVenueAddressEntry(true)
                                    }
                                >
                                    Enter manually
                                </button>
                            </div>
                            <div
                                ref={placeAutocompleteContainerRef}
                                className="min-h-12"
                            />
                            {formData.otherVenueAddress.trim() !== '' ? (
                                <p className="text-xs text-slate-500">
                                    Selected address:{' '}
                                    {formData.otherVenueAddress}
                                </p>
                            ) : (
                                <p className="text-xs text-slate-500">
                                    Start typing and choose a venue address from
                                    the suggestions.
                                </p>
                            )}
                            <FieldError error={errors.otherVenueAddress} />
                        </div>
                    )}

                    {shouldRenderManualVenueAddressInput && (
                        <div className="space-y-2">
                            <FloatingLabelInput
                                id="other-venue-address"
                                label="Venue Address"
                                required
                                value={formData.otherVenueAddress}
                                onChange={(e) =>
                                    updateFormData(
                                        'otherVenueAddress',
                                        e.target.value,
                                    )
                                }
                                error={errors.otherVenueAddress}
                                labelBackgroundClassName="bg-slate-50"
                            />
                            {canUsePlacesAutocomplete &&
                            useManualVenueAddressEntry ? (
                                <div className="text-right">
                                    <button
                                        type="button"
                                        className="text-xs font-medium text-blue-600 hover:underline"
                                        onClick={() =>
                                            setUseManualVenueAddressEntry(false)
                                        }
                                    >
                                        Use autocomplete instead
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}
                    {venueAddressAutocompleteMessage ? (
                        <p className="text-xs text-slate-500">
                            {venueAddressAutocompleteMessage}
                        </p>
                    ) : null}
                </div>
            )}

            {/* Event Reach */}
            <div>
                <Label
                    htmlFor="event-reach"
                    className="text-sm font-medium text-slate-700"
                >
                    Event Reach <Required />
                </Label>
                <select
                    id="event-reach"
                    aria-invalid={Boolean(errors.eventReach)}
                    className={`${selectBase} ${
                        errors.eventReach
                            ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500'
                            : ''
                    }`}
                    value={formData.eventReach}
                    onChange={(e) => {
                        const value = e.target.value;
                        updateFormData('eventReach', value);
                        if (value !== 'Hubs' && formData.hubs.length > 0) {
                            updateFormData('hubs', []);
                        }
                        if (
                            value !== 'Congregations' &&
                            formData.eventCongregations.length > 0
                        ) {
                            updateFormData('eventCongregations', []);
                        }
                    }}
                >
                    <option value="">Select an Option</option>
                    <option>South Africa</option>
                    <option>Hubs</option>
                    <option>Congregations</option>
                </select>
                <FieldError error={errors.eventReach} />
            </div>

            {/* Hubs Selection */}
            {formData.eventReach === 'Hubs' && (
                <div>
                    <Label className="text-sm font-medium text-slate-700">
                        Which hubs will this event be for? <Required />
                    </Label>
                    <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                        {availableHubs.map((hub) => (
                            <label
                                key={hub}
                                className="flex items-center gap-2"
                            >
                                <Checkbox
                                    checked={formData.hubs.includes(hub)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            updateFormData('hubs', [
                                                ...formData.hubs,
                                                hub,
                                            ]);
                                        } else {
                                            updateFormData(
                                                'hubs',
                                                formData.hubs.filter(
                                                    (h) => h !== hub,
                                                ),
                                            );
                                        }
                                    }}
                                />
                                <span>{hub}</span>
                            </label>
                        ))}
                    </div>
                    <FieldError error={errors.hubs} />
                </div>
            )}

            {/* Congregations Selection */}
            {formData.eventReach === 'Congregations' && (
                <div>
                    <Label className="text-sm font-medium text-slate-700">
                        Which congregations will this event be for? <Required />
                    </Label>
                    <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                        {availableCongregations.map((cong) => (
                            <label
                                key={cong}
                                className="flex items-center gap-2"
                            >
                                <Checkbox
                                    checked={formData.eventCongregations.includes(
                                        cong,
                                    )}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            updateFormData(
                                                'eventCongregations',
                                                [
                                                    ...formData.eventCongregations,
                                                    cong,
                                                ],
                                            );
                                        } else {
                                            updateFormData(
                                                'eventCongregations',
                                                formData.eventCongregations.filter(
                                                    (selectedCongregation) =>
                                                        selectedCongregation !==
                                                        cong,
                                                ),
                                            );
                                        }
                                    }}
                                />
                                <span>{cong}</span>
                            </label>
                        ))}
                    </div>
                    <FieldError error={errors.eventCongregations} />
                </div>
            )}

            {(isDirectoryLoading || directoryWarning) && (
                <p className="text-xs text-slate-500">
                    {isDirectoryLoading
                        ? 'Loading JG directory options...'
                        : directoryWarning}
                </p>
            )}

            {/* Child Minding */}
            <div>
                <Label className="text-sm font-medium text-slate-700">
                    Will your event offer child-minding? <Required />
                </Label>
                <RadioGroup
                    name="child-minding"
                    options={['Yes', 'No']}
                    columns={2}
                    value={formData.childMinding}
                    onChange={(value) => updateFormData('childMinding', value)}
                    error={errors.childMinding}
                />
            </div>

            {/* Child Minding Description */}
            {formData.childMinding === 'Yes' && (
                <div>
                    <p className="text-xs text-slate-500">
                        Please give a detailed description of the child minding
                        you will be offering.
                    </p>
                    <div className="mt-2">
                        <FloatingLabelTextarea
                            id="child-minding-description"
                            label="Child-minding description"
                            required
                            value={formData.childMindingDescription}
                            onChange={(e) =>
                                updateFormData(
                                    'childMindingDescription',
                                    e.target.value,
                                )
                            }
                            error={errors.childMindingDescription}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
