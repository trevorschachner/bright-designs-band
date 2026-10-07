import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * False during SSR and hydration, true afterwards. Replaces the
 * `useEffect(() => setMounted(true), [])` gate without a set-state-in-effect.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false)
}
