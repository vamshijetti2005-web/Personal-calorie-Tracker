import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-3xl border border-stone-200/80 bg-white p-5 shadow-[0_12px_45px_-24px_rgba(25,61,52,0.32)] ${className}`}
    >
      {children}
    </section>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
      {children}
    </label>
  )
}

const fieldClass =
  'w-full rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:bg-white focus:ring-3 focus:ring-emerald-700/10'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${fieldClass} ${props.className ?? ''}`} />
  )
}

export function Button({
  variant = 'primary',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const colors = {
    primary: 'bg-emerald-900 text-white hover:bg-emerald-800',
    secondary:
      'border border-stone-200 bg-white text-stone-700 hover:border-emerald-700 hover:text-emerald-900',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100',
  }[variant]

  return (
    <button
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${colors} ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
          {eyebrow}
        </p>
        <h1 className="font-display text-4xl leading-tight text-emerald-950 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
          {description}
        </p>
      </div>
      {action}
    </header>
  )
}

export function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {error}
    </div>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 px-6 py-10 text-center">
      <p className="font-display text-xl text-emerald-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
        {description}
      </p>
    </div>
  )
}

export function LoadingBlock() {
  return (
    <div className="grid min-h-48 place-items-center text-sm text-stone-400">
      Loading…
    </div>
  )
}
