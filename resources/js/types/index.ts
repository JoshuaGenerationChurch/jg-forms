export type * from './auth';
export type * from './navigation';
export type * from './ui';

import type { Auth } from './auth';

export type SharedData = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    workForms?: {
        isAdmin?: boolean;
        canManageInvitations?: boolean;
    };
    flash?: {
        success?: string | null;
        error?: string | null;
        inviteLink?: string | null;
    };
    [key: string]: unknown;
};
