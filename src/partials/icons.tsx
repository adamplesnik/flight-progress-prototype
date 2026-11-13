import type { SVGProps } from 'react'

/** The few icons the scene uses, from Tabler Icons (MIT), inlined as SVG. */

type IconProps = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & {
  size?: number | string
}

function outline({ size = 24, strokeWidth = 2, ...props }: IconProps) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  }
}

function filled({ size = 24, ...props }: IconProps) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    stroke: 'none',
    'aria-hidden': true,
    ...props,
  }
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <path d="M5 12l14 0" />
      <path d="M13 18l6 -6" />
      <path d="M13 6l6 6" />
    </svg>
  )
}

export function IconChevronDown(props: IconProps) {
  return (
    <svg {...outline(props)}>
      <path d="M6 9l6 6l6 -6" />
    </svg>
  )
}

export function IconPlayerPlayFilled(props: IconProps) {
  return (
    <svg {...filled(props)}>
      <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
    </svg>
  )
}

export function IconPlayerPauseFilled(props: IconProps) {
  return (
    <svg {...filled(props)}>
      <path d="M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" />
      <path d="M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" />
    </svg>
  )
}
