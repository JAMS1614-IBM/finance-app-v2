export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="state state-loading">
      {label}
    </div>
  );
}
