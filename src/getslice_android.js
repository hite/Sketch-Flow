import sketch from 'sketch'
// documentation: https://developer.sketchapp.com/reference/api/
import dom from 'sketch/dom'
import UI from 'sketch/ui'
import Settings from 'sketch/settings'

import * as pluginUtils from './utils'

function importSliceToProjectFolder(layerNames, tempPath) {
    layerNames.forEach(function (layerName) {
        // 只支持一级，如 subject/subject_ok_ico_normal
        var parts = layerName.split('/')
        var dirName = ''
        var fileName = layerName
        if (parts.length === 2) {
            dirName = parts[0]
            fileName = parts[1]

            if (NSFileManager.defaultManager().fileExistsAtPath(tempPath + dirName)) {
                //
            } else {
                const succ = pluginUtils.createDir(tempPath + dirName)
                if (!succ) {
                    UI.message('Create module directory fails')
                    return
                }
            }
        } else if (parts.length === 1) { // 如果一级，subject_ok_ico_normal 读 artboard 的名字作为目录
            var document = context.document
            var page = document.currentPage()
            var artboard = page.currentArtboard()
            var artboardName = artboard.name()
            var english = /^[0-9A-Za-z]+$/
            if (english.test(artboardName)) { // true,說明有英文字母
                dirName = artboardName
            } else {
                log('artBoardName 不合法 ' + artboardName)
            }
        }

        // 文件名如 subject/subject_ok_ico_normal 导出为 subject/subject_ok_ico_normal@1x.png
        const exportedImageFilePath = tempPath + layerName + '@1x.png'
        // 把它移动到 Android 的目录下面，最后的文件名要加上目录；
        tryToMove(exportedImageFilePath, dirName, fileName)
    })
}

function tryToMove(sourcePath, dirName, fileName) {
    var projectRoot = pluginUtils.getAndroidProjectRoot() // 必须存在
    var destPath = projectRoot + '/' + (dirName === '' ? '' : (dirName + '_')) + fileName + '.png'
    // 先检查工程里，有没有这个 dirName 存在，不存则整个目录复制，否则只复制 imageset
    if (NSFileManager.defaultManager().fileExistsAtPath(destPath)) {
        // 给用户警告
        UI.getInputFromUser("Has same '" + destPath + "', should I override it?", {
            type: UI.INPUT_TYPE.selection,
            possibleValues: ['Yes, override it', 'Abort']
        }, (err, value) => {
            if (err) {
                // most likely the user canceled the input
                return
            }
            if (value === 'Yes, override it') {
                log('Remove old project imagesetPath, ' + destPath)
                NSFileManager.defaultManager().removeItemAtPath_error(destPath, nil)
                moveToProject(sourcePath, destPath, fileName)
            } else {
                log('用户遇到冲突后，放弃覆盖旧的图片' + destPath)
            }
        })
    } else {
        moveToProject(sourcePath, destPath, fileName)
    }
}

function moveToProject(sourcePath, destPath, fileName) {
    log('sourcePath, destPath')
    log(sourcePath)
    log(destPath)
    // moveItemAtPath 函数要求目标地址是不存在的
    if (NSFileManager.defaultManager().moveItemAtPath_toPath_error(sourcePath, destPath, nil)) {
        //
        UI.message('导入工程切片成功')
        const pb = NSPasteboard.generalPasteboard()
        pb.clearContents()
        pb.writeObjects([`@mipmap/${fileName}`])
    } else {
        UI.message('移动切片到工程失败')
        log('移动切片到工程失败')
    }
}

export function sliceAndroid() {
    const document = sketch.getSelectedDocument()
    const selectedLayers = document.selectedLayers
    const selectedCount = selectedLayers.length

    if (selectedCount === 0) {
        UI.alert('Warning', 'No layers are selected.')
    } else {
        pluginUtils.checkAndroidProjectRoot((projectRoot) => {
            if (projectRoot) {
                const layerNames = []
                const tempPath = pluginUtils.getPluginRoot() + '/temp/'
                selectedLayers.forEach(function (layer, i) {
                    const options = {
                        scales: '1.5',
                        formats: 'png',
                        output: tempPath
                    }
                    log(layer.id + ', name = ' + layer.name + ', option = ')
                    log(options)
                    // 导出时，1 倍名字为,layer.png, 1.5 倍的为 layer@1x.png，
                    // 因为 export 会对 1.x 命名时，只用 1，所以 1.2，1.3 同时存在的时候只有一个结果
                    dom.export(layer, options)
                    layerNames.push(layer.name)
                })
                // 所有导出都结束后，
                if (layerNames.length > 0) {
                    importSliceToProjectFolder(layerNames, tempPath)
                } else {
                    log('没导出图啊')
                }
            } else {
                log('projectRoot is null')
            }
        })
    }
}

export function resetProjectSettings() {
    Settings.setSettingForKey('project-root', '')
}