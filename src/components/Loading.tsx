export default function Loading({ label = 'Učitavanje...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-black/40 font-cond tracking-wider uppercase text-sm">
      {label}
    </div>
  );
}
