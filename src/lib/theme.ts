/** 'system' follows the viewer's light or dark setting */
export type Theme = 'light' | 'dark' | 'system'

/** The theme as the attribute style.css switches the colours on */
export const themeAttribute = (theme: Theme = 'system') => ({
  'data-theme': theme === 'system' ? undefined : theme,
})
