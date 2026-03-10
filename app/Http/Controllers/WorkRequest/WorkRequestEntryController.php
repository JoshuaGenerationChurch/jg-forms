<?php

namespace App\Http\Controllers\WorkRequest;

use App\Http\Controllers\Controller;
use App\Mail\WorkFormSubmissionNotificationMail;
use App\Mail\WorkFormTemplateNotificationMail;
use App\Models\WorkForm;
use App\Models\WorkFormEmailTemplate;
use App\Models\WorkRequestEntry;
use App\Services\RecaptchaEnterpriseService;
use App\Services\WorkFormEmailTemplateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Mime\Address;
use Throwable;

class WorkRequestEntryController extends Controller
{
    public function storePublicWorkRequestEntry(
        Request $request,
        RecaptchaEnterpriseService $recaptcha,
    ): RedirectResponse {
        $rules = [
            'payload' => ['required', 'array'],
        ];

        if ($recaptcha->enabled()) {
            $rules['recaptchaToken'] = ['required', 'string'];
        }

        $validated = $request->validate($rules);

        if ($recaptcha->enabled()) {
            $verification = $recaptcha->verifyToken((string) ($validated['recaptchaToken'] ?? ''));
            if (! $verification['success']) {
                return back()->withErrors([
                    'recaptcha' => $verification['message'] ?? 'Could not verify spam protection. Please try again.',
                ])->withInput();
            }
        }

        /** @var array<string, mixed> $payload */
        $payload = $validated['payload'];
        $this->validateWorkRequestPayload($payload);

        $entry = WorkRequestEntry::query()->create([
            'user_id' => null,
            'form_slug' => 'work-request',
            'first_name' => Arr::get($payload, 'firstName'),
            'last_name' => Arr::get($payload, 'lastName'),
            'email' => Arr::get($payload, 'email'),
            'cellphone' => Arr::get($payload, 'cellphone'),
            'congregation' => Arr::get($payload, 'congregation'),
            'event_name' => Arr::get($payload, 'eventName'),
            'includes_dates_venue' => (bool) Arr::get($payload, 'includesDatesVenue', false),
            'includes_registration' => (bool) Arr::get($payload, 'includesRegistration', false),
            'includes_graphics' => (bool) Arr::get($payload, 'includesGraphics', false),
            'includes_graphics_digital' => (bool) Arr::get($payload, 'includesGraphicsDigital', false),
            'includes_graphics_print' => (bool) Arr::get($payload, 'includesGraphicsPrint', false),
            'includes_signage' => (bool) Arr::get($payload, 'includesSignage', false),
            'payload' => $payload,
        ]);

        $this->sendSubmissionNotifications($entry, $this->findForm('work-request'));

        return back();
    }

    /**
     * @param  array<string, mixed>  $payload
     *
     * @throws ValidationException
     */
    private function validateWorkRequestPayload(array $payload): void
    {
        $baseValidator = Validator::make($payload, [
            'firstName' => ['required', 'string', 'max:255'],
            'lastName' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'cellphone' => ['required', 'string', 'max:255'],
            'congregation' => ['required', 'string', 'max:255'],
            'includesDatesVenue' => ['required', 'boolean'],
            'includesRegistration' => ['required', 'boolean'],
            'includesGraphics' => ['required', 'boolean'],
            'includesGraphicsDigital' => ['required', 'boolean'],
            'includesGraphicsPrint' => ['required', 'boolean'],
            'includesSignage' => ['required', 'boolean'],
            'termsAccepted' => ['accepted'],
        ]);

        /** @var array<string, string> $errors */
        $errors = [];

        foreach ($baseValidator->errors()->toArray() as $field => $messages) {
            $message = is_array($messages) ? (string) ($messages[0] ?? '') : (string) $messages;
            if ($message !== '') {
                $errors[$field] = $message;
            }
        }

        $includesDatesVenue = $this->payloadBool($payload, 'includesDatesVenue');
        $includesRegistration = $this->payloadBool($payload, 'includesRegistration');
        $includesGraphics = $this->payloadBool($payload, 'includesGraphics');
        $includesGraphicsDigital = $this->payloadBool($payload, 'includesGraphicsDigital');
        $includesGraphicsPrint = $this->payloadBool($payload, 'includesGraphicsPrint');
        $includesSignage = $this->payloadBool($payload, 'includesSignage');

        if (! $includesDatesVenue && ! $includesGraphics && ! $includesSignage) {
            $errors['natureOfRequest'] = 'Please select at least one option for your request';
        }

        if ($includesGraphics && ! $includesGraphicsDigital && ! $includesGraphicsPrint) {
            $errors['graphicsType'] = 'Please select Digital, Print, or both';
        }

        if (($includesDatesVenue || $includesRegistration) && ! $includesGraphicsDigital) {
            $errors['graphicsType'] = 'Digital is required when Event Logistics or Registration Form is selected';
        }

        if ($includesDatesVenue) {
            if ($this->payloadString($payload, 'eventName') === '') {
                $errors['eventName'] = 'Event name is required';
            }

            if ($this->payloadString($payload, 'eventScheduleType') === '') {
                $errors['eventScheduleType'] = 'Please choose an event schedule type';
            }

            if ($this->payloadString($payload, 'announcementDate') === '') {
                $errors['announcementDate'] = 'Announcement date is required';
            }

            $venueType = $this->payloadString($payload, 'venueType');
            if ($venueType === '') {
                $errors['venueType'] = 'Please select a venue type';
            } elseif ($venueType === 'JG Venue' && $this->payloadString($payload, 'jgVenue') === '') {
                $errors['jgVenue'] = 'Please select a JG venue';
            } elseif ($venueType === 'Other') {
                if ($this->payloadString($payload, 'otherVenueName') === '') {
                    $errors['otherVenueName'] = 'Venue name is required';
                }

                if ($this->payloadString($payload, 'otherVenueAddress') === '') {
                    $errors['otherVenueAddress'] = 'Venue address is required';
                }
            }

            $eventReach = $this->payloadString($payload, 'eventReach');
            if ($eventReach === '') {
                $errors['eventReach'] = 'Please select event reach';
            } elseif ($eventReach === 'Hubs' && count($this->payloadArray($payload, 'hubs')) === 0) {
                $errors['hubs'] = 'Please select at least one option';
            } elseif (
                $eventReach === 'Congregations' &&
                count($this->payloadArray($payload, 'eventCongregations')) === 0
            ) {
                $errors['eventCongregations'] = 'Please select at least one congregation';
            }

            $childMinding = $this->payloadString($payload, 'childMinding');
            if ($childMinding === '') {
                $errors['childMinding'] = 'Please indicate if child-minding will be offered';
            } elseif ($childMinding === 'Yes' && $this->payloadString($payload, 'childMindingDescription') === '') {
                $errors['childMindingDescription'] = 'Please describe the child-minding offered';
            }
        }

        if ($includesRegistration) {
            if ($this->payloadString($payload, 'quicketDescription') === '') {
                $errors['quicketDescription'] = 'Description is required';
            }

            $ticketCurrency = strtoupper($this->payloadString($payload, 'ticketCurrency'));
            if (! in_array($ticketCurrency, ['ZAR', 'USD'], true)) {
                $errors['ticketCurrency'] = 'Please select a ticket currency';
            }

            if ($this->payloadString($payload, 'ticketPriceIncludesFee') === '') {
                $errors['ticketPriceIncludesFee'] = 'Please indicate if prices include platform fee';
            }

            if ($this->payloadString($payload, 'allowDonations') === '') {
                $errors['allowDonations'] = 'Please indicate if donations should be allowed';
            }

            if ($this->payloadString($payload, 'registrationClosingDate') === '') {
                $errors['registrationClosingDate'] = 'Registration closing date is required';
            }
        }

        if ($includesGraphicsDigital) {
            $digitalGraphicType = $this->payloadString($payload, 'digitalGraphicType');
            if ($digitalGraphicType === '') {
                $errors['digitalGraphicType'] = 'Please select a graphic type';
            }

            if ($digitalGraphicType === 'Banking Details Graphic') {
                if ($this->payloadString($payload, 'digitalBankName') === '') {
                    $errors['digitalBankName'] = 'Bank name is required';
                }
                if ($this->payloadString($payload, 'digitalBranchCode') === '') {
                    $errors['digitalBranchCode'] = 'Branch code is required';
                }
                if ($this->payloadString($payload, 'digitalAccountNumber') === '') {
                    $errors['digitalAccountNumber'] = 'Account number is required';
                }
                if ($this->payloadString($payload, 'digitalReference') === '') {
                    $errors['digitalReference'] = 'Reference is required';
                }
            }

            if (
                $digitalGraphicType === 'Other' &&
                $this->payloadString($payload, 'digitalOtherGraphicDescription') === ''
            ) {
                $errors['digitalOtherGraphicDescription'] = 'Please describe the graphic you want';
            }

            $hasDigitalFormat = $this->payloadBool($payload, 'digitalFormatWhatsapp')
                || $this->payloadBool($payload, 'digitalFormatAVSlide')
                || $this->payloadBool($payload, 'digitalFormatOther');

            if (! $hasDigitalFormat) {
                $errors['digitalFormats'] = 'Please select at least one format';
            }
        }

        if ($includesGraphicsPrint) {
            $isEventOrRegistrationPrintFlow = $includesDatesVenue || $includesRegistration;
            $isEventAndRegistrationPrintFlow = $includesDatesVenue && $includesRegistration;
            $eventReach = $this->payloadString($payload, 'eventReach');
            $shouldUseEventReachScope = $isEventOrRegistrationPrintFlow && $eventReach !== '';
            $effectivePrintScope = $shouldUseEventReachScope
                ? $eventReach
                : $this->payloadString($payload, 'printScope');
            $printTypes = $this->payloadArray($payload, 'printTypes');

            if (! $shouldUseEventReachScope && $effectivePrintScope === '') {
                $errors['printScope'] = 'Please select a scope';
            }

            if (
                ! $shouldUseEventReachScope &&
                $effectivePrintScope === 'Hubs' &&
                count($this->payloadArray($payload, 'printHubs')) === 0
            ) {
                $errors['printHubs'] = 'Please select at least one hub';
            }

            if (
                ! $shouldUseEventReachScope &&
                $effectivePrintScope === 'Congregations' &&
                count($this->payloadArray($payload, 'printCongregations')) === 0
            ) {
                $errors['printCongregations'] = 'Please select at least one congregation';
            }

            if (count($printTypes) === 0) {
                $errors['printTypes'] = 'Please select at least one print type';
            }

            if ($isEventAndRegistrationPrintFlow) {
                $allowedPrintTypes = [
                    'Congregational Flyer Handouts (A5: 148 x 210 mm)',
                    'Congregational Flyer Handouts (A6: 105 x 148 mm)',
                    'Posters (A3: 297 x 420 mm)',
                    'Posters (A4: 210 x 297 mm)',
                    'Invite/ Evangelism Cards (business card size)',
                ];
                foreach ($printTypes as $printType) {
                    if (! in_array($printType, $allowedPrintTypes, true)) {
                        $errors['printTypes'] = 'Only flyers, posters, and invite cards are available for event and registration requests';
                        break;
                    }
                }
            }
        }

        if ($includesSignage) {
            $hasSignageSelection = collect([
                'sharkfinJgBranded',
                'sharkfinJgKidsBranded',
                'temporaryFenceStandard2x1',
                'temporaryFenceCustom3x1',
                'temporaryFenceCustom4x1',
                'temporaryFenceCustom5x1',
                'toiletsArrowsMaleWord',
                'toiletsArrowsFemaleWord',
                'toiletsArrowsMaleFemaleWord',
                'toiletsMaleFemale',
                'toiletsMale',
                'toiletsFemale',
                'momsNursing',
                'momsNursingWithArrows',
                'momsWithBabies',
                'momsWithBabiesWithArrows',
                'toddlersRoom',
                'toddlersArrows',
                'firstAidSign',
                'firstAidSignWithArrows',
                'internalOther',
                'externalNoParking',
                'externalDisabledParking',
                'externalAmbulanceBay',
                'externalEntrance',
                'externalExit',
                'externalJoshGenArrows',
                'sandwichBoards',
                'permanentExternalBuildingSigns',
                'otherSignage',
            ])->contains(fn (string $key): bool => $this->payloadBool($payload, $key));

            if (! $hasSignageSelection) {
                $errors['signageSelection'] = 'Please select at least one signage request item';
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function payloadString(array $payload, string $key): string
    {
        return trim((string) Arr::get($payload, $key, ''));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function payloadBool(array $payload, string $key): bool
    {
        $value = Arr::get($payload, $key, false);

        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        if (is_string($value)) {
            return in_array(strtolower(trim($value)), ['1', 'true', 'yes', 'on'], true);
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<int, string>
     */
    private function payloadArray(array $payload, string $key): array
    {
        $value = Arr::get($payload, $key, []);
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter(array_map(static fn (mixed $item): string => trim((string) $item), $value)));
    }

    public function storePublicEasterHolidayEntry(
        Request $request,
        RecaptchaEnterpriseService $recaptcha,
    ): RedirectResponse {
        return $this->storePublicHolidayEntryBySlug($request, 'easter-holidays', $recaptcha);
    }

    public function storePublicChristmasHolidayEntry(
        Request $request,
        RecaptchaEnterpriseService $recaptcha,
    ): RedirectResponse {
        return $this->storePublicHolidayEntryBySlug($request, 'christmas-holidays', $recaptcha);
    }

    private function storePublicHolidayEntryBySlug(
        Request $request,
        string $formSlug,
        RecaptchaEnterpriseService $recaptcha,
    ): RedirectResponse {
        $form = $this->findForm($formSlug);
        abort_if($form === null, 404);

        $isEasterForm = $formSlug === 'easter-holidays';

        $rules = $isEasterForm
            ? [
                'congregation' => ['required', 'string', 'max:255'],
                'firstName' => ['required', 'string', 'max:255'],
                'lastName' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255'],
                'cellphone' => ['nullable', 'string', 'max:255'],
                'serviceTimes' => ['required', 'array', 'min:2'],
                'serviceTimes.*.serviceNameOption' => ['required', Rule::in(['good_friday', 'easter_sunday', 'custom'])],
                'serviceTimes.*.customServiceName' => ['nullable', 'string', 'max:255'],
                'serviceTimes.*.serviceDay' => ['nullable', Rule::in(['good_friday', 'easter_sunday'])],
                'serviceTimes.*.startTime' => ['required', 'date_format:H:i'],
                'serviceTimes.*.venueType' => ['required', Rule::in(['JG Venue', 'Other'])],
                'serviceTimes.*.jgVenue' => ['nullable', 'string', 'max:255'],
                'serviceTimes.*.otherVenueName' => ['nullable', 'string', 'max:255'],
                'serviceTimes.*.otherVenueAddress' => ['nullable', 'string', 'max:500'],
                'serviceTimes.*.congregationsInvolved' => ['required', 'array', 'min:1'],
                'serviceTimes.*.congregationsInvolved.*' => ['string', 'max:255'],
                'serviceTimes.*.graphicsLanguages' => ['nullable', 'array'],
                'serviceTimes.*.graphicsLanguages.*' => ['string', Rule::in(['English', 'Afrikaans'])],
                'serviceTimes.*.hasSpecificTheme' => ['nullable', Rule::in(['Yes', 'No'])],
                'serviceTimes.*.themeDescription' => ['nullable', 'string', 'max:2000'],
                'serviceTimes.*.needsSeparateGraphic' => ['nullable', Rule::in(['Yes', 'No'])],
                'serviceTimes.*.customGraphicThemeDescription' => ['nullable', 'string', 'max:2000'],
            ]
            : [
                'congregation' => ['required', 'string', 'max:255'],
                'firstName' => ['required', 'string', 'max:255'],
                'lastName' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255'],
                'cellphone' => ['nullable', 'string', 'max:255'],
                'notes' => ['nullable', 'string', 'max:2000'],
                'serviceTimes' => ['required', 'array', 'min:1'],
                'serviceTimes.*.serviceName' => ['nullable', 'string', 'max:255'],
                'serviceTimes.*.date' => ['required', 'date', 'after_or_equal:today'],
                'serviceTimes.*.startTime' => ['required', 'string', 'max:255'],
                'serviceTimes.*.venue' => ['nullable', 'string', 'max:255'],
            ];

        if ($recaptcha->enabled()) {
            $rules['recaptchaToken'] = ['required', 'string'];
        }

        $validated = $request->validate($rules);

        if ($recaptcha->enabled()) {
            $verification = $recaptcha->verifyToken((string) ($validated['recaptchaToken'] ?? ''));
            if (! $verification['success']) {
                return back()->withErrors([
                    'recaptcha' => $verification['message'] ?? 'Could not verify spam protection. Please try again.',
                ])->withInput();
            }
        }

        if ($isEasterForm) {
            $serviceNameMeta = [
                'good_friday' => ['name' => 'Good Friday', 'date' => '2026-04-03'],
                'easter_sunday' => ['name' => 'Easter Sunday', 'date' => '2026-04-05'],
            ];

            /** @var array<int, array<string, mixed>> $validatedServiceTimes */
            $validatedServiceTimes = $validated['serviceTimes'];
            $serviceNameOptions = collect($validatedServiceTimes)
                ->map(static fn (array $service): string => (string) ($service['serviceNameOption'] ?? ''))
                ->all();

            $errors = [];

            foreach ($validatedServiceTimes as $index => $service) {
                $serviceNameOption = (string) ($service['serviceNameOption'] ?? '');
                $customServiceName = trim((string) ($service['customServiceName'] ?? ''));
                $serviceDay = trim((string) ($service['serviceDay'] ?? ''));
                $venueType = (string) ($service['venueType'] ?? '');
                $jgVenue = trim((string) ($service['jgVenue'] ?? ''));
                $otherVenueName = trim((string) ($service['otherVenueName'] ?? ''));
                $otherVenueAddress = trim((string) ($service['otherVenueAddress'] ?? ''));
                $graphicsLanguages = $this->normalizeStringList($service['graphicsLanguages'] ?? []);
                $hasSpecificTheme = (string) ($service['hasSpecificTheme'] ?? '');
                $themeDescription = trim((string) ($service['themeDescription'] ?? ''));
                $needsSeparateGraphic = (string) ($service['needsSeparateGraphic'] ?? '');
                $customGraphicThemeDescription = trim((string) ($service['customGraphicThemeDescription'] ?? ''));

                if ($serviceNameOption === 'custom' && $customServiceName === '') {
                    $errors["serviceTimes.$index.customServiceName"] = 'Please provide a custom service name';
                }

                if ($serviceNameOption === 'custom' && $serviceDay === '') {
                    $errors["serviceTimes.$index.serviceDay"] = 'Please select the day for this event';
                }

                if ($venueType === 'JG Venue' && $jgVenue === '') {
                    $errors["serviceTimes.$index.jgVenue"] = 'Please select a JG venue';
                }

                if ($venueType === 'Other') {
                    if ($otherVenueName === '') {
                        $errors["serviceTimes.$index.otherVenueName"] = 'Please provide a venue name';
                    }

                    if ($otherVenueAddress === '') {
                        $errors["serviceTimes.$index.otherVenueAddress"] = 'Please provide a venue address';
                    }
                }

                if ($serviceNameOption === 'custom') {
                    if ($needsSeparateGraphic === '') {
                        $errors["serviceTimes.$index.needsSeparateGraphic"] = 'Please indicate if a separate graphic is needed';
                    }

                    if ($needsSeparateGraphic === 'Yes' && $customGraphicThemeDescription === '') {
                        $errors["serviceTimes.$index.customGraphicThemeDescription"] = 'Please provide details for the separate graphic';
                    }
                } else {
                    if (count($graphicsLanguages) === 0) {
                        $errors["serviceTimes.$index.graphicsLanguages"] = 'Please select at least one graphics language';
                    }

                    if ($hasSpecificTheme === '') {
                        $errors["serviceTimes.$index.hasSpecificTheme"] = 'Please indicate whether this service has a specific theme';
                    }

                    if ($hasSpecificTheme === 'Yes' && $themeDescription === '') {
                        $errors["serviceTimes.$index.themeDescription"] = 'Please provide a theme description';
                    }
                }
            }

            $missingRequiredServices = [];
            if (! in_array('good_friday', $serviceNameOptions, true)) {
                $missingRequiredServices[] = 'Good Friday';
            }

            if (! in_array('easter_sunday', $serviceNameOptions, true)) {
                $missingRequiredServices[] = 'Easter Sunday';
            }

            if ($missingRequiredServices !== []) {
                $errors['serviceTimes'] = sprintf(
                    'Please include service details for: %s',
                    implode(' and ', $missingRequiredServices),
                );
            }

            if ($errors !== []) {
                throw ValidationException::withMessages($errors);
            }

            $serviceTimes = collect($validatedServiceTimes)
                ->map(function (array $service) use ($serviceNameMeta): array {
                    $serviceNameOption = (string) ($service['serviceNameOption'] ?? '');
                    $customServiceName = trim((string) ($service['customServiceName'] ?? ''));
                    $serviceDay = trim((string) ($service['serviceDay'] ?? ''));
                    $resolvedServiceDay = $serviceNameOption === 'custom'
                        ? $serviceDay
                        : $serviceNameOption;
                    $serviceName = $serviceNameOption === 'custom'
                        ? $customServiceName
                        : (string) ($serviceNameMeta[$serviceNameOption]['name'] ?? '');
                    $serviceDate = $serviceNameMeta[$resolvedServiceDay]['date'] ?? null;

                    return [
                        'serviceNameOption' => $serviceNameOption,
                        'serviceDay' => $resolvedServiceDay,
                        'serviceName' => $serviceName,
                        'serviceDate' => $serviceDate,
                        'customServiceName' => $customServiceName,
                        'startTime' => trim((string) ($service['startTime'] ?? '')),
                        'venueType' => trim((string) ($service['venueType'] ?? '')),
                        'jgVenue' => trim((string) ($service['jgVenue'] ?? '')),
                        'otherVenueName' => trim((string) ($service['otherVenueName'] ?? '')),
                        'otherVenueAddress' => trim((string) ($service['otherVenueAddress'] ?? '')),
                        'congregationsInvolved' => $this->normalizeStringList($service['congregationsInvolved'] ?? []),
                        'graphicsLanguages' => $this->normalizeStringList($service['graphicsLanguages'] ?? []),
                        'hasSpecificTheme' => trim((string) ($service['hasSpecificTheme'] ?? '')),
                        'themeDescription' => trim((string) ($service['themeDescription'] ?? '')),
                        'needsSeparateGraphic' => trim((string) ($service['needsSeparateGraphic'] ?? '')),
                        'customGraphicThemeDescription' => trim((string) ($service['customGraphicThemeDescription'] ?? '')),
                    ];
                })
                ->values()
                ->all();
            $serviceTimes = $this->mergeEasterServiceTimes($serviceTimes);

            $payload = [
                'congregation' => trim((string) $validated['congregation']),
                'firstName' => trim((string) $validated['firstName']),
                'lastName' => trim((string) $validated['lastName']),
                'email' => trim((string) $validated['email']),
                'cellphone' => trim((string) ($validated['cellphone'] ?? '')),
                'serviceTimes' => $serviceTimes,
            ];
        } else {
            $serviceTimes = collect($validated['serviceTimes'])
                ->map(function (array $service): array {
                    return [
                        'serviceName' => trim((string) ($service['serviceName'] ?? '')),
                        'date' => (string) ($service['date'] ?? ''),
                        'startTime' => trim((string) ($service['startTime'] ?? '')),
                        'venue' => trim((string) ($service['venue'] ?? '')),
                    ];
                })
                ->values()
                ->all();

            $payload = [
                'congregation' => trim((string) $validated['congregation']),
                'firstName' => trim((string) $validated['firstName']),
                'lastName' => trim((string) $validated['lastName']),
                'email' => trim((string) $validated['email']),
                'cellphone' => trim((string) ($validated['cellphone'] ?? '')),
                'notes' => trim((string) ($validated['notes'] ?? '')),
                'serviceTimes' => $serviceTimes,
            ];
        }

        $entry = WorkRequestEntry::query()->create([
            'user_id' => null,
            'form_slug' => $formSlug,
            'first_name' => $payload['firstName'],
            'last_name' => $payload['lastName'],
            'email' => $payload['email'],
            'cellphone' => $payload['cellphone'] !== '' ? $payload['cellphone'] : null,
            'congregation' => $payload['congregation'],
            'event_name' => sprintf('%s - %s', (string) $payload['congregation'], (string) ($form['title'] ?? 'Service Times')),
            'payload' => $payload,
        ]);

        $this->sendSubmissionNotifications($entry, $form);

        return back();
    }

    public function adminFormEntriesExport(string $formSlug): StreamedResponse
    {
        $form = $this->findForm($formSlug);
        abort_if($form === null, 404);

        $entries = WorkRequestEntry::query()
            ->where('form_slug', $formSlug)
            ->latest()
            ->get();

        $filename = sprintf(
            '%s_entries_%s.csv',
            str_replace('-', '_', $formSlug),
            now()->format('Ymd_His'),
        );

        return response()->streamDownload(function () use ($entries, $formSlug): void {
            $output = fopen('php://output', 'wb');
            if ($output === false) {
                return;
            }

            fwrite($output, "\xEF\xBB\xBF");

            if ($formSlug === 'easter-holidays') {
                $aggregatedRows = $this->aggregateEasterServicesAcrossEntries($entries);

                fputcsv($output, [
                    'Entry IDs',
                    'Submitted At',
                    'Contact First Name',
                    'Contact Last Name',
                    'Contact Email',
                    'Cellphone',
                    "Contact's Congregation",
                    'Service Type',
                    'Service Day',
                    'Service Name',
                    'Custom Service Name',
                    'Service Date',
                    'Start Time',
                    'Venue Type',
                    'Venue',
                    'JG Venue',
                    'Other Venue Name',
                    'Other Venue Address',
                    'Congregations Involved',
                    'Graphics Languages',
                    'Specific Theme',
                    'Theme Description',
                    'Needs Separate Graphic',
                    'Custom Graphic Theme Details',
                ]);

                foreach ($aggregatedRows as $row) {
                    fputcsv($output, [
                        implode(', ', $row['sourceEntryIds']),
                        $row['createdAt'],
                        $row['firstName'],
                        $row['lastName'],
                        $row['email'],
                        $row['cellphone'],
                        $row['congregation'],
                        $row['serviceNameOption'],
                        $row['serviceDay'],
                        $row['serviceName'],
                        $row['customServiceName'],
                        $row['serviceDate'],
                        $row['startTime'],
                        $row['venueType'],
                        $this->formatEasterServiceVenueForExport($row),
                        $row['jgVenue'],
                        $row['otherVenueName'],
                        $row['otherVenueAddress'],
                        implode(', ', $row['congregationsInvolved']),
                        implode(', ', $row['graphicsLanguages']),
                        $row['hasSpecificTheme'],
                        $row['themeDescription'],
                        $row['needsSeparateGraphic'],
                        $row['customGraphicThemeDescription'],
                    ]);
                }

                fclose($output);

                return;
            }

            fputcsv($output, [
                'Entry ID',
                'Submitted At',
                'Form Slug',
                'First Name',
                'Last Name',
                'Email',
                'Cellphone',
                'Congregation',
                'Event Name',
                'Request Types',
                'Payload JSON',
            ]);

            foreach ($entries as $entry) {
                fputcsv($output, [
                    $entry->id,
                    $entry->created_at?->format('Y-m-d H:i:s') ?? '',
                    $entry->form_slug,
                    $entry->first_name ?? '',
                    $entry->last_name ?? '',
                    $entry->email ?? '',
                    $entry->cellphone ?? '',
                    $entry->congregation ?? '',
                    $entry->event_name ?? '',
                    implode(', ', $this->requestTypes($entry)),
                    json_encode($entry->payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                ]);
            }

            fclose($output);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache',
        ]);
    }

    /**
     * @return array<int, string>
     */
    private function normalizeStringList(mixed $values): array
    {
        if (! is_array($values)) {
            return [];
        }

        $items = array_map(
            static fn (mixed $value): string => trim((string) $value),
            $values,
        );

        $items = array_filter($items, static fn (string $value): bool => $value !== '');
        $items = array_values(array_unique($items));

        return $items;
    }

    /**
     * @param  array<int, array<string, mixed>>  $serviceTimes
     * @return array<int, array<string, mixed>>
     */
    private function mergeEasterServiceTimes(array $serviceTimes): array
    {
        /** @var array<string, array<string, mixed>> $mergedServices */
        $mergedServices = [];

        foreach ($serviceTimes as $service) {
            $serviceNameOption = trim((string) ($service['serviceNameOption'] ?? ''));
            $serviceDay = trim((string) ($service['serviceDay'] ?? ''));
            $serviceName = trim((string) ($service['serviceName'] ?? ''));
            $serviceDate = trim((string) ($service['serviceDate'] ?? ''));
            $startTime = trim((string) ($service['startTime'] ?? ''));
            $venueType = trim((string) ($service['venueType'] ?? ''));
            $jgVenue = trim((string) ($service['jgVenue'] ?? ''));
            $otherVenueName = trim((string) ($service['otherVenueName'] ?? ''));
            $otherVenueAddress = trim((string) ($service['otherVenueAddress'] ?? ''));
            $congregationsInvolved = $this->normalizeStringList($service['congregationsInvolved'] ?? []);
            $graphicsLanguages = $this->normalizeStringList($service['graphicsLanguages'] ?? []);
            $hasSpecificTheme = trim((string) ($service['hasSpecificTheme'] ?? ''));
            $themeDescription = trim((string) ($service['themeDescription'] ?? ''));
            $needsSeparateGraphic = trim((string) ($service['needsSeparateGraphic'] ?? ''));
            $customGraphicThemeDescription = trim((string) ($service['customGraphicThemeDescription'] ?? ''));

            $serviceIdentity = strtolower(
                $serviceNameOption === 'custom' ? $serviceName : $serviceNameOption,
            );
            $venueIdentity = strtolower(
                $venueType === 'JG Venue'
                    ? $jgVenue
                    : $otherVenueName.'|'.$otherVenueAddress,
            );
            $mergeKey = implode('||', [
                $serviceIdentity,
                strtolower($serviceDay),
                strtolower($serviceDate),
                strtolower($startTime),
                strtolower($venueType),
                $venueIdentity,
            ]);

            if (! isset($mergedServices[$mergeKey])) {
                $mergedServices[$mergeKey] = [
                    'serviceNameOption' => $serviceNameOption,
                    'serviceDay' => $serviceDay,
                    'serviceName' => $serviceName,
                    'serviceDate' => $serviceDate,
                    'customServiceName' => trim((string) ($service['customServiceName'] ?? '')),
                    'startTime' => $startTime,
                    'venueType' => $venueType,
                    'jgVenue' => $jgVenue,
                    'otherVenueName' => $otherVenueName,
                    'otherVenueAddress' => $otherVenueAddress,
                    'congregationsInvolved' => $congregationsInvolved,
                    'graphicsLanguages' => $graphicsLanguages,
                    'hasSpecificTheme' => $hasSpecificTheme,
                    'themeDescription' => $themeDescription,
                    'needsSeparateGraphic' => $needsSeparateGraphic,
                    'customGraphicThemeDescription' => $customGraphicThemeDescription,
                ];
                continue;
            }

            $existing = $mergedServices[$mergeKey];
            $mergedServices[$mergeKey]['congregationsInvolved'] = $this->normalizeStringList(
                array_merge(
                    is_array($existing['congregationsInvolved'] ?? null)
                        ? $existing['congregationsInvolved']
                        : [],
                    $congregationsInvolved,
                ),
            );
            $mergedServices[$mergeKey]['graphicsLanguages'] = $this->normalizeStringList(
                array_merge(
                    is_array($existing['graphicsLanguages'] ?? null)
                        ? $existing['graphicsLanguages']
                        : [],
                    $graphicsLanguages,
                ),
            );

            if ($hasSpecificTheme === 'Yes') {
                $mergedServices[$mergeKey]['hasSpecificTheme'] = 'Yes';
            }

            if ($themeDescription !== '') {
                $existingThemeDescription = trim((string) ($existing['themeDescription'] ?? ''));
                if ($existingThemeDescription === '') {
                    $mergedServices[$mergeKey]['themeDescription'] = $themeDescription;
                } elseif (
                    ! in_array(
                        strtolower($themeDescription),
                        array_map(
                            static fn (string $value): string => strtolower(trim($value)),
                            array_filter(
                                array_map('trim', explode(' | ', $existingThemeDescription)),
                                static fn (string $value): bool => $value !== '',
                            ),
                        ),
                        true,
                    )
                ) {
                    $mergedServices[$mergeKey]['themeDescription'] =
                        $existingThemeDescription.' | '.$themeDescription;
                }
            }

            if ($needsSeparateGraphic === 'Yes') {
                $mergedServices[$mergeKey]['needsSeparateGraphic'] = 'Yes';
            }

            if ($customGraphicThemeDescription !== '') {
                $existingGraphicDescription = trim((string) ($existing['customGraphicThemeDescription'] ?? ''));
                if ($existingGraphicDescription === '') {
                    $mergedServices[$mergeKey]['customGraphicThemeDescription'] = $customGraphicThemeDescription;
                } elseif (
                    ! in_array(
                        strtolower($customGraphicThemeDescription),
                        array_map(
                            static fn (string $value): string => strtolower(trim($value)),
                            array_filter(
                                array_map('trim', explode(' | ', $existingGraphicDescription)),
                                static fn (string $value): bool => $value !== '',
                            ),
                        ),
                        true,
                    )
                ) {
                    $mergedServices[$mergeKey]['customGraphicThemeDescription'] =
                        $existingGraphicDescription.' | '.$customGraphicThemeDescription;
                }
            }
        }

        return array_values($mergedServices);
    }

    /**
     * @param  array<string, mixed>  $service
     */
    private function formatEasterServiceVenueForExport(array $service): string
    {
        $venueType = trim((string) ($service['venueType'] ?? ''));
        if ($venueType === 'JG Venue') {
            return trim((string) ($service['jgVenue'] ?? ''));
        }

        $otherVenueName = trim((string) ($service['otherVenueName'] ?? ''));
        $otherVenueAddress = trim((string) ($service['otherVenueAddress'] ?? ''));

        return implode(', ', array_values(array_filter([
            $otherVenueName,
            $otherVenueAddress,
        ], static fn (string $value): bool => $value !== '')));
    }

    /**
     * @param  iterable<int, WorkRequestEntry>  $entries
     * @return array<int, array{
     *   id:int,
     *   formSlug:string,
     *   createdAt:string|null,
     *   firstName:string,
     *   lastName:string,
     *   email:string,
     *   cellphone:string,
     *   congregation:string,
     *   eventName:string,
     *   requestTypes:array<int,string>,
     *   canManage:bool,
     *   sourceEntryCount:int,
     *   sourceEntryIds:array<int,int>,
     *   serviceNameOption:string,
     *   serviceDay:string,
     *   serviceName:string,
     *   customServiceName:string,
     *   serviceDate:string,
     *   startTime:string,
     *   venueType:string,
     *   jgVenue:string,
     *   otherVenueName:string,
     *   otherVenueAddress:string,
     *   congregationsInvolved:array<int,string>,
     *   graphicsLanguages:array<int,string>,
     *   hasSpecificTheme:string,
     *   themeDescription:string,
     *   needsSeparateGraphic:string,
     *   customGraphicThemeDescription:string
     * }>
     */
    private function aggregateEasterServicesAcrossEntries(iterable $entries): array
    {
        /** @var array<string, array<string, mixed>> $grouped */
        $grouped = [];

        foreach ($entries as $entry) {
            $payload = is_array($entry->payload) ? $entry->payload : [];
            $serviceTimes = Arr::get($payload, 'serviceTimes', []);
            if (! is_array($serviceTimes)) {
                continue;
            }

            foreach ($serviceTimes as $service) {
                if (! is_array($service)) {
                    continue;
                }

                $serviceNameOption = trim((string) ($service['serviceNameOption'] ?? ''));
                $serviceDay = $this->resolveEasterServiceDay($service);
                $serviceName = trim((string) ($service['serviceName'] ?? ''));
                $customServiceName = trim((string) ($service['customServiceName'] ?? ''));
                $serviceDate = trim((string) ($service['serviceDate'] ?? ''));
                $startTime = trim((string) ($service['startTime'] ?? ''));
                $venueType = trim((string) ($service['venueType'] ?? ''));
                $jgVenue = trim((string) ($service['jgVenue'] ?? ''));
                $otherVenueName = trim((string) ($service['otherVenueName'] ?? ''));
                $otherVenueAddress = trim((string) ($service['otherVenueAddress'] ?? ''));
                $congregationsInvolved = $this->normalizeStringList($service['congregationsInvolved'] ?? []);
                $graphicsLanguages = $this->normalizeStringList($service['graphicsLanguages'] ?? []);
                $hasSpecificTheme = trim((string) ($service['hasSpecificTheme'] ?? ''));
                $themeDescription = trim((string) ($service['themeDescription'] ?? ''));
                $needsSeparateGraphic = trim((string) ($service['needsSeparateGraphic'] ?? ''));
                $customGraphicThemeDescription = trim((string) ($service['customGraphicThemeDescription'] ?? ''));

                $mergeKey = $this->buildEasterCrossEntryMergeKey([
                    'serviceNameOption' => $serviceNameOption,
                    'serviceDay' => $serviceDay,
                    'serviceName' => $serviceName,
                    'customServiceName' => $customServiceName,
                    'startTime' => $startTime,
                    'venueType' => $venueType,
                    'jgVenue' => $jgVenue,
                    'otherVenueName' => $otherVenueName,
                    'otherVenueAddress' => $otherVenueAddress,
                ]);

                if (! isset($grouped[$mergeKey])) {
                    $grouped[$mergeKey] = [
                        'sourceEntryIds' => [$entry->id],
                        'createdAt' => $entry->created_at?->format('Y-m-d H:i:s'),
                        'createdAtTimestamp' => $entry->created_at?->getTimestamp() ?? 0,
                        'firstNames' => $this->normalizeStringList([$entry->first_name]),
                        'lastNames' => $this->normalizeStringList([$entry->last_name]),
                        'emails' => $this->normalizeStringList([$entry->email]),
                        'cellphones' => $this->normalizeStringList([$entry->cellphone]),
                        'contactCongregations' => $this->normalizeStringList([$entry->congregation]),
                        'serviceNameOption' => $serviceNameOption,
                        'serviceDay' => $serviceDay,
                        'serviceName' => $serviceName,
                        'customServiceName' => $customServiceName,
                        'serviceDate' => $serviceDate,
                        'startTime' => $startTime,
                        'venueType' => $venueType,
                        'jgVenue' => $jgVenue,
                        'otherVenueName' => $otherVenueName,
                        'otherVenueAddress' => $otherVenueAddress,
                        'congregationsInvolved' => $congregationsInvolved,
                        'graphicsLanguages' => $graphicsLanguages,
                        'hasSpecificTheme' => $hasSpecificTheme,
                        'themeDescription' => $themeDescription,
                        'needsSeparateGraphic' => $needsSeparateGraphic,
                        'customGraphicThemeDescription' => $customGraphicThemeDescription,
                    ];

                    continue;
                }

                $currentTimestamp = $entry->created_at?->getTimestamp() ?? 0;
                if ($currentTimestamp > (int) $grouped[$mergeKey]['createdAtTimestamp']) {
                    $grouped[$mergeKey]['createdAtTimestamp'] = $currentTimestamp;
                    $grouped[$mergeKey]['createdAt'] = $entry->created_at?->format('Y-m-d H:i:s');
                }

                $grouped[$mergeKey]['sourceEntryIds'] = array_values(array_unique(array_merge(
                    is_array($grouped[$mergeKey]['sourceEntryIds'] ?? null)
                        ? $grouped[$mergeKey]['sourceEntryIds']
                        : [],
                    [$entry->id],
                )));
                $grouped[$mergeKey]['firstNames'] = $this->normalizeStringList(array_merge(
                    is_array($grouped[$mergeKey]['firstNames'] ?? null)
                        ? $grouped[$mergeKey]['firstNames']
                        : [],
                    [$entry->first_name],
                ));
                $grouped[$mergeKey]['lastNames'] = $this->normalizeStringList(array_merge(
                    is_array($grouped[$mergeKey]['lastNames'] ?? null)
                        ? $grouped[$mergeKey]['lastNames']
                        : [],
                    [$entry->last_name],
                ));
                $grouped[$mergeKey]['emails'] = $this->normalizeStringList(array_merge(
                    is_array($grouped[$mergeKey]['emails'] ?? null)
                        ? $grouped[$mergeKey]['emails']
                        : [],
                    [$entry->email],
                ));
                $grouped[$mergeKey]['cellphones'] = $this->normalizeStringList(array_merge(
                    is_array($grouped[$mergeKey]['cellphones'] ?? null)
                        ? $grouped[$mergeKey]['cellphones']
                        : [],
                    [$entry->cellphone],
                ));
                $grouped[$mergeKey]['contactCongregations'] = $this->normalizeStringList(array_merge(
                    is_array($grouped[$mergeKey]['contactCongregations'] ?? null)
                        ? $grouped[$mergeKey]['contactCongregations']
                        : [],
                    [$entry->congregation],
                ));
                $grouped[$mergeKey]['congregationsInvolved'] = $this->normalizeStringList(array_merge(
                    is_array($grouped[$mergeKey]['congregationsInvolved'] ?? null)
                        ? $grouped[$mergeKey]['congregationsInvolved']
                        : [],
                    $congregationsInvolved,
                ));
                $grouped[$mergeKey]['graphicsLanguages'] = $this->normalizeStringList(array_merge(
                    is_array($grouped[$mergeKey]['graphicsLanguages'] ?? null)
                        ? $grouped[$mergeKey]['graphicsLanguages']
                        : [],
                    $graphicsLanguages,
                ));

                if ($hasSpecificTheme === 'Yes') {
                    $grouped[$mergeKey]['hasSpecificTheme'] = 'Yes';
                }

                if ($needsSeparateGraphic === 'Yes') {
                    $grouped[$mergeKey]['needsSeparateGraphic'] = 'Yes';
                }

                if ($themeDescription !== '') {
                    $grouped[$mergeKey]['themeDescription'] = $this->appendUniquePipeSeparatedValue(
                        trim((string) ($grouped[$mergeKey]['themeDescription'] ?? '')),
                        $themeDescription,
                    );
                }

                if ($customGraphicThemeDescription !== '') {
                    $grouped[$mergeKey]['customGraphicThemeDescription'] = $this->appendUniquePipeSeparatedValue(
                        trim((string) ($grouped[$mergeKey]['customGraphicThemeDescription'] ?? '')),
                        $customGraphicThemeDescription,
                    );
                }
            }
        }

        $aggregatedRows = array_values(array_map(function (array $row): array {
            $sourceEntryIds = array_values(array_map(
                static fn (mixed $value): int => (int) $value,
                is_array($row['sourceEntryIds'] ?? null) ? $row['sourceEntryIds'] : [],
            ));
            sort($sourceEntryIds);

            $serviceName = (string) ($row['serviceName'] ?? '');
            $startTime = (string) ($row['startTime'] ?? '');
            $venueSummary = $this->formatEasterServiceVenueForExport($row);
            $eventSummaryParts = array_values(array_filter([
                $serviceName,
                $startTime,
                $venueSummary,
            ], static fn (string $value): bool => trim($value) !== ''));

            return [
                'id' => count($sourceEntryIds) > 0 ? $sourceEntryIds[0] : 0,
                'formSlug' => 'easter-holidays',
                'createdAt' => (string) ($row['createdAt'] ?? ''),
                'firstName' => implode(', ', $this->normalizeStringList($row['firstNames'] ?? [])),
                'lastName' => implode(', ', $this->normalizeStringList($row['lastNames'] ?? [])),
                'email' => implode(', ', $this->normalizeStringList($row['emails'] ?? [])),
                'cellphone' => implode(', ', $this->normalizeStringList($row['cellphones'] ?? [])),
                'congregation' => implode(', ', $this->normalizeStringList($row['contactCongregations'] ?? [])),
                'eventName' => implode(' | ', $eventSummaryParts),
                'requestTypes' => ['Easter service times'],
                'canManage' => false,
                'sourceEntryCount' => count($sourceEntryIds),
                'sourceEntryIds' => $sourceEntryIds,
                'serviceNameOption' => (string) ($row['serviceNameOption'] ?? ''),
                'serviceDay' => (string) ($row['serviceDay'] ?? ''),
                'serviceName' => (string) ($row['serviceName'] ?? ''),
                'customServiceName' => (string) ($row['customServiceName'] ?? ''),
                'serviceDate' => (string) ($row['serviceDate'] ?? ''),
                'startTime' => (string) ($row['startTime'] ?? ''),
                'venueType' => (string) ($row['venueType'] ?? ''),
                'jgVenue' => (string) ($row['jgVenue'] ?? ''),
                'otherVenueName' => (string) ($row['otherVenueName'] ?? ''),
                'otherVenueAddress' => (string) ($row['otherVenueAddress'] ?? ''),
                'congregationsInvolved' => $this->normalizeStringList($row['congregationsInvolved'] ?? []),
                'graphicsLanguages' => $this->normalizeStringList($row['graphicsLanguages'] ?? []),
                'hasSpecificTheme' => (string) ($row['hasSpecificTheme'] ?? ''),
                'themeDescription' => (string) ($row['themeDescription'] ?? ''),
                'needsSeparateGraphic' => (string) ($row['needsSeparateGraphic'] ?? ''),
                'customGraphicThemeDescription' => (string) ($row['customGraphicThemeDescription'] ?? ''),
                'createdAtTimestamp' => (int) ($row['createdAtTimestamp'] ?? 0),
            ];
        }, $grouped));

        usort($aggregatedRows, static function (array $a, array $b): int {
            return (int) ($b['createdAtTimestamp'] ?? 0) <=> (int) ($a['createdAtTimestamp'] ?? 0);
        });

        return array_values(array_map(static function (array $row): array {
            unset($row['createdAtTimestamp']);

            return $row;
        }, $aggregatedRows));
    }

    /**
     * @param  array<string, mixed>  $service
     */
    private function resolveEasterServiceDay(array $service): string
    {
        $serviceDay = trim((string) ($service['serviceDay'] ?? ''));
        if (in_array($serviceDay, ['good_friday', 'easter_sunday'], true)) {
            return $serviceDay;
        }

        $serviceNameOption = trim((string) ($service['serviceNameOption'] ?? ''));
        if (in_array($serviceNameOption, ['good_friday', 'easter_sunday'], true)) {
            return $serviceNameOption;
        }

        $serviceDate = trim((string) ($service['serviceDate'] ?? ''));
        if ($serviceDate === '2026-04-03') {
            return 'good_friday';
        }
        if ($serviceDate === '2026-04-05') {
            return 'easter_sunday';
        }

        return '';
    }

    /**
     * @param  array<string, mixed>  $service
     */
    private function buildEasterCrossEntryMergeKey(array $service): string
    {
        $serviceNameOption = trim((string) ($service['serviceNameOption'] ?? ''));
        $serviceDay = trim((string) ($service['serviceDay'] ?? ''));
        $serviceName = trim((string) ($service['serviceName'] ?? ''));
        $customServiceName = trim((string) ($service['customServiceName'] ?? ''));
        $startTime = trim((string) ($service['startTime'] ?? ''));
        $venueType = trim((string) ($service['venueType'] ?? ''));
        $jgVenue = trim((string) ($service['jgVenue'] ?? ''));
        $otherVenueName = trim((string) ($service['otherVenueName'] ?? ''));
        $otherVenueAddress = trim((string) ($service['otherVenueAddress'] ?? ''));

        $serviceTypeIdentity = $serviceNameOption === 'custom'
            ? strtolower($customServiceName !== '' ? $customServiceName : $serviceName)
            : strtolower($serviceNameOption);

        $venueIdentity = strtolower($venueType === 'JG Venue'
            ? $jgVenue
            : $otherVenueName.'|'.$otherVenueAddress);

        return implode('||', [
            $serviceTypeIdentity,
            strtolower($serviceDay),
            strtolower($startTime),
            strtolower($venueType),
            $venueIdentity,
        ]);
    }

    private function appendUniquePipeSeparatedValue(string $existing, string $incoming): string
    {
        $incoming = trim($incoming);
        if ($incoming === '') {
            return $existing;
        }

        if ($existing === '') {
            return $incoming;
        }

        $existingValues = array_filter(
            array_map('trim', explode(' | ', $existing)),
            static fn (string $value): bool => $value !== '',
        );
        $existingValuesLower = array_map(
            static fn (string $value): string => strtolower($value),
            $existingValues,
        );

        if (in_array(strtolower($incoming), $existingValuesLower, true)) {
            return $existing;
        }

        return $existing.' | '.$incoming;
    }

    public function adminFormsEntriesIndex(): Response
    {
        $forms = collect($this->formsConfig())
            ->map(function (array $form): array {
                $slug = (string) ($form['slug'] ?? '');

                $entriesQuery = WorkRequestEntry::query()->where('form_slug', $slug);

                return [
                    'slug' => $slug,
                    'title' => (string) ($form['title'] ?? $slug),
                    'description' => (string) ($form['description'] ?? ''),
                    'entryCount' => (int) $entriesQuery->count(),
                    'latestEntryAt' => $entriesQuery->max('created_at'),
                ];
            })
            ->values();

        return Inertia::render('admin/forms/entries-index', [
            'forms' => $forms,
        ]);
    }

    public function adminFormEntries(string $formSlug): Response
    {
        $form = $this->findForm($formSlug);
        abort_if($form === null, 404);

        $entries = WorkRequestEntry::query()
            ->where('form_slug', $formSlug)
            ->latest()
            ->get()
            ->map(fn (WorkRequestEntry $entry): array => $this->entrySummary($entry))
            ->values();

        return Inertia::render('admin/forms/entries', [
            'form' => $form,
            'entries' => $entries,
        ]);
    }

    public function adminFormEntryShow(string $formSlug, WorkRequestEntry $entry): Response
    {
        $form = $this->findForm($formSlug);
        abort_if($form === null, 404);
        $this->assertEntryBelongsToForm($entry, $formSlug);

        return Inertia::render('admin/forms/entry-show', [
            'form' => $form,
            'entry' => $this->entryDetail($entry),
        ]);
    }

    public function adminFormEntryEdit(string $formSlug, WorkRequestEntry $entry): Response
    {
        $form = $this->findForm($formSlug);
        abort_if($form === null, 404);
        $this->assertEntryBelongsToForm($entry, $formSlug);

        return Inertia::render('admin/forms/entry-edit', [
            'form' => $form,
            'entry' => $this->entryDetail($entry),
        ]);
    }

    public function adminFormEntryUpdate(Request $request, string $formSlug, WorkRequestEntry $entry): RedirectResponse
    {
        $form = $this->findForm($formSlug);
        abort_if($form === null, 404);
        $this->assertEntryBelongsToForm($entry, $formSlug);

        $validated = $request->validate([
            'firstName' => ['nullable', 'string', 'max:255'],
            'lastName' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'cellphone' => ['nullable', 'string', 'max:255'],
            'congregation' => ['nullable', 'string', 'max:255'],
            'eventName' => ['nullable', 'string', 'max:255'],
            'payloadJson' => ['required', 'string', 'json'],
        ]);

        /** @var mixed $decodedPayload */
        $decodedPayload = json_decode((string) $validated['payloadJson'], true);
        if (! is_array($decodedPayload)) {
            return back()->withErrors([
                'payloadJson' => 'Payload must decode to a JSON object.',
            ]);
        }

        /** @var array<string, mixed> $payload */
        $payload = $decodedPayload;

        $entry->update([
            'first_name' => Arr::get($validated, 'firstName'),
            'last_name' => Arr::get($validated, 'lastName'),
            'email' => Arr::get($validated, 'email'),
            'cellphone' => Arr::get($validated, 'cellphone'),
            'congregation' => Arr::get($validated, 'congregation'),
            'event_name' => Arr::get($validated, 'eventName'),
            'includes_dates_venue' => (bool) Arr::get($payload, 'includesDatesVenue', $entry->includes_dates_venue),
            'includes_registration' => (bool) Arr::get($payload, 'includesRegistration', $entry->includes_registration),
            'includes_graphics' => (bool) Arr::get($payload, 'includesGraphics', $entry->includes_graphics),
            'includes_graphics_digital' => (bool) Arr::get($payload, 'includesGraphicsDigital', $entry->includes_graphics_digital),
            'includes_graphics_print' => (bool) Arr::get($payload, 'includesGraphicsPrint', $entry->includes_graphics_print),
            'includes_signage' => (bool) Arr::get($payload, 'includesSignage', $entry->includes_signage),
            'payload' => $payload,
        ]);

        return redirect()->route('admin.forms.entries.entry.show', [
            'formSlug' => $formSlug,
            'entry' => $entry->id,
        ]);
    }

    public function adminFormEntryDestroy(string $formSlug, WorkRequestEntry $entry): RedirectResponse
    {
        $form = $this->findForm($formSlug);
        abort_if($form === null, 404);
        $this->assertEntryBelongsToForm($entry, $formSlug);

        $entry->delete();

        return redirect()->route('admin.forms.entries.show', [
            'formSlug' => $formSlug,
        ]);
    }

    /**
     * @return array<int, string>
     */
    private function requestTypes(WorkRequestEntry $entry): array
    {
        $types = [];

        if ($entry->includes_dates_venue) {
            $types[] = 'Event logistics';
        }

        if ($entry->includes_registration) {
            $types[] = 'Registration form';
        }

        if ($entry->includes_graphics_digital) {
            $types[] = 'Digital media';
        }

        if ($entry->includes_graphics_print) {
            $types[] = 'Print media';
        }

        if ($entry->includes_signage) {
            $types[] = 'Signage';
        }

        if (count($types) === 0) {
            if ($entry->form_slug === 'easter-holidays') {
                $types[] = 'Easter service times';
            }

            if ($entry->form_slug === 'christmas-holidays') {
                $types[] = 'Christmas service times';
            }
        }

        return $types;
    }

    /**
     * @return array<int, array{slug: string, title: string, description: string, url: string}>
     */
    private function formsConfig(): array
    {
        $forms = WorkForm::query()
            ->orderBy('id')
            ->get()
            ->map(function (WorkForm $form): array {
                return [
                    'slug' => $form->slug,
                    'title' => $form->title,
                    'description' => $form->description ?? '',
                    'url' => $form->url,
                ];
            })
            ->all();

        if (count($forms) > 0) {
            return $forms;
        }

        $forms = config('workforms.forms', []);

        return is_array($forms) ? $forms : [];
    }

    /**
     * @return array{slug: string, title: string, description: string, url: string}|null
     */
    private function findForm(string $slug): ?array
    {
        return collect($this->formsConfig())
            ->first(fn (array $form): bool => ($form['slug'] ?? null) === $slug);
    }

    /**
     * @param  array{slug?: string, title?: string, description?: string, url?: string}|null  $form
     */
    private function sendSubmissionNotifications(
        WorkRequestEntry $entry,
        ?array $form = null,
    ): void {
        $templateService = app(WorkFormEmailTemplateService::class);
        $workForm = WorkForm::query()
            ->where('slug', $entry->form_slug)
            ->first();

        if ($workForm) {
            $templates = $workForm->emailTemplates()
                ->where('is_active', true)
                ->orderBy('position')
                ->orderBy('id')
                ->get();

            if ($templates->isNotEmpty()) {
                foreach ($templates as $template) {
                    $this->sendTemplateNotification(
                        $template,
                        $entry,
                        $form,
                        $templateService,
                    );
                }

                return;
            }
        }

        $recipients = config('workforms.notification_recipients', []);
        if (! is_array($recipients) || count($recipients) === 0) {
            return;
        }

        foreach ($recipients as $recipient) {
            if (! is_array($recipient)) {
                continue;
            }

            $email = strtolower(trim((string) ($recipient['email'] ?? '')));
            if ($email === '') {
                continue;
            }

            $name = trim((string) ($recipient['name'] ?? ''));

            try {
                $recipientAddress = $name !== ''
                    ? new Address($email, $name)
                    : new Address($email);

                Mail::to($recipientAddress)->queue(
                    (new WorkFormSubmissionNotificationMail($entry, $form))
                        ->onConnection($this->mailQueueConnection()),
                );
            } catch (Throwable $exception) {
                report($exception);
            }
        }
    }

    private function matchesDevBoardRoutingRule(WorkRequestEntry $entry): bool
    {
        return $entry->includes_dates_venue && $entry->includes_registration;
    }

    private function matchesDesignBoardRoutingRule(WorkRequestEntry $entry): bool
    {
        return $entry->includes_graphics
            || $entry->includes_graphics_digital
            || $entry->includes_graphics_print
            || $entry->includes_signage;
    }

    /**
     * Detect routing tags from template identity and Trello-recipient metadata.
     *
     * @return array<int, string>
     */
    private function inferTemplateRoutingTags(WorkFormEmailTemplate $template): array
    {
        $tags = [];
        $templateIdentity = strtolower(
            trim(sprintf('%s %s', (string) $template->name, (string) $template->subject)),
        );

        if (str_contains($templateIdentity, 'trello') && str_contains($templateIdentity, 'dev')) {
            $tags[] = 'dev';
        }

        if (str_contains($templateIdentity, 'trello') && str_contains($templateIdentity, 'design')) {
            $tags[] = 'design';
        }

        $recipientLists = [
            is_array($template->to_recipients) ? $template->to_recipients : [],
            is_array($template->cc_recipients) ? $template->cc_recipients : [],
            is_array($template->bcc_recipients) ? $template->bcc_recipients : [],
        ];

        foreach ($recipientLists as $recipientList) {
            foreach ($recipientList as $recipient) {
                if (! is_array($recipient)) {
                    continue;
                }

                $email = strtolower(trim((string) ($recipient['email'] ?? '')));
                if ($email === '' || ! str_contains($email, 'boards.trello.com')) {
                    continue;
                }

                $name = strtolower(trim((string) ($recipient['name'] ?? '')));
                $identity = trim($name.' '.$email);

                if (str_contains($identity, 'dev')) {
                    $tags[] = 'dev';
                }

                if (str_contains($identity, 'design')) {
                    $tags[] = 'design';
                }
            }
        }

        return array_values(array_unique($tags));
    }

    /**
     * @param  array{slug?: string, title?: string, description?: string, url?: string}|null  $form
     */
    private function sendTemplateNotification(
        WorkFormEmailTemplate $template,
        WorkRequestEntry $entry,
        ?array $form,
        WorkFormEmailTemplateService $templateService,
    ): void {
        if (! $this->shouldDispatchWorkRequestTemplate($template, $entry)) {
            return;
        }

        $templateTags = $this->inferTemplateRoutingTags($template);
        $toRecipients = $templateService->mergeRecipientsWithDefaults(
            is_array($template->to_recipients) ? $template->to_recipients : [],
            $template->use_default_recipients,
        );
        $toRecipients = $this->filterTemplateRecipientsForEntry(
            $toRecipients,
            $entry,
            $template,
            $templateTags,
        );

        if (count($toRecipients) === 0) {
            return;
        }

        $ccRecipients = $templateService->normalizeRecipientsArray(
            is_array($template->cc_recipients) ? $template->cc_recipients : [],
        );
        $ccRecipients = $this->filterTemplateRecipientsForEntry(
            $ccRecipients,
            $entry,
            $template,
            $templateTags,
        );
        $bccRecipients = $templateService->normalizeRecipientsArray(
            is_array($template->bcc_recipients) ? $template->bcc_recipients : [],
        );
        $bccRecipients = $this->filterTemplateRecipientsForEntry(
            $bccRecipients,
            $entry,
            $template,
            $templateTags,
        );

        $placeholderMap = $templateService->buildPlaceholderMap($entry, $form);
        $subject = $entry->form_slug === 'work-request'
            ? $templateService->workRequestAutoSubject($entry)
            : $templateService->renderWithPlaceholders($template->subject, $placeholderMap);
        $headingTemplate = (string) ($template->heading ?? '');
        $heading = $templateService->renderWithPlaceholders($headingTemplate, $placeholderMap);
        $body = $templateService->renderWithPlaceholders($template->body, $placeholderMap);
        $body = $this->appendWorkRequestRoutingSummaryForHumanRecipients(
            $body,
            $entry,
            $toRecipients,
            $ccRecipients,
            $bccRecipients,
        );

        try {
            $pendingMail = Mail::to($this->mapRecipientsToAddresses($toRecipients));

            if ($ccRecipients !== []) {
                $pendingMail->cc($this->mapRecipientsToAddresses($ccRecipients));
            }

            if ($bccRecipients !== []) {
                $pendingMail->bcc($this->mapRecipientsToAddresses($bccRecipients));
            }

            $pendingMail->queue((new WorkFormTemplateNotificationMail(
                $subject,
                $heading,
                $body,
            ))->onConnection($this->mailQueueConnection()));
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    private function mailQueueConnection(): string
    {
        $mailQueueConnection = trim((string) config('workforms.mail_queue_connection', 'background'));

        return $mailQueueConnection !== '' ? $mailQueueConnection : 'background';
    }

    /**
     * @param  array<int, array{email:string,name:string|null}>  $recipients
     * @param  array<int, string>  $templateTags
     * @return array<int, array{email:string,name:string|null}>
     */
    private function filterTemplateRecipientsForEntry(
        array $recipients,
        WorkRequestEntry $entry,
        WorkFormEmailTemplate $template,
        array $templateTags,
    ): array {
        if ($entry->form_slug !== 'work-request') {
            return $recipients;
        }

        $triggerEvent = strtolower(trim((string) $template->trigger_event));
        if ($triggerEvent === 'work_request_dev') {
            return $this->matchesDevBoardRoutingRule($entry) ? $recipients : [];
        }

        if ($triggerEvent === 'work_request_design') {
            return $this->matchesDesignBoardRoutingRule($entry) ? $recipients : [];
        }

        $devMatches = $this->matchesDevBoardRoutingRule($entry);
        $designMatches = $this->matchesDesignBoardRoutingRule($entry);
        $filteredRecipients = [];

        foreach ($recipients as $recipient) {
            $recipientTag = $this->inferRecipientRoutingTag($recipient, $templateTags);

            if ($recipientTag === 'blocked') {
                continue;
            }

            if ($recipientTag === 'dev' && ! $devMatches) {
                continue;
            }

            if ($recipientTag === 'design' && ! $designMatches) {
                continue;
            }

            $filteredRecipients[] = $recipient;
        }

        return $filteredRecipients;
    }

    /**
     * @param  array{email:string,name:string|null}  $recipient
     * @param  array<int, string>  $templateTags
     */
    private function inferRecipientRoutingTag(array $recipient, array $templateTags): string
    {
        $email = strtolower(trim((string) ($recipient['email'] ?? '')));
        $name = strtolower(trim((string) ($recipient['name'] ?? '')));
        $identity = trim($name.' '.$email);

        if (! str_contains($email, 'boards.trello.com')) {
            return 'always';
        }

        $strictDevEmails = $this->configuredRecipientEmails('workforms.trello_dev_recipient_emails');
        $strictDesignEmails = $this->configuredRecipientEmails('workforms.trello_design_recipient_emails');
        $strictRoutingEnabled = $strictDevEmails !== [] || $strictDesignEmails !== [];

        if ($strictRoutingEnabled) {
            if (in_array($email, $strictDevEmails, true)) {
                return 'dev';
            }

            if (in_array($email, $strictDesignEmails, true)) {
                return 'design';
            }

            return 'blocked';
        }

        if (str_contains($identity, 'dev')) {
            return 'dev';
        }

        if (str_contains($identity, 'design')) {
            return 'design';
        }

        $hasDevTag = in_array('dev', $templateTags, true);
        $hasDesignTag = in_array('design', $templateTags, true);

        if ($hasDevTag && ! $hasDesignTag) {
            return 'dev';
        }

        if ($hasDesignTag && ! $hasDevTag) {
            return 'design';
        }

        return 'always';
    }

    /**
     * @param  array<int, array{email:string,name:string|null}>  $toRecipients
     * @param  array<int, array{email:string,name:string|null}>  $ccRecipients
     * @param  array<int, array{email:string,name:string|null}>  $bccRecipients
     */
    private function appendWorkRequestRoutingSummaryForHumanRecipients(
        string $body,
        WorkRequestEntry $entry,
        array $toRecipients,
        array $ccRecipients,
        array $bccRecipients,
    ): string {
        if ($entry->form_slug !== 'work-request') {
            return $body;
        }

        $allRecipients = array_merge($toRecipients, $ccRecipients, $bccRecipients);
        if (! $this->hasNonTrelloRecipient($allRecipients)) {
            return $body;
        }

        $routeDev = $this->matchesDevBoardRoutingRule($entry);
        $routeDesign = $this->matchesDesignBoardRoutingRule($entry);
        $targets = [];
        if ($routeDev) {
            $targets[] = 'JG Dev Board';
        }
        if ($routeDesign) {
            $targets[] = 'JG Design Board';
        }

        $targetText = $targets === [] ? 'None' : implode(', ', $targets);
        $hasHtml = preg_match('/<[^>]+>/', $body) === 1;

        if ($hasHtml) {
            $summary = '<hr><p><strong>Routing Summary</strong></p><ul>'
                .'<li><strong>Dev board:</strong> '.($routeDev ? 'Yes' : 'No').'</li>'
                .'<li><strong>Design board:</strong> '.($routeDesign ? 'Yes' : 'No').'</li>'
                .'<li><strong>Targets:</strong> '.$targetText.'</li>'
                .'</ul>';

            return rtrim($body).$summary;
        }

        $summary = "\n\nRouting Summary\n"
            .'Dev board: '.($routeDev ? 'Yes' : 'No')."\n"
            .'Design board: '.($routeDesign ? 'Yes' : 'No')."\n"
            .'Targets: '.$targetText;

        return rtrim($body).$summary;
    }

    /**
     * @param  array<int, array{email:string,name:string|null}>  $recipients
     */
    private function hasNonTrelloRecipient(array $recipients): bool
    {
        foreach ($recipients as $recipient) {
            $email = strtolower(trim((string) ($recipient['email'] ?? '')));
            if ($email === '') {
                continue;
            }

            if (! str_contains($email, 'boards.trello.com')) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<int, string>
     */
    private function configuredRecipientEmails(string $configKey): array
    {
        $configured = config($configKey, []);
        if (! is_array($configured)) {
            return [];
        }

        $emails = [];
        foreach ($configured as $value) {
            if (! is_string($value)) {
                continue;
            }

            $email = strtolower(trim($value));
            if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                continue;
            }

            $emails[$email] = $email;
        }

        return array_values($emails);
    }

    private function shouldDispatchWorkRequestTemplate(
        WorkFormEmailTemplate $template,
        WorkRequestEntry $entry,
    ): bool {
        if ($entry->form_slug !== 'work-request') {
            return true;
        }

        $templateIdentity = strtolower(trim((string) $template->name));
        $templateIdentity = preg_replace('/\s+/', ' ', $templateIdentity) ?? $templateIdentity;

        if ($templateIdentity === '') {
            return true;
        }

        if (str_contains($templateIdentity, 'hanri') && str_contains($templateIdentity, 'milo')) {
            return true;
        }

        if (str_contains($templateIdentity, 'trello') && str_contains($templateIdentity, 'dev')) {
            return $this->matchesDevBoardRoutingRule($entry);
        }

        if (str_contains($templateIdentity, 'trello') && str_contains($templateIdentity, 'design')) {
            return $this->matchesDesignBoardRoutingRule($entry);
        }

        $hasEventOrRegistration = $entry->includes_dates_venue || $entry->includes_registration;
        $hasDigital = $entry->includes_graphics_digital;
        $hasPrint = $entry->includes_graphics_print;
        $hasSignage = $entry->includes_signage;

        $isDigitalPrintOnly = ! $hasEventOrRegistration && $hasDigital && $hasPrint && ! $hasSignage;
        $isDigitalOnly = ! $hasEventOrRegistration && $hasDigital && ! $hasPrint && ! $hasSignage;
        $isPrintOnly = ! $hasEventOrRegistration && ! $hasDigital && $hasPrint && ! $hasSignage;
        $isSignageOnly = ! $hasEventOrRegistration && ! $hasDigital && ! $hasPrint && $hasSignage;

        if ($this->isGraphicsDigitalPrintTemplate($templateIdentity)) {
            return $isDigitalPrintOnly;
        }

        if ($this->isGraphicsDigitalTemplate($templateIdentity)) {
            return $isDigitalOnly;
        }

        if ($this->isGraphicsPrintTemplate($templateIdentity)) {
            return $isPrintOnly;
        }

        if ($this->isSignageTemplate($templateIdentity)) {
            return $isSignageOnly;
        }

        return true;
    }

    private function isGraphicsDigitalPrintTemplate(string $templateIdentity): bool
    {
        if (! str_contains($templateIdentity, 'graphics')) {
            return false;
        }

        return str_contains($templateIdentity, 'digital + print')
            || str_contains($templateIdentity, 'digital+print')
            || (str_contains($templateIdentity, 'digital') && str_contains($templateIdentity, 'print'));
    }

    private function isGraphicsDigitalTemplate(string $templateIdentity): bool
    {
        if ($this->isGraphicsDigitalPrintTemplate($templateIdentity)) {
            return false;
        }

        return str_contains($templateIdentity, 'graphics-digital')
            || str_contains($templateIdentity, 'graphics digital')
            || str_contains($templateIdentity, 'graphics - digital')
            || str_contains($templateIdentity, 'digital media');
    }

    private function isGraphicsPrintTemplate(string $templateIdentity): bool
    {
        if ($this->isGraphicsDigitalPrintTemplate($templateIdentity)) {
            return false;
        }

        return str_contains($templateIdentity, 'graphics-print')
            || str_contains($templateIdentity, 'graphics print')
            || str_contains($templateIdentity, 'graphics - print')
            || str_contains($templateIdentity, 'print media');
    }

    private function isSignageTemplate(string $templateIdentity): bool
    {
        return $templateIdentity === 'signage' || str_starts_with($templateIdentity, 'signage');
    }

    /**
     * @param  array<int, array{email:string,name:string|null}>  $recipients
     * @return array<int, Address>
     */
    private function mapRecipientsToAddresses(array $recipients): array
    {
        return collect($recipients)
            ->map(static function (array $recipient): Address {
                $name = trim((string) ($recipient['name'] ?? ''));
                $email = trim((string) ($recipient['email'] ?? ''));

                if ($name !== '') {
                    return new Address($email, $name);
                }

                return new Address($email);
            })
            ->values()
            ->all();
    }

    private function isAdmin(Request $request): bool
    {
        $user = $request->user();

        return $user?->can('forms.admin.access') ?? false;
    }

    private function assertEntryBelongsToForm(WorkRequestEntry $entry, string $formSlug): void
    {
        abort_unless($entry->form_slug === $formSlug, 404);
    }

    /**
     * @return array{id:int,formSlug:string,createdAt:string|null,firstName:string|null,lastName:string|null,email:string|null,eventName:string|null,requestTypes:array<int,string>,canManage:bool,sourceEntryCount:int}
     */
    private function entrySummary(WorkRequestEntry $entry): array
    {
        return [
            'id' => $entry->id,
            'formSlug' => $entry->form_slug,
            'createdAt' => $entry->created_at?->toIso8601String(),
            'firstName' => $entry->first_name,
            'lastName' => $entry->last_name,
            'email' => $entry->email,
            'eventName' => $entry->event_name,
            'requestTypes' => $this->requestTypes($entry),
            'canManage' => true,
            'sourceEntryCount' => 1,
        ];
    }

    /**
     * @return array{id:int,formSlug:string,createdAt:string|null,updatedAt:string|null,firstName:string|null,lastName:string|null,email:string|null,cellphone:string|null,congregation:string|null,eventName:string|null,requestTypes:array<int,string>,payload:array<string,mixed>|null,payloadJson:string}
     */
    private function entryDetail(WorkRequestEntry $entry): array
    {
        $payload = $entry->payload;

        return [
            'id' => $entry->id,
            'formSlug' => $entry->form_slug,
            'createdAt' => $entry->created_at?->toIso8601String(),
            'updatedAt' => $entry->updated_at?->toIso8601String(),
            'firstName' => $entry->first_name,
            'lastName' => $entry->last_name,
            'email' => $entry->email,
            'cellphone' => $entry->cellphone,
            'congregation' => $entry->congregation,
            'eventName' => $entry->event_name,
            'requestTypes' => $this->requestTypes($entry),
            'payload' => is_array($payload) ? $payload : null,
            'payloadJson' => json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: '{}',
        ];
    }
}
