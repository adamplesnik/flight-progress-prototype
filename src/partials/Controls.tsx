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
    <div className="flex gap-2 items-stretch">
      <button type="button" onClick={onToggle} className="primary">
        {paused ? 'Play' : 'Pause'}
      </button>
      <div className="buttons-wrapper">
        Go to
        {jumps.map(({ label, to }) => (
          <button key={label} type="button" onClick={() => onSeek(to)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
