import type { ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { FieldError, SectionHeader } from './form-components';
import type { FormPageProps } from './types';

function RequestCard({
    id,
    checked,
    title,
    description,
    onCheckedChange,
    disabled = false,
    children,
}: {
    id: string;
    checked: boolean;
    title: string;
    description: string;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    children?: ReactNode;
}) {
    return (
        <div
            className={cn(
                'rounded-xl border p-4 transition-colors',
                checked ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300',
                disabled && 'cursor-not-allowed opacity-80',
            )}
        >
            <div className="flex items-start gap-3">
                <Checkbox
                    id={id}
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(next) => onCheckedChange(Boolean(next))}
                    className="mt-1"
                />
                <label htmlFor={id} className={cn('flex-1', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
                    <p className="text-sm font-medium text-slate-800">{title}</p>
                    <p className="mt-1 text-sm text-slate-600">{description}</p>
                </label>
            </div>

            {checked && children ? <div className="mt-3 border-t border-blue-100 pt-3">{children}</div> : null}
        </div>
    );
}

export function NatureOfRequest({ formData, updateFormData, errors = {} }: FormPageProps) {
    const selectedRequests: string[] = [];
    const isDigitalRequired = formData.includesDatesVenue || formData.includesRegistration;

    if (formData.includesDatesVenue) {
        selectedRequests.push(
            formData.includesRegistration
                ? 'Event details + registration form'
                : 'Event details (dates, times, venue)',
        );
    }

    if (formData.includesGraphics) {
        const graphicsSelections = [
            formData.includesGraphicsDigital ? 'Digital' : null,
            formData.includesGraphicsPrint ? 'Print' : null,
        ]
            .filter((value): value is string => Boolean(value))
            .join(' + ');

        selectedRequests.push(
            graphicsSelections ? `Graphics (${graphicsSelections})` : 'Graphics',
        );
    }

    if (formData.includesSignage) {
        selectedRequests.push('Signage');
    }

    return (
        <div className="space-y-6">
            <SectionHeader title="What is your request?" />

            <div className="rounded-lg border border-sage-200 bg-sage-50 p-4 text-sm text-slate-700">
                Please note, one form will be submitted per request at a time.
            </div>

            <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Select all that apply:</p>
                <p className="mb-4 text-xs text-slate-500">
                    Your choices here control which sections appear next.
                </p>
                <FieldError error={errors.natureOfRequest} />

                <div className="space-y-4">
                    <RequestCard
                        id="dates-venue"
                        checked={formData.includesDatesVenue}
                        title="Event logistics"
                        description="Includes dates, times and a venue/location."
                        onCheckedChange={(checked) => {
                            updateFormData('includesDatesVenue', checked);
                            if (checked) {
                                updateFormData('includesGraphics', true);
                                updateFormData('includesGraphicsDigital', true);
                            }
                            if (!checked) {
                                updateFormData('includesRegistration', false);
                            }
                        }}
                    >
                        <div className="rounded-lg bg-white p-3">
                            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                                Optional Add-on
                            </p>
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="registration"
                                    checked={formData.includesRegistration}
                                    onCheckedChange={(checked) => {
                                        const nextChecked = Boolean(checked);
                                        updateFormData('includesRegistration', nextChecked);
                                        if (nextChecked) {
                                            updateFormData('includesGraphics', true);
                                            updateFormData('includesGraphicsDigital', true);
                                        }
                                    }}
                                    className="mt-0.5"
                                />
                                <label htmlFor="registration" className="cursor-pointer text-sm text-slate-700">
                                    Includes a Registration Form
                                </label>
                            </div>
                        </div>
                    </RequestCard>

                    <RequestCard
                        id="graphics"
                        checked={formData.includesGraphics}
                        title="Graphics"
                        description="Request design work for digital and/or print assets."
                        disabled={isDigitalRequired}
                        onCheckedChange={(checked) => {
                            if (!checked && isDigitalRequired) {
                                return;
                            }
                            updateFormData('includesGraphics', checked);
                            if (!checked) {
                                updateFormData('includesGraphicsDigital', false);
                                updateFormData('includesGraphicsPrint', false);
                            }
                        }}
                    >
                        <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Select Graphic Types
                            </p>
                            <div className="grid gap-2 md:grid-cols-2">
                                <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                    <Checkbox
                                        id="graphics-digital"
                                        checked={formData.includesGraphicsDigital}
                                        disabled={isDigitalRequired}
                                        onCheckedChange={(checked) => {
                                            if (isDigitalRequired) return;
                                            updateFormData('includesGraphicsDigital', Boolean(checked));
                                        }}
                                        className="mt-0.5"
                                    />
                                    <span className={cn(isDigitalRequired && 'text-slate-500')}>Digital</span>
                                </label>
                                <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                    <Checkbox
                                        id="graphics-print"
                                        checked={formData.includesGraphicsPrint}
                                        onCheckedChange={(checked) =>
                                            updateFormData('includesGraphicsPrint', Boolean(checked))
                                        }
                                        className="mt-0.5"
                                    />
                                    <span>Print</span>
                                </label>
                            </div>
                            {isDigitalRequired ? (
                                <p className="text-xs text-slate-500">
                                    Digital is required when Event Logistics or Registration Form is selected.
                                </p>
                            ) : null}
                            <FieldError error={errors.graphicsType} />
                        </div>
                    </RequestCard>

                    <RequestCard
                        id="signage"
                        checked={formData.includesSignage}
                        title="Signage"
                        description="Includes banners, sharkfins and related signage."
                        onCheckedChange={(checked) => updateFormData('includesSignage', checked)}
                    />

                </div>
            </div>

            {selectedRequests.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-medium text-slate-700">Selected requests</p>
                    <div className="flex flex-wrap gap-2">
                        {selectedRequests.map((request) => (
                            <span
                                key={request}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                            >
                                {request}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
