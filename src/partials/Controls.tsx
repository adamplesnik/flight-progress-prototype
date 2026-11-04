const jumps = [
  { label: '0%', to: 0 },
  { label: '50%', to: 0.5 },
  { label: '90%', to: 0.9 },
]

export function Controls({
  paused,
  onToggle,
  onSeek,
  showCountryNames,
  onToggleCountryNames,
}: {
  paused: boolean
  onToggle: () => void
  onSeek: (to: number) => void
  showCountryNames: boolean
  onToggleCountryNames: () => void
}) {
  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={onToggle}
        className="w-24 cursor-pointer rounded-xl bg-black p-3 text-white hover:bg-neutral-700"
      >
        {paused ? 'Play' : 'Pause'}
      </button>
      <div className="flex items-center gap-2 rounded-xl border border-neutral-400 p-1 pl-2">
        Go to
        {jumps.map(({ label, to }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSeek(to)}
            className="cursor-pointer rounded-lg p-3 hover:bg-neutral-300"
          >
            {label}
          </button>
        ))}
        <div className="h-full w-px bg-neutral-400"></div>
        <button
          type="button"
          aria-pressed={showCountryNames}
          onClick={onToggleCountryNames}
          className="w-36 cursor-pointer rounded-lg p-3 hover:bg-neutral-300"
        >
          {showCountryNames ? 'Hide countries' : 'Show countries'}
        </button>
      </div>
    </div>
  )
}
