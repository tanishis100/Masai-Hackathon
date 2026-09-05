import type { ReactNode } from "react"

import { cn } from "./cn"

export type CardProps = {
  title: string
  href?: string
  className?: string
  children?: ReactNode
}

export function Card({ title, href, className, children }: CardProps) {
  const body = (
    <>
      <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
        {title}
        {href ? <span className="ml-1 text-brand-600">-&gt;</span> : null}
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{children}</p>
    </>
  )

  const classes = cn(
    "block rounded-lg border border-neutral-200 p-5 transition-colors dark:border-neutral-800",
    href && "hover:border-brand-500 hover:bg-neutral-50 dark:hover:bg-neutral-900",
    className,
  )

  if (href) {
    return (
      <a className={classes} href={href} rel="noopener noreferrer" target="_blank">
        {body}
      </a>
    )
  }

  return <div className={classes}>{body}</div>
}
