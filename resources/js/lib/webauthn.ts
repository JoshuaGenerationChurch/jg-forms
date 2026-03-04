import type {
    PublicKeyCredentialCreationOptionsJSON,
    PublicKeyCredentialRequestOptionsJSON,
    RegistrationCredential,
    AuthenticationCredential,
} from '@/types/webauthn';

/**
 * Convert base64url string to ArrayBuffer
 */
function base64urlToBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLength);
    const binary = atob(padded);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return buffer;
}

/**
 * Convert Uint8Array to base64url string
 */
function bufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Convert JSON options to PublicKeyCredentialCreationOptions
 */
function jsonToCreationOptions(
    json: PublicKeyCredentialCreationOptionsJSON,
): CredentialCreationOptions {
    return {
        publicKey: {
            ...json.publicKey,
            challenge: base64urlToBuffer(json.publicKey.challenge),
            user: {
                ...json.publicKey.user,
                id: base64urlToBuffer(json.publicKey.user.id),
            },
            excludeCredentials: json.publicKey.excludeCredentials?.map(
                (cred) => ({
                    type: 'public-key' as const,
                    id: base64urlToBuffer(cred.id),
                }),
            ),
        } as PublicKeyCredentialCreationOptions,
    };
}

/**
 * Convert JSON options to PublicKeyCredentialRequestOptions
 */
function jsonToRequestOptions(
    json: PublicKeyCredentialRequestOptionsJSON,
): CredentialRequestOptions {
    return {
        publicKey: {
            ...json.publicKey,
            challenge: base64urlToBuffer(json.publicKey.challenge),
            allowCredentials: json.publicKey.allowCredentials?.map((cred) => ({
                type: 'public-key' as const,
                id: base64urlToBuffer(cred.id),
            })),
        } as PublicKeyCredentialRequestOptions,
    };
}

/**
 * Convert PublicKeyCredential to JSON for registration
 */
function credentialToRegistrationJSON(
    credential: PublicKeyCredential,
): RegistrationCredential {
    const response = credential.response as AuthenticatorAttestationResponse;
    return {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
            clientDataJSON: bufferToBase64url(response.clientDataJSON),
            attestationObject: bufferToBase64url(response.attestationObject),
        },
    };
}

/**
 * Convert PublicKeyCredential to JSON for authentication
 */
function credentialToAuthenticationJSON(
    credential: PublicKeyCredential,
): AuthenticationCredential {
    const response = credential.response as AuthenticatorAssertionResponse;
    return {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
            clientDataJSON: bufferToBase64url(response.clientDataJSON),
            authenticatorData: bufferToBase64url(response.authenticatorData),
            signature: bufferToBase64url(response.signature),
            userHandle: response.userHandle
                ? bufferToBase64url(response.userHandle)
                : undefined,
        },
    };
}

/**
 * Check if WebAuthn is supported in the current browser
 */
export function isWebAuthnSupported(): boolean {
    return (
        window?.PublicKeyCredential !== undefined &&
        navigator?.credentials?.create !== undefined
    );
}

/**
 * Check if platform authenticator (Face ID, Touch ID, Windows Hello) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!isWebAuthnSupported()) {
        return false;
    }
    try {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
        return false;
    }
}

/**
 * Register a new passkey
 */
export async function registerPasskey(
    optionsJSON: PublicKeyCredentialCreationOptionsJSON,
): Promise<RegistrationCredential> {
    if (!isWebAuthnSupported()) {
        throw new Error('WebAuthn is not supported in this browser');
    }

    const options = jsonToCreationOptions(optionsJSON);
    const credential = (await navigator.credentials.create(
        options,
    )) as PublicKeyCredential;

    if (!credential) {
        throw new Error('Failed to create credential');
    }

    return credentialToRegistrationJSON(credential);
}

/**
 * Authenticate with a passkey
 */
export async function authenticateWithPasskey(
    optionsJSON: PublicKeyCredentialRequestOptionsJSON,
): Promise<AuthenticationCredential> {
    if (!isWebAuthnSupported()) {
        throw new Error('WebAuthn is not supported in this browser');
    }

    const options = jsonToRequestOptions(optionsJSON);
    const credential = (await navigator.credentials.get(
        options,
    )) as PublicKeyCredential;

    if (!credential) {
        throw new Error('Failed to get credential');
    }

    return credentialToAuthenticationJSON(credential);
}
