import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function AdminPageContent({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4',
                className,
            )}
            {...props}
        />
    );
}
