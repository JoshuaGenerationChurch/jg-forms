import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Required() {
    return (
        <>
            <span aria-hidden="true" className="ml-1 text-red-500">
                *
            </span>
            <span className="sr-only">Required</span>
        </>
    );
}

export function FloatingLabelInput({
    id,
    label,
    error,
    required,
    className,
    inputClassName,
    labelBackgroundClassName,
    ...props
}: Omit<ComponentProps<'input'>, 'id'> & {
    id: string;
    label: string;
    error?: string;
    required?: boolean;
    className?: string;
    inputClassName?: string;
    labelBackgroundClassName?: string;
}) {
    const invalid = Boolean(error);

    return (
        <div className={cn('space-y-1', className)}>
            <div className="relative">
                <input
                    id={id}
                    data-slot="floating-input"
                    placeholder=" "
                    aria-invalid={invalid}
                    className={cn(
                        'peer block w-full rounded-lg border-2 bg-slate-100/50 px-4 pb-3 pt-5 text-sm text-slate-900 shadow-sm transition',
                        'placeholder-transparent focus-visible:outline-none focus-visible:ring-1',
                        invalid
                            ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500'
                            : 'border-slate-200 focus-visible:border-blue-400 focus-visible:ring-blue-400',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        inputClassName,
                    )}
                    {...props}
                />
                <label
                    htmlFor={id}
                    className={cn(
                        'pointer-events-none absolute left-4 top-0 -translate-y-1/2 rounded px-1 text-xs font-semibold transition-all duration-200',
                        invalid ? 'text-red-600' : 'text-blue-600',
                        labelBackgroundClassName ?? 'bg-white',
                        'peer-[&:placeholder-shown:not(:focus)]:top-1/2',
                        'peer-[&:placeholder-shown:not(:focus)]:bg-transparent peer-[&:placeholder-shown:not(:focus)]:px-0',
                        'peer-[&:placeholder-shown:not(:focus)]:text-sm peer-[&:placeholder-shown:not(:focus)]:font-normal',
                        invalid
                            ? 'peer-[&:placeholder-shown:not(:focus)]:text-red-600'
                            : 'peer-[&:placeholder-shown:not(:focus)]:text-slate-500',
                    )}
                >
                    {label}
                    {required ? <Required /> : null}
                </label>
            </div>
            <FieldError error={error} />
        </div>
    );
}

export function FloatingLabelTextarea({
    id,
    label,
    error,
    required,
    className,
    textareaClassName,
    labelBackgroundClassName,
    ...props
}: Omit<ComponentProps<'textarea'>, 'id'> & {
    id: string;
    label: string;
    error?: string;
    required?: boolean;
    className?: string;
    textareaClassName?: string;
    labelBackgroundClassName?: string;
}) {
    const invalid = Boolean(error);

    return (
        <div className={cn('space-y-1', className)}>
            <div className="relative">
                <textarea
                    id={id}
                    data-slot="floating-textarea"
                    placeholder=" "
                    aria-invalid={invalid}
                    className={cn(
                        'peer block min-h-[120px] w-full resize-y rounded-lg border-2 bg-slate-100/50 px-4 pb-3 pt-6 text-sm text-slate-900 shadow-sm transition',
                        'placeholder-transparent focus-visible:outline-none focus-visible:ring-1',
                        invalid
                            ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500'
                            : 'border-slate-200 focus-visible:border-blue-400 focus-visible:ring-blue-400',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        textareaClassName,
                    )}
                    {...props}
                />
                <label
                    htmlFor={id}
                    className={cn(
                        'pointer-events-none absolute left-4 top-0 -translate-y-1/2 rounded px-1 text-xs font-semibold transition-all duration-200',
                        invalid ? 'text-red-600' : 'text-blue-600',
                        labelBackgroundClassName ?? 'bg-white',
                        'peer-[&:placeholder-shown:not(:focus)]:top-4',
                        'peer-[&:placeholder-shown:not(:focus)]:bg-transparent peer-[&:placeholder-shown:not(:focus)]:px-0',
                        'peer-[&:placeholder-shown:not(:focus)]:text-sm peer-[&:placeholder-shown:not(:focus)]:font-normal',
                        invalid
                            ? 'peer-[&:placeholder-shown:not(:focus)]:text-red-600'
                            : 'peer-[&:placeholder-shown:not(:focus)]:text-slate-500',
                    )}
                >
                    {label}
                    {required ? <Required /> : null}
                </label>
            </div>
            <FieldError error={error} />
        </div>
    );
}

export function FieldError({ error }: { error?: string }) {
    if (!error) return null;
    return <p className="mt-1 text-sm text-red-500">{error}</p>;
}

export function PageError({ error }: { error?: string }) {
    if (!error) return null;
    return (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
        </div>
    );
}

export function ErrorSummary({
    errors,
}: {
    errors?: Record<string, string | undefined>;
}) {
    if (!errors) return null;

    const messages = Object.values(errors).filter((m): m is string => Boolean(m));
    const uniqueMessages = Array.from(new Set(messages));

    if (uniqueMessages.length === 0) return null;

    return (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">Please fix the following:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
                {uniqueMessages.map((message) => (
                    <li key={message}>{message}</li>
                ))}
            </ul>
        </div>
    );
}

export function SectionHeader({ title }: { title: string }) {
    return (
        <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <div className="mt-2 h-px w-full bg-slate-200" />
        </div>
    );
}

export function RadioGroup({
    name,
    options,
    columns = 1,
    value,
    onChange,
    error,
}: {
    name: string;
    options: string[];
    columns?: 1 | 2 | 3;
    value?: string;
    onChange?: (value: string) => void;
    error?: string;
}) {
    const invalid = Boolean(error);

    return (
        <div>
            <div
                className={cn(
                    'mt-2 grid gap-2',
                    columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-1',
                )}
            >
                {options.map((option, index) => {
                    const optionId = `${name}-${index}`;
                    const checked = value === option;

                    return (
                        <div key={option} className="relative">
                            <input
                                id={optionId}
                                type="radio"
                                name={name}
                                value={option}
                                checked={checked}
                                onChange={(e) => onChange?.(e.target.value)}
                                className="peer sr-only"
                            />
                            <label
                                htmlFor={optionId}
                                className={cn(
                                    'relative flex cursor-pointer items-center rounded-lg border-2 border-slate-200 bg-slate-100/50 px-4 py-3 pl-11 text-sm shadow-sm transition',
                                    'text-slate-700 hover:border-slate-300',
                                    "before:absolute before:left-4 before:top-1/2 before:h-5 before:w-5 before:-translate-y-1/2 before:rounded-full before:border-2 before:border-slate-300 before:bg-white before:content-['']",
                                    "after:absolute after:left-4 after:top-1/2 after:h-2 after:w-2 after:-translate-y-1/2 after:translate-x-[6px] after:rounded-full after:bg-white after:opacity-0 after:content-['']",
                                    'peer-checked:border-blue-400 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:font-semibold',
                                    'peer-checked:before:border-blue-600 peer-checked:before:bg-blue-600 peer-checked:after:opacity-100',
                                    'peer-focus-visible:ring-1 peer-focus-visible:ring-blue-400',
                                    invalid && !checked && 'border-red-500 before:border-red-500',
                                )}
                            >
                                {option}
                            </label>
                        </div>
                    );
                })}
            </div>
            <FieldError error={error} />
        </div>
    );
}
