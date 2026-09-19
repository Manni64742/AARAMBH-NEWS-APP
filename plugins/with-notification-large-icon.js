const { withAndroidManifest } = require('@expo/config-plugins')

/**
 * Config plugin that ensures the Android notification Large Icon metadata
 * points to the app's full-color launcher icon (@mipmap/ic_launcher).
 * This makes expanded notifications display the actual Aarambh News app icon.
 */
module.exports = function withNotificationLargeIcon(config) {
  return withAndroidManifest(config, async (manifestConfig) => {
    const mainApplication = manifestConfig.modResults.manifest.application?.[0]
    if (!mainApplication) return manifestConfig

    if (!mainApplication['meta-data']) {
      mainApplication['meta-data'] = []
    }

    // Remove any existing large_notification_icon entry
    mainApplication['meta-data'] = mainApplication['meta-data'].filter(
      (item) => item.$?.['android:name'] !== 'expo.modules.notifications.large_notification_icon'
    )

    // Set large icon to the app's ic_launcher
    mainApplication['meta-data'].push({
      $: {
        'android:name': 'expo.modules.notifications.large_notification_icon',
        'android:resource': '@mipmap/ic_launcher',
      },
    })

    return manifestConfig
  })
}
