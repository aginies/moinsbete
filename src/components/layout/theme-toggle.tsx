'use client'

import { Moon, Sun } from 'lucide-react'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export function ThemeToggle() {
  const t = useTranslations('nav')
  const [theme, setTheme] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }
    return 'light'
  })

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark')
    try {
      localStorage.setItem('theme', newTheme)
    } catch {
      // Ignore storage errors
    }
  }, [theme])

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t('change_theme')}>
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
