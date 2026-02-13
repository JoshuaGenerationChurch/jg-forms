import type { ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
    FieldError,
    FloatingLabelInput,
    FloatingLabelTextarea,
    SectionHeader,
} from './form-components';
import type { FormPageProps } from './types';

function OptionImage({ label }: { label: string }) {
    return (
        <div className="mb-3 aspect-[4/3] w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100">
            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-slate-500">
                {label} image
            </div>
        </div>
    );
}

function OptionCard({
    id,
    label,
    checked,
    onCheckedChange,
    showImage = true,
    children,
}: {
    id: string;
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    showImage?: boolean;
    children?: ReactNode;
}) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
            {showImage ? <OptionImage label={label} /> : null}
            <label htmlFor={id} className="flex items-start gap-3">
                <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(next) => onCheckedChange(Boolean(next))}
                    className="mt-0.5"
                />
                <span className="text-sm text-slate-700">{label}</span>
            </label>
            {checked && children ? (
                <div className="mt-3 pl-7">{children}</div>
            ) : null}
        </div>
    );
}

function DirectionQtyGrid({
    idPrefix,
    upQty,
    downQty,
    leftQty,
    rightQty,
    onUpChange,
    onDownChange,
    onLeftChange,
    onRightChange,
    error,
}: {
    idPrefix: string;
    upQty: string;
    downQty: string;
    leftQty: string;
    rightQty: string;
    onUpChange: (value: string) => void;
    onDownChange: (value: string) => void;
    onLeftChange: (value: string) => void;
    onRightChange: (value: string) => void;
    error?: string;
}) {
    return (
        <div className="space-y-2">
            <div className="grid gap-3 md:grid-cols-2">
                <FloatingLabelInput
                    id={`${idPrefix}-up`}
                    label="Up"
                    type="number"
                    inputMode="numeric"
                    value={upQty}
                    onChange={(e) => onUpChange(e.target.value)}
                />
                <FloatingLabelInput
                    id={`${idPrefix}-down`}
                    label="Down"
                    type="number"
                    inputMode="numeric"
                    value={downQty}
                    onChange={(e) => onDownChange(e.target.value)}
                />
                <FloatingLabelInput
                    id={`${idPrefix}-left`}
                    label="Left"
                    type="number"
                    inputMode="numeric"
                    value={leftQty}
                    onChange={(e) => onLeftChange(e.target.value)}
                />
                <FloatingLabelInput
                    id={`${idPrefix}-right`}
                    label="Right"
                    type="number"
                    inputMode="numeric"
                    value={rightQty}
                    onChange={(e) => onRightChange(e.target.value)}
                />
            </div>
            <FieldError error={error} />
        </div>
    );
}

export function Signage({
    formData,
    updateFormData,
    errors = {},
}: FormPageProps) {
    return (
        <div className="space-y-6">
            <SectionHeader title="Signage" />

            <FieldError error={errors.signageSelection} />

            <div className="space-y-3">
                <p className="text-sm text-slate-700">Sharkfin Banners</p>
                <div className="grid gap-3 md:grid-cols-2">
                    <OptionCard
                        id="sharkfin-jg-branded"
                        label="JG Branded (3m)"
                        checked={formData.sharkfinJgBranded}
                        onCheckedChange={(checked) => {
                            updateFormData('sharkfinJgBranded', checked);
                            if (!checked)
                                updateFormData('sharkfinJgBrandedQty', '');
                        }}
                    >
                        <FloatingLabelInput
                            id="sharkfin-jg-branded-qty"
                            label="Quantity"
                            required
                            type="number"
                            inputMode="numeric"
                            value={formData.sharkfinJgBrandedQty}
                            onChange={(e) =>
                                updateFormData(
                                    'sharkfinJgBrandedQty',
                                    e.target.value,
                                )
                            }
                            error={errors.sharkfinJgBrandedQty}
                        />
                    </OptionCard>

                    <OptionCard
                        id="sharkfin-jg-kids-branded"
                        label="JG Kids Branded (2m)"
                        checked={formData.sharkfinJgKidsBranded}
                        onCheckedChange={(checked) => {
                            updateFormData('sharkfinJgKidsBranded', checked);
                            if (!checked)
                                updateFormData('sharkfinJgKidsBrandedQty', '');
                        }}
                    >
                        <FloatingLabelInput
                            id="sharkfin-jg-kids-branded-qty"
                            label="Quantity"
                            required
                            type="number"
                            inputMode="numeric"
                            value={formData.sharkfinJgKidsBrandedQty}
                            onChange={(e) =>
                                updateFormData(
                                    'sharkfinJgKidsBrandedQty',
                                    e.target.value,
                                )
                            }
                            error={errors.sharkfinJgKidsBrandedQty}
                        />
                    </OptionCard>
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-sm text-slate-700">
                    Temporary Fence Banners
                </p>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-3 h-40 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                        <div className="flex h-full items-center justify-center px-3 text-center text-xs text-slate-500">
                            Temporary Fence Banner image
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-md border border-slate-200 p-3">
                            <label
                                htmlFor="temporary-fence-standard-2x1"
                                className="flex items-start gap-2"
                            >
                                <Checkbox
                                    id="temporary-fence-standard-2x1"
                                    checked={formData.temporaryFenceStandard2x1}
                                    onCheckedChange={(checked) => {
                                        const nextChecked = Boolean(checked);
                                        updateFormData(
                                            'temporaryFenceStandard2x1',
                                            nextChecked,
                                        );
                                        if (!nextChecked)
                                            updateFormData(
                                                'temporaryFenceStandard2x1Qty',
                                                '',
                                            );
                                    }}
                                    className="mt-0.5"
                                />
                                <span className="text-sm text-slate-700">
                                    2x1m
                                </span>
                            </label>
                            {formData.temporaryFenceStandard2x1 ? (
                                <div className="mt-3">
                                    <FloatingLabelInput
                                        id="temporary-fence-standard-2x1-qty"
                                        label="Quantity"
                                        required
                                        type="number"
                                        inputMode="numeric"
                                        value={
                                            formData.temporaryFenceStandard2x1Qty
                                        }
                                        onChange={(e) =>
                                            updateFormData(
                                                'temporaryFenceStandard2x1Qty',
                                                e.target.value,
                                            )
                                        }
                                        error={
                                            errors.temporaryFenceStandard2x1Qty
                                        }
                                    />
                                </div>
                            ) : null}
                        </div>

                        <div className="rounded-md border border-slate-200 p-3">
                            <label
                                htmlFor="temporary-fence-custom-3x1"
                                className="flex items-start gap-2"
                            >
                                <Checkbox
                                    id="temporary-fence-custom-3x1"
                                    checked={formData.temporaryFenceCustom3x1}
                                    onCheckedChange={(checked) => {
                                        const nextChecked = Boolean(checked);
                                        updateFormData(
                                            'temporaryFenceCustom3x1',
                                            nextChecked,
                                        );
                                        if (!nextChecked)
                                            updateFormData(
                                                'temporaryFenceCustom3x1Qty',
                                                '',
                                            );
                                    }}
                                    className="mt-0.5"
                                />
                                <span className="text-sm text-slate-700">
                                    3x1m
                                </span>
                            </label>
                            {formData.temporaryFenceCustom3x1 ? (
                                <div className="mt-3">
                                    <FloatingLabelInput
                                        id="temporary-fence-custom-3x1-qty"
                                        label="Quantity"
                                        required
                                        type="number"
                                        inputMode="numeric"
                                        value={
                                            formData.temporaryFenceCustom3x1Qty
                                        }
                                        onChange={(e) =>
                                            updateFormData(
                                                'temporaryFenceCustom3x1Qty',
                                                e.target.value,
                                            )
                                        }
                                        error={
                                            errors.temporaryFenceCustom3x1Qty
                                        }
                                    />
                                </div>
                            ) : null}
                        </div>

                        <div className="rounded-md border border-slate-200 p-3">
                            <label
                                htmlFor="temporary-fence-custom-4x1"
                                className="flex items-start gap-2"
                            >
                                <Checkbox
                                    id="temporary-fence-custom-4x1"
                                    checked={formData.temporaryFenceCustom4x1}
                                    onCheckedChange={(checked) => {
                                        const nextChecked = Boolean(checked);
                                        updateFormData(
                                            'temporaryFenceCustom4x1',
                                            nextChecked,
                                        );
                                        if (!nextChecked)
                                            updateFormData(
                                                'temporaryFenceCustom4x1Qty',
                                                '',
                                            );
                                    }}
                                    className="mt-0.5"
                                />
                                <span className="text-sm text-slate-700">
                                    4x1m
                                </span>
                            </label>
                            {formData.temporaryFenceCustom4x1 ? (
                                <div className="mt-3">
                                    <FloatingLabelInput
                                        id="temporary-fence-custom-4x1-qty"
                                        label="Quantity"
                                        required
                                        type="number"
                                        inputMode="numeric"
                                        value={
                                            formData.temporaryFenceCustom4x1Qty
                                        }
                                        onChange={(e) =>
                                            updateFormData(
                                                'temporaryFenceCustom4x1Qty',
                                                e.target.value,
                                            )
                                        }
                                        error={
                                            errors.temporaryFenceCustom4x1Qty
                                        }
                                    />
                                </div>
                            ) : null}
                        </div>

                        <div className="rounded-md border border-slate-200 p-3">
                            <label
                                htmlFor="temporary-fence-custom-5x1"
                                className="flex items-start gap-2"
                            >
                                <Checkbox
                                    id="temporary-fence-custom-5x1"
                                    checked={formData.temporaryFenceCustom5x1}
                                    onCheckedChange={(checked) => {
                                        const nextChecked = Boolean(checked);
                                        updateFormData(
                                            'temporaryFenceCustom5x1',
                                            nextChecked,
                                        );
                                        if (!nextChecked)
                                            updateFormData(
                                                'temporaryFenceCustom5x1Qty',
                                                '',
                                            );
                                    }}
                                    className="mt-0.5"
                                />
                                <span className="text-sm text-slate-700">
                                    5x1m
                                </span>
                            </label>
                            {formData.temporaryFenceCustom5x1 ? (
                                <div className="mt-3">
                                    <FloatingLabelInput
                                        id="temporary-fence-custom-5x1-qty"
                                        label="Quantity"
                                        required
                                        type="number"
                                        inputMode="numeric"
                                        value={
                                            formData.temporaryFenceCustom5x1Qty
                                        }
                                        onChange={(e) =>
                                            updateFormData(
                                                'temporaryFenceCustom5x1Qty',
                                                e.target.value,
                                            )
                                        }
                                        error={
                                            errors.temporaryFenceCustom5x1Qty
                                        }
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-sm text-slate-700">
                    Internal/Directional Signs
                </p>

                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-700">Toilets</p>
                    <div className="grid gap-3 md:grid-cols-2">
                        <OptionCard
                            id="toilets-arrows-male-word"
                            label="Arrows with Male Word"
                            checked={formData.toiletsArrowsMaleWord}
                            onCheckedChange={(checked) => {
                                updateFormData(
                                    'toiletsArrowsMaleWord',
                                    checked,
                                );
                                if (!checked) {
                                    updateFormData(
                                        'toiletsArrowsMaleWordUpQty',
                                        '',
                                    );
                                    updateFormData(
                                        'toiletsArrowsMaleWordDownQty',
                                        '',
                                    );
                                    updateFormData(
                                        'toiletsArrowsMaleWordLeftQty',
                                        '',
                                    );
                                    updateFormData(
                                        'toiletsArrowsMaleWordRightQty',
                                        '',
                                    );
                                }
                            }}
                        >
                            <DirectionQtyGrid
                                idPrefix="toilets-arrows-male-word"
                                upQty={formData.toiletsArrowsMaleWordUpQty}
                                downQty={formData.toiletsArrowsMaleWordDownQty}
                                leftQty={formData.toiletsArrowsMaleWordLeftQty}
                                rightQty={
                                    formData.toiletsArrowsMaleWordRightQty
                                }
                                onUpChange={(value) =>
                                    updateFormData(
                                        'toiletsArrowsMaleWordUpQty',
                                        value,
                                    )
                                }
                                onDownChange={(value) =>
                                    updateFormData(
                                        'toiletsArrowsMaleWordDownQty',
                                        value,
                                    )
                                }
                                onLeftChange={(value) =>
                                    updateFormData(
                                        'toiletsArrowsMaleWordLeftQty',
                                        value,
                                    )
                                }
                                onRightChange={(value) =>
                                    updateFormData(
                                        'toiletsArrowsMaleWordRightQty',
                                        value,
                                    )
                                }
                                error={errors.toiletsArrowsMaleWord}
                            />
                        </OptionCard>

                        <OptionCard
                            id="toilets-arrows-female-word"
                            label="Arrows with Female Word"
                            checked={formData.toiletsArrowsFemaleWord}
                            onCheckedChange={(checked) => {
                                updateFormData(
                                    'toiletsArrowsFemaleWord',
                                    checked,
                                );
                                if (!checked) {
                                    updateFormData(
                                        'toiletsArrowsFemaleWordUpQty',
                                        '',
                                    );
                                    updateFormData(
                                        'toiletsArrowsFemaleWordDownQty',
                                        '',
                                    );
                                    updateFormData(
                                        'toiletsArrowsFemaleWordLeftQty',
                                        '',
                                    );
                                    updateFormData(
                                        'toiletsArrowsFemaleWordRightQty',
                                        '',
                                    );
                                }
                            }}
                        >
                            <DirectionQtyGrid
                                idPrefix="toilets-arrows-female-word"
                                upQty={formData.toiletsArrowsFemaleWordUpQty}
                                downQty={
                                    formData.toiletsArrowsFemaleWordDownQty
                                }
                                leftQty={
                                    formData.toiletsArrowsFemaleWordLeftQty
                                }
                                rightQty={
                                    formData.toiletsArrowsFemaleWordRightQty
                                }
                                onUpChange={(value) =>
                                    updateFormData(
                                        'toiletsArrowsFemaleWordUpQty',
                                        value,
                                    )
                                }
                                onDownChange={(value) =>
                                    updateFormData(
                                        'toiletsArrowsFemaleWordDownQty',
                                        value,
                                    )
                                }
                                onLeftChange={(value) =>
                                    updateFormData(
                                        'toiletsArrowsFemaleWordLeftQty',
                                        value,
                                    )
                                }
                                onRightChange={(value) =>
                                    updateFormData(
                                        'toiletsArrowsFemaleWordRightQty',
                                        value,
                                    )
                                }
                                error={errors.toiletsArrowsFemaleWord}
                            />
                        </OptionCard>

                        <OptionCard
                            id="toilets-arrows-male-female-word"
                            label="Arrows with Male/Female Word"
                            checked={formData.toiletsArrowsMaleFemaleWord}
                            onCheckedChange={(checked) => {
                                updateFormData(
                                    'toiletsArrowsMaleFemaleWord',
                                    checked,
                                );
                                if (!checked) {
                                    updateFormData(
                                        'toiletsArrowsMaleFemaleWordUpQty',
                                        '',
                                    );
                                    updateFormData(
                                        'toiletsArrowsMaleFemaleWordDownQty',
                                        '',
                                    );
                                    updateFormData(
                                        'toiletsArrowsMaleFemaleWordLeftQty',
                                        '',
                                    );
                                    updateFormData(
                                        'toiletsArrowsMaleFemaleWordRightQty',
                                        '',
                                    );
                                }
                            }}
                        >
                            <DirectionQtyGrid
                                idPrefix="toilets-arrows-male-female-word"
                                upQty={
                                    formData.toiletsArrowsMaleFemaleWordUpQty
                                }
                                downQty={
                                    formData.toiletsArrowsMaleFemaleWordDownQty
                                }
                                leftQty={
                                    formData.toiletsArrowsMaleFemaleWordLeftQty
                                }
                                rightQty={
                                    formData.toiletsArrowsMaleFemaleWordRightQty
                                }
                                onUpChange={(value) =>
                                    updateFormData(
                                        'toiletsArrowsMaleFemaleWordUpQty',
                                        value,
                                    )
                                }
                                onDownChange={(value) =>
                                    updateFormData(
                                        'toiletsArrowsMaleFemaleWordDownQty',
                                        value,
                                    )
                                }
                                onLeftChange={(value) =>
                                    updateFormData(
                                        'toiletsArrowsMaleFemaleWordLeftQty',
                                        value,
                                    )
                                }
                                onRightChange={(value) =>
                                    updateFormData(
                                        'toiletsArrowsMaleFemaleWordRightQty',
                                        value,
                                    )
                                }
                                error={errors.toiletsArrowsMaleFemaleWord}
                            />
                        </OptionCard>

                        <OptionCard
                            id="toilets-male-female"
                            label='Male/Female (sign reads "Male/Female")'
                            checked={formData.toiletsMaleFemale}
                            onCheckedChange={(checked) => {
                                updateFormData('toiletsMaleFemale', checked);
                                if (!checked)
                                    updateFormData('toiletsMaleFemaleQty', '');
                            }}
                        >
                            <FloatingLabelInput
                                id="toilets-male-female-qty"
                                label="Quantity"
                                required
                                type="number"
                                inputMode="numeric"
                                value={formData.toiletsMaleFemaleQty}
                                onChange={(e) =>
                                    updateFormData(
                                        'toiletsMaleFemaleQty',
                                        e.target.value,
                                    )
                                }
                                error={errors.toiletsMaleFemaleQty}
                            />
                        </OptionCard>

                        <OptionCard
                            id="toilets-male"
                            label="Male"
                            checked={formData.toiletsMale}
                            onCheckedChange={(checked) => {
                                updateFormData('toiletsMale', checked);
                                if (!checked)
                                    updateFormData('toiletsMaleQty', '');
                            }}
                        >
                            <FloatingLabelInput
                                id="toilets-male-qty"
                                label="Quantity"
                                required
                                type="number"
                                inputMode="numeric"
                                value={formData.toiletsMaleQty}
                                onChange={(e) =>
                                    updateFormData(
                                        'toiletsMaleQty',
                                        e.target.value,
                                    )
                                }
                                error={errors.toiletsMaleQty}
                            />
                        </OptionCard>

                        <OptionCard
                            id="toilets-female"
                            label="Female"
                            checked={formData.toiletsFemale}
                            onCheckedChange={(checked) => {
                                updateFormData('toiletsFemale', checked);
                                if (!checked)
                                    updateFormData('toiletsFemaleQty', '');
                            }}
                        >
                            <FloatingLabelInput
                                id="toilets-female-qty"
                                label="Quantity"
                                required
                                type="number"
                                inputMode="numeric"
                                value={formData.toiletsFemaleQty}
                                onChange={(e) =>
                                    updateFormData(
                                        'toiletsFemaleQty',
                                        e.target.value,
                                    )
                                }
                                error={errors.toiletsFemaleQty}
                            />
                        </OptionCard>
                    </div>
                </div>

                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-700">Moms Room</p>
                    <div className="grid gap-3 md:grid-cols-2">
                        <OptionCard
                            id="moms-nursing"
                            label="Nursing Moms (No Men Allowed)"
                            checked={formData.momsNursing}
                            onCheckedChange={(checked) => {
                                updateFormData('momsNursing', checked);
                                if (!checked)
                                    updateFormData('momsNursingQty', '');
                            }}
                        >
                            <FloatingLabelInput
                                id="moms-nursing-qty"
                                label="Quantity"
                                required
                                type="number"
                                inputMode="numeric"
                                value={formData.momsNursingQty}
                                onChange={(e) =>
                                    updateFormData(
                                        'momsNursingQty',
                                        e.target.value,
                                    )
                                }
                                error={errors.momsNursingQty}
                            />
                        </OptionCard>

                        <OptionCard
                            id="moms-nursing-with-arrows"
                            label="Nursing Moms (No Men Allowed) with Arrows"
                            checked={formData.momsNursingWithArrows}
                            onCheckedChange={(checked) => {
                                updateFormData(
                                    'momsNursingWithArrows',
                                    checked,
                                );
                                if (!checked) {
                                    updateFormData(
                                        'momsNursingWithArrowsUpQty',
                                        '',
                                    );
                                    updateFormData(
                                        'momsNursingWithArrowsDownQty',
                                        '',
                                    );
                                    updateFormData(
                                        'momsNursingWithArrowsLeftQty',
                                        '',
                                    );
                                    updateFormData(
                                        'momsNursingWithArrowsRightQty',
                                        '',
                                    );
                                }
                            }}
                        >
                            <DirectionQtyGrid
                                idPrefix="moms-nursing-with-arrows"
                                upQty={formData.momsNursingWithArrowsUpQty}
                                downQty={formData.momsNursingWithArrowsDownQty}
                                leftQty={formData.momsNursingWithArrowsLeftQty}
                                rightQty={
                                    formData.momsNursingWithArrowsRightQty
                                }
                                onUpChange={(value) =>
                                    updateFormData(
                                        'momsNursingWithArrowsUpQty',
                                        value,
                                    )
                                }
                                onDownChange={(value) =>
                                    updateFormData(
                                        'momsNursingWithArrowsDownQty',
                                        value,
                                    )
                                }
                                onLeftChange={(value) =>
                                    updateFormData(
                                        'momsNursingWithArrowsLeftQty',
                                        value,
                                    )
                                }
                                onRightChange={(value) =>
                                    updateFormData(
                                        'momsNursingWithArrowsRightQty',
                                        value,
                                    )
                                }
                                error={errors.momsNursingWithArrows}
                            />
                        </OptionCard>

                        <OptionCard
                            id="moms-with-babies"
                            label="Moms Room (Moms with babies)"
                            checked={formData.momsWithBabies}
                            onCheckedChange={(checked) => {
                                updateFormData('momsWithBabies', checked);
                                if (!checked)
                                    updateFormData('momsWithBabiesQty', '');
                            }}
                        >
                            <FloatingLabelInput
                                id="moms-with-babies-qty"
                                label="Quantity"
                                required
                                type="number"
                                inputMode="numeric"
                                value={formData.momsWithBabiesQty}
                                onChange={(e) =>
                                    updateFormData(
                                        'momsWithBabiesQty',
                                        e.target.value,
                                    )
                                }
                                error={errors.momsWithBabiesQty}
                            />
                        </OptionCard>

                        <OptionCard
                            id="moms-with-babies-with-arrows"
                            label="Moms Room (Moms with babies) with Arrows"
                            checked={formData.momsWithBabiesWithArrows}
                            onCheckedChange={(checked) => {
                                updateFormData(
                                    'momsWithBabiesWithArrows',
                                    checked,
                                );
                                if (!checked) {
                                    updateFormData(
                                        'momsWithBabiesWithArrowsUpQty',
                                        '',
                                    );
                                    updateFormData(
                                        'momsWithBabiesWithArrowsDownQty',
                                        '',
                                    );
                                    updateFormData(
                                        'momsWithBabiesWithArrowsLeftQty',
                                        '',
                                    );
                                    updateFormData(
                                        'momsWithBabiesWithArrowsRightQty',
                                        '',
                                    );
                                }
                            }}
                        >
                            <DirectionQtyGrid
                                idPrefix="moms-with-babies-with-arrows"
                                upQty={formData.momsWithBabiesWithArrowsUpQty}
                                downQty={
                                    formData.momsWithBabiesWithArrowsDownQty
                                }
                                leftQty={
                                    formData.momsWithBabiesWithArrowsLeftQty
                                }
                                rightQty={
                                    formData.momsWithBabiesWithArrowsRightQty
                                }
                                onUpChange={(value) =>
                                    updateFormData(
                                        'momsWithBabiesWithArrowsUpQty',
                                        value,
                                    )
                                }
                                onDownChange={(value) =>
                                    updateFormData(
                                        'momsWithBabiesWithArrowsDownQty',
                                        value,
                                    )
                                }
                                onLeftChange={(value) =>
                                    updateFormData(
                                        'momsWithBabiesWithArrowsLeftQty',
                                        value,
                                    )
                                }
                                onRightChange={(value) =>
                                    updateFormData(
                                        'momsWithBabiesWithArrowsRightQty',
                                        value,
                                    )
                                }
                                error={errors.momsWithBabiesWithArrows}
                            />
                        </OptionCard>
                    </div>
                </div>

                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-700">Toddlers Room</p>
                    <div className="grid gap-3 md:grid-cols-2">
                        <OptionCard
                            id="toddlers-room"
                            label="Toddlers Room"
                            checked={formData.toddlersRoom}
                            onCheckedChange={(checked) => {
                                updateFormData('toddlersRoom', checked);
                                if (!checked)
                                    updateFormData('toddlersRoomQty', '');
                            }}
                        >
                            <FloatingLabelInput
                                id="toddlers-room-qty"
                                label="Quantity"
                                required
                                type="number"
                                inputMode="numeric"
                                value={formData.toddlersRoomQty}
                                onChange={(e) =>
                                    updateFormData(
                                        'toddlersRoomQty',
                                        e.target.value,
                                    )
                                }
                                error={errors.toddlersRoomQty}
                            />
                        </OptionCard>

                        <OptionCard
                            id="toddlers-arrows"
                            label="Toddlers Room with Arrows"
                            checked={formData.toddlersArrows}
                            onCheckedChange={(checked) => {
                                updateFormData('toddlersArrows', checked);
                                if (!checked) {
                                    updateFormData('toddlersArrowsUpQty', '');
                                    updateFormData('toddlersArrowsDownQty', '');
                                    updateFormData('toddlersArrowsLeftQty', '');
                                    updateFormData(
                                        'toddlersArrowsRightQty',
                                        '',
                                    );
                                }
                            }}
                        >
                            <DirectionQtyGrid
                                idPrefix="toddlers-arrows"
                                upQty={formData.toddlersArrowsUpQty}
                                downQty={formData.toddlersArrowsDownQty}
                                leftQty={formData.toddlersArrowsLeftQty}
                                rightQty={formData.toddlersArrowsRightQty}
                                onUpChange={(value) =>
                                    updateFormData('toddlersArrowsUpQty', value)
                                }
                                onDownChange={(value) =>
                                    updateFormData(
                                        'toddlersArrowsDownQty',
                                        value,
                                    )
                                }
                                onLeftChange={(value) =>
                                    updateFormData(
                                        'toddlersArrowsLeftQty',
                                        value,
                                    )
                                }
                                onRightChange={(value) =>
                                    updateFormData(
                                        'toddlersArrowsRightQty',
                                        value,
                                    )
                                }
                                error={errors.toddlersArrows}
                            />
                        </OptionCard>
                    </div>
                </div>

                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-700">First Aid</p>
                    <div className="grid gap-3 md:grid-cols-2">
                        <OptionCard
                            id="first-aid-sign"
                            label="Sign"
                            checked={formData.firstAidSign}
                            onCheckedChange={(checked) => {
                                updateFormData('firstAidSign', checked);
                                if (!checked)
                                    updateFormData('firstAidSignQty', '');
                            }}
                        >
                            <FloatingLabelInput
                                id="first-aid-sign-qty"
                                label="Quantity"
                                required
                                type="number"
                                inputMode="numeric"
                                value={formData.firstAidSignQty}
                                onChange={(e) =>
                                    updateFormData(
                                        'firstAidSignQty',
                                        e.target.value,
                                    )
                                }
                                error={errors.firstAidSignQty}
                            />
                        </OptionCard>

                        <OptionCard
                            id="first-aid-sign-with-arrows"
                            label="Sign with Arrows"
                            checked={formData.firstAidSignWithArrows}
                            onCheckedChange={(checked) => {
                                updateFormData(
                                    'firstAidSignWithArrows',
                                    checked,
                                );
                                if (!checked) {
                                    updateFormData(
                                        'firstAidSignWithArrowsUpQty',
                                        '',
                                    );
                                    updateFormData(
                                        'firstAidSignWithArrowsDownQty',
                                        '',
                                    );
                                    updateFormData(
                                        'firstAidSignWithArrowsLeftQty',
                                        '',
                                    );
                                    updateFormData(
                                        'firstAidSignWithArrowsRightQty',
                                        '',
                                    );
                                }
                            }}
                        >
                            <DirectionQtyGrid
                                idPrefix="first-aid-sign-with-arrows"
                                upQty={formData.firstAidSignWithArrowsUpQty}
                                downQty={formData.firstAidSignWithArrowsDownQty}
                                leftQty={formData.firstAidSignWithArrowsLeftQty}
                                rightQty={
                                    formData.firstAidSignWithArrowsRightQty
                                }
                                onUpChange={(value) =>
                                    updateFormData(
                                        'firstAidSignWithArrowsUpQty',
                                        value,
                                    )
                                }
                                onDownChange={(value) =>
                                    updateFormData(
                                        'firstAidSignWithArrowsDownQty',
                                        value,
                                    )
                                }
                                onLeftChange={(value) =>
                                    updateFormData(
                                        'firstAidSignWithArrowsLeftQty',
                                        value,
                                    )
                                }
                                onRightChange={(value) =>
                                    updateFormData(
                                        'firstAidSignWithArrowsRightQty',
                                        value,
                                    )
                                }
                                error={errors.firstAidSignWithArrows}
                            />
                        </OptionCard>
                    </div>
                </div>

                <OptionCard
                    id="internal-other"
                    label="Other Internal Signage"
                    checked={formData.internalOther}
                    showImage={false}
                    onCheckedChange={(checked) => {
                        updateFormData('internalOther', checked);
                        if (!checked) {
                            updateFormData('internalOtherDescription', '');
                            updateFormData('internalOtherQty', '');
                        }
                    }}
                >
                    <div className="space-y-3">
                        <FloatingLabelTextarea
                            id="internal-other-description"
                            label="Detailed Description"
                            required
                            value={formData.internalOtherDescription}
                            onChange={(e) =>
                                updateFormData(
                                    'internalOtherDescription',
                                    e.target.value,
                                )
                            }
                            error={errors.internalOtherDescription}
                        />
                        <FloatingLabelInput
                            id="internal-other-qty"
                            label="Quantity"
                            required
                            type="number"
                            inputMode="numeric"
                            value={formData.internalOtherQty}
                            onChange={(e) =>
                                updateFormData(
                                    'internalOtherQty',
                                    e.target.value,
                                )
                            }
                            error={errors.internalOtherQty}
                        />
                    </div>
                </OptionCard>
            </div>

            <div className="space-y-3">
                <p className="text-sm text-slate-700">
                    External/Directional Signs
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                    <OptionCard
                        id="external-no-parking"
                        label="No Parking"
                        checked={formData.externalNoParking}
                        onCheckedChange={(checked) => {
                            updateFormData('externalNoParking', checked);
                            if (!checked)
                                updateFormData('externalNoParkingQty', '');
                        }}
                    >
                        <FloatingLabelInput
                            id="external-no-parking-qty"
                            label="Quantity"
                            required
                            type="number"
                            inputMode="numeric"
                            value={formData.externalNoParkingQty}
                            onChange={(e) =>
                                updateFormData(
                                    'externalNoParkingQty',
                                    e.target.value,
                                )
                            }
                            error={errors.externalNoParkingQty}
                        />
                    </OptionCard>
                    <OptionCard
                        id="external-disabled-parking"
                        label="Disabled Parking"
                        checked={formData.externalDisabledParking}
                        onCheckedChange={(checked) => {
                            updateFormData('externalDisabledParking', checked);
                            if (!checked)
                                updateFormData(
                                    'externalDisabledParkingQty',
                                    '',
                                );
                        }}
                    >
                        <FloatingLabelInput
                            id="external-disabled-parking-qty"
                            label="Quantity"
                            required
                            type="number"
                            inputMode="numeric"
                            value={formData.externalDisabledParkingQty}
                            onChange={(e) =>
                                updateFormData(
                                    'externalDisabledParkingQty',
                                    e.target.value,
                                )
                            }
                            error={errors.externalDisabledParkingQty}
                        />
                    </OptionCard>
                    <OptionCard
                        id="external-ambulance-bay"
                        label="Ambulance Bay"
                        checked={formData.externalAmbulanceBay}
                        onCheckedChange={(checked) => {
                            updateFormData('externalAmbulanceBay', checked);
                            if (!checked)
                                updateFormData('externalAmbulanceBayQty', '');
                        }}
                    >
                        <FloatingLabelInput
                            id="external-ambulance-bay-qty"
                            label="Quantity"
                            required
                            type="number"
                            inputMode="numeric"
                            value={formData.externalAmbulanceBayQty}
                            onChange={(e) =>
                                updateFormData(
                                    'externalAmbulanceBayQty',
                                    e.target.value,
                                )
                            }
                            error={errors.externalAmbulanceBayQty}
                        />
                    </OptionCard>
                    <OptionCard
                        id="external-entrance"
                        label="Entrance"
                        checked={formData.externalEntrance}
                        onCheckedChange={(checked) => {
                            updateFormData('externalEntrance', checked);
                            if (!checked)
                                updateFormData('externalEntranceQty', '');
                        }}
                    >
                        <FloatingLabelInput
                            id="external-entrance-qty"
                            label="Quantity"
                            required
                            type="number"
                            inputMode="numeric"
                            value={formData.externalEntranceQty}
                            onChange={(e) =>
                                updateFormData(
                                    'externalEntranceQty',
                                    e.target.value,
                                )
                            }
                            error={errors.externalEntranceQty}
                        />
                    </OptionCard>
                    <OptionCard
                        id="external-exit"
                        label="Exit"
                        checked={formData.externalExit}
                        onCheckedChange={(checked) => {
                            updateFormData('externalExit', checked);
                            if (!checked) updateFormData('externalExitQty', '');
                        }}
                    >
                        <FloatingLabelInput
                            id="external-exit-qty"
                            label="Quantity"
                            required
                            type="number"
                            inputMode="numeric"
                            value={formData.externalExitQty}
                            onChange={(e) =>
                                updateFormData(
                                    'externalExitQty',
                                    e.target.value,
                                )
                            }
                            error={errors.externalExitQty}
                        />
                    </OptionCard>
                    <OptionCard
                        id="external-joshgen-arrows"
                        label="JoshGen + Arrows"
                        checked={formData.externalJoshGenArrows}
                        onCheckedChange={(checked) => {
                            updateFormData('externalJoshGenArrows', checked);
                            if (!checked) {
                                updateFormData('externalJoshGenArrowUpQty', '');
                                updateFormData(
                                    'externalJoshGenArrowDownQty',
                                    '',
                                );
                                updateFormData(
                                    'externalJoshGenArrowLeftQty',
                                    '',
                                );
                                updateFormData(
                                    'externalJoshGenArrowRightQty',
                                    '',
                                );
                            }
                        }}
                    >
                        <DirectionQtyGrid
                            idPrefix="external-joshgen-arrows"
                            upQty={formData.externalJoshGenArrowUpQty}
                            downQty={formData.externalJoshGenArrowDownQty}
                            leftQty={formData.externalJoshGenArrowLeftQty}
                            rightQty={formData.externalJoshGenArrowRightQty}
                            onUpChange={(value) =>
                                updateFormData(
                                    'externalJoshGenArrowUpQty',
                                    value,
                                )
                            }
                            onDownChange={(value) =>
                                updateFormData(
                                    'externalJoshGenArrowDownQty',
                                    value,
                                )
                            }
                            onLeftChange={(value) =>
                                updateFormData(
                                    'externalJoshGenArrowLeftQty',
                                    value,
                                )
                            }
                            onRightChange={(value) =>
                                updateFormData(
                                    'externalJoshGenArrowRightQty',
                                    value,
                                )
                            }
                            error={errors.externalJoshGenArrows}
                        />
                    </OptionCard>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <OptionCard
                    id="sandwich-boards"
                    label="Sandwich Boards (A-Frame, double-sided, A1 Size)"
                    checked={formData.sandwichBoards}
                    onCheckedChange={(checked) => {
                        updateFormData('sandwichBoards', checked);
                        if (!checked) {
                            updateFormData('sandwichBoardsDescription', '');
                            updateFormData('sandwichBoardsQty', '');
                        }
                    }}
                >
                    <div className="space-y-3">
                        <FloatingLabelTextarea
                            id="sandwich-boards-description"
                            label="Detailed Description"
                            required
                            value={formData.sandwichBoardsDescription}
                            onChange={(e) =>
                                updateFormData(
                                    'sandwichBoardsDescription',
                                    e.target.value,
                                )
                            }
                            error={errors.sandwichBoardsDescription}
                        />
                        <FloatingLabelInput
                            id="sandwich-boards-qty"
                            label="Quantity"
                            required
                            type="number"
                            inputMode="numeric"
                            value={formData.sandwichBoardsQty}
                            onChange={(e) =>
                                updateFormData(
                                    'sandwichBoardsQty',
                                    e.target.value,
                                )
                            }
                            error={errors.sandwichBoardsQty}
                        />
                    </div>
                </OptionCard>

                <OptionCard
                    id="permanent-external-building-signs"
                    label="Permanent External Building Signs"
                    checked={formData.permanentExternalBuildingSigns}
                    onCheckedChange={(checked) => {
                        updateFormData(
                            'permanentExternalBuildingSigns',
                            checked,
                        );
                        if (!checked) {
                            updateFormData(
                                'permanentExternalBuildingSignsDescription',
                                '',
                            );
                            updateFormData(
                                'permanentExternalBuildingSignsQty',
                                '',
                            );
                        }
                    }}
                >
                    <div className="space-y-3">
                        <FloatingLabelTextarea
                            id="permanent-external-building-signs-description"
                            label="Detailed Description"
                            required
                            value={
                                formData.permanentExternalBuildingSignsDescription
                            }
                            onChange={(e) =>
                                updateFormData(
                                    'permanentExternalBuildingSignsDescription',
                                    e.target.value,
                                )
                            }
                            error={
                                errors.permanentExternalBuildingSignsDescription
                            }
                        />
                        <FloatingLabelInput
                            id="permanent-external-building-signs-qty"
                            label="Quantity"
                            required
                            type="number"
                            inputMode="numeric"
                            value={formData.permanentExternalBuildingSignsQty}
                            onChange={(e) =>
                                updateFormData(
                                    'permanentExternalBuildingSignsQty',
                                    e.target.value,
                                )
                            }
                            error={errors.permanentExternalBuildingSignsQty}
                        />
                    </div>
                </OptionCard>

                <OptionCard
                    id="other-signage"
                    label="Other Signage Request"
                    checked={formData.otherSignage}
                    showImage={false}
                    onCheckedChange={(checked) => {
                        updateFormData('otherSignage', checked);
                        if (!checked) {
                            updateFormData('otherSignageDescription', '');
                            updateFormData('otherSignageQty', '');
                        }
                    }}
                >
                    <div className="space-y-3">
                        <FloatingLabelTextarea
                            id="other-signage-description"
                            label="Detailed Description"
                            required
                            value={formData.otherSignageDescription}
                            onChange={(e) =>
                                updateFormData(
                                    'otherSignageDescription',
                                    e.target.value,
                                )
                            }
                            error={errors.otherSignageDescription}
                        />
                        <FloatingLabelInput
                            id="other-signage-qty"
                            label="Quantity"
                            required
                            type="number"
                            inputMode="numeric"
                            value={formData.otherSignageQty}
                            onChange={(e) =>
                                updateFormData(
                                    'otherSignageQty',
                                    e.target.value,
                                )
                            }
                            error={errors.otherSignageQty}
                        />
                    </div>
                </OptionCard>
            </div>
        </div>
    );
}
