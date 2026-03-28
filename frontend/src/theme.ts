import { createTheme } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'

export type AppThemeMode = PaletteMode  // 'dark' | 'light'

export function createAppTheme(mode: AppThemeMode) {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      background: {
        default: isDark ? '#1a1a1a' : '#f4f4f6',
        paper:   isDark ? '#242424' : '#ffffff',
      },
      divider: isDark ? '#3a3a3a' : '#e0e0e0',
      primary: {
        main: '#7c6af7',
      },
      text: {
        primary:   isDark ? '#dcdcdc' : '#1a1a1a',
        secondary: isDark ? '#888888' : '#5a5a6a',
      },
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 15,
      h6: {
        fontSize: '1.15rem',
        fontWeight: 600,
      },
      subtitle1: {
        fontSize: '1rem',
      },
      subtitle2: {
        fontSize: '0.9rem',
        fontWeight: 600,
      },
      body1: {
        fontSize: '0.95rem',
      },
      body2: {
        fontSize: '0.875rem',
      },
      caption: {
        fontSize: '0.8rem',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderColor: isDark ? '#3a3a3a' : '#e0e0e0',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& fieldset':       { borderColor: isDark ? '#3a3a3a' : '#d0d0d8' },
            '&:hover fieldset': { borderColor: isDark ? '#666666' : '#9990f0' },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none' },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontSize: '0.75rem' },
        },
      },
    },
  })
}
