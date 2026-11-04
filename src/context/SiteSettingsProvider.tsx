import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { SITE_SETTINGS_DEFAULTS } from '../config/siteDefaults'
import { buildSocialLinks } from '../lib/settings/mappers'
import { getPublicSiteSettings } from '../services/siteSettingsService'
import type { SiteSettings } from '../types/siteSettings'
import {
  SiteSettingsContext,
  type SiteSettingsContextValue,
} from './site-settings-context'

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(SITE_SETTINGS_DEFAULTS)
  const [usingDefaults, setUsingDefaults] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    void getPublicSiteSettings()
      .then((result) => {
        if (cancelled) return
        setSettings(result.settings)
        setUsingDefaults(result.source === 'defaults')
      })
      .catch(() => {
        if (cancelled) return
        setSettings(SITE_SETTINGS_DEFAULTS)
        setUsingDefaults(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<SiteSettingsContextValue>(
    () => ({
      settings,
      socialLinks: buildSocialLinks(settings),
      isLoading,
      usingDefaults,
    }),
    [settings, isLoading, usingDefaults],
  )

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  )
}
