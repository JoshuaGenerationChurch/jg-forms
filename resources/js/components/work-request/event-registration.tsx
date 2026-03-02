import { Minus, Plus } from 'lucide-react';
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
    dateInputBase,
    type FormPageProps,
    withRequiredRegistrationInfoFields,
} from './types';

export function EventRegistration({
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
    const ticketPriceLabel =
        formData.ticketCurrency !== ''
            ? `Price (${formData.ticketCurrency})`
            : 'Price';
    const updateInfoToCollect = (
        nextInfoToCollect: typeof formData.infoToCollect,
    ) => {
        updateFormData(
            'infoToCollect',
            withRequiredRegistrationInfoFields(nextInfoToCollect),
        );
    };

    return (
        <div className="space-y-6">
            <SectionHeader title="Event Registration Form" />

            <div>
                <p className="text-xs text-slate-500">
                    A brief description that will appear on your event form.
                </p>
                <div className="mt-2">
                    <FloatingLabelTextarea
                        id="quicket-description"
                        label="Description"
                        required
                        value={formData.quicketDescription}
                        onChange={(e) =>
                            updateFormData('quicketDescription', e.target.value)
                        }
                        error={errors.quicketDescription}
                    />
                </div>
            </div>

            {/* Ticket Types Section */}
            <div>
                <div className="mb-4 max-w-xs space-y-1">
                    <Label
                        htmlFor="ticket-currency"
                        className="text-sm font-medium text-slate-700"
                    >
                        Ticket Currency <Required />
                    </Label>
                    <select
                        id="ticket-currency"
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-400"
                        value={formData.ticketCurrency}
                        onChange={(event) =>
                            updateFormData('ticketCurrency', event.target.value)
                        }
                    >
                        <option value="">Select currency</option>
                        <option value="ZAR">South African rand (ZAR)</option>
                        <option value="USD">US dollar (USD)</option>
                    </select>
                    <FieldError error={errors.ticketCurrency} />
                </div>

                <Label className="text-sm font-medium text-slate-700">
                    Ticket Types <Required />
                </Label>
                <FieldError error={errors.ticketTypes} />
                <FieldError error={errors.otherTickets} />

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
                                <FloatingLabelInput
                                    id="adults18-price"
                                    label={ticketPriceLabel}
                                    required
                                    type="number"
                                    inputMode="numeric"
                                    value={formData.ticketPrices.adults18Plus}
                                    onChange={(e) =>
                                        updateFormData('ticketPrices', {
                                            ...formData.ticketPrices,
                                            adults18Plus: e.target.value,
                                        })
                                    }
                                    error={errors['ticketPrices.adults18Plus']}
                                />

                                <FloatingLabelInput
                                    id="adults18-qty"
                                    label="Quantity"
                                    required
                                    type="number"
                                    inputMode="numeric"
                                    value={
                                        formData.ticketQuantities.adults18Plus
                                    }
                                    onChange={(e) =>
                                        updateFormData('ticketQuantities', {
                                            ...formData.ticketQuantities,
                                            adults18Plus: e.target.value,
                                        })
                                    }
                                    error={
                                        errors['ticketQuantities.adults18Plus']
                                    }
                                />
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
                                <FloatingLabelInput
                                    id="adults13-price"
                                    label={ticketPriceLabel}
                                    required
                                    type="number"
                                    inputMode="numeric"
                                    value={formData.ticketPrices.adults13Plus}
                                    onChange={(e) =>
                                        updateFormData('ticketPrices', {
                                            ...formData.ticketPrices,
                                            adults13Plus: e.target.value,
                                        })
                                    }
                                    error={errors['ticketPrices.adults13Plus']}
                                />

                                <FloatingLabelInput
                                    id="adults13-qty"
                                    label="Quantity"
                                    required
                                    type="number"
                                    inputMode="numeric"
                                    value={
                                        formData.ticketQuantities.adults13Plus
                                    }
                                    onChange={(e) =>
                                        updateFormData('ticketQuantities', {
                                            ...formData.ticketQuantities,
                                            adults13Plus: e.target.value,
                                        })
                                    }
                                    error={
                                        errors['ticketQuantities.adults13Plus']
                                    }
                                />
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
                            <span className="font-medium">
                                Children 4-12 years
                            </span>
                        </label>

                        {formData.ticketTypes.children4to12 && (
                            <div className="ml-6 grid gap-4 md:grid-cols-2">
                                <FloatingLabelInput
                                    id="children4-price"
                                    label={ticketPriceLabel}
                                    required
                                    type="number"
                                    inputMode="numeric"
                                    value={formData.ticketPrices.children4to12}
                                    onChange={(e) =>
                                        updateFormData('ticketPrices', {
                                            ...formData.ticketPrices,
                                            children4to12: e.target.value,
                                        })
                                    }
                                    error={errors['ticketPrices.children4to12']}
                                />

                                <FloatingLabelInput
                                    id="children4-qty"
                                    label="Quantity"
                                    required
                                    type="number"
                                    inputMode="numeric"
                                    value={
                                        formData.ticketQuantities.children4to12
                                    }
                                    onChange={(e) =>
                                        updateFormData('ticketQuantities', {
                                            ...formData.ticketQuantities,
                                            children4to12: e.target.value,
                                        })
                                    }
                                    error={
                                        errors['ticketQuantities.children4to12']
                                    }
                                />
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
                            <span className="font-medium">
                                Children 0-3 years
                            </span>
                        </label>

                        {formData.ticketTypes.children0to3 && (
                            <div className="ml-6 grid gap-4 md:grid-cols-2">
                                <FloatingLabelInput
                                    id="children0-price"
                                    label={ticketPriceLabel}
                                    required
                                    type="number"
                                    inputMode="numeric"
                                    value={formData.ticketPrices.children0to3}
                                    onChange={(e) =>
                                        updateFormData('ticketPrices', {
                                            ...formData.ticketPrices,
                                            children0to3: e.target.value,
                                        })
                                    }
                                    error={errors['ticketPrices.children0to3']}
                                />

                                <FloatingLabelInput
                                    id="children0-qty"
                                    label="Quantity"
                                    required
                                    type="number"
                                    inputMode="numeric"
                                    value={
                                        formData.ticketQuantities.children0to3
                                    }
                                    onChange={(e) =>
                                        updateFormData('ticketQuantities', {
                                            ...formData.ticketQuantities,
                                            children0to3: e.target.value,
                                        })
                                    }
                                    error={
                                        errors['ticketQuantities.children0to3']
                                    }
                                />
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
                                    <div
                                        key={index}
                                        className="flex items-end gap-2"
                                    >
                                        <FloatingLabelInput
                                            id={`other-ticket-${index}-name`}
                                            label="Ticket Name"
                                            required
                                            value={ticket.name}
                                            onChange={(e) => {
                                                const newTickets = [
                                                    ...formData.otherTickets,
                                                ];
                                                newTickets[index].name =
                                                    e.target.value;
                                                updateFormData(
                                                    'otherTickets',
                                                    newTickets,
                                                );
                                            }}
                                            className="flex-1"
                                        />

                                        <FloatingLabelInput
                                            id={`other-ticket-${index}-price`}
                                            label={ticketPriceLabel}
                                            required
                                            type="number"
                                            inputMode="numeric"
                                            value={ticket.price}
                                            onChange={(e) => {
                                                const newTickets = [
                                                    ...formData.otherTickets,
                                                ];
                                                newTickets[index].price =
                                                    e.target.value;
                                                updateFormData(
                                                    'otherTickets',
                                                    newTickets,
                                                );
                                            }}
                                            className="w-32"
                                        />

                                        <FloatingLabelInput
                                            id={`other-ticket-${index}-qty`}
                                            label="Qty"
                                            required
                                            type="number"
                                            inputMode="numeric"
                                            value={ticket.quantity}
                                            onChange={(e) => {
                                                const newTickets = [
                                                    ...formData.otherTickets,
                                                ];
                                                newTickets[index].quantity =
                                                    e.target.value;
                                                updateFormData(
                                                    'otherTickets',
                                                    newTickets,
                                                );
                                            }}
                                            className="w-28"
                                        />

                                        <Button
                                            variant="outline"
                                            size="icon"
                                            type="button"
                                            onClick={() => {
                                                const newTickets =
                                                    formData.otherTickets.filter(
                                                        (_, i) => i !== index,
                                                    );
                                                updateFormData(
                                                    'otherTickets',
                                                    newTickets,
                                                );
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
                                            {
                                                name: '',
                                                price: '',
                                                quantity: '',
                                            },
                                        ])
                                    }
                                >
                                    <Plus className="mr-2 size-4" />
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
                    Do your ticket prices include a 10% fee for our event
                    platform's administrative and commission fees? <Required />
                </Label>
                <RadioGroup
                    name="ticket-price-includes-fee"
                    options={['Yes', 'No']}
                    columns={2}
                    value={formData.ticketPriceIncludesFee}
                    onChange={(value) =>
                        updateFormData('ticketPriceIncludesFee', value)
                    }
                    error={errors.ticketPriceIncludesFee}
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
                            checked
                            disabled
                            onCheckedChange={() => {
                                // Required by registration platform.
                            }}
                        />
                        <span>Name (required)</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <Checkbox
                            checked
                            disabled
                            onCheckedChange={() => {
                                // Required by registration platform.
                            }}
                        />
                        <span>Last Name (required)</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <Checkbox
                            checked
                            disabled
                            onCheckedChange={() => {
                                // Required by registration platform.
                            }}
                        />
                        <span>Email (required)</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <Checkbox
                            checked
                            disabled
                            onCheckedChange={() => {
                                // Required by registration platform.
                            }}
                        />
                        <span>Cellphone (required)</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <Checkbox
                            checked={formData.infoToCollect.congregation}
                            onCheckedChange={(checked) =>
                                updateInfoToCollect({
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
                                updateInfoToCollect({
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
                                updateInfoToCollect({
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
                                updateInfoToCollect({
                                    ...formData.infoToCollect,
                                    other: checked as boolean,
                                })
                            }
                        />
                        <span>Other</span>
                    </label>
                </div>
                <FieldError error={errors.infoToCollect} />

                {/* Other Info Fields Repeater */}
                {formData.infoToCollect.other && (
                    <div className="mt-4 space-y-2">
                        {formData.otherInfoFields.map((field, index) => (
                            <div key={index} className="flex items-end gap-2">
                                <FloatingLabelInput
                                    id={`other-info-field-${index}`}
                                    label="Field name"
                                    value={field}
                                    onChange={(e) => {
                                        const newFields = [
                                            ...formData.otherInfoFields,
                                        ];
                                        newFields[index] = e.target.value;
                                        updateFormData(
                                            'otherInfoFields',
                                            newFields,
                                        );
                                    }}
                                    className="flex-1"
                                />

                                <Button
                                    variant="outline"
                                    size="icon"
                                    type="button"
                                    onClick={() => {
                                        const newFields =
                                            formData.otherInfoFields.filter(
                                                (_, i) => i !== index,
                                            );
                                        updateFormData(
                                            'otherInfoFields',
                                            newFields,
                                        );
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
                                updateFormData('otherInfoFields', [
                                    ...formData.otherInfoFields,
                                    '',
                                ])
                            }
                        >
                            <Plus className="mr-2 size-4" />
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
                    columns={2}
                    value={formData.allowDonations}
                    onChange={(value) =>
                        updateFormData('allowDonations', value)
                    }
                    error={errors.allowDonations}
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
                    min={todayIsoDate}
                    aria-invalid={Boolean(errors.registrationClosingDate)}
                    className={`${dateInputBase} ${
                        errors.registrationClosingDate
                            ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500'
                            : ''
                    }`}
                    value={formData.registrationClosingDate}
                    onChange={(e) =>
                        updateFormData(
                            'registrationClosingDate',
                            e.target.value,
                        )
                    }
                />
                <FieldError error={errors.registrationClosingDate} />
            </div>
        </div>
    );
}
