import type { ButtonHTMLAttributes } from "react"

import { cn } from "./cn"

const variants = {
  primary:
    "bg-neutral-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] hover:bg-neutral-800 focus-visible:outline-brand-600 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200",
  secondary:
    "border border-neutral-200 bg-white/75 text-neutral-900 shadow-sm backdrop-blur hover:bg-white focus-visible:outline-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/75 dark:text-neutral-50 dark:hover:bg-neutral-900",
  ghost:
    "bg-transparent text-neutral-700 hover:bg-white/70 focus-visible:outline-neutral-400 dark:text-neutral-300 dark:hover:bg-neutral-900/70",
} as const

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        "rounded-full",
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
