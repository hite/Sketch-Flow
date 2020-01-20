import sketch from 'sketch'
// documentation: https://developer.sketchapp.com/reference/api/
import dom from 'sketch/dom'
import UI from 'sketch/ui'

import * as pluginUtils from './utils'

// 从 terminal 里输出，结合正则，在 sublime text 自动生成
// name 如果有前缀相同的，长的放前面，为了方便后面的重命名，如 icon-29-ipad, icon-29
const kIOSIconNames = [{
    name: 'icon-1024',
    size: 1024,
    idiom: 'ios-marketing'
}, {
    name: 'icon-20-ipad',
    size: 20
}, {
    name: 'icon-20@2x-ipad',
    size: 40
}, {
    name: 'icon-20@2x',
    size: 40
}, {
    name: 'icon-20@3x',
    size: 60
}, {
    name: 'icon-29-ipad',
    size: 58
}, {
    name: 'icon-29@2x-ipad',
    size: 58
}, {
    name: 'icon-29@2x',
    size: 58
}, {
    name: 'icon-29@3x',
    size: 87
}, {
    name: 'icon-29',
    size: 29
}, {
    name: 'icon-40@2x',
    size: 80,
    idiom: 'ipad'
}, {
    name: 'icon-40@3x',
    size: 120
}, {
    name: 'icon-40',
    size: 40,
    idiom: 'ipad'
}, {
    name: 'icon-60@2x',
    size: 120
}, {
    name: 'icon-60@3x',
    size: 180
}, {
    name: 'icon-76@2x',
    size: 152,
    idiom: 'ipad'
}, {
    name: 'icon-76',
    size: 76,
    idiom: 'ipad'
}, {
    name: 'icon-83.5@2x',
    size: 167,
    idiom: 'ipad'
}]

// 其他直角
const kOtherRect = [{
    name: '512x512',
    size: 512
}, {
    name: '256x256',
    size: 256
}, {
    name: '224x224',
    size: 224
}, {
    name: '192x192',
    size: 192
}, {
    name: '168x168',
    size: 168
}, {
    name: '144x144',
    size: 144
}, {
    name: '136x136',
    size: 136
}, {
    name: '90x90',
    size: 90
}]

// 其他圆角
const kOtherRoundRect = [{
    name: '256x256',
    size: 256
}, {
    name: '512x512',
    size: 512
}, {
    name: '216x216',
    size: 216
}, {
    name: '160x160',
    size: 160
}]

const kAndroidIconNames = [{
    name: 'android/all_ic_launcher',
    size: 1024
}, {
    name: 'android/app/mipmap-hdpi/all_ic_launcher',
    size: 192
}, {
    name: 'android/app/mipmap-mdpi/all_ic_launcher',
    size: 48
}, {
    name: 'android/app/mipmap-xhdpi/all_ic_launcher',
    size: 256
}, {
    name: 'android/app/mipmap-xxhdpi/all_ic_launcher',
    size: 384
}, {
    name: 'android/app/mipmap-xxxhdpi/all_ic_launcher',
    size: 512
}]

function doExportIcons(layer, scale, tempPath, fileName) {
    layer.name = fileName
    const scalses = '' + scale

    const options = {
        scales: scalses,
        formats: 'png',
        output: tempPath
    }
    options['save-for-web'] = true
    // log(options)

    dom.export(layer, options)
}

const kAppIconSet = 'AppIcon.appiconset'
const kHomePath = NSFileManager.defaultManager().homeDirectoryForCurrentUser().path()
export function exportIcons() {
    const document = sketch.getSelectedDocument()
    const selectedLayers = document.selectedLayers
    var selectedCount = selectedLayers.length

    if (selectedCount === 0) {
        UI.message('No layers are selected.')
        return
    }

    var layer = selectedLayers.layers[0]
    if (layer.type !== 'Artboard') {
        UI.message('请选择 artboard \\ 画板，再导出， type = ' + layer.type)
        return
    }

    // 利用 dom.export 原生提供的接口创建文件夹。不需要自己去创建文件夹；
    // 因为这个接口的行为是这样的：如果存在文件夹则使用，不存在则创建。不会清空旧的文件夹。
    const orginalLayerName = layer.name
    const exportDestination = '~/Documents/Sketch Exports/' + (orginalLayerName || 'yanxuanIcons') + '_appicon'

    if (NSFileManager.defaultManager().fileExistsAtPath(exportDestination)) {
        //
        log('删除导出文件：' + exportDestination)
        NSFileManager.defaultManager().removeItemAtPath_error(exportDestination, nil)
    }
    const nowSize = layer.frame.width // 当前尺寸
    // 1.先导出 iOS 直角图标
    const iosName = 'iOS/' + kAppIconSet
    kIOSIconNames.forEach(function (iconObj, idx) {
        const iconName = iconObj.name
        const fileName = iosName + '/' + iconName
        const scale = (iconObj.size / nowSize)
        doExportIcons(layer, scale, exportDestination, fileName)
    })
    // 重命名 ，icon-29@2x-ipad@0.1x.png =》 icon-29@2x-ipad@0.1x.png
    var homePath = NSFileManager.defaultManager().homeDirectoryForCurrentUser().path()
    const imagesDir = exportDestination.replace('~', homePath) + '/' + iosName
    renameAndCreateContentJS(kIOSIconNames, imagesDir)
    // 2.导出其它直角图标
    const otherRectDirName = '直角'
    kOtherRect.forEach(function (iconObj, idx) {
        const iconName = iconObj.name
        const fileName = otherRectDirName + '/' + iconName
        const scale = (iconObj.size / nowSize)
        doExportIcons(layer, scale, exportDestination, fileName)
    })
    renameImages(kOtherRect,
        exportDestination.replace('~', kHomePath) + '/' + otherRectDirName,
        function matchFunc1(oldName, pureName) {
            return oldName.includes(pureName)
        },
        function renameFunc1(oldName, pureName) {
            return pureName + '.png'
        }
    )
    // 加入遮罩
    addMaskToArtborad(layer)
    // 3.导出 Android 图标 ,先增加一个 mask
    const otherRoundRectDirName = '其他渠道（圆角）'
    kOtherRoundRect.forEach(function (iconObj, idx) {
        const iconName = iconObj.name
        const fileName = otherRoundRectDirName + '/' + iconName
        const scale = (iconObj.size / nowSize)
        doExportIcons(layer, scale, exportDestination, fileName)
    })
    // 重命名 ，160x160@0.1x.png =》 160x160.png
    renameImages(kOtherRoundRect, exportDestination.replace('~', kHomePath) + '/' + otherRoundRectDirName)
    // 4.导出 Android 图标 ,先增加一个 mask
    kAndroidIconNames.forEach(function (iconObj, idx) {
        const iconName = iconObj.name
        const fileName = iconName
        const scale = (iconObj.size / nowSize)
        doExportIcons(layer, scale, exportDestination, fileName)
    })
    // 重命名 ，all_ic_launcher@0.1x.png =》 all_ic_launcher.png, 1024 尺寸 all_ic_launcher 最特殊。
    // 现在是一个一个文件夹替换，一个文件夹下只有一个文件夹
    kAndroidIconNames.forEach(function (iconObj, idx) {
        var parts = iconObj.name.split('/')
        var orginalPureName = parts.pop()
        var subDir = '/' + parts.join('/')
        // log('sub dir ' + subDir)
        var newFileName = orginalPureName + '.png'
        if (iconObj.size === 1024) {
            newFileName = orginalPureName
        }
        renameImages(kAndroidIconNames,
            exportDestination.replace('~', kHomePath) + subDir,
            function matchFunc1(oldName, pureName) {
                return true
            },
            function renameFunc1(oldName, pureName) {
                return newFileName
            }
        )
    })
    // finally
    layer.name = orginalLayerName
    UI.message('导出完毕,请打开 ' + exportDestination)
    // spawnSync('/usr/bin/open', [exportDestination])
}

function renameAndCreateContentJS(imageNameObjs, templateImagesetPath) {
    if (imageNameObjs.length === 0) {
        return false
    }
    const names = kIOSIconNames.map(function (item, idx) {
        return item.name
    })
    var imageSets = []

    var files = NSFileManager.defaultManager().contentsOfDirectoryAtPath_error(templateImagesetPath, nil)
    log('templateImagesetPath:' + templateImagesetPath)
    if (files && files.length > 0) {
        files.forEach(function (fileName, idx) {
            // 从 imageNameObjs 获取正确的名字和尺寸，生成 contentJs
            log('match to : ' + fileName)
            for (let index = 0; index < names.length; index++) {
                const name = names[index]
                // 因为 export 的图片都带有 @0.1.png 这样的后缀
                if (fileName.includes(name + '@')) {
                    log('matched: ' + name)
                    // 找到了，先重命名
                    if (NSFileManager.defaultManager().moveItemAtPath_toPath_error(templateImagesetPath + '/' + fileName, templateImagesetPath + '/' + name + '.png', nil)) {
                        //
                        log('重命名成功' + fileName)
                    } else {
                        UI.message('重命名文件失败')
                        log('重命名文件失败，' + fileName)
                        continue
                    }
                    //
                    const nameObj = imageNameObjs[index]
                    const size = nameObj.size
                    const idiom = nameObj.idiom || 'iphone'

                    let scale = 1
                    if (name.includes('@2x')) {
                        scale = 2
                    } else if (name.includes('@3x')) {
                        scale = 3
                    }

                    imageSets.push(`
                        {
                            "size": "${size}x${size}",
                            "idiom": "${idiom}",
                            "filename": "${name}.png",
                            "scale": "${scale}x"
                        }
                    `)

                    break
                }
            }
        })
    }

    if (imageSets.length === 0 || imageSets.length !== imageNameObjs.length) {
        UI.message('重命名失败，终止')
        log('数量不匹配，' + imageNameObjs.length + ' ~= ' + imageSets.length)
        return
    }

    log('createContentJson, imagename')

    var optionContent = `{
            "images" : [
              ${imageSets.join(',') || ''}
            ],
            "info" : {
              "version" : 1,
              "author" : "xcode"
            }
          }`
    const contentsSucc = pluginUtils.writeFile({
        content: optionContent,
        path: templateImagesetPath,
        fileName: 'Contents.json'
    })
    if (!contentsSucc) {
        UI.message('Create Contents.json fails')
        log('Create Contents.json fails')
        return false
    }
    return true
}

function renameImages(imageNameObjs, templateImagesetPath, matchFunc, renameFunc) {
    if (imageNameObjs.length === 0) {
        return false
    }
    const names = imageNameObjs.map(function (item, idx) {
        return item.name
    })

    var files = NSFileManager.defaultManager().contentsOfDirectoryAtPath_error(templateImagesetPath, nil)
    log('templateImagesetPath:' + templateImagesetPath)
    if (files && files.length > 0) {
        files.forEach(function (fileName, idx) {
            // 是文件夹，跳过
            if (!fileName.includes('.png')) {
                log('skip directory, ' + fileName)
                return
            }
            // 从 imageNameObjs 获取正确的名字和尺寸
            log('match to : ' + fileName)
            for (let index = 0; index < names.length; index++) {
                const name = names[index]
                // 因为 export 的图片都带有 @0.1.png 这样的后缀
                if ((matchFunc && matchFunc(fileName, name)) || fileName.includes(name + '@')) {
                    log('matched: ' + name)
                    // 找到了，先重命名
                    var newImageName = null
                    if (typeof renameFunc === 'function') {
                        newImageName = renameFunc(fileName, name)
                    } else {
                        newImageName = name + '.png'
                    }
                    if (NSFileManager.defaultManager().moveItemAtPath_toPath_error(templateImagesetPath + '/' + fileName, templateImagesetPath + '/' + newImageName, nil)) {
                        //
                        log('重命名成功' + newImageName)
                    } else {
                        UI.message('重命名文件失败')
                        log('重命名文件失败，' + fileName)
                        continue
                    }

                    break
                }
            }
        })
    }

    return true
}

// https: //github.com/patrickhill/SketchAutoMask/blob/master/AutoMask.sketchplugin/Contents/Sketch/automask.cocoascript

function addMaskToArtborad(layer) {
    // 如果 artboard 下面有多个 layer 视为已经添加了 mask 层级，skip
    if (layer.layers.length > 1 || layer.layers.length === 0) {
        log('layer hiarachy error')
        log(layer)
        return
    }
    layer.selected = false
    // create a group 放图片和 mask
    var group = new dom.Group({
        name: 'mask-container',
        parent: layer
    })

    var rect = new dom.Rectangle(0, 0, layer.frame.width, layer.frame.height)
    var mask = new dom.Shape({
        name: 'mask',
        frame: rect,
        parent: group
    })
    // mask 在上面遮住
    layer.layers[0].parent = group

    group.adjustToFit()
    //
    mask.selected = true
    // set the mask property for the mask layer
    var newSelection = updateContext().selection[0]
    newSelection.hasClippingMask = true
    newSelection.clippingMaskMode = 0
    // 此后，产生了mask 的子元素，对子元素做圆角，不知为何对 mask 不能做圆角
    const nowSize = layer.frame.width
    // log(mask.layers) 
    mask.layers[0].points.forEach(function (point, idx) {
        log(162 / 1024 * nowSize)
        point.cornerRadius = 162 / 1024 * nowSize
    })
}

// use this function to force the context refresh.
// without it, the script won't see the selection change
function updateContext() {
    var doc = NSDocumentController.sharedDocumentController().currentDocument();
    var selection = null
    if (MSApplicationMetadata.metadata().appVersion > 41.2) {
        selection = doc.selectedLayers().layers()
    } else {
        selection = doc.selectedLayers()
    }

    return {
        doc: doc,
        selection: selection
    }
}