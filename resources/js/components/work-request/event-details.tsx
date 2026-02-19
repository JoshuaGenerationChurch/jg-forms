import { ChevronDown, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import {
    congregationOptions,
    dateInputBase,
    hubOptions,
    selectBase,
} from './types';
import type { FormPageProps } from './types';

type DirectoryResponse = {
    hubs?: string[];
    venues?: string[];
    congregations?: string[];
};

const defaultVenueOptions = ['Venue 1', 'Venue 2', 'Venue 3'];

const sanitizeList = (values: unknown): string[] => {
    if (!Array.isArray(values)) {
        return [];
    }

    const cleanValues = values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    return Array.from(new Set(cleanValues));
};

export function EventDetails({
    formData,
    updateFormData,
    errors = {},
}: FormPageProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIsoDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000,
    )
        .toISOString()
        .slice(0, 10);
    const organiserCellParts = splitPhoneNumber(formData.organiserCell);
    const organiserCellCountryCodeOptions = countryCodeOptionsWithCurrent(
        organiserCellParts.countryCode,
    );
    const organiserCellInvalid = Boolean(errors.organiserCell);
    const [availableHubs, setAvailableHubs] = useState<string[]>(hubOptions);
    const [availableCongregations, setAvailableCongregations] =
        useState<string[]>(congregationOptions);
    const [availableVenues, setAvailableVenues] =
        useState<string[]>(defaultVenueOptions);
    const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
    const [directoryWarning, setDirectoryWarning] = useState<string | null>(
        null,
    );

    useEffect(() => {
        let cancelled = false;

        const loadDirectoryOptions = async () => {
            setIsLoadingDirectory(true);
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
                const hubs = sanitizeList(payload.hubs);
                const venues = sanitizeList(payload.venues);
                const congregations = sanitizeList(payload.congregations);

                if (cancelled) {
                    return;
                }

                if (hubs.length > 0) {
                    setAvailableHubs(hubs);
                }

                if (venues.length > 0) {
                    setAvailableVenues(venues);
                }

                if (congregations.length > 0) {
                    setAvailableCongregations(congregations);
                }

                if (
                    hubs.length === 0 ||
                    venues.length === 0 ||
                    congregations.length === 0
                ) {
                    setDirectoryWarning(
                        'Using local fallback options while JG API data is unavailable.',
                    );
                }
            } catch {
                if (!cancelled) {
                    setDirectoryWarning(
                        'Could not load JG API options. Using local fallback options.',
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingDirectory(false);
                }
            }
        };

        void loadDirectoryOptions();

        return () => {
            cancelled = true;
        };
    }, []);

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
                                        className={`h-12 w-full appearance-none rounded-lg border-2 bg-slate-100/50 pl-4 pr-12 text-sm text-slate-900 shadow-sm transition focus-visible:border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:outline-none ${organiserCellInvalid ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`}
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
                    <FieldError error={errors.eventStartDate} />
                </div>
            )}

            {/* Event Duration */}
            <div>
                <Label className="text-sm font-medium text-slate-700">
                    Event Duration <Required />
                </Label>
                <RadioGroup
                    name="event-duration"
                    options={['One Day Event', 'Multiple Day Event']}
                    columns={2}
                    value={formData.eventDuration}
                    onChange={(value) => updateFormData('eventDuration', value)}
                    error={errors.eventDuration}
                />
            </div>

            {/* One Day Event - Date and Time Fields */}
            {formData.eventDuration === 'One Day Event' && (
                <div>
                    <Label className="text-sm font-medium text-slate-700">
                        Event Date & Time <Required />
                    </Label>
                    <div className="mt-2 flex gap-4">
                        <div className="flex-1">
                            <Label className="text-xs text-slate-600">
                                Date
                            </Label>
                            <input
                                type="date"
                                min={todayIsoDate}
                                aria-invalid={Boolean(errors.eventStartDate)}
                                className={`${dateInputBase} ${
                                    errors.eventStartDate
                                        ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500'
                                        : ''
                                }`}
                                value={
                                    formData.eventStartDate?.split('T')[0] || ''
                                }
                                onChange={(e) => {
                                    const startTime =
                                        formData.eventStartDate?.split(
                                            'T',
                                        )[1] || '09:00';
                                    const endTime =
                                        formData.eventEndDate?.split('T')[1] ||
                                        '17:00';
                                    updateFormData(
                                        'eventStartDate',
                                        `${e.target.value}T${startTime}`,
                                    );
                                    updateFormData(
                                        'eventEndDate',
                                        `${e.target.value}T${endTime}`,
                                    );
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <Label className="text-xs text-slate-600">
                                Start Time
                            </Label>
                            <input
                                id="start-time"
                                type="time"
                                className={dateInputBase}
                                value={
                                    formData.eventStartDate?.split('T')[1] || ''
                                }
                                onChange={(e) => {
                                    const date =
                                        formData.eventStartDate?.split(
                                            'T',
                                        )[0] || '';
                                    updateFormData(
                                        'eventStartDate',
                                        `${date}T${e.target.value}`,
                                    );
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <Label className="text-xs text-slate-600">
                                End Time
                            </Label>
                            <input
                                id="end-time"
                                type="time"
                                className={dateInputBase}
                                value={
                                    formData.eventEndDate?.split('T')[1] || ''
                                }
                                onChange={(e) => {
                                    const date =
                                        formData.eventStartDate?.split(
                                            'T',
                                        )[0] || '';
                                    updateFormData(
                                        'eventEndDate',
                                        `${date}T${e.target.value}`,
                                    );
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Multiple Day Event - Repeater Fields */}
            {formData.eventDuration === 'Multiple Day Event' && (
                <div>
                    <Label className="text-sm font-medium text-slate-700">
                        Event Dates and Times <Required />
                    </Label>
                    <div className="mt-3 space-y-3">
                        {formData.eventDates.map((dateEntry, index) => (
                            <div key={index} className="flex items-end gap-4">
                                <div className="flex-1">
                                    <Label className="text-xs text-slate-600">
                                        Date
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
                                            newDates[index].date =
                                                e.target.value;
                                            updateFormData(
                                                'eventDates',
                                                newDates,
                                            );
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
                                            newDates[index].startTime =
                                                e.target.value;
                                            updateFormData(
                                                'eventDates',
                                                newDates,
                                            );
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
                                            newDates[index].endTime =
                                                e.target.value;
                                            updateFormData(
                                                'eventDates',
                                                newDates,
                                            );
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
                                        updateFormData('eventDates', newDates);
                                    }}
                                >
                                    <Minus className="size-4 text-red-600" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() =>
                                updateFormData('eventDates', [
                                    ...formData.eventDates,
                                    { date: '', startTime: '', endTime: '' },
                                ])
                            }
                        >
                            <Plus className="mr-2 size-4" />
                            Add Another Date
                        </Button>
                        <FieldError error={errors.eventDates} />
                    </div>
                </div>
            )}

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
                    onChange={(value) => updateFormData('venueType', value)}
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

                    <FloatingLabelInput
                        id="other-venue-address"
                        label="Venue Address"
                        required
                        value={formData.otherVenueAddress}
                        onChange={(e) =>
                            updateFormData('otherVenueAddress', e.target.value)
                        }
                        error={errors.otherVenueAddress}
                        labelBackgroundClassName="bg-slate-50"
                    />
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
                    onChange={(e) =>
                        updateFormData('eventReach', e.target.value)
                    }
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
                                    checked={formData.hubs.includes(cong)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            updateFormData('hubs', [
                                                ...formData.hubs,
                                                cong,
                                            ]);
                                        } else {
                                            updateFormData(
                                                'hubs',
                                                formData.hubs.filter(
                                                    (h) => h !== cong,
                                                ),
                                            );
                                        }
                                    }}
                                />
                                <span>{cong}</span>
                            </label>
                        ))}
                    </div>
                    <FieldError error={errors.hubs} />
                </div>
            )}

            {(isLoadingDirectory || directoryWarning) && (
                <p className="text-xs text-slate-500">
                    {isLoadingDirectory
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
