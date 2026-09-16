const { withDangerousMod } = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')

module.exports = function withGradleDownloadTimeout(config) {
  return withDangerousMod(config, [
    'android',
    async (androidConfig) => {
      const wrapperProps = path.join(androidConfig.modRequest.projectRoot, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties')
      if (!fs.existsSync(wrapperProps)) return androidConfig
      let content = fs.readFileSync(wrapperProps, 'utf8')
      const hasKey = (key) => new RegExp(`(^|\\s)${key}=`).test(content)
      content = content
        .replace(/\bconnectTimeout=-?\d+/g, 'connectTimeout=300000')
        .replace(/\bnetworkTimeout=-?\d+/g, 'networkTimeout=600000')
      if (!hasKey('networkTimeout')) content = `${content.trim()}\nnetworkTimeout=600000\n`
      if (!hasKey('connectTimeout')) content = `${content.trim()}\nconnectTimeout=300000\n`
      fs.writeFileSync(wrapperProps, content)
      return androidConfig
    },
  ])
}