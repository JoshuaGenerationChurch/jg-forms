import { ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
    FieldError,
    FloatingLabelInput,
    Required,
    SectionHeader,
} from './form-components';
import {
    combinePhoneNumber,
    countryCodeOptionsWithCurrent,
    phonePlaceholderByCountryCode,
    splitPhoneNumber,
} from './phone';
import { congregationOptions, selectBase } from './types';
import type { FormPageProps } from './types';

export function ContactDetails({
    formData,
    updateFormData,
    errors = {},
}: FormPageProps) {
    const cellphoneParts = splitPhoneNumber(formData.cellphone);
    const cellphoneCountryCodeOptions = countryCodeOptionsWithCurrent(
        cellphoneParts.countryCode,
    );
    const cellphoneInvalid = Boolean(errors.cellphone);

    return (
        <div className="space-y-6">
            <SectionHeader title="Contact Details" />
            <div className="grid gap-6 md:grid-cols-2">
                <FloatingLabelInput
                    id="first-name"
                    label="First Name"
                    required
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={(e) =>
                        updateFormData('firstName', e.target.value)
                    }
                    error={errors.firstName}
                />

                <FloatingLabelInput
                    id="last-name"
                    label="Last Name"
                    required
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    error={errors.lastName}
                />

                <div>
                    <Label
                        htmlFor="cellphone-local-number"
                        className="text-sm font-medium text-slate-700"
                    >
                        Cellphone <Required />
                    </Label>
                    <div className="mt-2 grid grid-cols-[minmax(12rem,14rem)_minmax(0,1fr)] gap-2">
                        <div className="relative">
                            <select
                                id="cellphone-country-code"
                                aria-label="Cellphone country code"
                                className={`h-12 w-full appearance-none rounded-lg border-2 bg-slate-100/50 pl-4 pr-12 text-sm text-slate-900 shadow-sm transition focus-visible:border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:outline-none ${cellphoneInvalid ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`}
                                value={cellphoneParts.countryCode}
                                onChange={(e) =>
                                    updateFormData(
                                        'cellphone',
                                        combinePhoneNumber(
                                            e.target.value,
                                            cellphoneParts.localNumber,
                                        ),
                                    )
                                }
                            >
                                {cellphoneCountryCodeOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-slate-500" />
                        </div>
                        <input
                            id="cellphone-local-number"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel-national"
                            aria-invalid={cellphoneInvalid}
                            className={`h-12 rounded-lg border-2 bg-slate-100/50 px-4 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:outline-none ${cellphoneInvalid ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`}
                            placeholder={phonePlaceholderByCountryCode(
                                cellphoneParts.countryCode,
                            )}
                            value={cellphoneParts.localNumber}
                            onChange={(e) =>
                                updateFormData(
                                    'cellphone',
                                    combinePhoneNumber(
                                        cellphoneParts.countryCode,
                                        e.target.value,
                                    ),
                                )
                            }
                        />
                    </div>
                    <FieldError error={errors.cellphone} />
                </div>

                <FloatingLabelInput
                    id="email"
                    label="Email"
                    required
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    error={errors.email}
                />

                <div>
                    <Label
                        htmlFor="congregation"
                        className="text-sm font-medium text-slate-700"
                    >
                        Your Congregation <Required />
                    </Label>
                    <select
                        id="congregation"
                        aria-invalid={Boolean(errors.congregation)}
                        className={`${selectBase} ${errors.congregation ? 'border-red-500' : ''}`}
                        value={formData.congregation}
                        onChange={(e) =>
                            updateFormData('congregation', e.target.value)
                        }
                    >
                        <option value="">Select an Option</option>
                        {congregationOptions.map((cong) => (
                            <option key={cong} value={cong}>
                                {cong}
                            </option>
                        ))}
                    </select>
                    <FieldError error={errors.congregation} />
                </div>
            </div>
        </div>
    );
}
