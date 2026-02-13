import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    FieldError,
    FloatingLabelInput,
    Required,
    SectionHeader,
} from './form-components';
import {
    congregationOptions,
    hubOptions,
    printTypeOptions,
    selectBase,
} from './types';
import type { FormPageProps } from './types';

type DirectoryResponse = {
    hubs?: string[];
    congregations?: string[];
};

type MultiSelectField = 'printHubs' | 'printCongregations';

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

export function PrintMedia({
    formData,
    updateFormData,
    errors = {},
}: FormPageProps) {
    const [availableHubs, setAvailableHubs] = useState<string[]>(hubOptions);
    const [availableCongregations, setAvailableCongregations] =
        useState<string[]>(congregationOptions);
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
                const congregations = sanitizeList(payload.congregations);

                if (cancelled) {
                    return;
                }

                if (hubs.length > 0) {
                    setAvailableHubs(hubs);
                }

                if (congregations.length > 0) {
                    setAvailableCongregations(congregations);
                }

                if (hubs.length === 0 || congregations.length === 0) {
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

    const toggleSelection = (
        field: MultiSelectField,
        option: string,
        checked: boolean,
    ) => {
        const currentValues = formData[field];

        if (checked) {
            updateFormData(
                field,
                Array.from(new Set([...currentValues, option])),
            );
            return;
        }

        updateFormData(
            field,
            currentValues.filter((value) => value !== option),
        );
    };

    const renderQuantityField = (type: string) => {
        switch (type) {
            case 'Congregational Flyer Handouts (A5: 148 x 210 mm)':
                return (
                    <FloatingLabelInput
                        id="print-a5-qty"
                        label="A5 Flyer Quantity"
                        required
                        type="number"
                        inputMode="numeric"
                        value={formData.printA5Qty}
                        onChange={(e) =>
                            updateFormData('printA5Qty', e.target.value)
                        }
                        error={errors.printA5Qty}
                    />
                );
            case 'Congregational Flyer Handouts (A6: 105 x 148 mm)':
                return (
                    <FloatingLabelInput
                        id="print-a6-qty"
                        label="A6 Flyer Quantity"
                        required
                        type="number"
                        inputMode="numeric"
                        value={formData.printA6Qty}
                        onChange={(e) =>
                            updateFormData('printA6Qty', e.target.value)
                        }
                        error={errors.printA6Qty}
                    />
                );
            case 'Posters (A3: 297 x 420 mm)':
                return (
                    <FloatingLabelInput
                        id="print-a3-qty"
                        label="A3 Poster Quantity"
                        required
                        type="number"
                        inputMode="numeric"
                        value={formData.printA3Qty}
                        onChange={(e) =>
                            updateFormData('printA3Qty', e.target.value)
                        }
                        error={errors.printA3Qty}
                    />
                );
            case 'Posters (A4: 210 x 297 mm)':
                return (
                    <FloatingLabelInput
                        id="print-a4-qty"
                        label="A4 Poster Quantity"
                        required
                        type="number"
                        inputMode="numeric"
                        value={formData.printA4Qty}
                        onChange={(e) =>
                            updateFormData('printA4Qty', e.target.value)
                        }
                        error={errors.printA4Qty}
                    />
                );
            case 'Invite/ Evangelism Cards (business card size)':
                return (
                    <FloatingLabelInput
                        id="print-cards-qty"
                        label="Invite/Evangelism Cards Quantity"
                        required
                        type="number"
                        inputMode="numeric"
                        value={formData.printCardsQty}
                        onChange={(e) =>
                            updateFormData('printCardsQty', e.target.value)
                        }
                        error={errors.printCardsQty}
                    />
                );
            case 'Coffee Cup Sleeves (One size)':
                return (
                    <FloatingLabelInput
                        id="print-coffee-cup-sleeves-qty"
                        label="Coffee Cup Sleeves Quantity"
                        required
                        type="number"
                        inputMode="numeric"
                        value={formData.printCoffeeCupSleevesQty}
                        onChange={(e) =>
                            updateFormData(
                                'printCoffeeCupSleevesQty',
                                e.target.value,
                            )
                        }
                        error={errors.printCoffeeCupSleevesQty}
                    />
                );
            case 'Visitor Coffee Voucher Card':
                return (
                    <FloatingLabelInput
                        id="print-visitor-coffee-voucher-card-qty"
                        label="Visitor Coffee Voucher Card Quantity"
                        required
                        type="number"
                        inputMode="numeric"
                        value={formData.printVisitorCoffeeVoucherCardQty}
                        onChange={(e) =>
                            updateFormData(
                                'printVisitorCoffeeVoucherCardQty',
                                e.target.value,
                            )
                        }
                        error={errors.printVisitorCoffeeVoucherCardQty}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader title="Print Media Details" />

            <div>
                <Label
                    htmlFor="print-scope"
                    className="text-sm font-medium text-slate-700"
                >
                    Scope <Required />
                </Label>
                <select
                    id="print-scope"
                    aria-invalid={Boolean(errors.printScope)}
                    className={`${selectBase} ${
                        errors.printScope
                            ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500'
                            : ''
                    }`}
                    value={formData.printScope}
                    onChange={(event) => {
                        const value = event.target.value;
                        updateFormData('printScope', value);

                        if (value !== 'Hubs') {
                            updateFormData('printHubs', []);
                        }

                        if (value !== 'Congregations') {
                            updateFormData('printCongregations', []);
                        }
                    }}
                >
                    <option value="">Select an Option</option>
                    <option>South Africa</option>
                    <option>Hubs</option>
                    <option>Congregations</option>
                </select>
                <FieldError error={errors.printScope} />
            </div>

            {formData.printScope === 'Hubs' && (
                <div>
                    <Label className="text-sm font-medium text-slate-700">
                        Which hubs is this for? <Required />
                    </Label>
                    <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                        {availableHubs.map((hub) => (
                            <label
                                key={hub}
                                className="flex items-center gap-2"
                            >
                                <Checkbox
                                    checked={formData.printHubs.includes(hub)}
                                    onCheckedChange={(checked) =>
                                        toggleSelection(
                                            'printHubs',
                                            hub,
                                            Boolean(checked),
                                        )
                                    }
                                />
                                <span>{hub}</span>
                            </label>
                        ))}
                    </div>
                    <FieldError error={errors.printHubs} />
                </div>
            )}

            {formData.printScope === 'Congregations' && (
                <div>
                    <Label className="text-sm font-medium text-slate-700">
                        Which congregations is this for? <Required />
                    </Label>
                    <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                        {availableCongregations.map((congregation) => (
                            <label
                                key={congregation}
                                className="flex items-center gap-2"
                            >
                                <Checkbox
                                    checked={formData.printCongregations.includes(
                                        congregation,
                                    )}
                                    onCheckedChange={(checked) =>
                                        toggleSelection(
                                            'printCongregations',
                                            congregation,
                                            Boolean(checked),
                                        )
                                    }
                                />
                                <span>{congregation}</span>
                            </label>
                        ))}
                    </div>
                    <FieldError error={errors.printCongregations} />
                </div>
            )}

            {(isLoadingDirectory || directoryWarning) && (
                <p className="text-xs text-slate-500">
                    {isLoadingDirectory
                        ? 'Loading JG directory options...'
                        : directoryWarning}
                </p>
            )}

            <div>
                <Label className="text-sm font-medium text-slate-700">
                    Print <Required />
                </Label>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                    {printTypeOptions.map((type) => {
                        const isSelected = formData.printTypes.includes(type);
                        const quantityField = isSelected
                            ? renderQuantityField(type)
                            : null;

                        return (
                            <div key={type} className="space-y-2">
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                updateFormData('printTypes', [
                                                    ...formData.printTypes,
                                                    type,
                                                ]);
                                            } else {
                                                updateFormData(
                                                    'printTypes',
                                                    formData.printTypes.filter(
                                                        (t) => t !== type,
                                                    ),
                                                );
                                            }
                                        }}
                                    />
                                    <span>{type}</span>
                                </label>
                                {quantityField ? (
                                    <div className="pl-6">{quantityField}</div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
                <FieldError error={errors.printTypes} />
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
                <FieldError error={errors.termsAccepted} />
            </div>
        </div>
    );
}
