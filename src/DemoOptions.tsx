import { useSearchParams } from 'react-router'

/** Each option: its label, and how it is kept in the address */
const OPTIONS = {
  compact: { label: 'Compact', param: 'variant', value: 'compact' },
  mockup: { label: 'Real world', param: 'mockup', value: '1' },
  night: { label: 'Night', param: 'night', value: '1' },
}

type Name = keyof typeof OPTIONS
export type Options = Record<Name, boolean>

/**
 * The demo's options, kept in the address so a link shows the same view:
 * ?variant=compact, ?mockup=1, ?night=1
 */
export function useDemoOptions() {
  const [params, setParams] = useSearchParams()
  const options = Object.fromEntries(
    Object.entries(OPTIONS).map(([name, { param, value }]) => [
      name,
      params.get(param) === value,
    ])
  ) as Options

  /** Turns an option on or off, keeping the others */
  const setOption = (name: Name, on: boolean) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        const { param, value } = OPTIONS[name]
        if (on) next.set(param, value)
        else next.delete(param)
        return next
      },
      { replace: true }
    )

  return [options, setOption] as const
}

/** The checkboxes beside the flight picker */
export function DemoOptions({
  options,
  onChange,
}: {
  options: Options
  onChange: (name: Name, on: boolean) => void
}) {
  return (
    <div className="demo-options">
      {(Object.keys(OPTIONS) as Name[]).map((name) => (
        <label key={name}>
          <input
            type="checkbox"
            checked={options[name]}
            onChange={(e) => onChange(name, e.target.checked)}
          />
          {OPTIONS[name].label}
        </label>
      ))}
    </div>
  )
}
