type GoogleAutocompletePlace = {
    formattedAddress?: string;
    formatted_address?: string;
    fetchFields?: (request: { fields: string[] }) => Promise<void>;
};

type GooglePlacePrediction = {
    toPlace: () => GoogleAutocompletePlace;
};

type GooglePlaceSelectEvent = Event & {
    place?: GoogleAutocompletePlace;
    placePrediction?: GooglePlacePrediction;
    detail?: {
        place?: GoogleAutocompletePlace;
        placePrediction?: GooglePlacePrediction;
    };
};

type GoogleAutocompleteInstance = {
    addListener: (eventName: string, handler: () => void) => void;
    getPlace: () => GoogleAutocompletePlace;
};

declare global {
    interface Window {
        google?: {
            maps?: {
                importLibrary?: (libraryName: string) => Promise<unknown>;
                places?: {
                    PlaceAutocompleteElement?: new (options?: {
                        includedRegionCodes?: string[];
                        includedPrimaryTypes?: string[];
                    }) => HTMLElement;
                    PlaceSelectEvent?: new (
                        type: string,
                        eventInitDict?: CustomEventInit,
                    ) => GooglePlaceSelectEvent;
                    Autocomplete: new (
                        inputField: HTMLInputElement,
                        options?: {
                            types?: string[];
                            fields?: string[];
                        },
                    ) => GoogleAutocompleteInstance;
                };
                event?: {
                    clearInstanceListeners: (
                        instance: GoogleAutocompleteInstance,
                    ) => void;
                };
            };
        };
        __googleMapsPlacesLoaderPromise?: Promise<void>;
    }
}

const GOOGLE_MAPS_API_KEY = (
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
).trim();
const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-places-api-script';
const GOOGLE_MAPS_READY_TIMEOUT_MS = 5000;

function hasPlacesLibrary(): boolean {
    return Boolean(
        window.google?.maps?.places?.PlaceAutocompleteElement ||
            window.google?.maps?.places?.Autocomplete,
    );
}

async function waitForPlacesLibraryReady(): Promise<void> {
    if (hasPlacesLibrary()) {
        return;
    }

    const importLibrary = window.google?.maps?.importLibrary as
        | ((libraryName: string) => Promise<unknown>)
        | undefined;
    if (importLibrary) {
        await importLibrary('places');
        if (hasPlacesLibrary()) {
            return;
        }
    }

    const startedAt = Date.now();
    await new Promise<void>((resolve, reject) => {
        const tick = () => {
            if (hasPlacesLibrary()) {
                resolve();
                return;
            }

            if (Date.now() - startedAt >= GOOGLE_MAPS_READY_TIMEOUT_MS) {
                reject(new Error('Google Maps Places library was not loaded.'));
                return;
            }

            window.setTimeout(tick, 50);
        };

        tick();
    });
}

export function googleMapsPlacesEnabled(): boolean {
    return GOOGLE_MAPS_API_KEY !== '';
}

export async function loadGoogleMapsPlacesApi(): Promise<void> {
    if (!googleMapsPlacesEnabled()) {
        throw new Error('Google Maps API key is missing.');
    }

    if (hasPlacesLibrary()) {
        return;
    }

    if (window.__googleMapsPlacesLoaderPromise) {
        return window.__googleMapsPlacesLoaderPromise;
    }

    window.__googleMapsPlacesLoaderPromise = new Promise<void>(
        (resolve, reject) => {
            const existingScript = document.getElementById(
                GOOGLE_MAPS_SCRIPT_ID,
            ) as HTMLScriptElement | null;

            const handleLoad = () => {
                void waitForPlacesLibraryReady()
                    .then(() => resolve())
                    .catch((error) => {
                        window.__googleMapsPlacesLoaderPromise = undefined;
                        reject(error);
                    });
            };

            const handleError = () => {
                window.__googleMapsPlacesLoaderPromise = undefined;
                reject(new Error('Failed to load Google Maps Places script.'));
            };

            if (existingScript) {
                existingScript.addEventListener('load', handleLoad, {
                    once: true,
                });
                existingScript.addEventListener('error', handleError, {
                    once: true,
                });
                return;
            }

            const script = document.createElement('script');
            script.id = GOOGLE_MAPS_SCRIPT_ID;
            script.src =
                'https://maps.googleapis.com/maps/api/js?libraries=places&loading=async&key=' +
                encodeURIComponent(GOOGLE_MAPS_API_KEY);
            script.async = true;
            script.defer = true;
            script.addEventListener('load', handleLoad, { once: true });
            script.addEventListener('error', handleError, { once: true });
            document.head.appendChild(script);
        },
    );

    return window.__googleMapsPlacesLoaderPromise;
}
