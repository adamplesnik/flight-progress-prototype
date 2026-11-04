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
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        className="w-24 cursor-pointer rounded-xl bg-gray-900 px-4 py-3 font-medium text-white hover:bg-gray-700"
      >
        {paused ? 'Play' : 'Pause'}
      </button>
      <div className="flex items-center gap-2 rounded-xl border border-gray-400/60 p-1 pl-2">
        Go to
        {jumps.map(({ label, to }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSeek(to)}
            className="cursor-pointer rounded-lg px-3 py-2 hover:bg-gray-300"
          >
            {label}
          </button>
        ))}
        <div className="h-6 w-px bg-gray-400"></div>
        <button
          type="button"
          aria-pressed={showCountryNames}
          onClick={onToggleCountryNames}
          className="w-48 cursor-pointer rounded-lg px-3 py-2 hover:bg-gray-300"
        >
          {showCountryNames ? 'Hide country names' : 'Show country names'}
        </button>
      </div>
    </div>
  )
}
