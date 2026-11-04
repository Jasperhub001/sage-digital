import { useContext } from 'react'
import { SiteSettingsContext } from '../context/site-settings-context'

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
