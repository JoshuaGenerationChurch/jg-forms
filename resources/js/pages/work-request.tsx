import { Head } from '@inertiajs/react';
import { Minus, Plus, Save } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// Type definitions
interface FormData {
    // Page 2: Nature of Request (checkboxes)
    includesDatesVenue: boolean;
    includesRegistration: boolean;
    includesGraphics: boolean;
    includesGraphicsDigital: boolean;
    includesGraphicsPrint: boolean;
    includesSignage: boolean;
    includesVideoFilm: boolean;

    // Page 2: Contact Details
    firstName: string;
    lastName: string;
    cellphone: string;
    email: string;
    roleInChurch: string;
    otherRole: string;
    congregation: string;
    requestSummary: string;
    theme: string;

    // Page 3: Event Details
    eventName: string;
    isUserOrganiser: string;
    organiserFirstName: string;
    organiserLastName: string;
    organiserEmail: string;
    organiserCell: string;
    eventDuration: string;
    eventStartDate: string;
    eventEndDate: string;
    eventDates: Array<{ date: string; startTime: string; endTime: string }>;
    announcementDate: string;
    venueType: string;
    jgVenue: string;
    otherVenueName: string;
    otherVenueAddress: string;
    eventReach: string;
    hubs: string[];
    childMinding: string;
    childMindingDescription: string;

    // Page 4: Event Registration
    quicketDescription: string;
    ticketPriceIncludesFee: string;
    ticketTypes: {
        adults18Plus: boolean;
        adults13Plus: boolean;
        children4to12: boolean;
        children0to3: boolean;
        other: boolean;
    };
    ticketPrices: {
        adults18Plus: string;
        adults13Plus: string;
        children4to12: string;
        children0to3: string;
    };
    ticketQuantities: {
        adults18Plus: string;
        adults13Plus: string;
        children4to12: string;
        children0to3: string;
    };
    otherTickets: Array<{ name: string; price: string; quantity: string }>;
    infoToCollect: {
        name: boolean;
        lastName: boolean;
        email: boolean;
        cellphone: boolean;
        congregation: boolean;
        functionInChurch: boolean;
        allergies: boolean;
        other: boolean;
    };
    otherInfoFields: string[];
    allowDonations: string;
    registrationClosingDate: string;

    // Page 5: Video/Film Project
    filmMedium: string;
    projectDescription: string;
    distribution: string;
    intendedAudience: string;
    videoContent: string;
    companionDocuments: string;
    dateNeeded: string;

    // Page 6: Graphics
    graphicsWhatsApp: boolean;
    graphicsInstagram: boolean;
    graphicsAVSlide: boolean;
    graphicsOther: string;

    // Page 7: Digital Media
    digitalScope: string;
    digitalWhatsApp: boolean;
    digitalInstagram: boolean;
    digitalOther: string;

    // Page 8: Signage
    signageScope: string;
    signageTypes: string[];
    sharkfinQty: string;
    fenceBannerQty: string;
    directionalSignsQty: string;
    buildingSignsQty: string;
    otherSignage: string;
    otherSignageQty: string;

    // Page 9: Print Media
    printTypes: string[];
    printOther: string;
    printOtherQty: string;
    printA5Qty: string;
    printA6Qty: string;
    printA3Qty: string;
    printA4Qty: string;
    printCardsQty: string;
    termsAccepted: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Work Request',
        href: '/work-request',
    },
];

const roleOptions = [
    'Saint',
    'Community Leader',
    'Ministry Coordinator',
    'Ministry Leader',
    'Deacon',
    "Elder's wife",
    'Elder',
    'Other',
];

const hubOptions = [
    'Central RSA',
    'City Central',
    'Helderberg Basin',
    'Northern Suburbs',
    'Overberg',
    'Southern Cape',
    'Western Seaboard',
    'Winelands',
    'Zimbabwe',
];

const congregationOptions = [
    'Bethlehem',
    'Bloemfontein',
    'Bonnievale',
    'Bredasdorp',
    'City Bowl AM',
    'De Doorns',
    'Dunoon',
    'Durbanville AM',
    'Durbanville Central',
    'Durbanville PM',
    'Edgemead 08:30',
    'Edgemead 11 AM',
    'Edgemead PM',
    'George AM',
    'George PM',
    'Gordons Bay',
    'Grabouw',
    'Hartbees',
    'Hermanus',
    'Khayelitsha',
    'Kimberley',
    'Langebaan',
    'Malmesbury',
    'Melkbosstrand',
    'Milnerton',
    'Montagu',
    'Mossel Bay AM',
    'Mossel Bay PM',
    'Muizenberg',
    'Oudtshoorn',
    'Paarl',
    'Pinehurst PM',
    'Potchefstroom',
    'Robertson',
    'Sea Point',
    'Somerset West',
    'Sonskyn Vallei',
    'Stellenbosch AM',
    'Stellenbosch Central',
    'Stellenbosch PM',
    'Stilbaai',
    'Sunningdale 11AM',
    'Sunningdale 8:30AM',
    'Sunningdale PM',
    'Swellendam',
    'Wellington AM',
    'Wellington PM',
    'Willowmore',
    'Woodstock PM',
    'Worcester',
    'Wynberg',
    'Yzerfontein',
    'Zim - Harare - CBD',
    'Zim - Tafara',
];

const selectBase =
    'mt-2 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';
const textareaBase =
    'mt-2 min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';
const dateInputBase =
    'mt-2 h-9 w-full rounded-md border border-input bg-white px-3 text-sm shadow-xs transition-all duration-200 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] [color-scheme:light] cursor-pointer hover:border-slate-400 hover:shadow-sm';

function Required() {
    return <span className="ml-1 text-xs font-normal text-red-500">(Required)</span>;
}

function SectionHeader({ title }: { title: string }) {
    return (
        <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <div className="mt-2 h-px w-full bg-slate-200" />
        </div>
    );
}

function RadioGroup({
    name,
    options,
    columns = 1,
    value,
    onChange,
}: {
    name: string;
    options: string[];
    columns?: 1 | 2 | 3;
    value?: string;
    onChange?: (value: string) => void;
}) {
    return (
        <div
            className={`mt-2 grid gap-2 text-sm text-slate-700 ${
                columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-1'
            }`}
        >
            {options.map((option) => (
                <label key={option} className="flex items-center gap-2">
                    <input
                        type="radio"
                        name={name}
                        value={option}
                        checked={value === option}
                        onChange={(e) => onChange?.(e.target.value)}
                        className="h-4 w-4 rounded-full border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{option}</span>
                </label>
            ))}
        </div>
    );
}

export default function WorkRequest() {
    const [stepIndex, setStepIndex] = useState(0);
    const [formData, setFormData] = useState<FormData>({
        includesDatesVenue: false,
        includesRegistration: false,
        includesGraphics: false,
        includesGraphicsDigital: false,
        includesGraphicsPrint: false,
        includesSignage: false,
        includesVideoFilm: false,
        firstName: '',
        lastName: '',
        cellphone: '',
        email: '',
        roleInChurch: '',
        otherRole: '',
        congregation: '',
        requestSummary: '',
        theme: '',
        eventName: '',
        isUserOrganiser: '',
        organiserFirstName: '',
        organiserLastName: '',
        organiserEmail: '',
        organiserCell: '',
        eventDuration: '',
        eventStartDate: '',
        eventEndDate: '',
        eventDates: [],
        announcementDate: '',
        venueType: '',
        jgVenue: '',
        otherVenueName: '',
        otherVenueAddress: '',
        eventReach: '',
        hubs: [],
        childMinding: '',
        childMindingDescription: '',
        quicketDescription: '',
        ticketPriceIncludesFee: '',
        ticketTypes: {
            adults18Plus: false,
            adults13Plus: false,
            children4to12: false,
            children0to3: false,
            other: false,
        },
        ticketPrices: {
            adults18Plus: '',
            adults13Plus: '',
            children4to12: '',
            children0to3: '',
        },
        ticketQuantities: {
            adults18Plus: '',
            adults13Plus: '',
            children4to12: '',
            children0to3: '',
        },
        otherTickets: [],
        infoToCollect: {
            name: false,
            lastName: false,
            email: false,
            cellphone: false,
            congregation: false,
            functionInChurch: false,
            allergies: false,
            other: false,
        },
        otherInfoFields: [],
        allowDonations: '',
        registrationClosingDate: '',
        filmMedium: '',
        projectDescription: '',
        distribution: '',
        intendedAudience: '',
        videoContent: '',
        companionDocuments: '',
        dateNeeded: '',
        graphicsWhatsApp: false,
        graphicsInstagram: false,
        graphicsAVSlide: false,
        graphicsOther: '',
        digitalScope: '',
        digitalWhatsApp: false,
        digitalInstagram: false,
        digitalOther: '',
        signageScope: '',
        signageTypes: [],
        sharkfinQty: '',
        fenceBannerQty: '',
        directionalSignsQty: '',
        buildingSignsQty: '',
        otherSignage: '',
        otherSignageQty: '',
        printTypes: [],
        printOther: '',
        printOtherQty: '',
        printA5Qty: '',
        printA6Qty: '',
        printA3Qty: '',
        printA4Qty: '',
        printCardsQty: '',
        termsAccepted: false,
    });

    const updateFormData = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    }, []);

    // Determine which pages should be visible based on form data
    const visiblePages = useMemo(() => {
        const pages: string[] = ['contact', 'nature'];

        // Event Details page shows when dates/venue is checked
        if (formData.includesDatesVenue) {
            pages.push('event');
        }

        // Quicket Registration shows when registration is checked
        if (formData.includesRegistration) {
            pages.push('quicket');
        }

        // Digital Media page (when Graphics > Digital is selected)
        if (formData.includesGraphicsDigital) {
            pages.push('digital');
        }

        // Print Media page (when Graphics > Print is selected)
        if (formData.includesGraphicsPrint) {
            pages.push('print');
        }

        // Signage page
        if (formData.includesSignage) {
            pages.push('signage');
        }

        // Video/Film page
        if (formData.includesVideoFilm) {
            pages.push('film');
        }

        return pages;
    }, [formData]);

    const steps = useMemo(() => {
        const allPages = [
            {
                id: 'contact',
                title: 'Contact Details',
                content: (
                    <div className="space-y-6">
                        <SectionHeader title="Contact Details" />
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="first-name" className="text-sm font-medium text-slate-700">
                                    Name <Required />
                                </Label>
                                <Input
                                    id="first-name"
                                    className="mt-2"
                                    value={formData.firstName}
                                    onChange={(e) => updateFormData('firstName', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="last-name" className="text-sm font-medium text-slate-700">
                                    Last Name <Required />
                                </Label>
                                <Input
                                    id="last-name"
                                    className="mt-2"
                                    value={formData.lastName}
                                    onChange={(e) => updateFormData('lastName', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="cellphone" className="text-sm font-medium text-slate-700">
                                    Cellphone <Required />
                                </Label>
                                <Input
                                    id="cellphone"
                                    className="mt-2"
                                    value={formData.cellphone}
                                    onChange={(e) => updateFormData('cellphone', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                                    Email <Required />
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-2"
                                    value={formData.email}
                                    onChange={(e) => updateFormData('email', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="congregation" className="text-sm font-medium text-slate-700">
                                    Your Congregation (Pull JG API) <Required />
                                </Label>
                                <select
                                    id="congregation"
                                    className={selectBase}
                                    value={formData.congregation}
                                    onChange={(e) => updateFormData('congregation', e.target.value)}
                                >
                                    <option value="">Select an Option</option>
                                    {congregationOptions.map((cong) => (
                                        <option key={cong} value={cong}>
                                            {cong}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                id: 'nature',
                title: 'Nature of Your Request',
                content: (
                    <div className="space-y-6">
                        <SectionHeader title="Nature of Your Request" />
                        
                        {/* Note */}
                        <div className="rounded-lg bg-sage-50 p-4 text-sm text-slate-700">
                            Please note, one form will be submitted per request at a time.
                        </div>

                        {/* My request */}
                        <div>
                            <p className="mb-4 text-sm font-medium text-slate-700">My request:</p>
                            
                            <div className="space-y-4">
                                {/* Checkbox 1: Dates, Times, Venue */}
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="dates-venue"
                                        checked={formData.includesDatesVenue}
                                        onCheckedChange={(checked) => {
                                            updateFormData('includesDatesVenue', checked as boolean);
                                            // Reset registration checkbox if dates/venue is unchecked
                                            if (!checked) {
                                                updateFormData('includesRegistration', false);
                                            }
                                        }}
                                        className="mt-0.5"
                                    />
                                    <label htmlFor="dates-venue" className="text-sm text-slate-700">
                                        Includes Dates, Times and a venue/location
                                    </label>
                                </div>

                                {/* Conditional Checkbox: Registration Form */}
                                {formData.includesDatesVenue && (
                                    <div className="ml-8 flex items-start gap-3">
                                        <Checkbox
                                            id="registration"
                                            checked={formData.includesRegistration}
                                            onCheckedChange={(checked) =>
                                                updateFormData('includesRegistration', checked as boolean)
                                            }
                                            className="mt-0.5"
                                        />
                                        <label htmlFor="registration" className="text-sm text-slate-700">
                                            Includes a Registration Form
                                        </label>
                                    </div>
                                )}

                                {/* Checkbox 2: Graphics */}
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="graphics"
                                        checked={formData.includesGraphics}
                                        onCheckedChange={(checked) => {
                                            updateFormData('includesGraphics', checked as boolean);
                                            // Reset sub-checkboxes if graphics is unchecked
                                            if (!checked) {
                                                updateFormData('includesGraphicsDigital', false);
                                                updateFormData('includesGraphicsPrint', false);
                                            }
                                        }}
                                        className="mt-0.5"
                                    />
                                    <label htmlFor="graphics" className="text-sm text-slate-700">
                                        Includes Graphics
                                    </label>
                                </div>

                                {/* Conditional Sub-checkboxes: Digital and Print */}
                                {formData.includesGraphics && (
                                    <div className="ml-8 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="graphics-digital"
                                                checked={formData.includesGraphicsDigital}
                                                onCheckedChange={(checked) =>
                                                    updateFormData('includesGraphicsDigital', checked as boolean)
                                                }
                                                className="mt-0.5"
                                            />
                                            <label htmlFor="graphics-digital" className="text-sm text-slate-700">
                                                Digital
                                            </label>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="graphics-print"
                                                checked={formData.includesGraphicsPrint}
                                                onCheckedChange={(checked) =>
                                                    updateFormData('includesGraphicsPrint', checked as boolean)
                                                }
                                                className="mt-0.5"
                                            />
                                            <label htmlFor="graphics-print" className="text-sm text-slate-700">
                                                Print
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Checkbox 4: Signage */}
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="signage"
                                        checked={formData.includesSignage}
                                        onCheckedChange={(checked) =>
                                            updateFormData('includesSignage', checked as boolean)
                                        }
                                        className="mt-0.5"
                                    />
                                    <label htmlFor="signage" className="text-sm text-slate-700">
                                        Will include Signage (Banners, Sharkfins etc.)
                                    </label>
                                </div>

                                {/* Checkbox 5: Video/Film */}
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="video-film"
                                        checked={formData.includesVideoFilm}
                                        onCheckedChange={(checked) =>
                                            updateFormData('includesVideoFilm', checked as boolean)
                                        }
                                        className="mt-0.5"
                                    />
                                    <label htmlFor="video-film" className="text-sm text-slate-700">
                                        Will include video/film
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                id: 'event',
                title: 'Event Details',
                content: (
                    <div className="space-y-6">
                        <SectionHeader title="Event Details" />
                        
                        {/* Event Name/Title */}
                        <div>
                            <Label htmlFor="event-name" className="text-sm font-medium text-slate-700">
                                Event Name/Title <Required />
                            </Label>
                            <p className="mt-1 text-xs text-slate-500">
                                This will be the official title for your event on all platforms.
                            </p>
                            <Input
                                id="event-name"
                                className="mt-2"
                                value={formData.eventName}
                                onChange={(e) => updateFormData('eventName', e.target.value)}
                            />
                        </div>

                        {/* Are you the Event Organiser? */}
                        <div>
                            <Label className="text-sm font-medium text-slate-700">
                                Are you the Event Organiser? <Required />
                            </Label>
                            <RadioGroup
                                name="is-user-organiser"
                                options={['Yes', 'No']}
                                value={formData.isUserOrganiser}
                                onChange={(value) => {
                                    updateFormData('isUserOrganiser', value);
                                    // Auto-populate if Yes
                                    if (value === 'Yes') {
                                        updateFormData('organiserFirstName', formData.firstName);
                                        updateFormData('organiserLastName', formData.lastName);
                                        updateFormData('organiserEmail', formData.email);
                                        updateFormData('organiserCell', formData.cellphone);
                                    }
                                }}
                            />
                        </div>

                        {/* Organiser Details - Show if No */}
                        {formData.isUserOrganiser === 'No' && (
                            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-medium text-slate-700">Event Organiser Details</p>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="organiser-first-name" className="text-sm text-slate-700">
                                            Event Organiser First Name <Required />
                                        </Label>
                                        <Input
                                            id="organiser-first-name"
                                            className="mt-2"
                                            value={formData.organiserFirstName}
                                            onChange={(e) => updateFormData('organiserFirstName', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="organiser-last-name" className="text-sm text-slate-700">
                                            Event Organiser Last Name <Required />
                                        </Label>
                                        <Input
                                            id="organiser-last-name"
                                            className="mt-2"
                                            value={formData.organiserLastName}
                                            onChange={(e) => updateFormData('organiserLastName', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="organiser-email" className="text-sm text-slate-700">
                                            Email <Required />
                                        </Label>
                                        <Input
                                            id="organiser-email"
                                            type="email"
                                            className="mt-2"
                                            value={formData.organiserEmail}
                                            onChange={(e) => updateFormData('organiserEmail', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="organiser-cell" className="text-sm text-slate-700">
                                            Cell Number <Required />
                                        </Label>
                                        <Input
                                            id="organiser-cell"
                                            className="mt-2"
                                            value={formData.organiserCell}
                                            onChange={(e) => updateFormData('organiserCell', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Organiser Details - Show if Yes (read-only display) */}
                        {formData.isUserOrganiser === 'Yes' && (
                            <div className="space-y-2 rounded-lg border border-sage-200 bg-sage-50 p-4">
                                <p className="text-sm font-medium text-slate-700">Event Organiser Details</p>
                                <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                                    <div>
                                        <span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}
                                    </div>
                                    <div>
                                        <span className="font-medium">Email:</span> {formData.email}
                                    </div>
                                    <div>
                                        <span className="font-medium">Cell:</span> {formData.cellphone}
                                    </div>
                                </div>
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
                                value={formData.eventDuration}
                                onChange={(value) => updateFormData('eventDuration', value)}
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
                                        <Label className="text-xs text-slate-600">Date</Label>
                                        <input
                                            type="date"
                                            className={dateInputBase}
                                            value={formData.eventStartDate?.split('T')[0] || ''}
                                            onChange={(e) => {
                                                const startTime = formData.eventStartDate?.split('T')[1] || '09:00';
                                                const endTime = formData.eventEndDate?.split('T')[1] || '17:00';
                                                updateFormData('eventStartDate', `${e.target.value}T${startTime}`);
                                                updateFormData('eventEndDate', `${e.target.value}T${endTime}`);
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-xs text-slate-600">Start Time</Label>
                                        <input
                                            id="start-time"
                                            type="time"
                                            className={dateInputBase}
                                            value={formData.eventStartDate?.split('T')[1] || ''}
                                            onChange={(e) => {
                                                const date = formData.eventStartDate?.split('T')[0] || '';
                                                updateFormData('eventStartDate', `${date}T${e.target.value}`);
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-xs text-slate-600">End Time</Label>
                                        <input
                                            id="end-time"
                                            type="time"
                                            className={dateInputBase}
                                            value={formData.eventEndDate?.split('T')[1] || ''}
                                            onChange={(e) => {
                                                const date = formData.eventStartDate?.split('T')[0] || '';
                                                updateFormData('eventEndDate', `${date}T${e.target.value}`);
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
                                                <Label className="text-xs text-slate-600">Date</Label>
                                                <input
                                                    type="date"
                                                    className={dateInputBase}
                                                    value={dateEntry.date}
                                                    onChange={(e) => {
                                                        const newDates = [...formData.eventDates];
                                                        newDates[index].date = e.target.value;
                                                        updateFormData('eventDates', newDates);
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <Label className="text-xs text-slate-600">Start Time</Label>
                                                <input
                                                    type="time"
                                                    className={dateInputBase}
                                                    value={dateEntry.startTime}
                                                    onChange={(e) => {
                                                        const newDates = [...formData.eventDates];
                                                        newDates[index].startTime = e.target.value;
                                                        updateFormData('eventDates', newDates);
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <Label className="text-xs text-slate-600">End Time</Label>
                                                <input
                                                    type="time"
                                                    className={dateInputBase}
                                                    value={dateEntry.endTime}
                                                    onChange={(e) => {
                                                        const newDates = [...formData.eventDates];
                                                        newDates[index].endTime = e.target.value;
                                                        updateFormData('eventDates', newDates);
                                                    }}
                                                />
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                type="button"
                                                onClick={() => {
                                                    const newDates = formData.eventDates.filter((_, i) => i !== index);
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
                                        <Plus className="size-4 mr-2" />
                                        Add Another Date
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Announcement Date */}
                        <div>
                            <Label htmlFor="announcement-date" className="text-sm font-medium text-slate-700">
                                Announcement Date <Required />
                            </Label>
                            <p className="mt-1 text-xs text-slate-500">
                                Must be at least 1 week before the event start date
                            </p>
                            <input
                                id="announcement-date"
                                type="date"
                                className={dateInputBase}
                                value={formData.announcementDate}
                                onChange={(e) => updateFormData('announcementDate', e.target.value)}
                            />
                        </div>

                        {/* Venue */}
                        <div>
                            <Label className="text-sm font-medium text-slate-700">
                                Venue (Pull JG API) <Required />
                            </Label>
                            <RadioGroup
                                name="venue-type"
                                options={['JG Venue', 'Other']}
                                value={formData.venueType}
                                onChange={(value) => updateFormData('venueType', value)}
                            />
                        </div>

                        {/* JG Venue Dropdown */}
                        {formData.venueType === 'JG Venue' && (
                            <div>
                                <Label htmlFor="jg-venue" className="text-sm font-medium text-slate-700">
                                    Select JG Venue <Required />
                                </Label>
                                <select
                                    id="jg-venue"
                                    className={selectBase}
                                    value={formData.jgVenue}
                                    onChange={(e) => updateFormData('jgVenue', e.target.value)}
                                >
                                    <option value="">Select a JG Venue (API Placeholder)</option>
                                    <option>Venue 1</option>
                                    <option>Venue 2</option>
                                    <option>Venue 3</option>
                                </select>
                            </div>
                        )}

                        {/* Other Venue - Name and Address */}
                        {formData.venueType === 'Other' && (
                            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <div>
                                    <Label htmlFor="other-venue-name" className="text-sm text-slate-700">
                                        Venue Name <Required />
                                    </Label>
                                    <Input
                                        id="other-venue-name"
                                        className="mt-2"
                                        value={formData.otherVenueName}
                                        onChange={(e) => updateFormData('otherVenueName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="other-venue-address" className="text-sm text-slate-700">
                                        Venue Address <Required />
                                    </Label>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Google Maps Autocomplete (Placeholder)
                                    </p>
                                    <Input
                                        id="other-venue-address"
                                        className="mt-2"
                                        placeholder="Enter address..."
                                        value={formData.otherVenueAddress}
                                        onChange={(e) => updateFormData('otherVenueAddress', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <Label htmlFor="event-reach" className="text-sm font-medium text-slate-700">
                                Event Reach <Required />
                            </Label>
                            <select
                                id="event-reach"
                                className={selectBase}
                                value={formData.eventReach}
                                onChange={(e) => updateFormData('eventReach', e.target.value)}
                            >
                                <option value="">Select an Option</option>
                                <option>South Africa</option>
                                <option>Hubs</option>
                                <option>Congregations</option>
                            </select>
                        </div>
                        {formData.eventReach === 'Hubs' && (
                            <div>
                                <Label className="text-sm font-medium text-slate-700">
                                    Which hubs will this event be for? <Required />
                                </Label>
                                <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                                    {hubOptions.map((hub) => (
                                        <label key={hub} className="flex items-center gap-2">
                                            <Checkbox
                                                checked={formData.hubs.includes(hub)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        updateFormData('hubs', [...formData.hubs, hub]);
                                                    } else {
                                                        updateFormData(
                                                            'hubs',
                                                            formData.hubs.filter((h) => h !== hub),
                                                        );
                                                    }
                                                }}
                                            />
                                            <span>{hub}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        {formData.eventReach === 'Congregations' && (
                            <div>
                                <Label className="text-sm font-medium text-slate-700">
                                    Which congregations will this event be for? (Pull JG API) <Required />
                                </Label>
                                <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                                    {congregationOptions.map((cong) => (
                                        <label key={cong} className="flex items-center gap-2">
                                            <Checkbox
                                                checked={formData.hubs.includes(cong)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        updateFormData('hubs', [...formData.hubs, cong]);
                                                    } else {
                                                        updateFormData(
                                                            'hubs',
                                                            formData.hubs.filter((h) => h !== cong),
                                                        );
                                                    }
                                                }}
                                            />
                                            <span>{cong}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Child Minding */}
                        <div>
                            <Label className="text-sm font-medium text-slate-700">
                                Will your event offer child-minding? <Required />
                            </Label>
                            <RadioGroup
                                name="child-minding"
                                options={['Yes', 'No']}
                                value={formData.childMinding}
                                onChange={(value) => updateFormData('childMinding', value)}
                            />
                        </div>

                        {/* Child Minding Description */}
                        {formData.childMinding === 'Yes' && (
                            <div>
                                <Label htmlFor="child-minding-description" className="text-sm font-medium text-slate-700">
                                    Please give a detailed description of the child minding you will be offering <Required />
                                </Label>
                                <textarea
                                    id="child-minding-description"
                                    className={textareaBase}
                                    value={formData.childMindingDescription}
                                    onChange={(e) => updateFormData('childMindingDescription', e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                ),
            },
            {
                id: 'quicket',
                title: 'Event Registration Form',
                content: (
                    <div className="space-y-6">
                        <SectionHeader title="Event Registration Form" />
                        <div>
                            <Label htmlFor="quicket-description" className="text-sm font-medium text-slate-700">
                                Description <Required />
                            </Label>
                            <p className="mt-1 text-xs text-slate-500">
                                A brief description that will appear on your event form.
                            </p>
                            <textarea
                                id="quicket-description"
                                className={textareaBase}
                                value={formData.quicketDescription}
                                onChange={(e) => updateFormData('quicketDescription', e.target.value)}
                            />
                        </div>

                        {/* Ticket Types Section */}
                        <div>
                            <Label className="text-sm font-medium text-slate-700">
                                Ticket Types <Required />
                            </Label>
                            <div className="mt-4 space-y-4">
                                {/* Adults 18+ */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <Checkbox
                                            checked={formData.ticketTypes.adults18Plus}
                                            onCheckedChange={(checked) =>
                                                updateFormData('ticketTypes', {
                                                    ...formData.ticketTypes,
                                                    adults18Plus: checked as boolean,
                                                })
                                            }
                                        />
                                        <span className="font-medium">Adults (18+)</span>
                                    </label>
                                    {formData.ticketTypes.adults18Plus && (
                                        <div className="ml-6 grid gap-4 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="adults18-price" className="text-xs text-slate-600">
                                                    Price <Required />
                                                </Label>
                                                <Input
                                                    id="adults18-price"
                                                    type="number"
                                                    className="mt-1"
                                                    value={formData.ticketPrices.adults18Plus}
                                                    onChange={(e) =>
                                                        updateFormData('ticketPrices', {
                                                            ...formData.ticketPrices,
                                                            adults18Plus: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="adults18-qty" className="text-xs text-slate-600">
                                                    Quantity <Required />
                                                </Label>
                                                <Input
                                                    id="adults18-qty"
                                                    type="number"
                                                    className="mt-1"
                                                    value={formData.ticketQuantities.adults18Plus}
                                                    onChange={(e) =>
                                                        updateFormData('ticketQuantities', {
                                                            ...formData.ticketQuantities,
                                                            adults18Plus: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Adults 13+ */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <Checkbox
                                            checked={formData.ticketTypes.adults13Plus}
                                            onCheckedChange={(checked) =>
                                                updateFormData('ticketTypes', {
                                                    ...formData.ticketTypes,
                                                    adults13Plus: checked as boolean,
                                                })
                                            }
                                        />
                                        <span className="font-medium">Adults (13+)</span>
                                    </label>
                                    {formData.ticketTypes.adults13Plus && (
                                        <div className="ml-6 grid gap-4 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="adults13-price" className="text-xs text-slate-600">
                                                    Price <Required />
                                                </Label>
                                                <Input
                                                    id="adults13-price"
                                                    type="number"
                                                    className="mt-1"
                                                    value={formData.ticketPrices.adults13Plus}
                                                    onChange={(e) =>
                                                        updateFormData('ticketPrices', {
                                                            ...formData.ticketPrices,
                                                            adults13Plus: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="adults13-qty" className="text-xs text-slate-600">
                                                    Quantity <Required />
                                                </Label>
                                                <Input
                                                    id="adults13-qty"
                                                    type="number"
                                                    className="mt-1"
                                                    value={formData.ticketQuantities.adults13Plus}
                                                    onChange={(e) =>
                                                        updateFormData('ticketQuantities', {
                                                            ...formData.ticketQuantities,
                                                            adults13Plus: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Children 4-12 */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <Checkbox
                                            checked={formData.ticketTypes.children4to12}
                                            onCheckedChange={(checked) =>
                                                updateFormData('ticketTypes', {
                                                    ...formData.ticketTypes,
                                                    children4to12: checked as boolean,
                                                })
                                            }
                                        />
                                        <span className="font-medium">Children 4-12 years</span>
                                    </label>
                                    {formData.ticketTypes.children4to12 && (
                                        <div className="ml-6 grid gap-4 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="children4-price" className="text-xs text-slate-600">
                                                    Price <Required />
                                                </Label>
                                                <Input
                                                    id="children4-price"
                                                    type="number"
                                                    className="mt-1"
                                                    value={formData.ticketPrices.children4to12}
                                                    onChange={(e) =>
                                                        updateFormData('ticketPrices', {
                                                            ...formData.ticketPrices,
                                                            children4to12: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="children4-qty" className="text-xs text-slate-600">
                                                    Quantity <Required />
                                                </Label>
                                                <Input
                                                    id="children4-qty"
                                                    type="number"
                                                    className="mt-1"
                                                    value={formData.ticketQuantities.children4to12}
                                                    onChange={(e) =>
                                                        updateFormData('ticketQuantities', {
                                                            ...formData.ticketQuantities,
                                                            children4to12: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Children 0-3 */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <Checkbox
                                            checked={formData.ticketTypes.children0to3}
                                            onCheckedChange={(checked) =>
                                                updateFormData('ticketTypes', {
                                                    ...formData.ticketTypes,
                                                    children0to3: checked as boolean,
                                                })
                                            }
                                        />
                                        <span className="font-medium">Children 0-3 years</span>
                                    </label>
                                    {formData.ticketTypes.children0to3 && (
                                        <div className="ml-6 grid gap-4 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="children0-price" className="text-xs text-slate-600">
                                                    Price <Required />
                                                </Label>
                                                <Input
                                                    id="children0-price"
                                                    type="number"
                                                    className="mt-1"
                                                    value={formData.ticketPrices.children0to3}
                                                    onChange={(e) =>
                                                        updateFormData('ticketPrices', {
                                                            ...formData.ticketPrices,
                                                            children0to3: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="children0-qty" className="text-xs text-slate-600">
                                                    Quantity <Required />
                                                </Label>
                                                <Input
                                                    id="children0-qty"
                                                    type="number"
                                                    className="mt-1"
                                                    value={formData.ticketQuantities.children0to3}
                                                    onChange={(e) =>
                                                        updateFormData('ticketQuantities', {
                                                            ...formData.ticketQuantities,
                                                            children0to3: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Other with Repeater */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <Checkbox
                                            checked={formData.ticketTypes.other}
                                            onCheckedChange={(checked) =>
                                                updateFormData('ticketTypes', {
                                                    ...formData.ticketTypes,
                                                    other: checked as boolean,
                                                })
                                            }
                                        />
                                        <span className="font-medium">Other</span>
                                    </label>
                                    {formData.ticketTypes.other && (
                                        <div className="ml-6 space-y-3">
                                            {formData.otherTickets.map((ticket, index) => (
                                                <div key={index} className="flex items-end gap-2">
                                                    <div className="flex-1">
                                                        <Label className="text-xs text-slate-600">
                                                            Ticket Name <Required />
                                                        </Label>
                                                        <Input
                                                            className="mt-1"
                                                            value={ticket.name}
                                                            onChange={(e) => {
                                                                const newTickets = [...formData.otherTickets];
                                                                newTickets[index].name = e.target.value;
                                                                updateFormData('otherTickets', newTickets);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="w-28">
                                                        <Label className="text-xs text-slate-600">
                                                            Price <Required />
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            className="mt-1"
                                                            value={ticket.price}
                                                            onChange={(e) => {
                                                                const newTickets = [...formData.otherTickets];
                                                                newTickets[index].price = e.target.value;
                                                                updateFormData('otherTickets', newTickets);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="w-24">
                                                        <Label className="text-xs text-slate-600">
                                                            Qty <Required />
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            className="mt-1"
                                                            value={ticket.quantity}
                                                            onChange={(e) => {
                                                                const newTickets = [...formData.otherTickets];
                                                                newTickets[index].quantity = e.target.value;
                                                                updateFormData('otherTickets', newTickets);
                                                            }}
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        type="button"
                                                        onClick={() => {
                                                            const newTickets = formData.otherTickets.filter(
                                                                (_, i) => i !== index,
                                                            );
                                                            updateFormData('otherTickets', newTickets);
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
                                                    updateFormData('otherTickets', [
                                                        ...formData.otherTickets,
                                                        { name: '', price: '', quantity: '' },
                                                    ])
                                                }
                                            >
                                                <Plus className="size-4 mr-2" />
                                                Add Another Ticket Type
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Platform Fee Question */}
                        <div>
                            <Label className="text-sm font-medium text-slate-700">
                                Do your ticket prices include a 10% fee for our event platform's administrative and commission fees? <Required />
                            </Label>
                            <RadioGroup
                                name="ticket-price-includes-fee"
                                options={['Yes', 'No']}
                                value={formData.ticketPriceIncludesFee}
                                onChange={(value) => updateFormData('ticketPriceIncludesFee', value)}
                            />
                        </div>

                        {/* Info to Collect Section */}
                        <div>
                            <Label className="text-sm font-medium text-slate-700">
                                Info to Collect from Registrants <Required />
                            </Label>
                            <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.infoToCollect.name}
                                        onCheckedChange={(checked) =>
                                            updateFormData('infoToCollect', {
                                                ...formData.infoToCollect,
                                                name: checked as boolean,
                                            })
                                        }
                                    />
                                    <span>Name</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.infoToCollect.lastName}
                                        onCheckedChange={(checked) =>
                                            updateFormData('infoToCollect', {
                                                ...formData.infoToCollect,
                                                lastName: checked as boolean,
                                            })
                                        }
                                    />
                                    <span>Last Name</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.infoToCollect.email}
                                        onCheckedChange={(checked) =>
                                            updateFormData('infoToCollect', {
                                                ...formData.infoToCollect,
                                                email: checked as boolean,
                                            })
                                        }
                                    />
                                    <span>Email</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.infoToCollect.cellphone}
                                        onCheckedChange={(checked) =>
                                            updateFormData('infoToCollect', {
                                                ...formData.infoToCollect,
                                                cellphone: checked as boolean,
                                            })
                                        }
                                    />
                                    <span>Cellphone</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.infoToCollect.congregation}
                                        onCheckedChange={(checked) =>
                                            updateFormData('infoToCollect', {
                                                ...formData.infoToCollect,
                                                congregation: checked as boolean,
                                            })
                                        }
                                    />
                                    <span>Congregation</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.infoToCollect.functionInChurch}
                                        onCheckedChange={(checked) =>
                                            updateFormData('infoToCollect', {
                                                ...formData.infoToCollect,
                                                functionInChurch: checked as boolean,
                                            })
                                        }
                                    />
                                    <span>Function in Church</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.infoToCollect.allergies}
                                        onCheckedChange={(checked) =>
                                            updateFormData('infoToCollect', {
                                                ...formData.infoToCollect,
                                                allergies: checked as boolean,
                                            })
                                        }
                                    />
                                    <span>Allergies</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.infoToCollect.other}
                                        onCheckedChange={(checked) =>
                                            updateFormData('infoToCollect', {
                                                ...formData.infoToCollect,
                                                other: checked as boolean,
                                            })
                                        }
                                    />
                                    <span>Other</span>
                                </label>
                            </div>

                            {/* Other Info Fields Repeater */}
                            {formData.infoToCollect.other && (
                                <div className="mt-4 space-y-2">
                                    {formData.otherInfoFields.map((field, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                className="flex-1"
                                                placeholder="Enter field name"
                                                value={field}
                                                onChange={(e) => {
                                                    const newFields = [...formData.otherInfoFields];
                                                    newFields[index] = e.target.value;
                                                    updateFormData('otherInfoFields', newFields);
                                                }}
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                type="button"
                                                onClick={() => {
                                                    const newFields = formData.otherInfoFields.filter(
                                                        (_, i) => i !== index,
                                                    );
                                                    updateFormData('otherInfoFields', newFields);
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
                                            updateFormData('otherInfoFields', [...formData.otherInfoFields, ''])
                                        }
                                    >
                                        <Plus className="size-4 mr-2" />
                                        Add Another Field
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-slate-700">
                                Do you want people to be able to donate? <Required />
                            </Label>
                            <RadioGroup
                                name="allow-donations"
                                options={['Yes', 'No']}
                                value={formData.allowDonations}
                                onChange={(value) => updateFormData('allowDonations', value)}
                            />
                        </div>
                        <div>
                            <Label
                                htmlFor="registration-closing-date"
                                className="text-sm font-medium text-slate-700"
                            >
                                Registration Closing Date <Required />
                            </Label>
                            <input
                                id="registration-closing-date"
                                type="date"
                                className={dateInputBase}
                                value={formData.registrationClosingDate}
                                onChange={(e) => updateFormData('registrationClosingDate', e.target.value)}
                            />
                        </div>
                    </div>
                ),
            },
            {
                id: 'film',
                title: 'Video/Film Project',
                content: (
                    <div className="space-y-6">
                        <SectionHeader title="Video/Film Project" />
                        <div>
                            <Label htmlFor="film-medium" className="text-sm font-medium text-slate-700">
                                What is your medium for this project? <Required />
                            </Label>
                            <select
                                id="film-medium"
                                className={selectBase}
                                value={formData.filmMedium}
                                onChange={(e) => updateFormData('filmMedium', e.target.value)}
                            >
                                <option value="">Select an Option</option>
                                <option>Digital</option>
                                <option>Film</option>
                                <option>Video</option>
                                <option>Archived Footage (VHS)</option>
                                <option>Both Digital and Film</option>
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="project-description" className="text-sm font-medium text-slate-700">
                                Tell us about your project <Required />
                            </Label>
                            <textarea
                                id="project-description"
                                className={textareaBase}
                                value={formData.projectDescription}
                                onChange={(e) => updateFormData('projectDescription', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="distribution" className="text-sm font-medium text-slate-700">
                                Distribution <Required />
                            </Label>
                            <select
                                id="distribution"
                                className={selectBase}
                                value={formData.distribution}
                                onChange={(e) => updateFormData('distribution', e.target.value)}
                            >
                                <option value="">Select an Option</option>
                                <option>Public</option>
                                <option>Members Only</option>
                                <option>Global</option>
                                <option>Congregational</option>
                                <option>Ministry</option>
                                <option>Regional Hub</option>
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="intended-audience" className="text-sm font-medium text-slate-700">
                                Intended Audience <Required />
                            </Label>
                            <Input
                                id="intended-audience"
                                className="mt-2"
                                value={formData.intendedAudience}
                                onChange={(e) => updateFormData('intendedAudience', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="video-content" className="text-sm font-medium text-slate-700">
                                What is the content of the video/film (what will we be recording)? <Required />
                            </Label>
                            <textarea
                                id="video-content"
                                className={textareaBase}
                                value={formData.videoContent}
                                onChange={(e) => updateFormData('videoContent', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-slate-700">
                                Will you be supplying any supplementary/companion documents for your video/film?{' '}
                                <Required />
                            </Label>
                            <RadioGroup
                                name="companion-documents"
                                options={['Yes', 'No']}
                                value={formData.companionDocuments}
                                onChange={(value) => updateFormData('companionDocuments', value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="date-needed" className="text-sm font-medium text-slate-700">
                                Date Needed <Required />
                            </Label>
                            <input
                                id="date-needed"
                                type="date"
                                className={dateInputBase}
                                value={formData.dateNeeded}
                                onChange={(e) => updateFormData('dateNeeded', e.target.value)}
                            />
                        </div>
                    </div>
                ),
            },
            {
                id: 'graphics',
                title: 'Graphics',
                content: (
                    <div className="space-y-6">
                        <SectionHeader title="Graphics" />
                        <div className="grid gap-6 md:grid-cols-2">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <Checkbox
                                    checked={formData.graphicsWhatsApp}
                                    onCheckedChange={(checked) =>
                                        updateFormData('graphicsWhatsApp', checked as boolean)
                                    }
                                />
                                <span>WhatsApp Graphic</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <Checkbox
                                    checked={formData.graphicsInstagram}
                                    onCheckedChange={(checked) =>
                                        updateFormData('graphicsInstagram', checked as boolean)
                                    }
                                />
                                <span>Instagram Graphic</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <Checkbox
                                    checked={formData.graphicsAVSlide}
                                    onCheckedChange={(checked) =>
                                        updateFormData('graphicsAVSlide', checked as boolean)
                                    }
                                />
                                <span>AV Slide (1920x1080px)</span>
                            </label>
                        </div>
                        <div>
                            <Label htmlFor="graphics-other" className="text-sm font-medium text-slate-700">
                                Other (Please Specify)
                            </Label>
                            <Input
                                id="graphics-other"
                                className="mt-2"
                                value={formData.graphicsOther}
                                onChange={(e) => updateFormData('graphicsOther', e.target.value)}
                            />
                        </div>
                    </div>
                ),
            },
            {
                id: 'digital',
                title: 'Digital Media',
                content: (
                    <div className="space-y-6">
                        <SectionHeader title="DIGITAL MEDIA" />
                        <div>
                            <Label htmlFor="digital-scope" className="text-sm font-medium text-slate-700">
                                Scope <Required />
                            </Label>
                            <select
                                id="digital-scope"
                                className={selectBase}
                                value={formData.digitalScope}
                                onChange={(e) => updateFormData('digitalScope', e.target.value)}
                            >
                                <option value="">Select an Option</option>
                                <option>Congregational</option>
                                <option>Global</option>
                                <option>Ministry</option>
                                <option>Regional Hub</option>
                            </select>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <Checkbox
                                    checked={formData.digitalWhatsApp}
                                    onCheckedChange={(checked) =>
                                        updateFormData('digitalWhatsApp', checked as boolean)
                                    }
                                />
                                <span>WhatsApp Graphic</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <Checkbox
                                    checked={formData.digitalInstagram}
                                    onCheckedChange={(checked) =>
                                        updateFormData('digitalInstagram', checked as boolean)
                                    }
                                />
                                <span>Instagram Graphic</span>
                            </label>
                        </div>
                        <div>
                            <Label htmlFor="digital-other" className="text-sm font-medium text-slate-700">
                                Other (Please Specify)
                            </Label>
                            <Input
                                id="digital-other"
                                className="mt-2"
                                value={formData.digitalOther}
                                onChange={(e) => updateFormData('digitalOther', e.target.value)}
                            />
                        </div>
                    </div>
                ),
            },
            {
                id: 'signage',
                title: 'SIGNAGE',
                content: (
                    <div className="space-y-6">
                        <SectionHeader title="SIGNAGE" />
                        <div>
                            <Label htmlFor="signage-scope" className="text-sm font-medium text-slate-700">
                                Scope <Required />
                            </Label>
                            <select
                                id="signage-scope"
                                className={selectBase}
                                value={formData.signageScope}
                                onChange={(e) => updateFormData('signageScope', e.target.value)}
                            >
                                <option value="">Select an Option</option>
                                <option>Congregational</option>
                                <option>Global</option>
                                <option>Ministry</option>
                                <option>Regional Hub</option>
                            </select>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-slate-700">Signage</Label>
                            <div className="mt-2 space-y-2 text-sm text-slate-700">
                                {[
                                    'Sharkfin Banners (3m)',
                                    'Temporary Fence Banner (2x1m)',
                                    'Internal Directional Signs (Laminated A3, landscape)',
                                    'Permanent External Building Signs',
                                    'Other',
                                ].map((type) => (
                                    <label key={type} className="flex items-center gap-2">
                                        <Checkbox
                                            checked={formData.signageTypes.includes(type)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    updateFormData('signageTypes', [...formData.signageTypes, type]);
                                                } else {
                                                    updateFormData(
                                                        'signageTypes',
                                                        formData.signageTypes.filter((t) => t !== type),
                                                    );
                                                }
                                            }}
                                        />
                                        <span>{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="sharkfin-qty" className="text-sm font-medium text-slate-700">
                                    Sharkfin Banners: Quantity <Required />
                                </Label>
                                <Input
                                    id="sharkfin-qty"
                                    type="number"
                                    className="mt-2"
                                    value={formData.sharkfinQty}
                                    onChange={(e) => updateFormData('sharkfinQty', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="fence-banner-qty" className="text-sm font-medium text-slate-700">
                                    Temporary Fence Banner: Quantify <Required />
                                </Label>
                                <Input
                                    id="fence-banner-qty"
                                    type="number"
                                    className="mt-2"
                                    value={formData.fenceBannerQty}
                                    onChange={(e) => updateFormData('fenceBannerQty', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="directional-signs-qty" className="text-sm font-medium text-slate-700">
                                Internal Directional Signs: Quantity <Required />
                            </Label>
                            <Input
                                id="directional-signs-qty"
                                type="number"
                                className="mt-2"
                                value={formData.directionalSignsQty}
                                onChange={(e) => updateFormData('directionalSignsQty', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <Label htmlFor="building-signs-qty" className="text-sm font-medium text-slate-700">
                                    Permanent External Building Signs: Quantity <Required />
                                </Label>
                                <Input
                                    id="building-signs-qty"
                                    type="number"
                                    className="mt-2"
                                    value={formData.buildingSignsQty}
                                    onChange={(e) => updateFormData('buildingSignsQty', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="other-signage" className="text-sm font-medium text-slate-700">
                                    Other Signage (Please specify) <Required />
                                </Label>
                                <Input
                                    id="other-signage"
                                    className="mt-2"
                                    value={formData.otherSignage}
                                    onChange={(e) => updateFormData('otherSignage', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="other-signage-qty" className="text-sm font-medium text-slate-700">
                                Other Signage: Quantity <Required />
                            </Label>
                            <Input
                                id="other-signage-qty"
                                type="number"
                                className="mt-2"
                                value={formData.otherSignageQty}
                                onChange={(e) => updateFormData('otherSignageQty', e.target.value)}
                            />
                        </div>
                    </div>
                ),
            },
            {
                id: 'print',
                title: 'Print Media Details',
                content: (
                    <div className="space-y-6">
                        <SectionHeader title="Print Media Details" />
                        <div>
                            <Label className="text-sm font-medium text-slate-700">
                                Print <Required />
                            </Label>
                            <div className="mt-2 space-y-2 text-sm text-slate-700">
                                {[
                                    'Congregational Flyer Handouts (A5)',
                                    'Congregational Flyer Handouts (A6)',
                                    'Posters (A3)',
                                    'Posters (A4)',
                                    'Invite/Evangelism Cards',
                                    'Other',
                                ].map((type) => (
                                    <label key={type} className="flex items-center gap-2">
                                        <Checkbox
                                            checked={formData.printTypes.includes(type)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    updateFormData('printTypes', [...formData.printTypes, type]);
                                                } else {
                                                    updateFormData(
                                                        'printTypes',
                                                        formData.printTypes.filter((t) => t !== type),
                                                    );
                                                }
                                            }}
                                        />
                                        <span>{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            <div>
                                <Label htmlFor="print-other" className="text-sm font-medium text-slate-700">
                                    Other? (Specify) <Required />
                                </Label>
                                <Input
                                    id="print-other"
                                    className="mt-2"
                                    value={formData.printOther}
                                    onChange={(e) => updateFormData('printOther', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="print-other-qty" className="text-sm font-medium text-slate-700">
                                    Quantity: Other <Required />
                                </Label>
                                <Input
                                    id="print-other-qty"
                                    type="number"
                                    className="mt-2"
                                    value={formData.printOtherQty}
                                    onChange={(e) => updateFormData('printOtherQty', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            <div>
                                <Label htmlFor="print-a5-qty" className="text-sm font-medium text-slate-700">
                                    Quantity: Congregational Flyer Handouts A5 <Required />
                                </Label>
                                <Input
                                    id="print-a5-qty"
                                    type="number"
                                    className="mt-2"
                                    value={formData.printA5Qty}
                                    onChange={(e) => updateFormData('printA5Qty', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="print-a6-qty" className="text-sm font-medium text-slate-700">
                                    Quantity: Congregational Flyer Handouts A6 <Required />
                                </Label>
                                <Input
                                    id="print-a6-qty"
                                    type="number"
                                    className="mt-2"
                                    value={formData.printA6Qty}
                                    onChange={(e) => updateFormData('printA6Qty', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="print-a3-qty" className="text-sm font-medium text-slate-700">
                                    Quantity: Posters A3 <Required />
                                </Label>
                                <Input
                                    id="print-a3-qty"
                                    type="number"
                                    className="mt-2"
                                    value={formData.printA3Qty}
                                    onChange={(e) => updateFormData('printA3Qty', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="print-a4-qty" className="text-sm font-medium text-slate-700">
                                    Quantity: Posters A4 <Required />
                                </Label>
                                <Input
                                    id="print-a4-qty"
                                    type="number"
                                    className="mt-2"
                                    value={formData.printA4Qty}
                                    onChange={(e) => updateFormData('printA4Qty', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="print-cards-qty" className="text-sm font-medium text-slate-700">
                                    Quantity: Invite/Evangelism Cards <Required />
                                </Label>
                                <Input
                                    id="print-cards-qty"
                                    type="number"
                                    className="mt-2"
                                    value={formData.printCardsQty}
                                    onChange={(e) => updateFormData('printCardsQty', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-slate-700">
                                Terms & Conditions <Required />
                            </Label>
                            <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                                <Checkbox
                                    checked={formData.termsAccepted}
                                    onCheckedChange={(checked) =>
                                        updateFormData('termsAccepted', checked as boolean)
                                    }
                                />
                                <span>
                                    I agree to the{' '}
                                    <a
                                        href="/terms-conditions/"
                                        target="_blank"
                                        className="text-blue-600 hover:underline"
                                    >
                                        Ts & Cs
                                    </a>{' '}
                                    and the{' '}
                                    <a
                                        href="/privacy-policy"
                                        target="_blank"
                                        className="text-blue-600 hover:underline"
                                    >
                                        Privacy Policy
                                    </a>
                                </span>
                            </label>
                        </div>
                    </div>
                ),
            },
        ];

        // Filter pages based on conditional logic
        return allPages.filter((page) => visiblePages.includes(page.id));
    }, [formData, updateFormData, visiblePages]);

    const currentStep = steps[stepIndex];
    const totalSteps = steps.length;
    const progress = Math.round(((stepIndex + 1) / totalSteps) * 100);
    const isLastStep = stepIndex === totalSteps - 1;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Work Request" />
            <div className="min-h-screen bg-[#f3f5f7]">
                <div className="mx-auto w-full max-w-6xl px-6 py-8">
                    <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold text-slate-900">Work Request Form</h1>
                            <p className="text-sm text-slate-500">
                                Step {stepIndex + 1} of {totalSteps}
                            </p>
                            <div className="h-2 w-full rounded-full bg-slate-200">
                                <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
                            </div>
                        </div>

                        <div className="mt-8">{currentStep.content}</div>

                        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                {stepIndex > 0 && (
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
                                    >
                                        Previous
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    type="button"
                                    onClick={() => setStepIndex((index) => Math.min(steps.length - 1, index + 1))}
                                    disabled={isLastStep}
                                >
                                    {isLastStep ? 'Completed' : 'Next'}
                                </Button>
                                <Button variant="outline" type="button">
                                    <Save className="size-4" />
                                    Save and Continue Later
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
