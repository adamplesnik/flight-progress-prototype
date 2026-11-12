import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
} from '@tabler/icons-react'
import clsx from 'clsx'
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
    <div className="fp:flex fp:w-full fp:items-center fp:gap-2">
      <div className="fp:h-16 fp:min-h-0 fp:w-full fp:min-w-0 fp:sm:flex-1">
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
            'fp:h-full fp:w-full fp:cursor-pointer fp:touch-pan-y fp:appearance-none fp:bg-transparent fp:px-2',
            // The track's filled part: --value is set by the animation
            'fp:[--fill:linear-gradient(90deg,var(--fp-color-main)_var(--value),transparent_0)]',
            'fp:[&::-webkit-slider-runnable-track]:h-2',
            'fp:[&::-webkit-slider-runnable-track]:rounded-full',
            'fp:[&::-webkit-slider-runnable-track]:bg-container',
            'fp:[&::-webkit-slider-runnable-track]:bg-(image:--fill)',
            'fp:[&::-webkit-slider-thumb]:-mt-2.5',
            'fp:[&::-webkit-slider-thumb]:size-7',
            'fp:[&::-webkit-slider-thumb]:appearance-none',
            'fp:[&::-webkit-slider-thumb]:rounded-full',
            'fp:[&::-webkit-slider-thumb]:bg-main',
            'fp:[&::-moz-range-track]:h-2',
            'fp:[&::-moz-range-track]:rounded-full',
            'fp:[&::-moz-range-track]:bg-container',
            'fp:[&::-moz-range-progress]:h-2',
            'fp:[&::-moz-range-progress]:rounded-full',
            'fp:[&::-moz-range-progress]:bg-main',
            'fp:[&::-moz-range-thumb]:size-7',
            'fp:[&::-moz-range-thumb]:rounded-full',
            'fp:[&::-moz-range-thumb]:border-0',
            'fp:[&::-moz-range-thumb]:bg-main'
          )}
        />
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="fp:flex fp:h-16 fp:w-16 fp:shrink-0 fp:cursor-pointer fp:items-center fp:justify-center fp:rounded-full fp:font-medium fp:text-main fp:hover:bg-container"
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
