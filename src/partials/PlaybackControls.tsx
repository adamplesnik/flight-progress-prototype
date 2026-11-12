import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
} from '@tabler/icons-react'
import clsx from 'clsx'
import { Pause, Play } from 'lucide-react'
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

  return (
    <div className="flex w-full items-center gap-2">
      <div className="h-16 min-h-0 w-full min-w-0 sm:flex-1">
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
          className={clsx(
            'h-full w-full cursor-pointer touch-pan-y appearance-none bg-transparent px-2',
            // The track's filled part: --value is set by the animation
            '[--fill:linear-gradient(90deg,var(--color-main)_var(--value),transparent_0)]',
            '[&::-webkit-slider-runnable-track]:h-2',
            '[&::-webkit-slider-runnable-track]:rounded-full',
            '[&::-webkit-slider-runnable-track]:bg-container',
            '[&::-webkit-slider-runnable-track]:bg-(image:--fill)',
            '[&::-webkit-slider-thumb]:-mt-2.5',
            '[&::-webkit-slider-thumb]:size-7',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-main',
            '[&::-moz-range-track]:h-2',
            '[&::-moz-range-track]:rounded-full',
            '[&::-moz-range-track]:bg-container',
            '[&::-moz-range-progress]:h-2',
            '[&::-moz-range-progress]:rounded-full',
            '[&::-moz-range-progress]:bg-main',
            '[&::-moz-range-thumb]:size-7',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:bg-main'
          )}
        />
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full font-medium text-main hover:bg-container"
      >
        {paused ? (
          <IconPlayerPlayFilled size={36} />
        ) : (
          <IconPlayerPauseFilled size={36} />
        )}
      </button>
    </div>
  )
}
