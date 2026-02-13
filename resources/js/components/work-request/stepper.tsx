import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = {
    id: string;
    title: string;
};

export function WorkRequestStepper({
    steps,
    currentIndex,
    onStepClick,
    hasError,
}: {
    steps: Step[];
    currentIndex: number;
    onStepClick?: (index: number) => void;
    hasError?: boolean;
}) {
    const totalSteps = steps.length;
    const safeIndex = Math.min(currentIndex, Math.max(0, totalSteps - 1));
    const currentTitle = steps[safeIndex]?.title ?? '';
    const progress = totalSteps > 0 ? Math.round(((safeIndex + 1) / totalSteps) * 100) : 0;

    return (
        <div className="mt-6">
            {/* Mobile */}
            <div className="sm:hidden">
                <p className="text-sm font-medium text-slate-700">{currentTitle}</p>
                <p className="mt-1 text-sm text-slate-500">
                    Step {safeIndex + 1} of {totalSteps}
                </p>
                <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Desktop */}
            <nav aria-label="Progress" className="hidden sm:block">
                <ol role="list" className="flex items-center">
                    {steps.map((step, index) => {
                        const isComplete = index < safeIndex;
                        const isCurrent = index === safeIndex;
                        const isUpcoming = index > safeIndex;
                        const isClickable = Boolean(onStepClick) && index <= safeIndex;

                        const circleClass = cn(
                            'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                            isComplete && 'border-blue-600 bg-blue-600 text-white',
                            isUpcoming && 'border-slate-300 bg-white text-slate-500',
                            isCurrent &&
                                !hasError &&
                                'border-blue-600 bg-white text-blue-600 ring-2 ring-blue-600 ring-offset-2',
                            isCurrent &&
                                hasError &&
                                'border-red-500 bg-white text-red-600 ring-2 ring-red-500 ring-offset-2',
                        );

                        const labelClass = cn(
                            'mt-2 w-full max-w-28 truncate text-center text-xs font-medium',
                            isComplete && 'text-slate-700',
                            isUpcoming && 'text-slate-500',
                            isCurrent && !hasError && 'text-blue-600',
                            isCurrent && hasError && 'text-red-600',
                        );

                        return (
                            <li key={step.id} className="relative flex-1">
                                {index !== totalSteps - 1 && (
                                    <div
                                        aria-hidden="true"
                                        className={cn(
                                            'absolute left-0 top-[18px] z-0 h-0.5 w-full',
                                            index < safeIndex ? 'bg-blue-600' : 'bg-slate-200',
                                        )}
                                    />
                                )}

                                <button
                                    type="button"
                                    onClick={isClickable ? () => onStepClick?.(index) : undefined}
                                    disabled={!isClickable}
                                    aria-current={isCurrent ? 'step' : undefined}
                                    className={cn(
                                        'relative z-10 flex w-full flex-col items-center px-1 focus-visible:outline-none',
                                        isClickable
                                            ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'
                                            : 'cursor-not-allowed',
                                    )}
                                >
                                    <span className={circleClass}>
                                        {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                                    </span>
                                    <span className={labelClass}>{step.title}</span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
}
