import { IconPlayerPauseFilled, IconPlayerPlayFilled } from './icons'
import type { RefObject } from 'react'

/** Play/pause and the slider that follows the flight and scrubs through it. */
export function PlaybackControls({
  paused,
  onToggle,
  onSeek,
  onScrubChange,
  sliderRef,
}: {
  paused: boolean
  onToggle: () => void
  onSeek: (to: number) => void
  /** The slider is being dragged: the flight holds still meanwhile. */
  onScrubChange: (scrubbing: boolean) => void
  /** The slider follows the animation through this ref, without re-rendering. */
  sliderRef: RefObject<HTMLInputElement | null>
}) {
  const startScrub = () => {
    onScrubChange(true)
    const end = () => {
      onScrubChange(false)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }
  const Icon = paused ? IconPlayerPlayFilled : IconPlayerPauseFilled

  return (
    <div className="controls">
      <input
        ref={sliderRef}
        type="range"
        min={0}
        max={100}
        step={0.1}
        defaultValue={0}
        aria-label="Flight progress"
        onChange={(e) => onSeek(e.target.valueAsNumber / 100)}
        onPointerDown={startScrub}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={paused ? 'Play' : 'Pause'}
      >
        <Icon size={36} />
      </button>
    </div>
  )
}
