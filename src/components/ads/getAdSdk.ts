let cachedSdk: any | null | undefined

/**
 * Lazy-load the Google Mobile Ads SDK on native.
 * Expo Go has no native module, and `TurboModuleRegistry.getEnforcing` throws
 * on import — so we feature-detect via a guarded require and fall back to a
 * branded placeholder ad (recommended default).
 */
export function getAdSdk(): any | null {
  if (cachedSdk !== undefined) return cachedSdk
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedSdk = require('react-native-google-mobile-ads')
  } catch {
    cachedSdk = null
  }
  return cachedSdk
}