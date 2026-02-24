<?php

namespace App\Services;

use App\Models\WorkForm;
use App\Models\WorkRequestEntry;

class WorkFormEmailTemplateService
{
    /**
     * @param  array<int, mixed>|null  $rawRecipients
     * @return array<int, array{email:string,name:string|null}>
     */
    public function normalizeRecipientsArray(?array $rawRecipients): array
    {
        $normalized = [];

        foreach ($rawRecipients ?? [] as $recipient) {
            if (! is_array($recipient)) {
                continue;
            }

            $email = strtolower(trim((string) ($recipient['email'] ?? '')));
            if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                continue;
            }

            $name = trim((string) ($recipient['name'] ?? ''));

            $normalized[$email] = [
                'email' => $email,
                'name' => $name !== '' ? $name : null,
            ];
        }

        return array_values($normalized);
    }

    /**
     * @return array<int, array{email:string,name:string|null}>
     */
    public function parseRecipientsString(string $rawRecipients): array
    {
        $chunks = array_filter(array_map(
            static fn (string $part): string => trim($part),
            explode(';', $rawRecipients),
        ));

        $parsedRecipients = [];

        foreach ($chunks as $chunk) {
            $name = null;
            $email = $chunk;

            if (preg_match('/^\s*"?(?<name>[^"<]+?)"?\s*<(?<email>[^>]+)>\s*$/', $chunk, $matches) === 1) {
                $nameCandidate = trim((string) ($matches['name'] ?? ''));
                $name = $nameCandidate !== '' ? $nameCandidate : null;
                $email = trim((string) ($matches['email'] ?? ''));
            }

            $email = strtolower(trim($email));
            if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                continue;
            }

            $parsedRecipients[] = [
                'email' => $email,
                'name' => $name,
            ];
        }

        return $this->normalizeRecipientsArray($parsedRecipients);
    }

    /**
     * @return array<int, array{email:string,name:string|null}>
     */
    public function defaultRecipients(): array
    {
        $configuredRecipients = config('workforms.notification_recipients', []);

        return is_array($configuredRecipients)
            ? $this->normalizeRecipientsArray($configuredRecipients)
            : [];
    }

    /**
     * @param  array<int, array{email:string,name:string|null}>  $templateRecipients
     * @return array<int, array{email:string,name:string|null}>
     */
    public function mergeRecipientsWithDefaults(
        array $templateRecipients,
        bool $useDefaultRecipients,
    ): array {
        if (! $useDefaultRecipients) {
            return $this->normalizeRecipientsArray($templateRecipients);
        }

        return $this->normalizeRecipientsArray(array_merge(
            $this->defaultRecipients(),
            $templateRecipients,
        ));
    }

    /**
     * @param  array{slug?:string,title?:string,url?:string}|null  $form
     * @return array<string, string>
     */
    public function buildPlaceholderMap(
        WorkRequestEntry $entry,
        ?array $form = null,
    ): array {
        $payload = is_array($entry->payload) ? $entry->payload : [];
        $payload = $this->normalizeEventDatePlaceholders($payload);
        $payload = $this->normalizeEventReachPlaceholders($payload);
        $placeholderMap = [
            'form.slug' => (string) ($form['slug'] ?? $entry->form_slug),
            'form.title' => (string) ($form['title'] ?? ''),
            'form.url' => (string) ($form['url'] ?? ''),
            'entry.id' => (string) $entry->id,
            'entry.form_slug' => (string) $entry->form_slug,
            'entry.first_name' => (string) ($entry->first_name ?? ''),
            'entry.last_name' => (string) ($entry->last_name ?? ''),
            'entry.email' => (string) ($entry->email ?? ''),
            'entry.cellphone' => (string) ($entry->cellphone ?? ''),
            'entry.congregation' => (string) ($entry->congregation ?? ''),
            'entry.event_name' => (string) ($entry->event_name ?? ''),
            'entry.created_at' => (string) ($entry->created_at?->toDateTimeString() ?? ''),
            'entry.updated_at' => (string) ($entry->updated_at?->toDateTimeString() ?? ''),
            'entry.request_types' => implode(', ', $this->requestTypes($entry)),
        ];

        if (($form['slug'] ?? $entry->form_slug) === 'work-request') {
            $placeholderMap['entry.auto_subject'] = $this->workRequestAutoSubject($entry);
            $placeholderMap = array_merge(
                $placeholderMap,
                $this->workRequestBoardRoutingPlaceholders($entry),
            );
        }

        foreach ($this->flattenPayload($payload, 'payload') as $key => $value) {
            $placeholderMap[$key] = $value;
        }

        if (($form['slug'] ?? $entry->form_slug) === 'work-request') {
            $placeholderMap = array_merge(
                $placeholderMap,
                $this->buildWorkRequestAllFieldsPlaceholderMap($payload),
            );
        }

        return $placeholderMap;
    }

    /**
     * @return array<int, array{key:string,sample:string}>
     */
    public function availablePlaceholdersForForm(WorkForm $form): array
    {
        $placeholders = [
            ['key' => 'form.slug', 'sample' => $form->slug],
            ['key' => 'form.title', 'sample' => $form->title],
            ['key' => 'form.url', 'sample' => $form->url],
            ['key' => 'entry.id', 'sample' => '123'],
            ['key' => 'entry.form_slug', 'sample' => $form->slug],
            ['key' => 'entry.first_name', 'sample' => 'Jane'],
            ['key' => 'entry.last_name', 'sample' => 'Doe'],
            ['key' => 'entry.email', 'sample' => 'jane@example.com'],
            ['key' => 'entry.cellphone', 'sample' => '+27820000000'],
            ['key' => 'entry.congregation', 'sample' => 'City Bowl AM'],
            ['key' => 'entry.event_name', 'sample' => 'Sunday Service'],
            ['key' => 'entry.created_at', 'sample' => now()->toDateTimeString()],
            ['key' => 'entry.request_types', 'sample' => 'Event logistics, Digital media'],
            ['key' => 'entry.auto_subject', 'sample' => 'Youth Night - Congregations - '.now()->toDateString()],
        ];

        if ($form->slug === 'work-request') {
            $placeholders = array_merge(
                $placeholders,
                $this->workRequestBoardRoutingPlaceholderSamples(),
                $this->workRequestSchemaPlaceholders(),
            );
        }

        $entries = WorkRequestEntry::query()
            ->where('form_slug', $form->slug)
            ->latest()
            ->limit(50)
            ->get();

        $payloadPlaceholders = [];

        foreach ($entries as $entry) {
            if (! is_array($entry->payload)) {
                continue;
            }

            foreach ($this->flattenPayload($entry->payload, 'payload') as $key => $value) {
                if (array_key_exists($key, $payloadPlaceholders)) {
                    continue;
                }

                $payloadPlaceholders[$key] = [
                    'key' => $key,
                    'sample' => $value,
                ];
            }
        }

        $placeholders = array_merge($placeholders, array_values($payloadPlaceholders));

        usort($placeholders, static fn (array $a, array $b): int => strcmp($a['key'], $b['key']));

        $uniquePlaceholders = [];
        foreach ($placeholders as $placeholder) {
            $uniquePlaceholders[$placeholder['key']] = $placeholder;
        }

        return array_values($uniquePlaceholders);
    }

    /**
     * @return array<int, array{key:string,sample:string}>
     */
    private function workRequestSchemaPlaceholders(): array
    {
        $keys = [
            'includesDatesVenue',
            'includesRegistration',
            'includesGraphics',
            'includesGraphicsDigital',
            'includesGraphicsPrint',
            'includesSignage',
            'allFields.contact',
            'allFields.event',
            'allFields.registration',
            'allFields.graphicsDigital',
            'allFields.graphicsPrint',
            'allFields.signage',
            'firstName',
            'lastName',
            'cellphone',
            'email',
            'roleInChurch',
            'otherRole',
            'congregation',
            'theme',
            'eventName',
            'isUserOrganiser',
            'organiserFirstName',
            'organiserLastName',
            'organiserEmail',
            'organiserCell',
            'eventDuration',
            'eventStartDate',
            'eventEndDate',
            'eventDates.0.date',
            'eventDates.0.startTime',
            'eventDates.0.endTime',
            'announcementDate',
            'venueType',
            'jgVenue',
            'otherVenueName',
            'otherVenueAddress',
            'eventReach',
            'hubs.0',
            'eventCongregations.0',
            'outreachCampStartDate',
            'outreachCampStartTime',
            'outreachCampEndDate',
            'outreachCampEndTime',
            'childMinding',
            'childMindingDescription',
            'quicketDescription',
            'ticketCurrency',
            'ticketPriceIncludesFee',
            'ticketTypes.adults18Plus',
            'ticketTypes.adults13Plus',
            'ticketTypes.children4to12',
            'ticketTypes.children0to3',
            'ticketTypes.other',
            'ticketPrices.adults18Plus',
            'ticketPrices.adults13Plus',
            'ticketPrices.children4to12',
            'ticketPrices.children0to3',
            'ticketQuantities.adults18Plus',
            'ticketQuantities.adults13Plus',
            'ticketQuantities.children4to12',
            'ticketQuantities.children0to3',
            'otherTickets.0.name',
            'otherTickets.0.price',
            'otherTickets.0.quantity',
            'infoToCollect.name',
            'infoToCollect.lastName',
            'infoToCollect.email',
            'infoToCollect.cellphone',
            'infoToCollect.congregation',
            'infoToCollect.functionInChurch',
            'infoToCollect.allergies',
            'infoToCollect.other',
            'otherInfoFields.0',
            'allowDonations',
            'registrationClosingDate',
            'graphicsWhatsApp',
            'graphicsInstagram',
            'graphicsAVSlide',
            'graphicsOther',
            'digitalGraphicType',
            'digitalBankName',
            'digitalBranchCode',
            'digitalAccountNumber',
            'digitalReference',
            'digitalOtherGraphicDescription',
            'digitalFormatWhatsapp',
            'digitalFormatAVSlide',
            'digitalFormatOther',
            'digitalOtherFormatDescription',
            'signageScope',
            'signageHubs.0',
            'signageCongregations.0',
            'sharkfinJgBranded',
            'sharkfinJgBrandedQty',
            'sharkfinJgKidsBranded',
            'sharkfinJgKidsBrandedQty',
            'temporaryFenceStandard2x1',
            'temporaryFenceStandard2x1Qty',
            'temporaryFenceCustom3x1',
            'temporaryFenceCustom3x1Qty',
            'temporaryFenceCustom4x1',
            'temporaryFenceCustom4x1Qty',
            'temporaryFenceCustom5x1',
            'temporaryFenceCustom5x1Qty',
            'toiletsArrowsMaleWord',
            'toiletsArrowsMaleWordUpQty',
            'toiletsArrowsMaleWordDownQty',
            'toiletsArrowsMaleWordLeftQty',
            'toiletsArrowsMaleWordRightQty',
            'toiletsArrowsFemaleWord',
            'toiletsArrowsFemaleWordUpQty',
            'toiletsArrowsFemaleWordDownQty',
            'toiletsArrowsFemaleWordLeftQty',
            'toiletsArrowsFemaleWordRightQty',
            'toiletsArrowsMaleFemaleWord',
            'toiletsArrowsMaleFemaleWordUpQty',
            'toiletsArrowsMaleFemaleWordDownQty',
            'toiletsArrowsMaleFemaleWordLeftQty',
            'toiletsArrowsMaleFemaleWordRightQty',
            'toiletsMaleFemale',
            'toiletsMaleFemaleQty',
            'toiletsMale',
            'toiletsMaleQty',
            'toiletsFemale',
            'toiletsFemaleQty',
            'momsNursing',
            'momsNursingQty',
            'momsNursingWithArrows',
            'momsNursingWithArrowsUpQty',
            'momsNursingWithArrowsDownQty',
            'momsNursingWithArrowsLeftQty',
            'momsNursingWithArrowsRightQty',
            'momsWithBabies',
            'momsWithBabiesQty',
            'momsWithBabiesWithArrows',
            'momsWithBabiesWithArrowsUpQty',
            'momsWithBabiesWithArrowsDownQty',
            'momsWithBabiesWithArrowsLeftQty',
            'momsWithBabiesWithArrowsRightQty',
            'toddlersRoom',
            'toddlersRoomQty',
            'toddlersArrows',
            'toddlersArrowsUpQty',
            'toddlersArrowsDownQty',
            'toddlersArrowsLeftQty',
            'toddlersArrowsRightQty',
            'firstAidSign',
            'firstAidSignQty',
            'firstAidSignWithArrows',
            'firstAidSignWithArrowsUpQty',
            'firstAidSignWithArrowsDownQty',
            'firstAidSignWithArrowsLeftQty',
            'firstAidSignWithArrowsRightQty',
            'internalOther',
            'internalOtherDescription',
            'internalOtherQty',
            'externalNoParking',
            'externalNoParkingQty',
            'externalDisabledParking',
            'externalDisabledParkingQty',
            'externalAmbulanceBay',
            'externalAmbulanceBayQty',
            'externalEntrance',
            'externalEntranceQty',
            'externalExit',
            'externalExitQty',
            'externalJoshGenArrows',
            'externalJoshGenArrowUpQty',
            'externalJoshGenArrowDownQty',
            'externalJoshGenArrowLeftQty',
            'externalJoshGenArrowRightQty',
            'sandwichBoards',
            'sandwichBoardsDescription',
            'sandwichBoardsQty',
            'permanentExternalBuildingSigns',
            'permanentExternalBuildingSignsDescription',
            'permanentExternalBuildingSignsQty',
            'otherSignage',
            'otherSignageDescription',
            'otherSignageQty',
            'printScope',
            'printHubs.0',
            'printCongregations.0',
            'printTypes.0',
            'printOther',
            'printOtherQty',
            'printA5Qty',
            'printA6Qty',
            'printA3Qty',
            'printA4Qty',
            'printCardsQty',
            'printCoffeeCupSleevesQty',
            'printVisitorCoffeeVoucherCardQty',
            'termsAccepted',
        ];

        return array_map(function (string $key): array {
            $sample = match ($key) {
                'firstName' => 'Jane',
                'lastName' => 'Doe',
                'email', 'organiserEmail' => 'jane@example.com',
                'cellphone', 'organiserCell' => '+27820000000',
                'eventName' => 'Youth Night',
                'allFields.contact' => '<strong>firstName</strong>: Jane<br><strong>lastName</strong>: Doe<br><strong>email</strong>: jane@example.com',
                'allFields.event' => '<strong>eventName</strong>: Youth Night<br><strong>eventReach</strong>: Congregations',
                'allFields.registration' => '<strong>includesRegistration</strong>: Yes<br><strong>ticketCurrency</strong>: ZAR',
                'allFields.graphicsDigital' => '<strong>includesGraphicsDigital</strong>: Yes<br><strong>digitalGraphicType</strong>: Event branding',
                'allFields.graphicsPrint' => '<strong>includesGraphicsPrint</strong>: Yes<br><strong>printScope</strong>: Hubs',
                'allFields.signage' => '<strong>includesSignage</strong>: Yes<br><strong>signageScope</strong>: Congregations',
                'eventDates.0.date' => now()->toDateString(),
                'eventDates.0.startTime' => '18:00',
                'eventDates.0.endTime' => '20:00',
                'outreachCampStartDate' => now()->toDateString(),
                'outreachCampStartTime' => '18:00',
                'outreachCampEndDate' => now()->addDay()->toDateString(),
                'outreachCampEndTime' => '16:00',
                'congregation', 'signageCongregations.0', 'printCongregations.0' => 'City Bowl AM',
                'eventCongregations.0' => 'City Bowl AM',
                'hubs.0', 'signageHubs.0', 'printHubs.0' => 'Cape Town',
                'ticketCurrency' => 'ZAR',
                default => '',
            };

            return [
                'key' => 'payload.'.$key,
                'sample' => $sample,
            ];
        }, $keys);
    }

    /**
     * @return array<int, array{key:string,sample:string}>
     */
    private function workRequestBoardRoutingPlaceholderSamples(): array
    {
        return [
            [
                'key' => 'entry.route_dev_board',
                'sample' => 'Yes',
            ],
            [
                'key' => 'entry.route_design_board',
                'sample' => 'Yes',
            ],
            [
                'key' => 'entry.route_targets',
                'sample' => 'JG Dev Board, JG Design Board',
            ],
            [
                'key' => 'entry.route_message',
                'sample' => 'This request is being routed to the JG Dev Board and JG Design Board.',
            ],
            [
                'key' => 'entry.route_instruction',
                'sample' => 'JG Dev and Design Trello Boards',
            ],
        ];
    }

    /**
     * @param  array<string, string>  $placeholderMap
     */
    public function renderWithPlaceholders(
        string $value,
        array $placeholderMap,
    ): string {
        $renderedValue = $value;

        foreach ($placeholderMap as $placeholderKey => $placeholderValue) {
            $renderedValue = str_replace(
                '{{'.$placeholderKey.'}}',
                $placeholderValue,
                $renderedValue,
            );
        }

        return $renderedValue;
    }

    public function workRequestAutoSubject(WorkRequestEntry $entry): string
    {
        $payload = is_array($entry->payload) ? $entry->payload : [];
        $payload = $this->normalizeEventDatePlaceholders($payload);
        $payload = $this->normalizeEventReachPlaceholders($payload);

        $submittedDate = $this->formatDateForSouthAfricaSubject(
            (string) ($entry->created_at?->toDateString() ?? now()->toDateString()),
        );
        $congregation = trim((string) ($payload['congregation'] ?? $entry->congregation ?? ''));
        $congregation = $congregation !== '' ? $congregation : 'Unknown Congregation';

        if ($entry->includes_dates_venue) {
            $eventName = trim((string) ($payload['eventName'] ?? $entry->event_name ?? ''));
            $eventName = $eventName !== '' ? $eventName : 'Event Request';

            $eventReach = trim((string) ($payload['eventReach'] ?? ''));
            $eventReach = $eventReach !== '' ? $eventReach : $congregation;

            $eventStartDateRaw = trim((string) ($payload['eventStartDate'] ?? ''));
            $eventStartDate = str_contains($eventStartDateRaw, 'T')
                ? (string) explode('T', $eventStartDateRaw, 2)[0]
                : $eventStartDateRaw;
            $eventStartDate = $eventStartDate !== '' ? $eventStartDate : $submittedDate;
            $eventStartDate = $this->formatDateForSouthAfricaSubject($eventStartDate);

            return sprintf(
                '%s - %s - %s',
                $eventName,
                $eventReach,
                $eventStartDate,
            );
        }

        $hasDigital = $entry->includes_graphics_digital;
        $hasPrint = $entry->includes_graphics_print;
        $hasSignage = $entry->includes_signage;

        $label = match (true) {
            $hasDigital && $hasPrint && ! $hasSignage => 'Graphics',
            $hasDigital && ! $hasPrint && ! $hasSignage => 'Digital Media',
            ! $hasDigital && $hasPrint && ! $hasSignage => 'Print Media',
            ! $hasDigital && ! $hasPrint && $hasSignage => 'Signage',
            $hasSignage && ($hasDigital || $hasPrint) => 'Graphics & Signage',
            $entry->includes_registration => 'Registration Request',
            default => 'Work Request',
        };

        return sprintf('%s - %s - %s', $label, $congregation, $submittedDate);
    }

    private function formatDateForSouthAfricaSubject(string $rawDate): string
    {
        $date = trim($rawDate);
        if ($date === '') {
            return $date;
        }

        $normalizedDate = str_contains($date, 'T')
            ? (string) explode('T', $date, 2)[0]
            : $date;

        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $normalizedDate, $matches) !== 1) {
            return $rawDate;
        }

        return $matches[3].'-'.$matches[2].'-'.$matches[1];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, string>
     */
    private function flattenPayload(array $payload, string $prefix): array
    {
        $flattenedPayload = [];

        foreach ($payload as $key => $value) {
            $currentKey = $prefix.'.'.$key;

            if (is_array($value)) {
                if ($value === []) {
                    $flattenedPayload[$currentKey] = '';

                    continue;
                }

                foreach ($this->flattenPayload($value, $currentKey) as $nestedKey => $nestedValue) {
                    $flattenedPayload[$nestedKey] = $nestedValue;
                }

                continue;
            }

            if (is_bool($value)) {
                $flattenedPayload[$currentKey] = $value ? 'true' : 'false';

                continue;
            }

            if (is_scalar($value) || $value === null) {
                $flattenedPayload[$currentKey] = trim((string) $value);
            }
        }

        return $flattenedPayload;
    }

    /**
     * @return array<string, string>
     */
    private function workRequestBoardRoutingPlaceholders(WorkRequestEntry $entry): array
    {
        $routeDev = $entry->includes_dates_venue && $entry->includes_registration;
        $routeDesign = $entry->includes_graphics
            || $entry->includes_graphics_digital
            || $entry->includes_graphics_print
            || $entry->includes_signage;

        $targets = [];
        if ($routeDev) {
            $targets[] = 'JG Dev Board';
        }
        if ($routeDesign) {
            $targets[] = 'JG Design Board';
        }

        $routeMessage = match (count($targets)) {
            2 => 'This request is being routed to the JG Dev Board and JG Design Board.',
            1 => 'This request is being routed to the '.$targets[0].'.',
            default => 'This request is not being routed to a Trello board.',
        };
        $routeInstruction = match (count($targets)) {
            2 => 'JG Dev and Design Trello Boards',
            1 => $routeDev ? 'JG Dev Trello Board' : 'JG Design Trello Board',
            default => 'No Trello board',
        };

        return [
            'entry.route_dev_board' => $routeDev ? 'Yes' : 'No',
            'entry.route_design_board' => $routeDesign ? 'Yes' : 'No',
            'entry.route_targets' => implode(', ', $targets),
            'entry.route_message' => $routeMessage,
            'entry.route_instruction' => $routeInstruction,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, string>
     */
    private function buildWorkRequestAllFieldsPlaceholderMap(array $payload): array
    {
        $stepRules = $this->workRequestAllFieldStepRules();
        $flattenedPayload = $this->flattenPayload($payload, 'payload');
        $allFieldMap = [];

        foreach ($stepRules as $stepKey => $rule) {
            $lines = [];

            foreach ($flattenedPayload as $flatKey => $flatValue) {
                if (! str_starts_with($flatKey, 'payload.')) {
                    continue;
                }

                $payloadKey = substr($flatKey, 8);
                if ($payloadKey === false || $payloadKey === '') {
                    continue;
                }

                if (! $this->payloadKeyMatchesStepRule($payloadKey, $rule)) {
                    continue;
                }

                if (! $this->isMeaningfulAllFieldsValue($flatValue)) {
                    continue;
                }

                $lines[] = sprintf(
                    '<strong>%s</strong>: %s',
                    $this->escapeHtml($payloadKey),
                    $this->escapeHtml($this->presentAllFieldsValue($flatValue)),
                );
            }

            $allFieldMap['payload.allFields.'.$stepKey] = implode('<br>', $lines);
        }

        return $allFieldMap;
    }

    /**
     * @return array<string, array{exact:array<int,string>, prefixes:array<int,string>}>
     */
    private function workRequestAllFieldStepRules(): array
    {
        return [
            'contact' => [
                'exact' => [
                    'firstName',
                    'lastName',
                    'cellphone',
                    'email',
                    'roleInChurch',
                    'otherRole',
                    'congregation',
                    'termsAccepted',
                ],
                'prefixes' => [],
            ],
            'event' => [
                'exact' => [
                    'includesDatesVenue',
                    'theme',
                    'eventName',
                    'isUserOrganiser',
                    'organiserFirstName',
                    'organiserLastName',
                    'organiserEmail',
                    'organiserCell',
                    'eventDuration',
                    'eventStartDate',
                    'eventEndDate',
                    'announcementDate',
                    'venueType',
                    'jgVenue',
                    'otherVenueName',
                    'otherVenueAddress',
                    'eventReach',
                    'outreachCampStartDate',
                    'outreachCampStartTime',
                    'outreachCampEndDate',
                    'outreachCampEndTime',
                    'childMinding',
                    'childMindingDescription',
                ],
                'prefixes' => [
                    'eventDates.',
                    'hubs.',
                    'eventCongregations.',
                ],
            ],
            'registration' => [
                'exact' => [
                    'includesRegistration',
                ],
                'prefixes' => [
                    'quicket',
                    'ticket',
                    'otherTickets.',
                    'infoToCollect.',
                    'otherInfoFields.',
                    'allowDonations',
                    'registrationClosingDate',
                ],
            ],
            'graphicsDigital' => [
                'exact' => [
                    'includesGraphics',
                    'includesGraphicsDigital',
                    'graphicsWhatsApp',
                    'graphicsInstagram',
                    'graphicsAVSlide',
                    'graphicsOther',
                    'digitalGraphicType',
                    'digitalBankName',
                    'digitalBranchCode',
                    'digitalAccountNumber',
                    'digitalReference',
                    'digitalOtherGraphicDescription',
                    'digitalFormatWhatsapp',
                    'digitalFormatAVSlide',
                    'digitalFormatOther',
                    'digitalOtherFormatDescription',
                ],
                'prefixes' => [],
            ],
            'graphicsPrint' => [
                'exact' => [
                    'includesGraphicsPrint',
                ],
                'prefixes' => [
                    'print',
                ],
            ],
            'signage' => [
                'exact' => [
                    'includesSignage',
                ],
                'prefixes' => [
                    'signage',
                    'sharkfin',
                    'temporaryFence',
                    'toilets',
                    'moms',
                    'toddlers',
                    'firstAid',
                    'internal',
                    'external',
                    'sandwichBoards',
                    'permanentExternal',
                    'otherSignage',
                ],
            ],
        ];
    }

    /**
     * @param  array{exact:array<int,string>, prefixes:array<int,string>}  $rule
     */
    private function payloadKeyMatchesStepRule(string $payloadKey, array $rule): bool
    {
        if (in_array($payloadKey, $rule['exact'], true)) {
            return true;
        }

        foreach ($rule['prefixes'] as $prefix) {
            if (str_starts_with($payloadKey, $prefix)) {
                return true;
            }
        }

        return false;
    }

    private function isMeaningfulAllFieldsValue(string $value): bool
    {
        $normalized = strtolower(trim($value));

        return $normalized !== '' && $normalized !== 'false';
    }

    private function presentAllFieldsValue(string $value): string
    {
        return match (strtolower(trim($value))) {
            'true' => 'Yes',
            'false' => 'No',
            default => $value,
        };
    }

    private function escapeHtml(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * Ensure commonly used event date placeholders are populated even when
     * multi-day event data is stored in eventDates[].
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function normalizeEventDatePlaceholders(array $payload): array
    {
        $eventStartDate = trim((string) ($payload['eventStartDate'] ?? ''));
        $eventEndDate = trim((string) ($payload['eventEndDate'] ?? ''));
        $eventDates = $payload['eventDates'] ?? null;

        if (! is_array($eventDates) || $eventDates === []) {
            return $payload;
        }

        $firstEventDate = is_array($eventDates[0] ?? null)
            ? trim((string) (($eventDates[0]['date'] ?? '') ?: ''))
            : '';
        $lastEventDateValue = $eventDates[array_key_last($eventDates)] ?? null;
        $lastEventDate = is_array($lastEventDateValue)
            ? trim((string) (($lastEventDateValue['date'] ?? '') ?: ''))
            : '';

        if ($eventStartDate === '' && $firstEventDate !== '') {
            $payload['eventStartDate'] = $firstEventDate;
        }

        if ($eventEndDate === '' && $lastEventDate !== '') {
            $payload['eventEndDate'] = $lastEventDate;
        }

        return $payload;
    }

    /**
     * Backward compatible mapping for event reach scopes.
     *
     * Older entries stored both hub and congregation selections in payload.hubs.
     * Ensure congregation selections are exposed via payload.eventCongregations.*
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function normalizeEventReachPlaceholders(array $payload): array
    {
        $eventReach = trim((string) ($payload['eventReach'] ?? ''));
        $hubs = $payload['hubs'] ?? null;
        $eventCongregations = $payload['eventCongregations'] ?? null;

        if ($eventReach === 'Congregations' && is_array($hubs)) {
            if (! is_array($eventCongregations) || $eventCongregations === []) {
                $payload['eventCongregations'] = $hubs;
            }
        }

        return $payload;
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

        if ($types === []) {
            if ($entry->form_slug === 'easter-holidays') {
                $types[] = 'Easter service times';
            }

            if ($entry->form_slug === 'christmas-holidays') {
                $types[] = 'Christmas service times';
            }
        }

        return $types;
    }
}
