import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const fieldClass =
  "w-full rounded-xl border border-mist bg-paper px-3 py-2.5 text-sm text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15";

export function Label({ children }: { children: string }) {
  return <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">{children}</label>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function Button({
  children,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-forest text-cream hover:bg-forest-dark",
    ghost: "bg-transparent text-forest hover:bg-mist/60",
    danger: "bg-clay text-white hover:bg-clay/90",
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-mist bg-paper p-5 shadow-card ${className}`}>{children}</section>;
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">{message}</div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-mist px-6 py-10 text-center">
      <p className="font-display text-lg text-forest">{title}</p>
      <p className="mt-1 text-sm text-ink/60">{body}</p>
    </div>
  );
}
