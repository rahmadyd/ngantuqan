/**
 * The admin's loading state.
 *
 * This boundary does more than draw a skeleton: it stops the sidebar's
 * prefetching from rendering every section in the background. Without it,
 * opening the dashboard rendered all thirteen sections — each with its own
 * database queries — before the first section was even on screen.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-md bg-surface-sunken" />
        <div className="h-4 w-72 rounded-md bg-surface-sunken" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-lg bg-surface-sunken" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-lg bg-surface-sunken" />
        <div className="h-72 rounded-lg bg-surface-sunken" />
      </div>
    </div>
  );
}
