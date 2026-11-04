const jumps = [
  { label: '0%', to: 0 },
  { label: '50%', to: 0.5 },
  { label: '90%', to: 0.9 },
]

export function Controls({
  paused,
  onToggle,
  onSeek,
}: {
  paused: boolean
  onToggle: () => void
  onSeek: (to: number) => void
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
      <div className="flex items-center gap-2 rounded-xl border border-current p-1 pl-2">
        Go to
        {jumps.map(({ label, to }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSeek(to)}
            className="rounded-x cursor-pointer rounded-lg p-3 hover:bg-neutral-300"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
