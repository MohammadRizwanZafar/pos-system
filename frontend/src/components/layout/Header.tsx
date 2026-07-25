"use client";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <header className="mb-5 flex flex-col gap-3 animate-fade-in sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl xl:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">{children}</div>
      )}
    </header>
  );
}
