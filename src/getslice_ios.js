import sketch from 'sketch'
// documentation: https://developer.sketchapp.com/reference/api/
import dom from 'sketch/dom'
import UI from 'sketch/ui'

import * as pluginUtils from './utils'

function importSliceToProjectFolder(layerNames, tempPath) {
    var existed = []
    layerNames.forEach(function (name) {
        // 去重
        const composeObj = createTemplateImageSet(name, tempPath)
        if (composeObj && composeObj.length > 0 && !existed.includes(composeObj)) {
            existed.push(composeObj)
        }
    })
    // log('existed')
    // 此次截图生成的 2x3x 图
    for (let i = 0; i < existed.length; i++) {
        var composeParts = existed[i].split(',')
        var fileName = composeParts[1]
        var dirName = composeParts[0]
        const sourceDirPath = tempPath + dirName
        const imagesetPath = sourceDirPath + `/${fileName}.imageset`
        // 读取此次生成的文件，生成 Contents.json 下面的文件；
        var newImageNames = [];
        [`${fileName}@2x.png`, `${fileName}@3x.png`].forEach((imageName) => {
            const filePath = imagesetPath + '/' + imageName
            log('Contents.json 查询， ' + filePath)
            if (NSFileManager.defaultManager().fileExistsAtPath(filePath)) {
                newImageNames.push(imageName)
            } else {
                log(imageName + ' 没找到不存在')
            }
        })

        // 生成 contentjs 文件

        if (createContentJson(newImageNames, imagesetPath)) {
            // 把整个 subject 或者 imageset 目录移动到 projectRoot 下；
            tryToMove(sourceDirPath, dirName, fileName)
        } else {
            log('createContentJson fail')
        }
    }
}

function createContentJson(imageNames, templateImagesetPath) {
    if (imageNames.length === 0) {
        return false
    }
    var image2x = null
    var image3x = null
    log('createContentJson, imagename')
    log(imageNames)
    imageNames.forEach((name) => {
        if (name.includes('@2x')) {
            image2x = `{
                    "idiom" : "universal",
                    "filename" : "${name}",
                    "scale" : "2x"
                  },`
        } else if (name.includes('@3x')) {
            image3x = `{
                    "idiom" : "universal",
                    "filename" : "${name}",
                    "scale" : "3x"
                  },`
        }
    })
    var optionContent = `{
            "images" : [
              {
                "idiom" : "universal",
                "scale" : "1x"
              },
              ${image2x || ''}
              ${image3x || ''}
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

function createTemplateImageSet(layerName, tempPath) {
    // 只支持一级，如 subject/subject_ok_ico_normal
    var parts = layerName.split('/')
    var sourceDirPath = '',
        dirName = ''
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

    sourceDirPath = tempPath + dirName
    // 把文件名如 subject_ok_ico_normal@2x
    const fileNameParts = fileName.split('@')
    if (fileNameParts.length === 2) {
        fileName = fileNameParts[0]
    }
    log('filename ' + fileName + ',layerName = ' + layerName)
    // imageset 的名字用新名字（加目录之后的名字），里面图片的名字用新名字；
    const newFileName = (dirName === '' ? '' : (dirName + '_')) + fileName
    // 先生成 .imageset 文件夹
    const templateImagesetPath = sourceDirPath + `/${newFileName}.imageset/`
    if (NSFileManager.defaultManager().fileExistsAtPath(templateImagesetPath)) {
        log('old templateImagesetPath have been exsited, ' + templateImagesetPath)
    } else {
        const succ = pluginUtils.createDir(templateImagesetPath)
        if (!succ) {
            UI.message('Create templateImagesetPath directory fails,' + templateImagesetPath)
            return
        }
    }

    log('临时目录下生成的 ImagesetPath；')
    log(templateImagesetPath)
    //
    var exportedSuffixs = ['.png', '@1x.png'] // 如 layername = layer;
    if (/@2x$/.test(layerName)) { // 如 layername = layer@2x;
        exportedSuffixs = ['@2x.png']
    } else if (/@3x$/.test(layerName)) { // 如 layername = layer@3x;
        exportedSuffixs = ['@3x.png']
    }
    // 找到所以同名的图片；
    var existed = []

    exportedSuffixs.forEach((exportedSuffix) => {
        const oldFileName = fileName + exportedSuffix
        const filePath = tempPath + '/' + oldFileName
        log('exported filepath ' + filePath)
        if (NSFileManager.defaultManager().fileExistsAtPath(filePath)) {
            // 移动到 templateImagesetPath 目录下
            var newSuffix = exportedSuffix
            if (exportedSuffix === '.png' || exportedSuffix === '@1x.png') { // 如 layername = layer;
                newSuffix = (exportedSuffix === '.png' ? '@2x.png' : '@3x.png')
            }
            const newFilePath = templateImagesetPath + '/' + newFileName + newSuffix
            // 删除旧的 2x3x 图
            if (NSFileManager.defaultManager().fileExistsAtPath(newFilePath)) {
                //
                log('删除旧2x3x 图：' + newFileName)
                NSFileManager.defaultManager().removeItemAtPath_error(newFilePath, nil)
            }
            if (NSFileManager.defaultManager().moveItemAtPath_toPath_error(filePath, newFilePath, nil)) {
                //
                existed.push(newFileName)
            } else {
                log('移动图片失败：' + oldFileName)
            }
        } else {
            log(filePath + ' 不存在')
        }
    })

    if (existed.length === 0) {
        log('被移动的图片为 0')
        return
    }

    return dirName + ',' + newFileName
}

function tryToMove(sourceDirPath, dirName, fileName) {
    let sourcePath, destPath

    var projectRoot = pluginUtils.getIOSProjectRoot() // 必须存在
    // 先检查工程里，有没有这个 dirName 存在，不存则整个目录复制，否则只复制 imageset
    if (NSFileManager.defaultManager().fileExistsAtPath(projectRoot + '/' + dirName)) {
        // 只复制 imageset
        sourcePath = sourceDirPath + `/${fileName}.imageset/`
        destPath = projectRoot + '/' + dirName + `/${fileName}.imageset/`

        if (NSFileManager.defaultManager().fileExistsAtPath(destPath)) {
            // 给用户警告
            UI.getInputFromUser("Has same name '" + `/${fileName}.imageset/` + "', should override old directory?", {
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
                    log('用户遇到冲突后，放弃覆盖旧的图片')
                }
            })
        } else {
            moveToProject(sourcePath, destPath, fileName)
        }
    } else {
        sourcePath = sourceDirPath
        destPath = projectRoot + '/' + dirName
        moveToProject(sourcePath, destPath, fileName)
    }
}

function moveToProject(sourcePath, destPath, fileName) {
    pluginUtils.moveToProject(sourcePath, destPath, function (dest) {
        const sample = pluginUtils.getIOSIconNameTemplate()
        if (sample.length > 0) {
            const pb = NSPasteboard.generalPasteboard()
            pb.clearContents()
            pb.writeObjects([sample.replace('$iconName', fileName)])
        } else {
            log('getIOSIconNameTemplate fail')
        }
    })
}

export function copyTextCode() {
    const document = sketch.getSelectedDocument()
    const selectedLayers = document.selectedLayers
    var selectedCount = selectedLayers.length

    if (selectedCount === 0) {
        UI.message('No layers are selected.')
        return
    }
    var layer = selectedLayers.layers[0]

    if (layer.type === 'Text' && layer.sharedStyle && layer.sharedStyle.name) {
        const sample = pluginUtils.getIOSCodeTemplate()
        if (sample.length > 0) {
            const styleNameParts = layer.sharedStyle.name.split('/')
            const code = styleNameParts.pop()
            const pb = NSPasteboard.generalPasteboard()
            pb.clearContents()
            pb.writeObjects([sample.replace('$codeName', code)])
            UI.message('Text code is copied')
        } else {
            log('getIOSCodeTemplate fail')
        }
    }
}

export function sliceIOS() {
    const document = sketch.getSelectedDocument()
    const selectedLayers = document.selectedLayers
    const selectedCount = selectedLayers.length

    if (selectedCount === 0) {
        UI.alert('Warning', 'No layers are selected.')
    } else {
        pluginUtils.checkIOSProjectRoot((projectRoot) => {
            if (projectRoot) {
                const layerNames = []
                const tempPath = pluginUtils.getPluginRoot() + '/temp/'
                selectedLayers.forEach(function (layer, i) {
                    let scalses = '1,1.5'
                    if (layer.name.includes('@2x')) {
                        scalses = '1'
                    } else if (layer.name.includes('@3x')) {
                        scalses = '1'
                    }
                    const options = {
                        scales: scalses,
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