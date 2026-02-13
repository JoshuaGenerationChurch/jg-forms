import type { ReactNode } from 'react';

type ReportSection = {
    title: string;
    rows: Array<{ label: string; value: string }>;
};

type Props = {
    formSlug: string;
    payload: Record<string, unknown> | null;
};

const WORK_REQUEST_SECTION_RULES: Array<{
    title: string;
    keys?: string[];
    prefixes?: string[];
}> = [
    {
        title: 'Request Setup',
        keys: [
            'includesDatesVenue',
            'includesRegistration',
            'includesGraphics',
            'includesGraphicsDigital',
            'includesGraphicsPrint',
            'includesSignage',
            'theme',
            'eventReach',
            'hubs',
            'childMinding',
            'childMindingDescription',
        ],
    },
    {
        title: 'Event Details',
        keys: [
            'eventDuration',
            'eventStartDate',
            'eventEndDate',
            'eventDates',
            'announcementDate',
            'venueType',
            'jgVenue',
            'otherVenueName',
            'otherVenueAddress',
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
    quicketDescription: 'Registration details',
    ticketPriceIncludesFee: 'Ticket price includes fee?',
    ticketTypes: 'Ticket types',
    ticketPrices: 'Ticket prices',
    ticketQuantities: 'Ticket quantities',
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

function formatLabel(rawKey: string): string {
    if (LABEL_OVERRIDES[rawKey]) {
        return LABEL_OVERRIDES[rawKey];
    }

    return rawKey
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\bqty\b/gi, 'Qty')
        .replace(/\bav\b/gi, 'AV')
        .replace(/\bjg\b/gi, 'JG')
        .replace(/\bwhats app\b/gi, 'WhatsApp')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, (match) => match.toUpperCase());
}

function formatPrimitive(value: string | number | boolean): string {
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    return String(value);
}

function keyValueSummary(value: Record<string, unknown>): string {
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
            selectedLabels.push(
                `${formatLabel(key)}: ${formatPrimitive(item)}`,
            );
        }
    }

    return selectedLabels.join(', ');
}

function formatArray(value: unknown[]): string {
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
                const summary = keyValueSummary(item);
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

function formatValue(value: unknown): string {
    if (typeof value === 'string') {
        return value.trim();
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return formatPrimitive(value);
    }

    if (Array.isArray(value)) {
        return formatArray(value);
    }

    if (isPlainObject(value)) {
        return keyValueSummary(value);
    }

    return '';
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

function buildWorkRequestSections(
    payload: Record<string, unknown>,
): ReportSection[] {
    const sections: ReportSection[] = [];
    const consumedKeys = new Set<string>();

    for (const rule of WORK_REQUEST_SECTION_RULES) {
        const rows: Array<{ label: string; value: string }> = [];

        if (rule.keys) {
            for (const key of rule.keys) {
                const value = payload[key];
                if (!isMeaningful(value)) {
                    continue;
                }

                const formattedValue = formatValue(value);
                if (formattedValue === '') {
                    continue;
                }

                rows.push({
                    label: formatLabel(key),
                    value: formattedValue,
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
                const formattedValue = formatValue(value);
                if (formattedValue === '') {
                    continue;
                }

                rows.push({
                    label: formatLabel(key),
                    value: formattedValue,
                });
                consumedKeys.add(key);
            }
        }

        if (rows.length > 0) {
            sections.push({
                title: rule.title,
                rows,
            });
        }
    }

    const additionalRows = Object.entries(payload)
        .filter(([key, value]) => !consumedKeys.has(key) && isMeaningful(value))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => ({
            label: formatLabel(key),
            value: formatValue(value),
        }))
        .filter((row) => row.value !== '');

    if (additionalRows.length > 0) {
        sections.push({
            title: 'Additional Responses',
            rows: additionalRows,
        });
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

function renderRows(rows: Array<{ label: string; value: string }>): ReactNode {
    return (
        <dl className="space-y-2 text-sm">
            {rows.map((row) => (
                <div
                    key={`${row.label}-${row.value}`}
                    className="flex flex-col gap-1 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0 md:flex-row md:items-start md:justify-between md:gap-4"
                >
                    <dt className="text-slate-500">{row.label}</dt>
                    <dd className="max-w-[70%] text-left text-slate-900 md:text-right">
                        {row.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export default function EntryResponseReport({ formSlug, payload }: Props) {
    if (!payload || Object.keys(payload).length === 0) {
        return (
            <div className="mt-6 rounded-lg border border-slate-200 p-4">
                <h2 className="text-sm font-semibold text-slate-900">
                    Responses
                </h2>
                <p className="mt-3 text-sm text-slate-500">
                    No response data was captured for this entry.
                </p>
            </div>
        );
    }

    const sections = buildSections(formSlug, payload);

    if (sections.length === 0) {
        return (
            <div className="mt-6 rounded-lg border border-slate-200 p-4">
                <h2 className="text-sm font-semibold text-slate-900">
                    Responses
                </h2>
                <p className="mt-3 text-sm text-slate-500">
                    No filled responses found in this submission.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-6 rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Responses</h2>
            <div className="mt-4 space-y-4">
                {sections.map((section) => (
                    <div
                        key={section.title}
                        className="rounded-lg border border-slate-200 p-4"
                    >
                        <h3 className="text-sm font-semibold text-slate-900">
                            {section.title}
                        </h3>
                        <div className="mt-3">{renderRows(section.rows)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
