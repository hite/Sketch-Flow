// documentation: https://developer.sketchapp.com/reference/api/

import UI from 'sketch/ui'
import Settings from 'sketch/settings'

const kProjectRootForIOSKey = 'kProjectRootForIOSKey'
const kProjectRootForAndroidKey = 'kProjectRootForIOSKey'

function checkProjectRoot(key, callback) {
    var projectRoot = Settings.settingForKey(key)
    if (!projectRoot || projectRoot.length === 0) {
        UI.getInputFromUser(
            `The root of your ${key === kProjectRootForIOSKey ? 'iOS' : 'Android'} project`, {
                initialValue: key === kProjectRootForIOSKey ? '/Users/userName/App/Assets.xcassets/' : '/Users/userName/App/res/mipmap-xxhdpi'
            },
            (err, value) => {
                if (err) {
                    // most likely the user canceled the input
                    callback(null)
                    return
                }
                Settings.setSettingForKey(key, value)
                callback(projectRoot)
            }
        )
    } else {
        callback(projectRoot)
    }
}

export function createDir(path) {
    return NSFileManager.defaultManager().createDirectoryAtPath_withIntermediateDirectories_attributes_error(
        path,
        true,
        nil,
        nil
    )
}

export function getIOSProjectRoot() {
    var projectRoot = Settings.settingForKey(kProjectRootForIOSKey)
    return projectRoot
}

export function getAndroidProjectRoot() {
    var projectRoot = Settings.settingForKey(kProjectRootForAndroidKey)
    return projectRoot
}

export function writeFile(options) {
    var content = NSString.stringWithString(options.content),
        savePathName = []

    NSFileManager.defaultManager().createDirectoryAtPath_withIntermediateDirectories_attributes_error(
        options.path,
        true,
        nil,
        nil
    )
    savePathName.push(options.path, '/', options.fileName)
    savePathName = savePathName.join('')

    return content.writeToFile_atomically_encoding_error(savePathName, false, 4, null)
}

export function getPluginRoot() {
    const scriptPath = NSString.stringWithString(context.scriptPath)
    const pluginRoot = scriptPath
        .stringByDeletingLastPathComponent()
    return pluginRoot
}

function checkIOSProjectRoot(callback) {
    checkProjectRoot(kProjectRootForIOSKey, callback)
}

function checkAndroidProjectRoot(callback) {
    checkProjectRoot(kProjectRootForAndroidKey, callback)
}

function resetProjectSettings() {
    Settings.setSettingForKey(kProjectRootForIOSKey, '')
    Settings.setSettingForKey(kProjectRootForAndroidKey, '')
}

export {
    checkIOSProjectRoot,
    checkAndroidProjectRoot,
    resetProjectSettings
}