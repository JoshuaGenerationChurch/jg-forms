type GrecaptchaEnterprise = {
    ready: (callback: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
};

declare global {
    interface Window {
        grecaptcha?: {
            enterprise?: GrecaptchaEnterprise;
        };
    }
}

const RECAPTCHA_SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '').trim();

export const DEFAULT_RECAPTCHA_ACTION = 'work_request_submit';

export function recaptchaEnabled(): boolean {
    return RECAPTCHA_SITE_KEY !== '';
}

export async function executeRecaptcha(
    action: string = DEFAULT_RECAPTCHA_ACTION,
): Promise<string | null> {
    if (!recaptchaEnabled()) {
        return null;
    }

    const enterprise = window.grecaptcha?.enterprise;
    if (!enterprise) {
        throw new Error('reCAPTCHA Enterprise is not available on window.');
    }

    return new Promise<string>((resolve, reject) => {
        enterprise.ready(() => {
            void enterprise
                .execute(RECAPTCHA_SITE_KEY, { action })
                .then((token) => {
                    if (typeof token !== 'string' || token.trim() === '') {
                        reject(new Error('reCAPTCHA token was empty.'));
                        return;
                    }

                    resolve(token);
                })
                .catch((error) => reject(error));
        });
    });
}

