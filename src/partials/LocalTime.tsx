export function LocalTime({ clock }: { clock: string }) {
  return (
    <time className="local-time" dateTime={clock}>
      {clock}
    </time>
  )
}
