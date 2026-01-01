import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    withText?: boolean;
}

export function ProvenPostLogo({ className, withText = true }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            {/* The Icon */}
            <div className="relative flex items-center justify-center">
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                >
                    {/* Main Document Shape - Represents the Script */}
                    <path
                        d="M6 6C6 3.79086 7.79086 2 10 2H19L26 9V26C26 28.2091 24.2091 30 22 30H10C7.79086 30 6 28.2091 6 26V6Z"
                        className="fill-primary/5 stroke-primary stroke-[2]"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Text Lines - Represents Content */}
                    <path
                        d="M11 10H17"
                        className="stroke-primary/40 stroke-[2]"
                        strokeLinecap="round"
                    />
                    <path
                        d="M11 16H21"
                        className="stroke-primary/40 stroke-[2]"
                        strokeLinecap="round"
                    />
                    <path
                        d="M11 22H15"
                        className="stroke-primary/40 stroke-[2]"
                        strokeLinecap="round"
                    />

                    {/* The "Proven" Badge - A Checkmark Circle */}
                    <circle
                        cx="24"
                        cy="24"
                        r="7"
                        className="fill-background stroke-blue-600 dark:stroke-blue-500 stroke-[2]"
                    />
                    <path
                        d="M21.5 24L23 25.5L26.5 22"
                        className="stroke-blue-600 dark:stroke-blue-500 stroke-[2]"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            {/* The Text Brand */}
            {withText && (
                <div className="flex flex-col leading-none">
                    <span className="font-bold text-lg tracking-tight text-foreground">
                        Proven<span className="text-blue-600 dark:text-blue-500">Post</span>
                    </span>
                </div>
            )}
        </div>
    );
}
