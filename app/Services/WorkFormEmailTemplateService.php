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

        if (($form['slug'] ?? $entry->form_slug) === 'work-request') {
            $payload = array_merge($payload, $this->workRequestComputedPayload($payload));
        }

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
                $this->workRequestEventSummaryPlaceholders($payload),
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
                $this->workRequestEventSummaryPlaceholderSamples(),
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
            'ticketTypeSummary',
            'ticketPriceSummary',
            'ticketQuantitySummary',
            'ticketLineItems',
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
                'ticketTypeSummary' => 'Adults 18+, Children 4 to 12 and Student',
                'ticketPriceSummary' => 'Adults 18+: ZAR 120, Children 4 to 12: ZAR 60, Student: ZAR 80',
                'ticketQuantitySummary' => 'Adults 18+: 250, Children 4 to 12: 60, Student: 40',
                'ticketLineItems' => 'Adults 18+ (Price: ZAR 120, Qty: 250); Children 4 to 12 (Price: ZAR 60, Qty: 60); Student (Price: ZAR 80, Qty: 40)',
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
     * @return array<int, array{key:string,sample:string}>
     */
    private function workRequestEventSummaryPlaceholderSamples(): array
    {
        return [
            [
                'key' => 'entry.event_duration_summary',
                'sample' => '25-Feb 18:00-20:00; 26-Feb 09:00-12:00',
            ],
            [
                'key' => 'entry.event_reach_summary',
                'sample' => 'Cape Town, Durban and Pretoria',
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

        $day = '';
        $month = '';

        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $normalizedDate, $matches) === 1) {
            $month = $matches[2];
            $day = $matches[3];
        } elseif (preg_match('/^(\d{2})-(\d{2})-(\d{4})$/', $normalizedDate, $matches) === 1) {
            $day = $matches[1];
            $month = $matches[2];
        } else {
            return $rawDate;
        }

        $monthName = match ($month) {
            '01' => 'Jan',
            '02' => 'Feb',
            '03' => 'Mar',
            '04' => 'Apr',
            '05' => 'May',
            '06' => 'Jun',
            '07' => 'Jul',
            '08' => 'Aug',
            '09' => 'Sep',
            '10' => 'Oct',
            '11' => 'Nov',
            '12' => 'Dec',
            default => '',
        };

        if ($monthName === '') {
            return $rawDate;
        }

        return str_pad($day, 2, '0', STR_PAD_LEFT).'-'.$monthName;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, string>
     */
    private function workRequestEventSummaryPlaceholders(array $payload): array
    {
        $eventReach = trim((string) ($payload['eventReach'] ?? ''));
        $reachSummary = match ($eventReach) {
            'South Africa' => 'South Africa',
            'Hubs' => $this->humanList($this->stringList($payload['hubs'] ?? [])),
            'Congregations' => $this->humanList($this->stringList($payload['eventCongregations'] ?? [])),
            default => '',
        };

        $eventDates = $payload['eventDates'] ?? null;
        $scheduleParts = [];

        if (is_array($eventDates)) {
            foreach ($eventDates as $eventDateRow) {
                if (! is_array($eventDateRow)) {
                    continue;
                }

                $date = $this->formatDateForSouthAfricaSubject(
                    trim((string) ($eventDateRow['date'] ?? '')),
                );
                $startTime = trim((string) ($eventDateRow['startTime'] ?? ''));
                $endTime = trim((string) ($eventDateRow['endTime'] ?? ''));

                if ($date === '') {
                    continue;
                }

                $timeRange = match (true) {
                    $startTime !== '' && $endTime !== '' => $startTime.'-'.$endTime,
                    $startTime !== '' => $startTime,
                    $endTime !== '' => $endTime,
                    default => '',
                };

                $scheduleParts[] = trim($date.' '.$timeRange);
            }
        }

        if ($scheduleParts === []) {
            $eventStartDateRaw = trim((string) ($payload['eventStartDate'] ?? ''));
            $eventEndDateRaw = trim((string) ($payload['eventEndDate'] ?? ''));

            $eventStartDate = str_contains($eventStartDateRaw, 'T')
                ? (string) explode('T', $eventStartDateRaw, 2)[0]
                : $eventStartDateRaw;
            $eventStartTime = str_contains($eventStartDateRaw, 'T')
                ? trim((string) explode('T', $eventStartDateRaw, 2)[1])
                : '';

            $eventEndDate = str_contains($eventEndDateRaw, 'T')
                ? (string) explode('T', $eventEndDateRaw, 2)[0]
                : $eventEndDateRaw;
            $eventEndTime = str_contains($eventEndDateRaw, 'T')
                ? trim((string) explode('T', $eventEndDateRaw, 2)[1])
                : '';

            $startDateText = $this->formatDateForSouthAfricaSubject($eventStartDate);
            $endDateText = $this->formatDateForSouthAfricaSubject($eventEndDate);

            if ($startDateText !== '') {
                if ($endDateText !== '' && $endDateText !== $startDateText) {
                    $scheduleParts[] = trim($startDateText.' '.$eventStartTime)
                        .' to '.trim($endDateText.' '.$eventEndTime);
                } else {
                    $timeRange = match (true) {
                        $eventStartTime !== '' && $eventEndTime !== '' => $eventStartTime.'-'.$eventEndTime,
                        $eventStartTime !== '' => $eventStartTime,
                        $eventEndTime !== '' => $eventEndTime,
                        default => '',
                    };
                    $scheduleParts[] = trim($startDateText.' '.$timeRange);
                }
            }
        }

        $durationSummary = $scheduleParts !== []
            ? implode('; ', $scheduleParts)
            : trim((string) ($payload['eventDuration'] ?? ''));

        return [
            'entry.event_duration_summary' => $durationSummary !== '' ? $durationSummary : 'Not specified',
            'entry.event_reach_summary' => $reachSummary !== '' ? $reachSummary : 'Not specified',
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, string>
     */
    private function workRequestComputedPayload(array $payload): array
    {
        $ticketRows = $this->workRequestTicketRows($payload);
        $ticketCurrency = trim((string) ($payload['ticketCurrency'] ?? ''));

        return [
            'ticketTypeSummary' => $this->workRequestTicketTypeSummary($payload),
            'ticketPriceSummary' => $this->workRequestTicketPriceSummary($ticketRows, $ticketCurrency),
            'ticketQuantitySummary' => $this->workRequestTicketQuantitySummary($ticketRows),
            'ticketLineItems' => $this->workRequestTicketLineItemsSummary($ticketRows, $ticketCurrency),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function workRequestTicketTypeSummary(array $payload): string
    {
        $ticketRows = $this->workRequestTicketRows($payload);
        $typeLabels = array_map(
            static fn (array $row): string => $row['label'],
            $ticketRows,
        );
        $typeLabels = array_values(array_unique(array_filter($typeLabels)));

        $summary = $this->humanList($typeLabels);

        return $summary !== '' ? $summary : 'Not specified';
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<int, array{label:string,price:string,quantity:string}>
     */
    private function workRequestTicketRows(array $payload): array
    {
        $ticketTypes = is_array($payload['ticketTypes'] ?? null)
            ? $payload['ticketTypes']
            : [];
        $ticketPrices = is_array($payload['ticketPrices'] ?? null)
            ? $payload['ticketPrices']
            : [];
        $ticketQuantities = is_array($payload['ticketQuantities'] ?? null)
            ? $payload['ticketQuantities']
            : [];

        $rows = [];
        $standardTicketMap = [
            'adults18Plus' => 'Adults 18+',
            'adults13Plus' => 'Adults 13+',
            'children4to12' => 'Children 4 to 12',
            'children0to3' => 'Children 0 to 3',
        ];

        foreach ($standardTicketMap as $ticketKey => $ticketLabel) {
            if (! $this->isTruthyPayloadValue($ticketTypes[$ticketKey] ?? false)) {
                continue;
            }

            $rows[] = [
                'label' => $ticketLabel,
                'price' => trim((string) ($ticketPrices[$ticketKey] ?? '')),
                'quantity' => trim((string) ($ticketQuantities[$ticketKey] ?? '')),
            ];
        }

        if ($this->isTruthyPayloadValue($ticketTypes['other'] ?? false)) {
            $otherTickets = $payload['otherTickets'] ?? [];

            if (is_array($otherTickets)) {
                foreach ($otherTickets as $otherTicket) {
                    if (! is_array($otherTicket)) {
                        continue;
                    }

                    $name = trim((string) ($otherTicket['name'] ?? ''));
                    if ($name === '') {
                        continue;
                    }

                    $rows[] = [
                        'label' => $name,
                        'price' => trim((string) ($otherTicket['price'] ?? '')),
                        'quantity' => trim((string) ($otherTicket['quantity'] ?? '')),
                    ];
                }
            }
        }

        if ($rows === [] && $this->isTruthyPayloadValue($ticketTypes['other'] ?? false)) {
            $rows[] = [
                'label' => 'Other',
                'price' => '',
                'quantity' => '',
            ];
        }

        return $rows;
    }

    /**
     * @param  array<int, array{label:string,price:string,quantity:string}>  $ticketRows
     */
    private function workRequestTicketPriceSummary(array $ticketRows, string $currency): string
    {
        if ($ticketRows === []) {
            return 'Not specified';
        }

        $normalizedCurrency = trim($currency);
        $lines = array_map(function (array $row) use ($normalizedCurrency): string {
            $price = $row['price'] !== '' ? $row['price'] : 'Not specified';
            $priceText = $normalizedCurrency !== '' && $price !== 'Not specified'
                ? $normalizedCurrency.' '.$price
                : $price;

            return $row['label'].': '.$priceText;
        }, $ticketRows);

        return implode(', ', $lines);
    }

    /**
     * @param  array<int, array{label:string,price:string,quantity:string}>  $ticketRows
     */
    private function workRequestTicketQuantitySummary(array $ticketRows): string
    {
        if ($ticketRows === []) {
            return 'Not specified';
        }

        $lines = array_map(static function (array $row): string {
            $quantity = $row['quantity'] !== '' ? $row['quantity'] : 'Not specified';

            return $row['label'].': '.$quantity;
        }, $ticketRows);

        return implode(', ', $lines);
    }

    /**
     * @param  array<int, array{label:string,price:string,quantity:string}>  $ticketRows
     */
    private function workRequestTicketLineItemsSummary(array $ticketRows, string $currency): string
    {
        if ($ticketRows === []) {
            return 'Not specified';
        }

        $normalizedCurrency = trim($currency);
        $lines = array_map(function (array $row) use ($normalizedCurrency): string {
            $price = $row['price'] !== '' ? $row['price'] : 'Not specified';
            $priceText = $normalizedCurrency !== '' && $price !== 'Not specified'
                ? $normalizedCurrency.' '.$price
                : $price;
            $quantity = $row['quantity'] !== '' ? $row['quantity'] : 'Not specified';

            return sprintf(
                '%s (Price: %s, Qty: %s)',
                $row['label'],
                $priceText,
                $quantity,
            );
        }, $ticketRows);

        return implode('; ', $lines);
    }

    private function isTruthyPayloadValue(mixed $value): bool
    {
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
     * @param  mixed  $value
     * @return array<int, string>
     */
    private function stringList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $values = [];
        foreach ($value as $item) {
            $text = trim((string) $item);
            if ($text === '') {
                continue;
            }
            $values[$text] = $text;
        }

        return array_values($values);
    }

    /**
     * @param  array<int, string>  $values
     */
    private function humanList(array $values): string
    {
        $count = count($values);
        if ($count === 0) {
            return '';
        }

        if ($count === 1) {
            return $values[0];
        }

        if ($count === 2) {
            return $values[0].' and '.$values[1];
        }

        $lastValue = array_pop($values);

        return implode(', ', $values).' and '.$lastValue;
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
