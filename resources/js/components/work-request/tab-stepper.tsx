import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = {
    id: string;
    title: string;
};

export function WorkRequestTabStepper({
    steps,
    currentIndex,
    maxEnabledIndex,
    allValid,
    onSelect,
    hasError,
}: {
    steps: Step[];
    currentIndex: number;
    maxEnabledIndex: number;
    allValid?: boolean;
    onSelect: (index: number) => void;
    hasError?: boolean;
}) {
    const totalSteps = steps.length;
    const safeCurrent = Math.min(currentIndex, Math.max(0, totalSteps - 1));
    const safeMaxEnabled = Math.min(
        maxEnabledIndex,
        Math.max(0, totalSteps - 1),
    );

    const currentTitle = steps[safeCurrent]?.title ?? '';
    const progress =
        totalSteps > 0 ? Math.round(((safeCurrent + 1) / totalSteps) * 100) : 0;

    return (
        <div className="mt-6">
            {/* Mobile: keep it simple */}
            <div className="sm:hidden">
                <p className="text-sm font-medium text-slate-700">
                    {currentTitle}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                    Step {safeCurrent + 1} of {totalSteps}
                </p>
                <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                    <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Desktop: tab-style stepper */}
            <nav aria-label="Work request steps" className="hidden sm:block">
                <ol role="tablist" className="flex items-center">
                    {steps.map((step, index) => {
                        const isEnabled = index <= safeMaxEnabled;
                        const isCurrent = index === safeCurrent;

                        const isValid = allValid
                            ? true
                            : index < safeMaxEnabled;
                        const isTarget = !allValid && index === safeMaxEnabled;

                        const connectorClass = cn(
                            'absolute top-[18px] left-0 z-0 h-0.5 w-full',
                            index < safeMaxEnabled
                                ? 'bg-blue-600'
                                : 'bg-slate-200',
                        );

                        const circleClass = cn(
                            'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                            !isEnabled &&
                                'border-slate-300 bg-white text-slate-400',
                            isValid && 'border-blue-600 bg-blue-600 text-white',
                            isTarget &&
                                'border-blue-600 bg-white text-blue-600',
                            isCurrent &&
                                isValid &&
                                'ring-2 ring-blue-600 ring-offset-2',
                            isCurrent &&
                                isTarget &&
                                !hasError &&
                                'ring-2 ring-blue-600 ring-offset-2',
                            isCurrent &&
                                isTarget &&
                                hasError &&
                                'border-red-500 text-red-600 ring-2 ring-red-500 ring-offset-2',
                        );

                        const labelClass = cn(
                            'mt-2 w-full max-w-28 truncate text-center text-xs font-medium',
                            !isEnabled && 'text-slate-400',
                            isValid && 'text-slate-700',
                            isTarget && 'text-blue-600',
                            isCurrent && isTarget && hasError && 'text-red-600',
                        );

                        return (
                            <li key={step.id} className="relative flex-1">
                                {index !== totalSteps - 1 && (
                                    <div
                                        aria-hidden="true"
                                        className={connectorClass}
                                    />
                                )}

                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={isCurrent}
                                    aria-disabled={!isEnabled}
                                    onClick={() => onSelect(index)}
                                    className={cn(
                                        'relative z-10 flex w-full flex-col items-center px-1 focus-visible:outline-none',
                                        isEnabled
                                            ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'
                                            : 'cursor-not-allowed',
                                    )}
                                >
                                    <span className={circleClass}>
                                        {isValid ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            index + 1
                                        )}
                                    </span>
                                    <span className={labelClass}>
                                        {step.title}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
}
