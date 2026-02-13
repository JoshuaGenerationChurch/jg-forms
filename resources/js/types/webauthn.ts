export type WebAuthnCredential = {
    id: string;
    name: string;
    type: string;
    created_at: string;
    last_used_at: string | null;
};

export type PublicKeyCredentialCreationOptionsJSON = {
    publicKey: {
        challenge: string;
        rp: {
            name: string;
            id: string;
        };
        user: {
            id: string;
            name: string;
            displayName: string;
        };
        pubKeyCredParams: Array<{
            type: string;
            alg: number;
        }>;
        timeout?: number;
        attestation?: string;
        authenticatorSelection?: {
            authenticatorAttachment?: 'platform' | 'cross-platform';
            requireResidentKey?: boolean;
            residentKey?: 'discouraged' | 'preferred' | 'required';
            userVerification?: 'required' | 'preferred' | 'discouraged';
        };
        excludeCredentials?: Array<{
            type: string;
            id: string;
        }>;
    };
};

export type PublicKeyCredentialRequestOptionsJSON = {
    publicKey: {
        challenge: string;
        timeout?: number;
        rpId?: string;
        allowCredentials?: Array<{
            type: string;
            id: string;
        }>;
        userVerification?: 'required' | 'preferred' | 'discouraged';
    };
};

export type RegistrationCredential = {
    id: string;
    rawId: string;
    type: string;
    response: {
        clientDataJSON: string;
        attestationObject: string;
    };
    name?: string;
};

export type AuthenticationCredential = {
    id: string;
    rawId: string;
    type: string;
    response: {
        clientDataJSON: string;
        authenticatorData: string;
        signature: string;
        userHandle?: string;
    };
};
