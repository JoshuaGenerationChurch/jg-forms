<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Throwable;

class JgDirectoryService
{
    /**
     * @return array{hubs: array<int, string>, venues: array<int, string>, congregations: array<int, string>}
     */
    public function getDigitalMediaOptions(): array
    {
        return [
            'hubs' => $this->fetchList((string) config('services.jg.hubs_endpoint', '/hubs')),
            'venues' => $this->fetchList((string) config('services.jg.venues_endpoint', '/venues')),
            'congregations' => $this->fetchList((string) config('services.jg.congregations_endpoint', '/congregations')),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function fetchList(string $endpoint): array
    {
        $baseUrl = trim((string) config('services.jg.base_url', ''));

        if ($baseUrl === '') {
            return [];
        }

        try {
            $request = Http::acceptJson()
                ->baseUrl(rtrim($baseUrl, '/'))
                ->timeout((int) config('services.jg.timeout', 10));

            $token = trim((string) config('services.jg.token', ''));
            if ($token !== '') {
                $request = $request->withToken($token);
            }

            $response = $request->get($endpoint);

            if ($response->failed()) {
                return [];
            }

            return $this->normalizeList($response->json());
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @return array<int, string>
     */
    private function normalizeList(mixed $payload): array
    {
        if (! is_array($payload)) {
            return [];
        }

        if (array_is_list($payload)) {
            return $this->normalizeListItems($payload);
        }

        foreach (['data', 'items', 'results', 'hubs', 'venues', 'congregations'] as $key) {
            if (array_key_exists($key, $payload)) {
                $normalized = $this->normalizeList($payload[$key]);
                if ($normalized !== []) {
                    return $normalized;
                }
            }
        }

        return [];
    }

    /**
     * @param  array<int, mixed>  $items
     * @return array<int, string>
     */
    private function normalizeListItems(array $items): array
    {
        $names = [];

        foreach ($items as $item) {
            if (is_string($item)) {
                $name = $this->sanitizeName($item);
                if ($name !== '') {
                    $names[] = $name;
                }

                continue;
            }

            if (! is_array($item)) {
                continue;
            }

            foreach (['name', 'title', 'label', 'display_name'] as $field) {
                $value = $item[$field] ?? null;
                if (is_string($value)) {
                    $value = $this->sanitizeName($value);
                    if ($value !== '') {
                        $names[] = $value;
                        break;
                    }

                    continue;
                }

                if (is_array($value)) {
                    foreach (['rendered', 'raw'] as $nestedField) {
                        $nestedValue = $value[$nestedField] ?? null;
                        if (! is_string($nestedValue)) {
                            continue;
                        }

                        $nestedValue = $this->sanitizeName($nestedValue);
                        if ($nestedValue !== '') {
                            $names[] = $nestedValue;
                            break 2;
                        }
                    }
                }
            }
        }

        $uniqueNames = array_values(array_unique($names));

        sort($uniqueNames, SORT_NATURAL | SORT_FLAG_CASE);

        return $uniqueNames;
    }

    private function sanitizeName(string $value): string
    {
        $sanitizedValue = trim(strip_tags($value));
        $sanitizedValue = html_entity_decode(
            $sanitizedValue,
            ENT_QUOTES | ENT_HTML5,
            'UTF-8',
        );
        $sanitizedValue = str_replace(
            ["\u{2018}", "\u{2019}"],
            "'",
            $sanitizedValue,
        );

        return trim($sanitizedValue);
    }
}
