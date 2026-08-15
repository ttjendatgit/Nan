/** Restrained architectural alignment grid for light-background homepage
 * sections -- 12 vertical rules at ~5% opacity, scoped to the same max-w-7xl
 * container as the section content. Desktop only (lg+); at narrower widths
 * it would just read as clutter. */
export default function EditorialGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-full max-w-7xl -translate-x-1/2 px-6 lg:block lg:px-12"
    >
      <div className="nan-grid-12 h-full w-full" />
    </div>
  );
}
