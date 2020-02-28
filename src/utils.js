// documentation: https://developer.sketchapp.com/reference/api/

import UI from 'sketch/ui'
import Settings from 'sketch/settings'

const kProjectRootForIOSKey = 'kProjectRootForIOSKey'
const kProjectRootForAndroidKey = 'kProjectRootForAndroidKey'
const kIOSIconTemplateKey = 'kIOSIconTemplateKey'
const kAndroidIconTemplateKey = 'kAndroidIconTemplateKey'
const kIOSCodeTemplateKey = 'kIOSCodeTemplateKey'
const kAndroidCodeTemplateKey = 'kAndroidCodeTemplateKey'

function checkProjectRoot(key, callback) {
    var path = Settings.settingForKey(key)
    if (!path || path.length === 0) {
        showConfigs()
    } else {
        if (path === null || path === '') {
            callback(null)
            return
        }
        // 说明是工程的真实目录，需要必须存在
        var isIOS = (key === kProjectRootForIOSKey)

        if (isIOS && path.indexOf('/Assets.xcassets') > -1) {
            if (!NSFileManager.defaultManager().fileExistsAtPath(path)) {
                log('iOS 的工程路径不存在，' + path)
                UI.alert('Warning', '"' + path + '" does not exsit.')
                path = null
            }
        } else if (!isIOS && path.indexOf('/res/mipmap-xxhdpi') > -1) {
            if (!NSFileManager.defaultManager().fileExistsAtPath(path)) {
                UI.alert('Warning', '"' + path + '" doesn`t exsit.')
                log('Android 的工程路径不存在，' + path)
                path = null
            }
        } else {
            // 如果不存在，帮助自动创建一个
            if (!NSFileManager.defaultManager().fileExistsAtPath(path)) {
                const succ = createDir(path)
                if (!succ) {
                    UI.message('Create project root fails')
                    path = null
                } else {
                    log('自动创建目录：' + path)
                    // 同时保持到配置里
                    Settings.setSettingForKey(kProjectRootForIOSKey, path)
                }
            }
        }

        callback(path)
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
export function moveToProject(sourcePath, destPath, onsuccess) {
    log('sourcePath, destPath')
    log(sourcePath)
    log(destPath)
    // moveItemAtPath 函数要求目标地址是不存在的
    if (NSFileManager.defaultManager().moveItemAtPath_toPath_error(sourcePath, destPath, nil)) {
        //
        UI.message('导入工程切片成功，保存路径：' + destPath)
        if (typeof onsuccess === 'function') {
            onsuccess(destPath)
        }
    } else {
        UI.message('移动切片到工程失败')
        log('移动切片到工程失败')
    }
}

function createLabel(title, x, y, width, height) {
    var infoLabel = NSTextField.alloc().initWithFrame(NSMakeRect(x, y, width, height))

    infoLabel.setSelectable(false)
    infoLabel.setEditable(false)
    infoLabel.setBezeled(false)
    infoLabel.setDrawsBackground(false)
    infoLabel.setStringValue(title)
    return infoLabel
}

export function getIOSIconNameTemplate() {
    var iOSIconNamePattern = Settings.settingForKey(kIOSIconTemplateKey)
    log('iOSIconNamePattern : ' + iOSIconNamePattern)
    return iOSIconNamePattern || 'YXSpecImage($iconName)'
}

export function getAndroidIconNameTemplate() {
    var androidIconNamePattern = Settings.settingForKey(kAndroidIconTemplateKey)
    return androidIconNamePattern || '@mipmap/$iconName'
}

export function getIOSCodeTemplate() {
    var iOSCodePattern = Settings.settingForKey(kIOSCodeTemplateKey)
    return iOSCodePattern || 'YXCode_$codeName'
}

export function getAndroidCodeTemplate() {
    var androidCodePattern = Settings.settingForKey(kAndroidCodeTemplateKey)
    return androidCodePattern || 'YXCode_$codeName'
}

export function showConfigs() {
    var alert = COSAlertWindow.new()
    alert.setMessageText('Configure plugin`s settings')
    alert.addButtonWithTitle('OK')
    alert.addButtonWithTitle('Cancel')

    // Create the main view
    var viewWidth = 500
    var viewHeight = 360
    var minusSomeWidth = 100 // 因为 alert window 上左侧 sketch 的 log 占去了一些位置。所以要去掉
    var elementWidth = viewWidth - minusSomeWidth
    var availableHeight = viewHeight - 12 // 30 是顶部 title 占的位置，而且很奇怪的是，它的顺序是从下到上的？？？？
    //
    var sectionHeight = 60
    var sectionLabelHeight = 20
    var sectionTextFieldHeight = 30
    var view = NSView.alloc().initWithFrame(NSMakeRect(0, 0, viewWidth, viewHeight))
    alert.addAccessoryView(view)

    var sectionIndex = 0
    // 设置 iOS 的 配置；
    var infoLabel = createLabel('1️⃣ The images directory of your iOS project : ', 0, availableHeight - sectionIndex * sectionHeight - 8, elementWidth, sectionLabelHeight)
    sectionIndex++
    view.addSubview(infoLabel)

    var horizontalTextField = NSTextView.alloc().initWithFrame(NSMakeRect(0, availableHeight - sectionIndex * sectionHeight + sectionLabelHeight, elementWidth, sectionTextFieldHeight))
    var iosRootPath = Settings.settingForKey(kProjectRootForIOSKey)
    horizontalTextField.setString(iosRootPath || 'e.g /Users/userName/YourApp/Assets.xcassets/')
    horizontalTextField.setVerticallyResizable(false)
    view.addSubview(horizontalTextField)

    // 设置 Android 的 配置；
    var infoLabel2 = createLabel('2️⃣ The images directory of your Android project: ', 0, availableHeight - sectionIndex * sectionHeight - 8, elementWidth, sectionLabelHeight)
    sectionIndex++
    view.addSubview(infoLabel2)

    var androidPathField = NSTextView.alloc().initWithFrame(NSMakeRect(0, availableHeight - sectionIndex * sectionHeight + sectionLabelHeight, elementWidth, sectionTextFieldHeight))
    var androidRootPath = Settings.settingForKey(kProjectRootForAndroidKey)
    androidPathField.setString(androidRootPath || 'e.g /Users/userName/YourApp/res/mipmap-xxhdpi')
    androidPathField.setVerticallyResizable(false)
    horizontalTextField.setNextKeyView(androidPathField)

    view.addSubview(androidPathField)

    // 设置 生成 iOS 样式代码的 配置；
    var infoLabel3 = createLabel('3️⃣ Configure iOS icon name template: ', 0, availableHeight - sectionIndex * sectionHeight - 8, elementWidth, sectionLabelHeight)
    sectionIndex++
    view.addSubview(infoLabel3)

    var iOSIconName = NSTextView.alloc().initWithFrame(NSMakeRect(0, availableHeight - sectionIndex * sectionHeight + sectionLabelHeight, elementWidth, sectionTextFieldHeight))
    iOSIconName.setString(getIOSIconNameTemplate())
    iOSIconName.setVerticallyResizable(false)
    view.addSubview(iOSIconName)
    // 设置 Android 样式代码的 配置
    var infoLabel4 = createLabel('4️⃣ Configure Android icon name template: ', 0, availableHeight - sectionIndex * sectionHeight - 8, elementWidth, sectionLabelHeight)
    sectionIndex++
    view.addSubview(infoLabel4)

    var androidIconName = NSTextView.alloc().initWithFrame(NSMakeRect(0, availableHeight - sectionIndex * sectionHeight + sectionLabelHeight, elementWidth, sectionTextFieldHeight))
    androidIconName.setString(getAndroidIconNameTemplate())
    androidIconName.setVerticallyResizable(false)
    view.addSubview(androidIconName)

    // 设置 生成 iOS 样式代码的 配置；
    var infoLabel5 = createLabel('5️⃣ Configure iOS code template: ', 0, availableHeight - sectionIndex * sectionHeight - 8, elementWidth, sectionLabelHeight)
    sectionIndex++
    view.addSubview(infoLabel5)

    var iOSCodeTemplate = NSTextView.alloc().initWithFrame(NSMakeRect(0, availableHeight - sectionIndex * sectionHeight + sectionLabelHeight, elementWidth, sectionTextFieldHeight))
    iOSCodeTemplate.setString(getIOSCodeTemplate())
    iOSCodeTemplate.setVerticallyResizable(false)
    view.addSubview(iOSCodeTemplate)
    // 设置 Android 样式代码的 配置
    var infoLabel6 = createLabel('6️⃣ Configure Android code template: ', 0, availableHeight - sectionIndex * sectionHeight - 8, elementWidth, sectionLabelHeight)
    sectionIndex++
    view.addSubview(infoLabel6)

    var androidCodeTemplate = NSTextView.alloc().initWithFrame(NSMakeRect(0, availableHeight - sectionIndex * sectionHeight + sectionLabelHeight, elementWidth, sectionTextFieldHeight))
    androidCodeTemplate.setString(getAndroidCodeTemplate())
    androidCodeTemplate.setVerticallyResizable(false)
    view.addSubview(androidCodeTemplate)

    var response = alert.runModal()
    log(response)
    if (response === 1000) {
        var iosRootPathNew = horizontalTextField.string()
        if (iosRootPathNew.length() > 0 && !iosRootPathNew.includes('e.g ')) {
            Settings.setSettingForKey(kProjectRootForIOSKey, iosRootPathNew)
        }

        var andoirdRootPathNew = androidPathField.string()
        if (andoirdRootPathNew.length() > 0 && !andoirdRootPathNew.includes('e.g ')) {
            Settings.setSettingForKey(kProjectRootForAndroidKey, andoirdRootPathNew)
        }

        //
        var iOSIconNameNew = iOSIconName.string()
        if (iOSIconNameNew.length() > 0) {
            Settings.setSettingForKey(kIOSIconTemplateKey, iOSIconNameNew)
        }

        var androidIconNameNew = androidIconName.string()
        if (androidIconNameNew.length() > 0) {
            Settings.setSettingForKey(kAndroidIconTemplateKey, androidIconNameNew)
        }
        //
        var iOSCodePatternNew = iOSCodeTemplate.string()
        if (iOSCodePatternNew.length() > 0) {
            Settings.setSettingForKey(kIOSCodeTemplateKey, iOSCodePatternNew)
        }
        var androidCodePatternNew = androidCodeTemplate.string()
        if (androidCodePatternNew.length() > 0) {
            Settings.setSettingForKey(kAndroidCodeTemplateKey, androidCodePatternNew)
        }
        log('configurations are changed.')
    } else {
        log('cancelled')
    }
}

function checkIOSProjectRoot(callback) {
    checkProjectRoot(kProjectRootForIOSKey, callback)
}

function checkAndroidProjectRoot(callback) {
    checkProjectRoot(kProjectRootForAndroidKey, callback)
}

export {
    checkIOSProjectRoot,
    checkAndroidProjectRoot
}