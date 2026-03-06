import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PublicFormContainerProps = {
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    innerClassName?: string;
};

export function PublicFormContainer({
    children,
    className,
    contentClassName,
    innerClassName,
}: PublicFormContainerProps) {
    return (
        <main
            className={cn(
                'flex w-full flex-1 border-x border-slate-200 sm:mx-auto sm:max-w-6xl sm:px-6',
                className,
            )}
        >
            <div
                className={cn(
                    'w-full pt-4 pb-0 sm:mx-auto sm:max-w-5xl sm:py-8',
                    contentClassName,
                )}
            >
                <div
                    className={cn(
                        'rounded-md border border-slate-200 bg-white px-[15px] py-6 shadow-sm sm:p-8',
                        innerClassName,
                    )}
                >
                    {children}
                </div>
            </div>
        </main>
    );
}
