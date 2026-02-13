import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden p-6 md:p-10">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sage-400 via-sage-500 to-sage-600" />

            {/* Animated gradient orbs for depth */}
            <div className="animate-blob absolute top-20 left-20 h-96 w-96 rounded-full bg-sage-300 opacity-70 mix-blend-multiply blur-3xl filter" />
            <div className="animate-blob animation-delay-2000 absolute top-40 right-20 h-96 w-96 rounded-full bg-sage-400 opacity-70 mix-blend-multiply blur-3xl filter" />
            <div className="animate-blob animation-delay-4000 absolute -bottom-20 left-40 h-96 w-96 rounded-full bg-sage-500 opacity-70 mix-blend-multiply blur-3xl filter" />

            {/* Glassmorphic card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="rounded-3xl border border-white/20 bg-white/30 p-8 shadow-2xl backdrop-blur-xl dark:bg-white/10">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href={home()}
                                className="flex flex-col items-center gap-2 font-medium"
                            >
                                <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0077C0] p-1.5 shadow-lg">
                                    <AppLogoIcon className="size-9 object-contain" />
                                </div>
                                <span className="sr-only">{title}</span>
                            </Link>

                            <div className="space-y-2 text-center">
                                <h1 className="text-2xl font-semibold text-white drop-shadow-sm">
                                    {title}
                                </h1>
                                <p className="text-center text-sm text-white/80">
                                    {description}
                                </p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
