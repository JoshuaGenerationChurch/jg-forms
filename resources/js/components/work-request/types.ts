// Type definitions for work request form
export interface FormData {
    // Page 2: Nature of Request (checkboxes)
    includesDatesVenue: boolean;
    includesRegistration: boolean;
    includesGraphics: boolean;
    includesGraphicsDigital: boolean;
    includesGraphicsPrint: boolean;
    includesSignage: boolean;

    // Page 2: Contact Details
    firstName: string;
    lastName: string;
    cellphone: string;
    email: string;
    roleInChurch: string;
    otherRole: string;
    congregation: string;
    requestSummary: string;
    theme: string;

    // Page 3: Event Details
    eventName: string;
    isUserOrganiser: string;
    organiserFirstName: string;
    organiserLastName: string;
    organiserEmail: string;
    organiserCell: string;
    eventDuration: string;
    eventStartDate: string;
    eventEndDate: string;
    eventDates: Array<{ date: string; startTime: string; endTime: string }>;
    announcementDate: string;
    venueType: string;
    jgVenue: string;
    otherVenueName: string;
    otherVenueAddress: string;
    eventReach: string;
    hubs: string[];
    childMinding: string;
    childMindingDescription: string;

    // Page 4: Event Registration
    quicketDescription: string;
    ticketPriceIncludesFee: string;
    ticketTypes: {
        adults18Plus: boolean;
        adults13Plus: boolean;
        children4to12: boolean;
        children0to3: boolean;
        other: boolean;
    };
    ticketPrices: {
        adults18Plus: string;
        adults13Plus: string;
        children4to12: string;
        children0to3: string;
    };
    ticketQuantities: {
        adults18Plus: string;
        adults13Plus: string;
        children4to12: string;
        children0to3: string;
    };
    otherTickets: Array<{ name: string; price: string; quantity: string }>;
    infoToCollect: {
        name: boolean;
        lastName: boolean;
        email: boolean;
        cellphone: boolean;
        congregation: boolean;
        functionInChurch: boolean;
        allergies: boolean;
        other: boolean;
    };
    otherInfoFields: string[];
    allowDonations: string;
    registrationClosingDate: string;

    // Page 5: Graphics
    graphicsWhatsApp: boolean;
    graphicsInstagram: boolean;
    graphicsAVSlide: boolean;
    graphicsOther: string;

    // Page 6: Digital Media
    digitalGraphicType: string;
    digitalBankName: string;
    digitalBranchCode: string;
    digitalAccountNumber: string;
    digitalReference: string;
    digitalOtherGraphicDescription: string;

    digitalFormatWhatsapp: boolean;
    digitalFormatAVSlide: boolean;
    digitalFormatOther: boolean;
    digitalOtherFormatDescription: string;

    // Page 7: Signage
    signageScope: string;
    signageHubs: string[];
    signageCongregations: string[];

    sharkfinJgBranded: boolean;
    sharkfinJgBrandedQty: string;
    sharkfinJgKidsBranded: boolean;
    sharkfinJgKidsBrandedQty: string;

    temporaryFenceStandard2x1: boolean;
    temporaryFenceStandard2x1Qty: string;
    temporaryFenceCustom3x1: boolean;
    temporaryFenceCustom3x1Qty: string;
    temporaryFenceCustom4x1: boolean;
    temporaryFenceCustom4x1Qty: string;
    temporaryFenceCustom5x1: boolean;
    temporaryFenceCustom5x1Qty: string;

    toiletsArrowsMaleWord: boolean;
    toiletsArrowsMaleWordUpQty: string;
    toiletsArrowsMaleWordDownQty: string;
    toiletsArrowsMaleWordLeftQty: string;
    toiletsArrowsMaleWordRightQty: string;
    toiletsArrowsFemaleWord: boolean;
    toiletsArrowsFemaleWordUpQty: string;
    toiletsArrowsFemaleWordDownQty: string;
    toiletsArrowsFemaleWordLeftQty: string;
    toiletsArrowsFemaleWordRightQty: string;
    toiletsArrowsMaleFemaleWord: boolean;
    toiletsArrowsMaleFemaleWordUpQty: string;
    toiletsArrowsMaleFemaleWordDownQty: string;
    toiletsArrowsMaleFemaleWordLeftQty: string;
    toiletsArrowsMaleFemaleWordRightQty: string;
    toiletsMaleFemale: boolean;
    toiletsMaleFemaleQty: string;
    toiletsMale: boolean;
    toiletsMaleQty: string;
    toiletsFemale: boolean;
    toiletsFemaleQty: string;

    momsNursing: boolean;
    momsNursingQty: string;
    momsNursingWithArrows: boolean;
    momsNursingWithArrowsUpQty: string;
    momsNursingWithArrowsDownQty: string;
    momsNursingWithArrowsLeftQty: string;
    momsNursingWithArrowsRightQty: string;
    momsWithBabies: boolean;
    momsWithBabiesQty: string;
    momsWithBabiesWithArrows: boolean;
    momsWithBabiesWithArrowsUpQty: string;
    momsWithBabiesWithArrowsDownQty: string;
    momsWithBabiesWithArrowsLeftQty: string;
    momsWithBabiesWithArrowsRightQty: string;

    toddlersRoom: boolean;
    toddlersRoomQty: string;
    toddlersArrows: boolean;
    toddlersArrowsUpQty: string;
    toddlersArrowsDownQty: string;
    toddlersArrowsLeftQty: string;
    toddlersArrowsRightQty: string;

    firstAidSign: boolean;
    firstAidSignQty: string;
    firstAidSignWithArrows: boolean;
    firstAidSignWithArrowsUpQty: string;
    firstAidSignWithArrowsDownQty: string;
    firstAidSignWithArrowsLeftQty: string;
    firstAidSignWithArrowsRightQty: string;

    internalOther: boolean;
    internalOtherDescription: string;
    internalOtherQty: string;

    externalNoParking: boolean;
    externalNoParkingQty: string;
    externalDisabledParking: boolean;
    externalDisabledParkingQty: string;
    externalAmbulanceBay: boolean;
    externalAmbulanceBayQty: string;
    externalEntrance: boolean;
    externalEntranceQty: string;
    externalExit: boolean;
    externalExitQty: string;

    externalJoshGenArrows: boolean;
    externalJoshGenArrowUpQty: string;
    externalJoshGenArrowDownQty: string;
    externalJoshGenArrowLeftQty: string;
    externalJoshGenArrowRightQty: string;

    sandwichBoards: boolean;
    sandwichBoardsDescription: string;
    sandwichBoardsQty: string;

    permanentExternalBuildingSigns: boolean;
    permanentExternalBuildingSignsDescription: string;
    permanentExternalBuildingSignsQty: string;

    otherSignage: boolean;
    otherSignageDescription: string;
    otherSignageQty: string;

    // Page 8: Print Media
    printScope: string;
    printHubs: string[];
    printCongregations: string[];
    printTypes: string[];
    printOther: string;
    printOtherQty: string;
    printA5Qty: string;
    printA6Qty: string;
    printA3Qty: string;
    printA4Qty: string;
    printCardsQty: string;
    printCoffeeCupSleevesQty: string;
    printVisitorCoffeeVoucherCardQty: string;
    termsAccepted: boolean;
}

export interface FormPageProps {
    formData: FormData;
    updateFormData: <K extends keyof FormData>(
        key: K,
        value: FormData[K],
    ) => void;
    errors?: Record<string, string | undefined>;
}

// Initial form state
export const initialFormData: FormData = {
    includesDatesVenue: false,
    includesRegistration: false,
    includesGraphics: false,
    includesGraphicsDigital: false,
    includesGraphicsPrint: false,
    includesSignage: false,
    firstName: '',
    lastName: '',
    cellphone: '+27',
    email: '',
    roleInChurch: '',
    otherRole: '',
    congregation: '',
    requestSummary: '',
    theme: '',
    eventName: '',
    isUserOrganiser: '',
    organiserFirstName: '',
    organiserLastName: '',
    organiserEmail: '',
    organiserCell: '+27',
    eventDuration: '',
    eventStartDate: '',
    eventEndDate: '',
    eventDates: [],
    announcementDate: '',
    venueType: '',
    jgVenue: '',
    otherVenueName: '',
    otherVenueAddress: '',
    eventReach: '',
    hubs: [],
    childMinding: '',
    childMindingDescription: '',
    quicketDescription: '',
    ticketPriceIncludesFee: '',
    ticketTypes: {
        adults18Plus: false,
        adults13Plus: false,
        children4to12: false,
        children0to3: false,
        other: false,
    },
    ticketPrices: {
        adults18Plus: '',
        adults13Plus: '',
        children4to12: '',
        children0to3: '',
    },
    ticketQuantities: {
        adults18Plus: '',
        adults13Plus: '',
        children4to12: '',
        children0to3: '',
    },
    otherTickets: [],
    infoToCollect: {
        name: false,
        lastName: false,
        email: false,
        cellphone: false,
        congregation: false,
        functionInChurch: false,
        allergies: false,
        other: false,
    },
    otherInfoFields: [],
    allowDonations: '',
    registrationClosingDate: '',
    graphicsWhatsApp: false,
    graphicsInstagram: false,
    graphicsAVSlide: false,
    graphicsOther: '',
    digitalGraphicType: '',
    digitalBankName: '',
    digitalBranchCode: '',
    digitalAccountNumber: '',
    digitalReference: '',
    digitalOtherGraphicDescription: '',

    digitalFormatWhatsapp: false,
    digitalFormatAVSlide: false,
    digitalFormatOther: false,
    digitalOtherFormatDescription: '',
    signageScope: '',
    signageHubs: [],
    signageCongregations: [],

    sharkfinJgBranded: false,
    sharkfinJgBrandedQty: '',
    sharkfinJgKidsBranded: false,
    sharkfinJgKidsBrandedQty: '',

    temporaryFenceStandard2x1: false,
    temporaryFenceStandard2x1Qty: '',
    temporaryFenceCustom3x1: false,
    temporaryFenceCustom3x1Qty: '',
    temporaryFenceCustom4x1: false,
    temporaryFenceCustom4x1Qty: '',
    temporaryFenceCustom5x1: false,
    temporaryFenceCustom5x1Qty: '',

    toiletsArrowsMaleWord: false,
    toiletsArrowsMaleWordUpQty: '',
    toiletsArrowsMaleWordDownQty: '',
    toiletsArrowsMaleWordLeftQty: '',
    toiletsArrowsMaleWordRightQty: '',
    toiletsArrowsFemaleWord: false,
    toiletsArrowsFemaleWordUpQty: '',
    toiletsArrowsFemaleWordDownQty: '',
    toiletsArrowsFemaleWordLeftQty: '',
    toiletsArrowsFemaleWordRightQty: '',
    toiletsArrowsMaleFemaleWord: false,
    toiletsArrowsMaleFemaleWordUpQty: '',
    toiletsArrowsMaleFemaleWordDownQty: '',
    toiletsArrowsMaleFemaleWordLeftQty: '',
    toiletsArrowsMaleFemaleWordRightQty: '',
    toiletsMaleFemale: false,
    toiletsMaleFemaleQty: '',
    toiletsMale: false,
    toiletsMaleQty: '',
    toiletsFemale: false,
    toiletsFemaleQty: '',

    momsNursing: false,
    momsNursingQty: '',
    momsNursingWithArrows: false,
    momsNursingWithArrowsUpQty: '',
    momsNursingWithArrowsDownQty: '',
    momsNursingWithArrowsLeftQty: '',
    momsNursingWithArrowsRightQty: '',
    momsWithBabies: false,
    momsWithBabiesQty: '',
    momsWithBabiesWithArrows: false,
    momsWithBabiesWithArrowsUpQty: '',
    momsWithBabiesWithArrowsDownQty: '',
    momsWithBabiesWithArrowsLeftQty: '',
    momsWithBabiesWithArrowsRightQty: '',

    toddlersRoom: false,
    toddlersRoomQty: '',
    toddlersArrows: false,
    toddlersArrowsUpQty: '',
    toddlersArrowsDownQty: '',
    toddlersArrowsLeftQty: '',
    toddlersArrowsRightQty: '',

    firstAidSign: false,
    firstAidSignQty: '',
    firstAidSignWithArrows: false,
    firstAidSignWithArrowsUpQty: '',
    firstAidSignWithArrowsDownQty: '',
    firstAidSignWithArrowsLeftQty: '',
    firstAidSignWithArrowsRightQty: '',

    internalOther: false,
    internalOtherDescription: '',
    internalOtherQty: '',

    externalNoParking: false,
    externalNoParkingQty: '',
    externalDisabledParking: false,
    externalDisabledParkingQty: '',
    externalAmbulanceBay: false,
    externalAmbulanceBayQty: '',
    externalEntrance: false,
    externalEntranceQty: '',
    externalExit: false,
    externalExitQty: '',

    externalJoshGenArrows: false,
    externalJoshGenArrowUpQty: '',
    externalJoshGenArrowDownQty: '',
    externalJoshGenArrowLeftQty: '',
    externalJoshGenArrowRightQty: '',

    sandwichBoards: false,
    sandwichBoardsDescription: '',
    sandwichBoardsQty: '',

    permanentExternalBuildingSigns: false,
    permanentExternalBuildingSignsDescription: '',
    permanentExternalBuildingSignsQty: '',

    otherSignage: false,
    otherSignageDescription: '',
    otherSignageQty: '',
    printScope: '',
    printHubs: [],
    printCongregations: [],
    printTypes: [],
    printOther: '',
    printOtherQty: '',
    printA5Qty: '',
    printA6Qty: '',
    printA3Qty: '',
    printA4Qty: '',
    printCardsQty: '',
    printCoffeeCupSleevesQty: '',
    printVisitorCoffeeVoucherCardQty: '',
    termsAccepted: false,
};

// Options arrays
export const roleOptions = [
    'Saint',
    'Community Leader',
    'Ministry Coordinator',
    'Ministry Leader',
    'Deacon',
    "Elder's wife",
    'Elder',
    'Other',
];

export const hubOptions = [
    'Central RSA',
    'City Central',
    'Helderberg Basin',
    'Northern Suburbs',
    'Overberg',
    'Southern Cape',
    'Western Seaboard',
    'Winelands',
    'Zimbabwe',
];

export const congregationOptions = [
    'Bethlehem',
    'Bloemfontein',
    'Bonnievale',
    'Bredasdorp',
    'City Bowl AM',
    'De Doorns',
    'Dunoon',
    'Durbanville AM',
    'Durbanville Central',
    'Durbanville PM',
    'Edgemead 08:30',
    'Edgemead 11 AM',
    'Edgemead PM',
    'George AM',
    'George PM',
    'Gordons Bay',
    'Grabouw',
    'Hartbees',
    'Hermanus',
    'Khayelitsha',
    'Kimberley',
    'Langebaan',
    'Malmesbury',
    'Melkbosstrand',
    'Milnerton',
    'Montagu',
    'Mossel Bay AM',
    'Mossel Bay PM',
    'Muizenberg',
    'Oudtshoorn',
    'Paarl',
    'Pinehurst PM',
    'Potchefstroom',
    'Robertson',
    'Sea Point',
    'Somerset West',
    'Sonskyn Vallei',
    'Stellenbosch AM',
    'Stellenbosch Central',
    'Stellenbosch PM',
    'Stilbaai',
    'Sunningdale 11AM',
    'Sunningdale 8:30AM',
    'Sunningdale PM',
    'Swellendam',
    'Wellington AM',
    'Wellington PM',
    'Willowmore',
    'Woodstock PM',
    'Worcester',
    'Wynberg',
    'Yzerfontein',
    'Zim - Harare - CBD',
    'Zim - Tafara',
];

export const printTypeOptions = [
    'Congregational Flyer Handouts (A5: 148 x 210 mm)',
    'Congregational Flyer Handouts (A6: 105 x 148 mm)',
    'Posters (A3: 297 x 420 mm)',
    'Posters (A4: 210 x 297 mm)',
    'Invite/ Evangelism Cards (business card size)',
    'Coffee Cup Sleeves (One size)',
    'Visitor Coffee Voucher Card',
];

// Base CSS classes for form elements
export const selectBase =
    'mt-2 h-12 w-full rounded-lg border-2 border-slate-200 bg-slate-100/50 px-4 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:border-blue-400 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:focus-visible:border-red-500 aria-invalid:focus-visible:ring-red-500';

// Note: prefer FloatingLabelTextarea for new textarea fields.
export const textareaBase =
    'mt-2 min-h-[120px] w-full rounded-lg border-2 border-slate-200 bg-slate-100/50 px-4 py-3 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:border-blue-400 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:focus-visible:border-red-500 aria-invalid:focus-visible:ring-red-500';

export const dateInputBase =
    'mt-2 h-12 w-full rounded-lg border-2 border-slate-200 bg-slate-100/50 px-4 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:border-blue-400 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:focus-visible:border-red-500 aria-invalid:focus-visible:ring-red-500 [color-scheme:light] cursor-pointer hover:border-slate-300';
