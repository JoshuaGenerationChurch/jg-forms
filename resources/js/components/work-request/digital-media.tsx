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
import type { FormPageProps } from './types';

export function DigitalMedia({
    formData,
    updateFormData,
    errors = {},
}: FormPageProps) {
    return (
        <div className="space-y-6">
            <SectionHeader title="Digital Media" />

            <div>
                <Label className="text-sm font-medium text-slate-700">
                    Type of graphic you want <Required />
                </Label>
                <RadioGroup
                    name="digital-graphic-type"
                    options={['Banking Details Graphic', 'Other']}
                    columns={2}
                    value={formData.digitalGraphicType}
                    onChange={(value) =>
                        updateFormData('digitalGraphicType', value)
                    }
                    error={errors.digitalGraphicType}
                />
            </div>

            {formData.digitalGraphicType === 'Banking Details Graphic' && (
                <div className="grid gap-4 md:grid-cols-2">
                    <FloatingLabelInput
                        id="digital-bank-name"
                        label="Bank Name"
                        required
                        value={formData.digitalBankName}
                        onChange={(event) =>
                            updateFormData(
                                'digitalBankName',
                                event.target.value,
                            )
                        }
                        error={errors.digitalBankName}
                    />
                    <FloatingLabelInput
                        id="digital-branch-code"
                        label="Branch Code"
                        required
                        value={formData.digitalBranchCode}
                        onChange={(event) =>
                            updateFormData(
                                'digitalBranchCode',
                                event.target.value,
                            )
                        }
                        error={errors.digitalBranchCode}
                    />
                    <FloatingLabelInput
                        id="digital-account-number"
                        label="Account Number"
                        required
                        value={formData.digitalAccountNumber}
                        onChange={(event) =>
                            updateFormData(
                                'digitalAccountNumber',
                                event.target.value,
                            )
                        }
                        error={errors.digitalAccountNumber}
                    />
                    <FloatingLabelInput
                        id="digital-reference"
                        label="Reference"
                        required
                        value={formData.digitalReference}
                        onChange={(event) =>
                            updateFormData(
                                'digitalReference',
                                event.target.value,
                            )
                        }
                        error={errors.digitalReference}
                    />
                </div>
            )}

            {formData.digitalGraphicType === 'Other' && (
                <div>
                    <p className="mb-2 text-xs text-slate-500">
                        Give us a description of the heart and purpose of your
                        activity to help us conceptualize a suitable design for
                        you, and include the information you require on this
                        graphic.
                    </p>
                    <FloatingLabelTextarea
                        id="digital-other-graphic-description"
                        label="Graphic Description"
                        required
                        value={formData.digitalOtherGraphicDescription}
                        onChange={(event) =>
                            updateFormData(
                                'digitalOtherGraphicDescription',
                                event.target.value,
                            )
                        }
                        error={errors.digitalOtherGraphicDescription}
                    />
                </div>
            )}

            <div>
                <Label className="text-sm font-medium text-slate-700">
                    Format of your graphic <Required />
                </Label>
                <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                    <label className="flex items-center gap-2">
                        <Checkbox
                            checked={formData.digitalFormatWhatsapp}
                            onCheckedChange={(checked) =>
                                updateFormData(
                                    'digitalFormatWhatsapp',
                                    Boolean(checked),
                                )
                            }
                        />
                        <span>Whatsapp (1080x1920p)</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <Checkbox
                            checked={formData.digitalFormatAVSlide}
                            onCheckedChange={(checked) =>
                                updateFormData(
                                    'digitalFormatAVSlide',
                                    Boolean(checked),
                                )
                            }
                        />
                        <span>AV Slide (1920x1080p)</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <Checkbox
                            checked={formData.digitalFormatOther}
                            onCheckedChange={(checked) =>
                                updateFormData(
                                    'digitalFormatOther',
                                    Boolean(checked),
                                )
                            }
                        />
                        <span>Other</span>
                    </label>
                </div>
                <FieldError error={errors.digitalFormats} />
            </div>

            {formData.digitalFormatOther && (
                <FloatingLabelInput
                    id="digital-other-format"
                    label="Describe the format"
                    required
                    value={formData.digitalOtherFormatDescription}
                    onChange={(event) =>
                        updateFormData(
                            'digitalOtherFormatDescription',
                            event.target.value,
                        )
                    }
                    error={errors.digitalOtherFormatDescription}
                />
            )}
        </div>
    );
}
