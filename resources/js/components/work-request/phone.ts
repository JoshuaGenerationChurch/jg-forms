export type CountryCodeOption = {
    value: string;
    label: string;
};

export const DEFAULT_COUNTRY_CODE = '+27';

export const COUNTRY_CODE_OPTIONS: CountryCodeOption[] = [
    { value: '+27', label: '(+27) South Africa' },
    { value: '+1', label: '(+1) United States/Canada' },
    { value: '+263', label: '(+263) Zimbabwe' },
];

const knownCountryCodes = new Set(
    COUNTRY_CODE_OPTIONS.map((option) => option.value),
);

const countryCodesByLengthDesc = [...knownCountryCodes].sort(
    (a, b) => b.length - a.length,
);

export function splitPhoneNumber(value: string): {
    countryCode: string;
    localNumber: string;
} {
    const normalized = value.trim().replace(/\s+/g, ' ');
    if (normalized === '') {
        return { countryCode: DEFAULT_COUNTRY_CODE, localNumber: '' };
    }

    for (const countryCode of countryCodesByLengthDesc) {
        if (normalized === countryCode) {
            return { countryCode, localNumber: '' };
        }

        if (normalized.startsWith(countryCode)) {
            return {
                countryCode,
                localNumber: normalized.slice(countryCode.length).trim(),
            };
        }
    }

    const matchedCountryCode = normalized.match(/^\+\d{1,4}/)?.[0];

    if (matchedCountryCode) {
        return {
            countryCode: matchedCountryCode,
            localNumber: normalized.slice(matchedCountryCode.length).trim(),
        };
    }

    return { countryCode: DEFAULT_COUNTRY_CODE, localNumber: normalized };
}

export function combinePhoneNumber(
    countryCode: string,
    localNumber: string,
): string {
    const trimmedCountryCode = countryCode.trim();
    const trimmedLocalNumber = localNumber.trim();

    if (trimmedCountryCode === '') {
        return trimmedLocalNumber;
    }

    if (trimmedLocalNumber === '') {
        return trimmedCountryCode;
    }

    return `${trimmedCountryCode} ${trimmedLocalNumber}`;
}

export function countryCodeOptionsWithCurrent(
    countryCode: string,
): CountryCodeOption[] {
    const trimmedCountryCode = countryCode.trim();

    if (trimmedCountryCode === '' || knownCountryCodes.has(trimmedCountryCode)) {
        return COUNTRY_CODE_OPTIONS;
    }

    return [
        {
            value: trimmedCountryCode,
            label: `${trimmedCountryCode} (Current)`,
        },
        ...COUNTRY_CODE_OPTIONS,
    ];
}

const LOCAL_NUMBER_PLACEHOLDERS: Record<string, string> = {
    '+27': '82 123 4567',
    '+1': '(201) 555-0123',
    '+263': '71 234 5678',
};

export function phonePlaceholderByCountryCode(countryCode: string): string {
    const trimmedCountryCode = countryCode.trim();

    return (
        LOCAL_NUMBER_PLACEHOLDERS[trimmedCountryCode] ??
        'Local phone number'
    );
}
