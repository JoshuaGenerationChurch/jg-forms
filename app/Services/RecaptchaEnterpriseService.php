<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class RecaptchaEnterpriseService
{
    /**
     * @return array{
     *   ok: bool,
     *   enabled: bool,
     *   site_key_present: bool,
     *   project_id_present: bool,
     *   expected_action_present: bool,
     *   credentials_path: string,
     *   credentials_file_exists: bool,
     *   credentials_file_readable: bool,
     *   access_token_available: bool,
     *   message: string
     * }
     */
    public function healthCheck(): array
    {
        $enabled = $this->enabled();
        $siteKey = trim((string) config('services.recaptcha.site_key', ''));
        $projectId = trim((string) config('services.recaptcha.project_id', ''));
        $expectedAction = trim((string) config('services.recaptcha.expected_action', ''));
        $credentialsPath = trim((string) config('services.recaptcha.credentials_path', ''));

        $siteKeyPresent = $siteKey !== '';
        $projectIdPresent = $projectId !== '';
        $expectedActionPresent = $expectedAction !== '';
        $credentialsFileExists = $credentialsPath !== '' && is_file($credentialsPath);
        $credentialsFileReadable = $credentialsPath !== '' && is_readable($credentialsPath);

        $accessTokenAvailable = false;
        if (
            $enabled &&
            $siteKeyPresent &&
            $projectIdPresent &&
            $expectedActionPresent &&
            $credentialsFileExists &&
            $credentialsFileReadable
        ) {
            $accessTokenAvailable = $this->fetchAccessToken($credentialsPath) !== null;
        }

        $ok = $enabled &&
            $siteKeyPresent &&
            $projectIdPresent &&
            $expectedActionPresent &&
            $credentialsFileExists &&
            $credentialsFileReadable &&
            $accessTokenAvailable;

        $message = $ok
            ? 'reCAPTCHA is configured and can fetch Google OAuth access tokens.'
            : 'reCAPTCHA is not fully operational. Check missing config, file access, or outbound connectivity.';

        return [
            'ok' => $ok,
            'enabled' => $enabled,
            'site_key_present' => $siteKeyPresent,
            'project_id_present' => $projectIdPresent,
            'expected_action_present' => $expectedActionPresent,
            'credentials_path' => $credentialsPath,
            'credentials_file_exists' => $credentialsFileExists,
            'credentials_file_readable' => $credentialsFileReadable,
            'access_token_available' => $accessTokenAvailable,
            'message' => $message,
        ];
    }

    public function enabled(): bool
    {
        return (bool) config('services.recaptcha.enabled', false);
    }

    /**
     * @return array{success: bool, message: string|null, score: float|null}
     */
    public function verifyToken(string $token): array
    {
        if (! $this->enabled()) {
            return [
                'success' => true,
                'message' => null,
                'score' => null,
            ];
        }

        $siteKey = trim((string) config('services.recaptcha.site_key', ''));
        $projectId = trim((string) config('services.recaptcha.project_id', ''));
        $expectedAction = trim((string) config('services.recaptcha.expected_action', 'work_request_submit'));
        $minScore = (float) config('services.recaptcha.min_score', 0.5);
        $credentialsPath = trim((string) config('services.recaptcha.credentials_path', ''));

        if (
            $token === '' ||
            $siteKey === '' ||
            $projectId === '' ||
            $expectedAction === '' ||
            $credentialsPath === ''
        ) {
            Log::error('reCAPTCHA configuration is incomplete.', [
                'token_present' => $token !== '',
                'site_key_present' => $siteKey !== '',
                'project_id_present' => $projectId !== '',
                'expected_action_present' => $expectedAction !== '',
                'credentials_path_present' => $credentialsPath !== '',
            ]);

            return [
                'success' => false,
                'message' => 'Spam protection is not configured correctly. Please contact support.',
                'score' => null,
            ];
        }

        $accessToken = $this->fetchAccessToken($credentialsPath);

        if ($accessToken === null) {
            Log::error('reCAPTCHA access token could not be obtained.', [
                'credentials_path' => $credentialsPath,
            ]);

            return [
                'success' => false,
                'message' => 'Spam protection service is currently unavailable. Please try again.',
                'score' => null,
            ];
        }

        try {
            $response = Http::acceptJson()
                ->withToken($accessToken)
                ->timeout(12)
                ->post("https://recaptchaenterprise.googleapis.com/v1/projects/{$projectId}/assessments", [
                    'event' => [
                        'token' => $token,
                        'siteKey' => $siteKey,
                        'expectedAction' => $expectedAction,
                    ],
                ]);

            if ($response->failed()) {
                Log::error('reCAPTCHA Enterprise assessment failed.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'message' => 'Could not verify spam protection. Please try again.',
                    'score' => null,
                ];
            }

            /** @var mixed $json */
            $json = $response->json();
            if (! is_array($json)) {
                Log::error('reCAPTCHA assessment returned invalid JSON payload.');

                return [
                    'success' => false,
                    'message' => 'Could not verify spam protection. Please try again.',
                    'score' => null,
                ];
            }

            $tokenValid = (bool) data_get($json, 'tokenProperties.valid', false);
            $action = trim((string) data_get($json, 'tokenProperties.action', ''));
            $scoreRaw = data_get($json, 'riskAnalysis.score');
            $score = is_numeric($scoreRaw) ? (float) $scoreRaw : null;

            if (! $tokenValid) {
                Log::warning('reCAPTCHA token was invalid.', [
                    'action' => $action,
                    'score' => $score,
                    'invalid_reason' => data_get($json, 'tokenProperties.invalidReason'),
                ]);

                return [
                    'success' => false,
                    'message' => 'Spam protection token was invalid or expired. Please submit again.',
                    'score' => $score,
                ];
            }

            if ($action === '' || $action !== $expectedAction) {
                Log::warning('reCAPTCHA action mismatch.', [
                    'expected_action' => $expectedAction,
                    'actual_action' => $action,
                    'score' => $score,
                ]);

                return [
                    'success' => false,
                    'message' => 'Spam protection action mismatch. Please submit again.',
                    'score' => $score,
                ];
            }

            if ($score === null || $score < $minScore) {
                Log::warning('reCAPTCHA score below threshold.', [
                    'score' => $score,
                    'threshold' => $minScore,
                    'action' => $action,
                ]);

                return [
                    'success' => false,
                    'message' => 'Spam protection score was too low. Please try again.',
                    'score' => $score,
                ];
            }

            return [
                'success' => true,
                'message' => null,
                'score' => $score,
            ];
        } catch (Throwable $exception) {
            Log::error('reCAPTCHA Enterprise verification exception.', [
                'message' => $exception->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Could not verify spam protection. Please try again.',
                'score' => null,
            ];
        }
    }

    private function fetchAccessToken(string $credentialsPath): ?string
    {
        if (! is_file($credentialsPath) || ! is_readable($credentialsPath)) {
            Log::error('reCAPTCHA credentials file missing or unreadable.', [
                'credentials_path' => $credentialsPath,
                'exists' => is_file($credentialsPath),
                'readable' => is_readable($credentialsPath),
            ]);

            return null;
        }

        $credentialsContent = @file_get_contents($credentialsPath);
        if (! is_string($credentialsContent) || $credentialsContent === '') {
            Log::error('reCAPTCHA credentials file could not be read.');

            return null;
        }

        /** @var mixed $credentialsJson */
        $credentialsJson = json_decode($credentialsContent, true);
        if (! is_array($credentialsJson)) {
            Log::error('reCAPTCHA credentials JSON is invalid.');

            return null;
        }

        $clientEmail = trim((string) ($credentialsJson['client_email'] ?? ''));
        $privateKey = (string) ($credentialsJson['private_key'] ?? '');
        $tokenUri = trim((string) ($credentialsJson['token_uri'] ?? 'https://oauth2.googleapis.com/token'));

        if ($clientEmail === '' || $privateKey === '' || $tokenUri === '') {
            Log::error('reCAPTCHA credentials JSON is missing required fields.', [
                'client_email_present' => $clientEmail !== '',
                'private_key_present' => $privateKey !== '',
                'token_uri_present' => $tokenUri !== '',
            ]);

            return null;
        }

        $jwt = $this->makeServiceAccountJwt($clientEmail, $privateKey, $tokenUri);

        if ($jwt === null) {
            return null;
        }

        try {
            $response = Http::asForm()
                ->acceptJson()
                ->timeout(12)
                ->post($tokenUri, [
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion' => $jwt,
                ]);

            if ($response->failed()) {
                Log::error('Failed to obtain Google OAuth token for reCAPTCHA.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $accessToken = trim((string) data_get($response->json(), 'access_token', ''));

            return $accessToken !== '' ? $accessToken : null;
        } catch (Throwable $exception) {
            Log::error('Google OAuth token request failed for reCAPTCHA.', [
                'message' => $exception->getMessage(),
            ]);

            return null;
        }
    }

    private function makeServiceAccountJwt(
        string $clientEmail,
        string $privateKey,
        string $tokenUri,
    ): ?string {
        $issuedAt = time();
        $expiresAt = $issuedAt + 3600;

        $header = ['alg' => 'RS256', 'typ' => 'JWT'];
        $payload = [
            'iss' => $clientEmail,
            'sub' => $clientEmail,
            'aud' => $tokenUri,
            'scope' => 'https://www.googleapis.com/auth/cloud-platform',
            'iat' => $issuedAt,
            'exp' => $expiresAt,
        ];

        $segments = [
            $this->base64UrlEncode(json_encode($header, JSON_UNESCAPED_SLASHES)),
            $this->base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES)),
        ];

        if (in_array(null, $segments, true)) {
            return null;
        }

        $signingInput = implode('.', $segments);
        $signature = '';
        $signed = openssl_sign($signingInput, $signature, $privateKey, OPENSSL_ALGO_SHA256);

        if (! $signed) {
            return null;
        }

        $encodedSignature = $this->base64UrlEncode($signature);
        if ($encodedSignature === null) {
            return null;
        }

        return "{$signingInput}.{$encodedSignature}";
    }

    private function base64UrlEncode(string $value): ?string
    {
        $encoded = base64_encode($value);
        if ($encoded === false) {
            return null;
        }

        return rtrim(strtr($encoded, '+/', '-_'), '=');
    }
}
