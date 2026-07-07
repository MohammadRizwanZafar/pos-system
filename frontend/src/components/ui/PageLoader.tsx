export default function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
