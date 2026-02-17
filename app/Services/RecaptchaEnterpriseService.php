<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class RecaptchaEnterpriseService
{
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
            return [
                'success' => false,
                'message' => 'Spam protection is not configured correctly. Please contact support.',
                'score' => null,
            ];
        }

        $accessToken = $this->fetchAccessToken($credentialsPath);

        if ($accessToken === null) {
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
                Log::warning('reCAPTCHA Enterprise assessment failed.', [
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
                return [
                    'success' => false,
                    'message' => 'Spam protection token was invalid or expired. Please submit again.',
                    'score' => $score,
                ];
            }

            if ($action === '' || $action !== $expectedAction) {
                return [
                    'success' => false,
                    'message' => 'Spam protection action mismatch. Please submit again.',
                    'score' => $score,
                ];
            }

            if ($score === null || $score < $minScore) {
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
            Log::warning('reCAPTCHA Enterprise verification exception.', [
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
            return null;
        }

        $credentialsContent = @file_get_contents($credentialsPath);
        if (! is_string($credentialsContent) || $credentialsContent === '') {
            return null;
        }

        /** @var mixed $credentialsJson */
        $credentialsJson = json_decode($credentialsContent, true);
        if (! is_array($credentialsJson)) {
            return null;
        }

        $clientEmail = trim((string) ($credentialsJson['client_email'] ?? ''));
        $privateKey = (string) ($credentialsJson['private_key'] ?? '');
        $tokenUri = trim((string) ($credentialsJson['token_uri'] ?? 'https://oauth2.googleapis.com/token'));

        if ($clientEmail === '' || $privateKey === '' || $tokenUri === '') {
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
                Log::warning('Failed to obtain Google OAuth token for reCAPTCHA.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $accessToken = trim((string) data_get($response->json(), 'access_token', ''));

            return $accessToken !== '' ? $accessToken : null;
        } catch (Throwable $exception) {
            Log::warning('Google OAuth token request failed for reCAPTCHA.', [
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

