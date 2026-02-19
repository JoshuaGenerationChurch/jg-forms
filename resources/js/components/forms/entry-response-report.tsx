import type { LucideIcon } from 'lucide-react';
import {
    CalendarDays,
    Check,
    Clock3,
    FileText,
    Image,
    MapPin,
    Printer,
    Ticket,
    User,
} from 'lucide-react';
import type { ReactNode } from 'react';

type ReportRow = {
    key: string;
    label: string;
    value: string;
    fullWidth?: boolean;
    showYesIcon?: boolean;
};

type ReportSection = {
    title: string;
    rows: ReportRow[];
};

type Props = {
    formSlug: string;
    payload: Record<string, unknown> | null;
};

type FormatOptions = {
    ticketCurrency?: string;
};

const ORGANISER_DETAIL_KEYS = new Set([
    'organiserFirstName',
    'organiserLastName',
    'organiserEmail',
    'organiserCell',
]);

const WORK_REQUEST_SECTION_RULES: Array<{
    title: string;
    keys?: string[];
    prefixes?: string[];
}> = [
    {
        title: 'Event Details',
        keys: [
            'eventName',
            'eventDuration',
            'eventStartDate',
            'eventEndDate',
            'eventDates',
            'announcementDate',
            'venueType',
            'jgVenue',
            'otherVenueName',
            'otherVenueAddress',
            'eventReach',
            'hubs',
            'childMinding',
            'childMindingDescription',
            'isUserOrganiser',
            'organiserFirstName',
            'organiserLastName',
            'organiserEmail',
            'organiserCell',
        ],
    },
    {
        title: 'Registration',
        keys: [
            'quicketDescription',
            'ticketCurrency',
            'ticketPriceIncludesFee',
            'ticketTypes',
            'ticketPrices',
            'ticketQuantities',
            'otherTickets',
            'infoToCollect',
            'otherInfoFields',
            'allowDonations',
            'registrationClosingDate',
        ],
    },
    {
        title: 'Digital Media',
        prefixes: [
            'digital',
            'graphicsWhatsApp',
            'graphicsInstagram',
            'graphicsAVSlide',
            'graphicsOther',
        ],
    },
    {
        title: 'Print Media',
        keys: ['termsAccepted'],
        prefixes: ['print'],
    },
    {
        title: 'Signage',
        prefixes: [
            'signage',
            'sharkfin',
            'temporaryFence',
            'toilets',
            'moms',
            'toddlers',
            'firstAid',
            'internal',
            'external',
            'sandwich',
            'permanentExternalBuildingSigns',
            'otherSignage',
        ],
    },
];

const LABEL_OVERRIDES: Record<string, string> = {
    includesDatesVenue: 'Event logistics selected',
    includesRegistration: 'Registration form selected',
    includesGraphics: 'Graphics selected',
    includesGraphicsDigital: 'Digital media selected',
    includesGraphicsPrint: 'Print media selected',
    includesSignage: 'Signage selected',
    eventReach: 'Event reach',
    hubs: 'Selected hubs',
    childMinding: 'Child minding',
    childMindingDescription: 'Child minding details',
    eventStartDate: 'Event start',
    eventEndDate: 'Event end',
    eventDates: 'Event dates',
    announcementDate: 'Announcement date',
    jgVenue: 'JG venue',
    isUserOrganiser: 'Is requester organiser?',
    organiserCell: 'Organiser cellphone',
    quicketDescription: 'Description',
    ticketCurrency: 'Ticket currency',
    ticketPriceIncludesFee: 'Ticket price includes fee?',
    ticketTypes: 'Ticket types',
    ticketPrices: 'Ticket prices',
    ticketQuantities: 'Ticket quantities',
    adults18Plus: 'Adults 18+',
    adults13Plus: 'Adults 13+',
    children4to12: 'Children 4 to 12',
    children0to3: 'Children 0 to 3',
    otherTickets: 'Other tickets',
    infoToCollect: 'Info to collect',
    otherInfoFields: 'Other info fields',
    allowDonations: 'Allow donations?',
    registrationClosingDate: 'Registration closing date',
    graphicsWhatsApp: 'WhatsApp graphic (1080x1920)',
    graphicsInstagram: 'Instagram graphic',
    graphicsAVSlide: 'AV slide (1920x1080)',
    graphicsOther: 'Other graphics notes',
    digitalGraphicType: 'Graphic type',
    digitalOtherGraphicDescription: 'Other graphic description',
    digitalFormatWhatsapp: 'Format: WhatsApp',
    digitalFormatAVSlide: 'Format: AV slide',
    digitalFormatOther: 'Format: Other',
    digitalOtherFormatDescription: 'Other format description',
    serviceTimes: 'Service times',
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMeaningful(value: unknown): boolean {
    if (value === null || value === undefined) {
        return false;
    }

    if (typeof value === 'string') {
        return value.trim() !== '';
    }

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value);
    }

    if (Array.isArray(value)) {
        return value.some((item) => isMeaningful(item));
    }

    if (isPlainObject(value)) {
        return Object.values(value).some((item) => isMeaningful(item));
    }

    return false;
}

function parseYesNoValue(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value !== 'string') {
        return null;
    }

    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === 'yes' || normalizedValue === 'true' || normalizedValue === '1') {
        return true;
    }

    if (normalizedValue === 'no' || normalizedValue === 'false' || normalizedValue === '0') {
        return false;
    }

    return null;
}

function requesterIsEventOrganiser(payload: Record<string, unknown>): boolean {
    const parsedValue = parseYesNoValue(payload.isUserOrganiser);

    return parsedValue === true;
}

function formatLabel(rawKey: string): string {
    if (LABEL_OVERRIDES[rawKey]) {
        return LABEL_OVERRIDES[rawKey];
    }

    return rawKey
        .replace(/_/g, ' ')
        .replace(/([a-zA-Z])(\d)/g, '$1 $2')
        .replace(/(\d)([a-zA-Z])/g, '$1 $2')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\bA\s+(\d+)\b/g, 'A$1')
        .replace(/\bqty\b/gi, 'Qty')
        .replace(/\bav\b/gi, 'AV')
        .replace(/\bjg\b/gi, 'JG')
        .replace(/\bwhats app\b/gi, 'WhatsApp')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, (match) => match.toUpperCase());
}

function formatSectionLabel(sectionTitle: string, key: string): string {
    const label = formatLabel(key);

    if (sectionTitle === 'Print Media' && key.startsWith('print')) {
        return label.replace(/^Print\s+/, '');
    }

    return label;
}

function formatPrimitive(value: string | number | boolean): string {
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    return String(value);
}

function formatDateTimeValue(value: string): string {
    const trimmedValue = value.trim();
    const match = trimmedValue.match(
        /^(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2})(?::\d{2})?$/,
    );

    if (!match) {
        return trimmedValue;
    }

    const [, datePart, hourPart, minutePart] = match;
    const hour24 = Number.parseInt(hourPart, 10);

    if (Number.isNaN(hour24) || hour24 < 0 || hour24 > 23) {
        return trimmedValue;
    }

    const period = hour24 >= 12 ? 'pm' : 'am';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

    return `${datePart} @ ${String(hour12).padStart(2, '0')}:${minutePart} ${period}`;
}

function resolveTicketCurrency(payload: Record<string, unknown>): string {
    const rawTicketCurrency = payload.ticketCurrency;
    if (typeof rawTicketCurrency !== 'string') {
        return '';
    }

    const normalizedCurrency = rawTicketCurrency.trim().toUpperCase();

    return normalizedCurrency === 'ZAR' || normalizedCurrency === 'USD'
        ? normalizedCurrency
        : '';
}

function keyValueSummary(
    value: Record<string, unknown>,
    options: FormatOptions = {},
): string {
    const selectedLabels: string[] = [];

    for (const [key, item] of Object.entries(value)) {
        if (!isMeaningful(item)) {
            continue;
        }

        if (typeof item === 'boolean' && item) {
            selectedLabels.push(formatLabel(key));
            continue;
        }

        if (
            typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean'
        ) {
            const primitiveValue = formatPrimitive(item);
            const formattedValue =
                key.toLowerCase() === 'price' && options.ticketCurrency
                    ? `${options.ticketCurrency} ${primitiveValue}`
                    : primitiveValue;

            selectedLabels.push(
                `${formatLabel(key)}: ${formattedValue}`,
            );
        }
    }

    return selectedLabels.join(', ');
}

function formatArray(
    value: unknown[],
    options: FormatOptions = {},
): string {
    const meaningfulItems = value.filter((item) => isMeaningful(item));
    if (meaningfulItems.length === 0) {
        return '';
    }

    const primitiveValues = meaningfulItems.filter((item) =>
        ['string', 'number', 'boolean'].includes(typeof item),
    ) as Array<string | number | boolean>;

    if (primitiveValues.length === meaningfulItems.length) {
        return primitiveValues.map((item) => formatPrimitive(item)).join(', ');
    }

    const objectValues = meaningfulItems.filter((item) => isPlainObject(item));

    if (objectValues.length === meaningfulItems.length) {
        return objectValues
            .map((item, index) => {
                const summary = keyValueSummary(item, options);
                if (summary === '') {
                    return '';
                }

                return `${index + 1}. ${summary}`;
            })
            .filter((line) => line !== '')
            .join(' | ');
    }

    return JSON.stringify(meaningfulItems);
}

function formatValue(value: unknown, options: FormatOptions = {}): string {
    if (typeof value === 'string') {
        return value.trim();
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return formatPrimitive(value);
    }

    if (Array.isArray(value)) {
        return formatArray(value, options);
    }

    if (isPlainObject(value)) {
        return keyValueSummary(value, options);
    }

    return '';
}

function formatTicketPrices(value: unknown, ticketCurrency: string): string {
    if (!isPlainObject(value)) {
        const formattedValue = formatValue(value);
        if (formattedValue === '') {
            return '';
        }

        return ticketCurrency !== ''
            ? `${ticketCurrency} ${formattedValue}`
            : formattedValue;
    }

    return Object.entries(value)
        .filter(([, item]) => isMeaningful(item))
        .map(([key, item]) => {
            const amount = formatValue(item);
            if (amount === '') {
                return '';
            }

            const displayAmount =
                ticketCurrency !== '' ? `${ticketCurrency} ${amount}` : amount;

            return `${formatLabel(key)}: ${displayAmount}`;
        })
        .filter((item) => item !== '')
        .join(', ');
}

function buildHolidaySections(
    payload: Record<string, unknown>,
): ReportSection[] {
    const sections: ReportSection[] = [];

    const serviceTimes = payload.serviceTimes;
    if (
        Array.isArray(serviceTimes) &&
        serviceTimes.some((item) => isPlainObject(item))
    ) {
        const rows = serviceTimes
            .filter((item): item is Record<string, unknown> =>
                isPlainObject(item),
            )
            .map((service, index) => {
                const serviceName =
                    typeof service.serviceName === 'string'
                        ? service.serviceName.trim()
                        : '';
                const date =
                    typeof service.date === 'string' ? service.date.trim() : '';
                const startTime =
                    typeof service.startTime === 'string'
                        ? service.startTime.trim()
                        : '';
                const venue =
                    typeof service.venue === 'string'
                        ? service.venue.trim()
                        : '';

                const value = [
                    serviceName || `Service ${index + 1}`,
                    date !== '' ? `Date: ${date}` : null,
                    startTime !== '' ? `Time: ${startTime}` : null,
                    venue !== '' ? `Venue: ${venue}` : null,
                ]
                    .filter(Boolean)
                    .join(' | ');

                return {
                    key: `service-${index}`,
                    label: `Service ${index + 1}`,
                    value,
                };
            })
            .filter((row) => row.value !== '');

        if (rows.length > 0) {
            sections.push({
                title: 'Service Times',
                rows,
            });
        }
    }

    const additionalRows = [
        'congregation',
        'firstName',
        'lastName',
        'email',
        'cellphone',
        'notes',
    ]
        .map((key) => ({ key, value: payload[key] }))
        .filter(({ value }) => isMeaningful(value))
        .map(({ key, value }) => ({
            key,
            label: formatLabel(key),
            value: formatValue(value),
        }))
        .filter((row) => row.value !== '');

    if (additionalRows.length > 0) {
        sections.push({
            title: 'Submission Details',
            rows: additionalRows,
        });
    }

    return sections;
}

function digitalMediaRowOrder(key: string): number {
    if (key === 'digitalGraphicType') {
        return 1;
    }

    if (key === 'digitalOtherGraphicDescription' || key === 'graphicsOther') {
        return 2;
    }

    if (
        key.startsWith('digitalFormat') ||
        key === 'digitalOtherFormatDescription' ||
        key === 'graphicsWhatsApp' ||
        key === 'graphicsInstagram' ||
        key === 'graphicsAVSlide'
    ) {
        return 3;
    }

    return 4;
}

function printMediaRowOrder(key: string): number {
    const printOrder: Record<string, number> = {
        printScope: 1,
        printHubs: 2,
        printCongregations: 3,
        printTypes: 4,
        printA5Qty: 5,
        printA6Qty: 6,
        printA3Qty: 7,
        printA4Qty: 8,
        printCardsQty: 9,
        printCoffeeCupSleevesQty: 10,
        printVisitorCoffeeVoucherCardQty: 11,
        printOther: 12,
        printOtherQty: 13,
        termsAccepted: 14,
    };

    return printOrder[key] ?? 999;
}

function mergeSignageSelectionRows(rows: ReportRow[]): ReportRow[] {
    const mergedRows = [...rows];
    const rowPairs: Array<{ selectionKey: string; quantityKey: string }> = [
        {
            selectionKey: 'sharkfinJgBranded',
            quantityKey: 'sharkfinJgBrandedQty',
        },
        {
            selectionKey: 'sharkfinJgKidsBranded',
            quantityKey: 'sharkfinJgKidsBrandedQty',
        },
    ];

    for (const pair of rowPairs) {
        const selectionRow = mergedRows.find(
            (row) => row.key === pair.selectionKey,
        );
        if (!selectionRow) {
            continue;
        }

        const quantityRowIndex = mergedRows.findIndex(
            (row) => row.key === pair.quantityKey,
        );

        selectionRow.showYesIcon = true;

        if (quantityRowIndex !== -1) {
            const quantityRow = mergedRows[quantityRowIndex];
            const quantityValue = quantityRow.value.trim();

            if (quantityValue !== '') {
                selectionRow.value = `Qty: ${quantityValue}`;
            } else {
                selectionRow.value = '';
            }

            mergedRows.splice(quantityRowIndex, 1);
        }
    }

    return mergedRows;
}

function buildWorkRequestSections(
    payload: Record<string, unknown>,
): ReportSection[] {
    const sections: ReportSection[] = [];
    const consumedKeys = new Set<string>();
    const ticketCurrency = resolveTicketCurrency(payload);
    const hideOrganiserDetails = requesterIsEventOrganiser(payload);

    for (const rule of WORK_REQUEST_SECTION_RULES) {
        const rows: ReportRow[] = [];

        if (rule.keys) {
            for (const key of rule.keys) {
                if (
                    hideOrganiserDetails &&
                    rule.title === 'Event Details' &&
                    ORGANISER_DETAIL_KEYS.has(key)
                ) {
                    continue;
                }

                const value = payload[key];
                if (!isMeaningful(value)) {
                    continue;
                }

                const formattedValue =
                    key === 'ticketPrices'
                        ? formatTicketPrices(value, ticketCurrency)
                        : key === 'eventStartDate' || key === 'eventEndDate'
                          ? typeof value === 'string'
                              ? formatDateTimeValue(value)
                              : formatValue(value, { ticketCurrency })
                        : formatValue(value, { ticketCurrency });
                if (formattedValue === '') {
                    continue;
                }

                rows.push({
                    key,
                    label: formatSectionLabel(rule.title, key),
                    value: formattedValue,
                    fullWidth:
                        rule.title === 'Registration' &&
                        key === 'quicketDescription',
                });
                consumedKeys.add(key);
            }
        }

        if (rule.prefixes) {
            const prefixMatches = Object.entries(payload)
                .filter(([key, value]) => {
                    if (consumedKeys.has(key) || !isMeaningful(value)) {
                        return false;
                    }

                    return rule.prefixes?.some((prefix) =>
                        key.startsWith(prefix),
                    );
                })
                .sort(([left], [right]) => left.localeCompare(right));

            for (const [key, value] of prefixMatches) {
                const formattedValue = formatValue(value, { ticketCurrency });
                if (formattedValue === '') {
                    continue;
                }

                rows.push({
                    key,
                    label: formatSectionLabel(rule.title, key),
                    value: formattedValue,
                    fullWidth: false,
                });
                consumedKeys.add(key);
            }
        }

        if (rows.length > 0) {
            if (rule.title === 'Digital Media') {
                rows.sort((left, right) => {
                    const orderDifference =
                        digitalMediaRowOrder(left.key) -
                        digitalMediaRowOrder(right.key);

                    if (orderDifference !== 0) {
                        return orderDifference;
                    }

                    return left.label.localeCompare(right.label);
                });
            }

            if (rule.title === 'Print Media') {
                rows.sort((left, right) => {
                    const orderDifference =
                        printMediaRowOrder(left.key) -
                        printMediaRowOrder(right.key);

                    if (orderDifference !== 0) {
                        return orderDifference;
                    }

                    return left.label.localeCompare(right.label);
                });
            }

            const sectionRows =
                rule.title === 'Signage'
                    ? mergeSignageSelectionRows(rows)
                    : rows;

            sections.push({
                title: rule.title,
                rows: sectionRows,
            });
        }
    }

    return sections;
}

function buildSections(
    formSlug: string,
    payload: Record<string, unknown>,
): ReportSection[] {
    if (formSlug === 'easter-holidays' || formSlug === 'christmas-holidays') {
        return buildHolidaySections(payload);
    }

    return buildWorkRequestSections(payload);
}

function sectionIcon(title: string): LucideIcon {
    const normalizedTitle = title.trim().toLowerCase();

    if (normalizedTitle === 'event details') {
        return CalendarDays;
    }

    if (normalizedTitle === 'registration') {
        return Ticket;
    }

    if (normalizedTitle === 'digital media') {
        return Image;
    }

    if (normalizedTitle === 'print media') {
        return Printer;
    }

    if (normalizedTitle === 'signage') {
        return MapPin;
    }

    if (normalizedTitle === 'service times') {
        return Clock3;
    }

    if (normalizedTitle === 'submission details') {
        return User;
    }

    return FileText;
}

function renderRows(
    rows: ReportRow[],
): ReactNode {
    return (
        <dl className="space-y-2 text-sm">
            {rows.map((row, index) => (
                <div
                    key={`${row.key}-${index}`}
                    className={`rounded-md px-2 py-2 ${
                        row.fullWidth
                            ? 'flex flex-col gap-2'
                            : 'flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-4'
                    } ${
                        index % 2 === 1 ? 'bg-slate-100/70' : 'bg-white'
                    }`}
                >
                    <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        {row.label}
                    </dt>
                    <dd
                        className={
                            row.fullWidth
                                ? 'max-w-none text-left leading-6 text-slate-900 md:text-justify'
                                : 'max-w-[70%] text-left text-slate-900 md:text-right'
                        }
                    >
                        {(() => {
                            const showYesIcon =
                                row.showYesIcon === true ||
                                row.value.trim().toLowerCase() === 'yes';

                            if (!showYesIcon) {
                                return row.value;
                            }

                            const showExtraText =
                                row.value.trim() !== '' &&
                                row.value.trim().toLowerCase() !== 'yes';

                            return (
                                <span
                                    className="inline-flex items-center gap-2"
                                    aria-label="Yes"
                                    title="Yes"
                                >
                                    <Check className="size-4 text-emerald-600" />
                                    {showExtraText ? (
                                        <span>{row.value}</span>
                                    ) : null}
                                </span>
                            );
                        })()}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export default function EntryResponseReport({ formSlug, payload }: Props) {
    if (!payload || Object.keys(payload).length === 0) {
        return (
            <div className="mt-6">
                <p className="mt-3 text-sm text-slate-500">
                    No response data was captured for this entry.
                </p>
            </div>
        );
    }

    const sections = buildSections(formSlug, payload);

    if (sections.length === 0) {
        return (
            <div className="mt-6">
                <p className="mt-3 text-sm text-slate-500">
                    No filled responses found in this submission.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
            {sections.map((section) => {
                const SectionIcon = sectionIcon(section.title);

                return (
                    <div
                        key={section.title}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <SectionIcon className="size-4 text-blue-600" />
                            <h3 className="text-xs font-semibold tracking-[0.12em] text-slate-700 uppercase">
                                {section.title}
                            </h3>
                        </div>
                        <div className="p-4">{renderRows(section.rows)}</div>
                    </div>
                );
            })}
        </div>
    );
}
