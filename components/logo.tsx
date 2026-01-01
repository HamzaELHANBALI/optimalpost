import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    withText?: boolean;
    variant?: 'full' | 'icon' | 'wordmark';
    size?: 'sm' | 'md' | 'lg';
}

export function ProvenPostLogo({ 
    className, 
    withText = true, 
    variant = 'full',
    size = 'md' 
}: LogoProps) {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl'
    };

    const iconOnly = variant === 'icon';
    const wordmarkOnly = variant === 'wordmark';

    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            {!wordmarkOnly && (
                <div className="relative flex items-center justify-center">
                    <svg
                        width="40"
                        height="40"
                        viewBox="0 0 40 40"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={sizeClasses[size]}
                    >
                        {/* Background gradient circle */}
                        <defs>
                            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="oklch(0.488 0.243 264.376)" />
                                <stop offset="100%" stopColor="oklch(0.696 0.17 162.48)" />
                            </linearGradient>
                        </defs>
                        
                        {/* Main document/paper shape - represents content */}
                        <path
                            d="M8 8C8 5.23858 10.2386 3 13 3H20L28 11V28C28 30.7614 25.7614 33 23 33H13C10.2386 33 8 30.7614 8 28V8Z"
                            className="fill-primary/10 dark:fill-primary/20 stroke-primary/60 dark:stroke-primary/40"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Content lines - represents script/text */}
                        <path
                            d="M12 14H20"
                            className="stroke-primary/50 dark:stroke-primary/60"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                        <path
                            d="M12 18H24"
                            className="stroke-primary/50 dark:stroke-primary/60"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                        <path
                            d="M12 22H18"
                            className="stroke-primary/50 dark:stroke-primary/60"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />

                        {/* Sparkle/star icon - represents optimization/viral content */}
                        <circle
                            cx="30"
                            cy="10"
                            r="6"
                            className="fill-blue-500/20 dark:fill-blue-400/30"
                        />
                        <path
                            d="M30 6L30.5 8.5L33 9L30.5 9.5L30 12L29.5 9.5L27 9L29.5 8.5L30 6Z"
                            className="fill-blue-600 dark:fill-blue-400"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Checkmark badge - represents "proven" */}
                        <circle
                            cx="30"
                            cy="30"
                            r="7"
                            className="fill-background dark:fill-card stroke-blue-600 dark:stroke-blue-400"
                            strokeWidth="2"
                        />
                        <path
                            d="M26.5 30L28.5 32L33.5 27"
                            className="stroke-blue-600 dark:stroke-blue-400"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            )}

            {/* The Text Brand */}
            {withText && !iconOnly && (
                <div className="flex flex-col leading-none">
                    <span className={cn(
                        "font-bold tracking-tight text-foreground",
                        textSizeClasses[size]
                    )}>
                        Proven<span className="text-blue-600 dark:text-blue-400">Post</span>
                    </span>
                    {size === 'lg' && (
                        <span className="text-xs text-muted-foreground font-normal tracking-wide mt-0.5">
                            Content Optimization Lab
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
