/** Web has no native AdMob module — always return null so AdBanner shows its placeholder. */
export function getAdSdk(): any | null {
  return null
}