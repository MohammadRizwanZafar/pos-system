"use client";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 animate-fade-in sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-3">{children}</div>
      )}
    </header>
  );
}
