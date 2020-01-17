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
    // log(options)

    dom.export(layer, options)
}

function exportRectIcons(artboard, scale, exportDestination, fileName) {
    doExportIcons(artboard, scale, exportDestination, fileName)
}

function exportRoundRectIcons(artboard, scale, exportDestination, fileName) {
    doExportIcons(artboard, scale, exportDestination, fileName)
}

const kAppIconSet = 'AppIcon.appiconset'

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
        UI.message('请选择 artboard \\ 画板，再导出')
        return
    }

    // 利用 dom.export 原生提供的接口创建文件夹。不需要自己去创建文件夹；
    // 因为这个接口的行为是这样的：如果存在文件夹则使用，不存在则创建。不会清空旧的文件夹。
    const orginalLayerName = layer.name
    const exportDestination = '~/Documents/Sketch Exports/' + (orginalLayerName || 'yanxuanIcons')

    const nowSize = layer.frame.width // 当前尺寸
    // 先导出直角图标
    const iosName = 'iOS/' + kAppIconSet
    kIOSIconNames.forEach(function (iconObj, idx) {
        const iconName = iconObj.name
        const fileName = iosName + '/' + iconName
        const scale = (iconObj.size / nowSize)
        exportRectIcons(layer, scale, exportDestination, fileName)
    })
    // 重命名 ，icon-29@2x-ipad@0.1x.png =》 icon-29@2x-ipad@0.1x.png
    var homePath = NSFileManager.defaultManager().homeDirectoryForCurrentUser().path()
    const imagesDir = exportDestination.replace('~', homePath) + '/' + iosName
    renameAndCreateContentJS(kIOSIconNames, imagesDir)
    //     exportRoundRectIcons()

    // finally
    layer.name = orginalLayerName
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