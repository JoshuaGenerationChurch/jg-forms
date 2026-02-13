/**
 * WebAuthn API endpoints
 * These are simple endpoint definitions for WebAuthn operations
 */

export const webauthnApi = {
    registerOptions: {
        url: '/webauthn/register/options',
        method: 'POST' as const,
    },
    register: {
        url: '/webauthn/register',
        method: 'POST' as const,
    },
    loginOptions: {
        url: '/webauthn/login/options',
        method: 'POST' as const,
    },
    login: {
        url: '/webauthn/login',
        method: 'POST' as const,
    },
    index: {
        url: '/webauthn/keys',
        method: 'GET' as const,
    },
    destroy: (id: string) => ({
        url: `/webauthn/${id}`,
        method: 'DELETE' as const,
    }),
};
