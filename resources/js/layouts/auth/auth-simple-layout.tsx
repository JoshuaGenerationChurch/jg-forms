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
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sage-400 via-sage-500 to-sage-600" />
            
            {/* Animated gradient orbs for depth */}
            <div className="absolute top-20 left-20 w-96 h-96 bg-sage-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
            <div className="absolute top-40 right-20 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-20 left-40 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
            
            {/* Glassmorphic card */}
            <div className="relative w-full max-w-md z-10">
                <div className="backdrop-blur-xl bg-white/30 dark:bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href={home()}
                                className="flex flex-col items-center gap-2 font-medium"
                            >
                                <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/40 backdrop-blur-sm shadow-lg">
                                    <AppLogoIcon className="size-8 fill-current text-sage-800" />
                                </div>
                                <span className="sr-only">{title}</span>
                            </Link>

                            <div className="space-y-2 text-center">
                                <h1 className="text-2xl font-semibold text-white drop-shadow-sm">{title}</h1>
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
