import type { FormData } from './types';

export type ValidationErrors = Partial<Record<keyof FormData | string, string>>;

function todayIsoDate(): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
}

function datePart(value: string): string {
    return value.split('T')[0] ?? '';
}

function isBeforeToday(value: string): boolean {
    const date = datePart(value);
    if (date === '') {
        return false;
    }

    return date < todayIsoDate();
}

function isEndMonthBeforeStartMonth(
    startDateTime: string,
    endDateTime: string,
): boolean {
    const startDate = datePart(startDateTime);
    const endDate = datePart(endDateTime);

    if (startDate === '' || endDate === '') {
        return false;
    }

    return endDate.slice(0, 7) < startDate.slice(0, 7);
}

function hasInternationalCountryCode(value: string): boolean {
    return /^\+[1-9]\d{0,3}(?:[\s-]?\d){4,}$/.test(value.trim());
}

// Validate contact details page
export function validateContactDetails(formData: FormData): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!formData.firstName.trim()) {
        errors.firstName = 'Name is required';
    }
    if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required';
    }
    if (!formData.cellphone.trim()) {
        errors.cellphone = 'Cellphone is required';
    } else if (!hasInternationalCountryCode(formData.cellphone)) {
        errors.cellphone =
            'Please enter a full cellphone number with country code (for example: +27 82 123 4567)';
    }
    if (!formData.email.trim()) {
        errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
    }
    if (!formData.congregation) {
        errors.congregation = 'Please select your congregation';
    }

    return errors;
}

// Validate nature of request page
export function validateNatureOfRequest(formData: FormData): ValidationErrors {
    const errors: ValidationErrors = {};
    const requiresDigital =
        formData.includesDatesVenue || formData.includesRegistration;

    // At least one option must be selected
    const hasSelection =
        formData.includesDatesVenue ||
        formData.includesGraphics ||
        formData.includesSignage;

    if (!hasSelection) {
        errors.natureOfRequest =
            'Please select at least one option for your request';
    }

    // If graphics is selected, at least one sub-option must be selected
    if (
        formData.includesGraphics &&
        !formData.includesGraphicsDigital &&
        !formData.includesGraphicsPrint
    ) {
        errors.graphicsType = 'Please select Digital, Print, or both';
    }

    if (requiresDigital && !formData.includesGraphicsDigital) {
        errors.graphicsType =
            'Digital is required when Event Logistics or Registration Form is selected';
    }

    return errors;
}

// Validate event details page
export function validateEventDetails(formData: FormData): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!formData.eventName.trim()) {
        errors.eventName = 'Event name is required';
    }
    if (!formData.isUserOrganiser) {
        errors.isUserOrganiser =
            'Please indicate if you are the event organiser';
    }
    if (formData.isUserOrganiser === 'No') {
        if (!formData.organiserFirstName.trim()) {
            errors.organiserFirstName = 'Organiser first name is required';
        }
        if (!formData.organiserLastName.trim()) {
            errors.organiserLastName = 'Organiser last name is required';
        }
        if (!formData.organiserEmail.trim()) {
            errors.organiserEmail = 'Organiser email is required';
        }
        if (!formData.organiserCell.trim()) {
            errors.organiserCell = 'Organiser cell number is required';
        } else if (!hasInternationalCountryCode(formData.organiserCell)) {
            errors.organiserCell =
                'Please enter a full cellphone number with country code (for example: +27 82 123 4567)';
        }
    }
    if (!formData.eventDuration) {
        errors.eventDuration = 'Please select event duration';
    }
    if (formData.eventDuration === 'One Day Event') {
        if (!formData.eventStartDate) {
            errors.eventStartDate = 'Event date is required';
        } else if (isBeforeToday(formData.eventStartDate)) {
            errors.eventStartDate = 'Event date cannot be in the past';
        }

        if (
            isEndMonthBeforeStartMonth(
                formData.eventStartDate,
                formData.eventEndDate,
            )
        ) {
            errors.eventStartDate =
                'End date must be in the same month or later than the start date';
        }
    }
    if (formData.eventDuration === 'Multiple Day Event') {
        if (formData.eventDates.length === 0) {
            errors.eventDates = 'Please add at least one event date';
        } else {
            const hasEmptyDate = formData.eventDates.some(
                (d) => !d.date || !d.startTime || !d.endTime,
            );
            const hasPastDate = formData.eventDates.some((d) =>
                isBeforeToday(d.date),
            );
            if (hasEmptyDate) {
                errors.eventDates = 'Please complete all date and time fields';
            } else if (hasPastDate) {
                errors.eventDates = 'Event dates cannot be in the past';
            }
        }
    }
    if (!formData.announcementDate) {
        errors.announcementDate = 'Announcement date is required';
    } else if (isBeforeToday(formData.announcementDate)) {
        errors.announcementDate = 'Announcement date cannot be in the past';
    }
    if (!formData.venueType) {
        errors.venueType = 'Please select a venue type';
    }
    if (formData.venueType === 'JG Venue' && !formData.jgVenue) {
        errors.jgVenue = 'Please select a JG venue';
    }
    if (formData.venueType === 'Other') {
        if (!formData.otherVenueName.trim()) {
            errors.otherVenueName = 'Venue name is required';
        }
        if (!formData.otherVenueAddress.trim()) {
            errors.otherVenueAddress = 'Venue address is required';
        }
    }
    if (!formData.eventReach) {
        errors.eventReach = 'Please select event reach';
    }
    if (
        (formData.eventReach === 'Hubs' ||
            formData.eventReach === 'Congregations') &&
        formData.hubs.length === 0
    ) {
        errors.hubs = 'Please select at least one option';
    }
    if (!formData.childMinding) {
        errors.childMinding =
            'Please indicate if child-minding will be offered';
    }
    if (
        formData.childMinding === 'Yes' &&
        !formData.childMindingDescription.trim()
    ) {
        errors.childMindingDescription =
            'Please describe the child-minding offered';
    }

    return errors;
}

// Validate event registration page
export function validateEventRegistration(
    formData: FormData,
): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!formData.quicketDescription.trim()) {
        errors.quicketDescription = 'Description is required';
    }

    if (formData.ticketCurrency !== 'ZAR' && formData.ticketCurrency !== 'USD') {
        errors.ticketCurrency = 'Please select a ticket currency';
    }

    // Check if at least one ticket type is selected
    const hasTicketType =
        formData.ticketTypes.adults18Plus ||
        formData.ticketTypes.adults13Plus ||
        formData.ticketTypes.children4to12 ||
        formData.ticketTypes.children0to3 ||
        formData.ticketTypes.other;

    if (!hasTicketType) {
        errors.ticketTypes = 'Please select at least one ticket type';
    }

    // Validate prices and quantities for selected ticket types
    if (formData.ticketTypes.adults18Plus) {
        if (!formData.ticketPrices.adults18Plus)
            errors['ticketPrices.adults18Plus'] =
                'Adults (18+) ticket price is required';
        if (!formData.ticketQuantities.adults18Plus)
            errors['ticketQuantities.adults18Plus'] =
                'Adults (18+) ticket quantity is required';
    }
    if (formData.ticketTypes.adults13Plus) {
        if (!formData.ticketPrices.adults13Plus)
            errors['ticketPrices.adults13Plus'] =
                'Adults (13+) ticket price is required';
        if (!formData.ticketQuantities.adults13Plus)
            errors['ticketQuantities.adults13Plus'] =
                'Adults (13+) ticket quantity is required';
    }
    if (formData.ticketTypes.children4to12) {
        if (!formData.ticketPrices.children4to12)
            errors['ticketPrices.children4to12'] =
                'Children (4-12) ticket price is required';
        if (!formData.ticketQuantities.children4to12)
            errors['ticketQuantities.children4to12'] =
                'Children (4-12) ticket quantity is required';
    }
    if (formData.ticketTypes.children0to3) {
        if (!formData.ticketPrices.children0to3)
            errors['ticketPrices.children0to3'] =
                'Children (0-3) ticket price is required';
        if (!formData.ticketQuantities.children0to3)
            errors['ticketQuantities.children0to3'] =
                'Children (0-3) ticket quantity is required';
    }
    if (formData.ticketTypes.other && formData.otherTickets.length === 0) {
        errors.otherTickets = 'Please add at least one custom ticket type';
    }

    if (!formData.ticketPriceIncludesFee) {
        errors.ticketPriceIncludesFee =
            'Please indicate if prices include platform fee';
    }

    // Check if at least one info field is selected
    const hasInfoField = Object.values(formData.infoToCollect).some((v) => v);
    if (!hasInfoField) {
        errors.infoToCollect = 'Please select at least one field to collect';
    }

    if (!formData.allowDonations) {
        errors.allowDonations =
            'Please indicate if donations should be allowed';
    }
    if (!formData.registrationClosingDate) {
        errors.registrationClosingDate =
            'Registration closing date is required';
    } else if (isBeforeToday(formData.registrationClosingDate)) {
        errors.registrationClosingDate =
            'Registration closing date cannot be in the past';
    }

    return errors;
}

// Validate digital media page
export function validateDigitalMedia(formData: FormData): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!formData.digitalGraphicType) {
        errors.digitalGraphicType = 'Please select a graphic type';
    }

    if (formData.digitalGraphicType === 'Banking Details Graphic') {
        if (!formData.digitalBankName.trim()) {
            errors.digitalBankName = 'Bank name is required';
        }
        if (!formData.digitalBranchCode.trim()) {
            errors.digitalBranchCode = 'Branch code is required';
        }
        if (!formData.digitalAccountNumber.trim()) {
            errors.digitalAccountNumber = 'Account number is required';
        }
        if (!formData.digitalReference.trim()) {
            errors.digitalReference = 'Reference is required';
        }
    }

    if (
        formData.digitalGraphicType === 'Other' &&
        !formData.digitalOtherGraphicDescription.trim()
    ) {
        errors.digitalOtherGraphicDescription =
            'Please describe the graphic you want';
    }

    const hasFormat =
        formData.digitalFormatWhatsapp ||
        formData.digitalFormatAVSlide ||
        formData.digitalFormatOther;
    if (!hasFormat) {
        errors.digitalFormats = 'Please select at least one format';
    }

    if (
        formData.digitalFormatOther &&
        !formData.digitalOtherFormatDescription.trim()
    ) {
        errors.digitalOtherFormatDescription =
            'Please specify the other format';
    }

    return errors;
}

// Validate signage page
export function validateSignage(formData: FormData): ValidationErrors {
    const errors: ValidationErrors = {};
    const hasDirectionQty = (values: string[]): boolean =>
        values.some((value) => value.trim().length > 0);

    const hasSelection =
        formData.sharkfinJgBranded ||
        formData.sharkfinJgKidsBranded ||
        formData.temporaryFenceStandard2x1 ||
        formData.temporaryFenceCustom3x1 ||
        formData.temporaryFenceCustom4x1 ||
        formData.temporaryFenceCustom5x1 ||
        formData.toiletsArrowsMaleWord ||
        formData.toiletsArrowsFemaleWord ||
        formData.toiletsArrowsMaleFemaleWord ||
        formData.toiletsMaleFemale ||
        formData.toiletsMale ||
        formData.toiletsFemale ||
        formData.momsNursing ||
        formData.momsNursingWithArrows ||
        formData.momsWithBabies ||
        formData.momsWithBabiesWithArrows ||
        formData.toddlersRoom ||
        formData.toddlersArrows ||
        formData.firstAidSign ||
        formData.firstAidSignWithArrows ||
        formData.internalOther ||
        formData.externalNoParking ||
        formData.externalDisabledParking ||
        formData.externalAmbulanceBay ||
        formData.externalEntrance ||
        formData.externalExit ||
        formData.externalJoshGenArrows ||
        formData.sandwichBoards ||
        formData.permanentExternalBuildingSigns ||
        formData.otherSignage;

    if (!hasSelection) {
        errors.signageSelection =
            'Please select at least one signage request item';
    }

    if (formData.sharkfinJgBranded && !formData.sharkfinJgBrandedQty.trim()) {
        errors.sharkfinJgBrandedQty = 'Quantity is required';
    }

    if (
        formData.sharkfinJgKidsBranded &&
        !formData.sharkfinJgKidsBrandedQty.trim()
    ) {
        errors.sharkfinJgKidsBrandedQty = 'Quantity is required';
    }

    if (
        formData.temporaryFenceStandard2x1 &&
        !formData.temporaryFenceStandard2x1Qty.trim()
    ) {
        errors.temporaryFenceStandard2x1Qty = 'Quantity is required';
    }

    if (
        formData.temporaryFenceCustom3x1 &&
        !formData.temporaryFenceCustom3x1Qty.trim()
    ) {
        errors.temporaryFenceCustom3x1Qty = 'Quantity is required';
    }

    if (
        formData.temporaryFenceCustom4x1 &&
        !formData.temporaryFenceCustom4x1Qty.trim()
    ) {
        errors.temporaryFenceCustom4x1Qty = 'Quantity is required';
    }

    if (
        formData.temporaryFenceCustom5x1 &&
        !formData.temporaryFenceCustom5x1Qty.trim()
    ) {
        errors.temporaryFenceCustom5x1Qty = 'Quantity is required';
    }

    if (formData.toiletsArrowsMaleWord) {
        if (
            !hasDirectionQty([
                formData.toiletsArrowsMaleWordUpQty,
                formData.toiletsArrowsMaleWordDownQty,
                formData.toiletsArrowsMaleWordLeftQty,
                formData.toiletsArrowsMaleWordRightQty,
            ])
        ) {
            errors.toiletsArrowsMaleWord =
                'Please add at least one direction quantity';
        }
    }

    if (formData.toiletsArrowsFemaleWord) {
        if (
            !hasDirectionQty([
                formData.toiletsArrowsFemaleWordUpQty,
                formData.toiletsArrowsFemaleWordDownQty,
                formData.toiletsArrowsFemaleWordLeftQty,
                formData.toiletsArrowsFemaleWordRightQty,
            ])
        ) {
            errors.toiletsArrowsFemaleWord =
                'Please add at least one direction quantity';
        }
    }

    if (formData.toiletsArrowsMaleFemaleWord) {
        if (
            !hasDirectionQty([
                formData.toiletsArrowsMaleFemaleWordUpQty,
                formData.toiletsArrowsMaleFemaleWordDownQty,
                formData.toiletsArrowsMaleFemaleWordLeftQty,
                formData.toiletsArrowsMaleFemaleWordRightQty,
            ])
        ) {
            errors.toiletsArrowsMaleFemaleWord =
                'Please add at least one direction quantity';
        }
    }

    if (formData.toiletsMaleFemale && !formData.toiletsMaleFemaleQty.trim()) {
        errors.toiletsMaleFemaleQty = 'Quantity is required';
    }

    if (formData.toiletsMale && !formData.toiletsMaleQty.trim()) {
        errors.toiletsMaleQty = 'Quantity is required';
    }

    if (formData.toiletsFemale && !formData.toiletsFemaleQty.trim()) {
        errors.toiletsFemaleQty = 'Quantity is required';
    }

    if (formData.momsNursing) {
        if (!formData.momsNursingQty.trim()) {
            errors.momsNursingQty = 'Quantity is required';
        }
    }

    if (formData.momsNursingWithArrows) {
        if (
            !hasDirectionQty([
                formData.momsNursingWithArrowsUpQty,
                formData.momsNursingWithArrowsDownQty,
                formData.momsNursingWithArrowsLeftQty,
                formData.momsNursingWithArrowsRightQty,
            ])
        ) {
            errors.momsNursingWithArrows =
                'Please add at least one direction quantity';
        }
    }

    if (formData.momsWithBabies) {
        if (!formData.momsWithBabiesQty.trim()) {
            errors.momsWithBabiesQty = 'Quantity is required';
        }
    }

    if (formData.momsWithBabiesWithArrows) {
        if (
            !hasDirectionQty([
                formData.momsWithBabiesWithArrowsUpQty,
                formData.momsWithBabiesWithArrowsDownQty,
                formData.momsWithBabiesWithArrowsLeftQty,
                formData.momsWithBabiesWithArrowsRightQty,
            ])
        ) {
            errors.momsWithBabiesWithArrows =
                'Please add at least one direction quantity';
        }
    }

    if (formData.toddlersRoom && !formData.toddlersRoomQty.trim()) {
        errors.toddlersRoomQty = 'Quantity is required';
    }

    if (formData.toddlersArrows) {
        if (
            !hasDirectionQty([
                formData.toddlersArrowsUpQty,
                formData.toddlersArrowsDownQty,
                formData.toddlersArrowsLeftQty,
                formData.toddlersArrowsRightQty,
            ])
        ) {
            errors.toddlersArrows =
                'Please add at least one toddlers room arrow direction quantity';
        }
    }

    if (formData.firstAidSign && !formData.firstAidSignQty.trim()) {
        errors.firstAidSignQty = 'Quantity is required';
    }

    if (formData.firstAidSignWithArrows) {
        if (
            !hasDirectionQty([
                formData.firstAidSignWithArrowsUpQty,
                formData.firstAidSignWithArrowsDownQty,
                formData.firstAidSignWithArrowsLeftQty,
                formData.firstAidSignWithArrowsRightQty,
            ])
        ) {
            errors.firstAidSignWithArrows =
                'Please add at least one first aid arrow direction quantity';
        }
    }

    if (formData.internalOther) {
        if (!formData.internalOtherDescription.trim()) {
            errors.internalOtherDescription =
                'Please add a detailed description';
        }

        if (!formData.internalOtherQty.trim()) {
            errors.internalOtherQty = 'Quantity is required';
        }
    }

    if (formData.externalNoParking && !formData.externalNoParkingQty.trim()) {
        errors.externalNoParkingQty = 'Quantity is required';
    }

    if (
        formData.externalDisabledParking &&
        !formData.externalDisabledParkingQty.trim()
    ) {
        errors.externalDisabledParkingQty = 'Quantity is required';
    }

    if (
        formData.externalAmbulanceBay &&
        !formData.externalAmbulanceBayQty.trim()
    ) {
        errors.externalAmbulanceBayQty = 'Quantity is required';
    }

    if (formData.externalEntrance && !formData.externalEntranceQty.trim()) {
        errors.externalEntranceQty = 'Quantity is required';
    }

    if (formData.externalExit && !formData.externalExitQty.trim()) {
        errors.externalExitQty = 'Quantity is required';
    }

    if (formData.externalJoshGenArrows) {
        if (
            !hasDirectionQty([
                formData.externalJoshGenArrowUpQty,
                formData.externalJoshGenArrowDownQty,
                formData.externalJoshGenArrowLeftQty,
                formData.externalJoshGenArrowRightQty,
            ])
        ) {
            errors.externalJoshGenArrows =
                'Please add at least one JoshGen arrow direction quantity';
        }
    }

    if (formData.sandwichBoards) {
        if (!formData.sandwichBoardsDescription.trim()) {
            errors.sandwichBoardsDescription =
                'Please add a detailed description';
        }

        if (!formData.sandwichBoardsQty.trim()) {
            errors.sandwichBoardsQty = 'Quantity is required';
        }
    }

    if (formData.permanentExternalBuildingSigns) {
        if (!formData.permanentExternalBuildingSignsDescription.trim()) {
            errors.permanentExternalBuildingSignsDescription =
                'Please add a detailed description';
        }

        if (!formData.permanentExternalBuildingSignsQty.trim()) {
            errors.permanentExternalBuildingSignsQty = 'Quantity is required';
        }
    }

    if (formData.otherSignage) {
        if (!formData.otherSignageDescription.trim()) {
            errors.otherSignageDescription =
                'Please add a detailed description';
        }

        if (!formData.otherSignageQty.trim()) {
            errors.otherSignageQty = 'Quantity is required';
        }
    }

    return errors;
}

// Validate print media page
export function validatePrintMedia(formData: FormData): ValidationErrors {
    const errors: ValidationErrors = {};
    const effectivePrintScope =
        formData.includesDatesVenue && formData.eventReach !== ''
            ? formData.eventReach
            : formData.printScope;

    if (!effectivePrintScope) {
        errors.printScope = 'Please select a scope';
    }

    if (effectivePrintScope === 'Hubs' && formData.printHubs.length === 0) {
        errors.printHubs = 'Please select at least one hub';
    }

    if (
        effectivePrintScope === 'Congregations' &&
        formData.printCongregations.length === 0
    ) {
        errors.printCongregations = 'Please select at least one congregation';
    }

    if (formData.printTypes.length === 0) {
        errors.printTypes = 'Please select at least one print type';
    }

    // Validate quantities for selected types
    if (
        formData.printTypes.includes(
            'Congregational Flyer Handouts (A5: 148 x 210 mm)',
        ) &&
        !formData.printA5Qty
    ) {
        errors.printA5Qty = 'A5 flyer quantity is required';
    }
    if (
        formData.printTypes.includes(
            'Congregational Flyer Handouts (A6: 105 x 148 mm)',
        ) &&
        !formData.printA6Qty
    ) {
        errors.printA6Qty = 'A6 flyer quantity is required';
    }
    if (
        formData.printTypes.includes('Posters (A3: 297 x 420 mm)') &&
        !formData.printA3Qty
    ) {
        errors.printA3Qty = 'A3 poster quantity is required';
    }
    if (
        formData.printTypes.includes('Posters (A4: 210 x 297 mm)') &&
        !formData.printA4Qty
    ) {
        errors.printA4Qty = 'A4 poster quantity is required';
    }
    if (
        formData.printTypes.includes(
            'Invite/ Evangelism Cards (business card size)',
        ) &&
        !formData.printCardsQty
    ) {
        errors.printCardsQty = 'Invite/Evangelism cards quantity is required';
    }
    if (
        formData.printTypes.includes('Coffee Cup Sleeves (One size)') &&
        !formData.printCoffeeCupSleevesQty
    ) {
        errors.printCoffeeCupSleevesQty =
            'Coffee cup sleeves quantity is required';
    }
    if (
        formData.printTypes.includes('Visitor Coffee Voucher Card') &&
        !formData.printVisitorCoffeeVoucherCardQty
    ) {
        errors.printVisitorCoffeeVoucherCardQty =
            'Visitor coffee voucher card quantity is required';
    }
    if (formData.printTypes.includes('Other')) {
        if (!formData.printOther.trim()) {
            errors.printOther = 'Please specify the other print type';
        }
        if (!formData.printOtherQty) {
            errors.printOtherQty = 'Other print quantity is required';
        }
    }

    if (!formData.termsAccepted) {
        errors.termsAccepted = 'You must accept the terms and conditions';
    }

    return errors;
}

// Main validation function that validates a specific page
export function validatePage(
    pageId: string,
    formData: FormData,
): ValidationErrors {
    switch (pageId) {
        case 'contact':
            return validateContactDetails(formData);
        case 'nature':
            return validateNatureOfRequest(formData);
        case 'event':
            return validateEventDetails(formData);
        case 'quicket':
            return validateEventRegistration(formData);
        case 'digital':
            return validateDigitalMedia(formData);
        case 'signage':
            return validateSignage(formData);
        case 'print':
            return validatePrintMedia(formData);
        default:
            return {};
    }
}

// Check if there are any errors
export function hasErrors(errors: ValidationErrors): boolean {
    return Object.keys(errors).length > 0;
}
