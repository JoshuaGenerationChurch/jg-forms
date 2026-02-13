import { Label } from '@/components/ui/label';
import { FloatingLabelInput, FieldError, Required, SectionHeader } from './form-components';
import { congregationOptions, selectBase } from './types';
import type { FormPageProps } from './types';

export function ContactDetails({ formData, updateFormData, errors = {} }: FormPageProps) {
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
                    onChange={(e) => updateFormData('firstName', e.target.value)}
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

                <FloatingLabelInput
                    id="cellphone"
                    label="Cellphone"
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={formData.cellphone}
                    onChange={(e) => updateFormData('cellphone', e.target.value)}
                    error={errors.cellphone}
                />

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
                    <Label htmlFor="congregation" className="text-sm font-medium text-slate-700">
                        Your Congregation <Required />
                    </Label>
                    <select
                        id="congregation"
                        aria-invalid={Boolean(errors.congregation)}
                        className={`${selectBase} ${errors.congregation ? 'border-red-500' : ''}`}
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
                    <FieldError error={errors.congregation} />
                </div>
            </div>
        </div>
    );
}
