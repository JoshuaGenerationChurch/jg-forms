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

        foreach ($this->flattenPayload($payload, 'payload') as $key => $value) {
            $placeholderMap[$key] = $value;
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
        ];

        if ($form->slug === 'work-request') {
            $placeholders = array_merge(
                $placeholders,
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
                'eventDates.0.date' => now()->toDateString(),
                'eventDates.0.startTime' => '18:00',
                'eventDates.0.endTime' => '20:00',
                'congregation', 'signageCongregations.0', 'printCongregations.0' => 'City Bowl AM',
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
