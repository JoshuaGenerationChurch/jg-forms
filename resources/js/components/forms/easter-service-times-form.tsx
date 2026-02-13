import { router, useForm } from '@inertiajs/react';
import { Minus, Plus } from 'lucide-react';
import { useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ServiceTime = {
    serviceName: string;
    date: string;
    startTime: string;
    venue: string;
};

type EasterServiceTimesFormData = {
    congregation: string;
    firstName: string;
    lastName: string;
    email: string;
    cellphone: string;
    notes: string;
    serviceTimes: ServiceTime[];
};

const blankServiceTime: ServiceTime = {
    serviceName: '',
    date: '',
    startTime: '',
    venue: '',
};

export function EasterServiceTimesForm() {
    const formSlug = 'easter-holidays';
    const { data, setData, post, processing, errors, recentlySuccessful } =
        useForm<EasterServiceTimesFormData>({
            congregation: '',
            firstName: '',
            lastName: '',
            email: '',
            cellphone: '',
            notes: '',
            serviceTimes: [{ ...blankServiceTime }],
        });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIsoDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000,
    )
        .toISOString()
        .slice(0, 10);

    useEffect(() => {
        if (!recentlySuccessful) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.visit('/forms');
        }, 1500);

        return () => window.clearTimeout(timeout);
    }, [recentlySuccessful]);

    const addServiceTime = () => {
        setData('serviceTimes', [
            ...data.serviceTimes,
            { ...blankServiceTime },
        ]);
    };

    const removeServiceTime = (index: number) => {
        if (data.serviceTimes.length === 1) {
            return;
        }

        setData(
            'serviceTimes',
            data.serviceTimes.filter((_, itemIndex) => itemIndex !== index),
        );
    };

    const updateServiceTime = (
        index: number,
        field: keyof ServiceTime,
        value: string,
    ) => {
        setData(
            'serviceTimes',
            data.serviceTimes.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item,
            ),
        );
    };

    const serviceTimeError = (index: number, field: keyof ServiceTime) => {
        return errors[`serviceTimes.${index}.${field}`];
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post('/forms/easter-holidays/entries', {
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-8">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                    Easter Holidays Service Times
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Add all congregation service times across the Easter holiday
                    period.
                </p>
                {recentlySuccessful ? (
                    <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        Submitted successfully.
                    </p>
                ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor={`${formSlug}-congregation`}>
                        Congregation <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`${formSlug}-congregation`}
                        value={data.congregation}
                        onChange={(event) =>
                            setData('congregation', event.target.value)
                        }
                        placeholder="e.g. City Bowl AM"
                    />
                    {errors.congregation ? (
                        <p className="text-xs text-red-600">
                            {errors.congregation}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`${formSlug}-cellphone`}>Cellphone</Label>
                    <Input
                        id={`${formSlug}-cellphone`}
                        value={data.cellphone}
                        onChange={(event) =>
                            setData('cellphone', event.target.value)
                        }
                        placeholder="e.g. +27 82 000 0000"
                    />
                    {errors.cellphone ? (
                        <p className="text-xs text-red-600">
                            {errors.cellphone}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`${formSlug}-first-name`}>
                        Contact First Name{' '}
                        <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`${formSlug}-first-name`}
                        value={data.firstName}
                        onChange={(event) =>
                            setData('firstName', event.target.value)
                        }
                    />
                    {errors.firstName ? (
                        <p className="text-xs text-red-600">
                            {errors.firstName}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`${formSlug}-last-name`}>
                        Contact Last Name{' '}
                        <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`${formSlug}-last-name`}
                        value={data.lastName}
                        onChange={(event) =>
                            setData('lastName', event.target.value)
                        }
                    />
                    {errors.lastName ? (
                        <p className="text-xs text-red-600">
                            {errors.lastName}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`${formSlug}-email`}>
                        Contact Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`${formSlug}-email`}
                        type="email"
                        value={data.email}
                        onChange={(event) =>
                            setData('email', event.target.value)
                        }
                        placeholder="you@congregation.org"
                    />
                    {errors.email ? (
                        <p className="text-xs text-red-600">{errors.email}</p>
                    ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`${formSlug}-notes`}>
                        Notes (Optional)
                    </Label>
                    <textarea
                        id={`${formSlug}-notes`}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        rows={4}
                        value={data.notes}
                        onChange={(event) =>
                            setData('notes', event.target.value)
                        }
                        placeholder="Any additional context for your services"
                    />
                    {errors.notes ? (
                        <p className="text-xs text-red-600">{errors.notes}</p>
                    ) : null}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-medium text-slate-900">
                        Service Times
                    </h2>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addServiceTime}
                    >
                        <Plus className="size-4" />
                        Add Service
                    </Button>
                </div>

                {errors.serviceTimes ? (
                    <p className="text-xs text-red-600">
                        {errors.serviceTimes}
                    </p>
                ) : null}

                <div className="space-y-4">
                    {data.serviceTimes.map((service, index) => (
                        <div
                            key={`${formSlug}-service-${index}`}
                            className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-slate-800">
                                    Service {index + 1}
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => removeServiceTime(index)}
                                    disabled={data.serviceTimes.length === 1}
                                >
                                    <Minus className="size-4" />
                                    Remove
                                </Button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                    <Label
                                        htmlFor={`${formSlug}-service-name-${index}`}
                                    >
                                        Service Name
                                    </Label>
                                    <Input
                                        id={`${formSlug}-service-name-${index}`}
                                        value={service.serviceName}
                                        onChange={(event) =>
                                            updateServiceTime(
                                                index,
                                                'serviceName',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="e.g. Good Friday Morning"
                                    />
                                    {serviceTimeError(index, 'serviceName') ? (
                                        <p className="text-xs text-red-600">
                                            {serviceTimeError(
                                                index,
                                                'serviceName',
                                            )}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-1">
                                    <Label
                                        htmlFor={`${formSlug}-service-date-${index}`}
                                    >
                                        Date{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id={`${formSlug}-service-date-${index}`}
                                        type="date"
                                        min={todayIsoDate}
                                        value={service.date}
                                        onChange={(event) =>
                                            updateServiceTime(
                                                index,
                                                'date',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {serviceTimeError(index, 'date') ? (
                                        <p className="text-xs text-red-600">
                                            {serviceTimeError(index, 'date')}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-1">
                                    <Label
                                        htmlFor={`${formSlug}-service-start-${index}`}
                                    >
                                        Start Time{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id={`${formSlug}-service-start-${index}`}
                                        type="time"
                                        value={service.startTime}
                                        onChange={(event) =>
                                            updateServiceTime(
                                                index,
                                                'startTime',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {serviceTimeError(index, 'startTime') ? (
                                        <p className="text-xs text-red-600">
                                            {serviceTimeError(
                                                index,
                                                'startTime',
                                            )}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-1">
                                    <Label
                                        htmlFor={`${formSlug}-service-venue-${index}`}
                                    >
                                        Venue / Campus
                                    </Label>
                                    <Input
                                        id={`${formSlug}-service-venue-${index}`}
                                        value={service.venue}
                                        onChange={(event) =>
                                            updateServiceTime(
                                                index,
                                                'venue',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="e.g. Main Hall"
                                    />
                                    {serviceTimeError(index, 'venue') ? (
                                        <p className="text-xs text-red-600">
                                            {serviceTimeError(index, 'venue')}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                    {processing ? 'Submitting...' : 'Submit Service Times'}
                </Button>
            </div>
        </form>
    );
}
