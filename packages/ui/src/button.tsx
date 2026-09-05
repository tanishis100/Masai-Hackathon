import type { ButtonHTMLAttributes } from "react"

import { cn } from "./cn"

const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600",
  secondary:
    "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus-visible:outline-neutral-400 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-700",
  ghost:
    "bg-transparent text-neutral-700 hover:bg-neutral-100 focus-visible:outline-neutral-400 dark:text-neutral-300 dark:hover:bg-neutral-800",
} as const

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
