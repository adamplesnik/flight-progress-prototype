import clsx from 'clsx'
import type { RefObject } from 'react'

/** Play/pause, the map style switch and the slider that follows the flight and scrubs through it. */
export function PlaybackControls({
  paused,
  onToggle,
  grayMap,
  onToggleGrayMap,
  onSeek,
  onScrubChange,
  sliderRef,
}: {
  paused: boolean
  onToggle: () => void
  /** Gray land on a white sea instead of light land on a gray sea */
  grayMap: boolean
  onToggleGrayMap: () => void
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
    <div className="flex w-full flex-col gap-2 sm:flex-row">
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="h-12 w-24 shrink-0 cursor-pointer rounded-xl bg-gray-900 px-4 font-medium text-white hover:bg-gray-700"
        >
          {paused ? 'Play' : 'Pause'}
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={grayMap}
          onClick={onToggleGrayMap}
          className="group flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-gray-400/60 px-3 font-medium hover:bg-gray-300/60"
        >
          <span
            className={clsx(
              'relative h-6 w-10 rounded-full transition-colors',
              grayMap ? 'bg-gray-900' : 'bg-gray-400/60'
            )}
          >
            <span
              className={clsx(
                'absolute top-1 left-1 size-4 rounded-full bg-white transition-transform',
                grayMap && 'translate-x-4'
              )}
            />
          </span>
          Gray land
        </button>
      </div>
      <div className="h-12 min-w-0 flex-1 rounded-xl border border-gray-400/60">
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
            '[--fill:linear-gradient(90deg,var(--color-gray-900)_var(--value),transparent_0)]',
            '[&::-webkit-slider-runnable-track]:h-2',
            '[&::-webkit-slider-runnable-track]:rounded-full',
            '[&::-webkit-slider-runnable-track]:bg-gray-400/60',
            '[&::-webkit-slider-runnable-track]:bg-(image:--fill)',
            '[&::-webkit-slider-thumb]:-mt-2.5',
            '[&::-webkit-slider-thumb]:size-7',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-gray-900',
            '[&::-moz-range-track]:h-2',
            '[&::-moz-range-track]:rounded-full',
            '[&::-moz-range-track]:bg-gray-400/60',
            '[&::-moz-range-progress]:h-2',
            '[&::-moz-range-progress]:rounded-full',
            '[&::-moz-range-progress]:bg-gray-900',
            '[&::-moz-range-thumb]:size-7',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:bg-gray-900'
          )}
        />
      </div>
    </div>
  )
}
