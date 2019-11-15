import sketch from 'sketch'
// documentation: https://developer.sketchapp.com/reference/api/
import dom from 'sketch/dom'
import UI from 'sketch/ui'
import Settings from 'sketch/settings'

function checkProjectRoot(callback) {
  var projectRoot = Settings.settingForKey('project-root')
  if (!projectRoot || projectRoot.length === 0) {
    UI.getInputFromUser(
      'The root of your project ,iOS or Android', {
        initialValue: '/Users/hite/workspace/yanxuan-ios/NeteaseYanxuan/Assets.xcassets/'
      },
      (err, value) => {
        if (err) {
          // most likely the user canceled the input
          callback(null)
          return
        }
        Settings.setSettingForKey('project-root', value)
        callback(projectRoot)
      }
    )
  } else {
    callback(projectRoot)
  }
}

function createDir(path) {
  return NSFileManager.defaultManager().createDirectoryAtPath_withIntermediateDirectories_attributes_error(
    path,
    true,
    nil,
    nil
  )
}

function importSliceToProjectFolder(layerNames, tempPath) {
  layerNames.forEach(function(name) {
    _importSliceToProjectFolder(name, tempPath)
  })
}

function _importSliceToProjectFolder(layerName, tempPath) {
  // 只支持一级，如 subject/subject_ok_ico_normal
  var parts = layerName.split('/')
  var dirPath = '',
    dirName = ''
  var fileName = layerName
  if (parts.length === 2) {
    dirName = parts[0]
    fileName = parts[1]

    if (NSFileManager.defaultManager().fileExistsAtPath(tempPath + dirName)) {
      //
    } else {
      const succ = createDir(tempPath + dirName)
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

  dirPath = tempPath + dirName
  // 把文件名如 subject_ok_ico_normal@2x
  const fileNameParts = fileName.split('@')
  if (fileNameParts.length === 2) {
    fileName = fileNameParts[0]
  }
  // 先生成 .imageset 文件夹
  const imagesetPath = dirPath + `/${fileName}.imageset/`
  if (NSFileManager.defaultManager().fileExistsAtPath(imagesetPath)) {
    log('Remove old imagesetPath, ' + imagesetPath)
    NSFileManager.defaultManager().removeItemAtPath_error(imagesetPath, nil)
  }
  const succ = createDir(imagesetPath)
  if (!succ) {
    UI.message('Create imageset directory fails,' + imagesetPath)
    return
  }
  log(dirPath)
  log(imagesetPath)
  // 找到所以同名的图片；
  var existed = [];
  [`${fileName}@2x.png`, `${fileName}@3x.png`].forEach((imageName) => {
    const filePath = tempPath + '/' + imageName
    if (NSFileManager.defaultManager().fileExistsAtPath(filePath)) {
      // 移动到 imagesetPath 目录下
      if (NSFileManager.defaultManager().moveItemAtPath_toPath_error(filePath, imagesetPath + '/' + imageName, nil)) {
        //
        existed.push(imageName)
      } else {
        log('移动图片失败' + imageName)
      }
    }
  })

  // 生成 Contents.json 下面的文件；
  if (existed.length === 0) {
    log('被移动的图片为 0')
    return
  }
  var image2x = nil, image3x = nil
  existed.forEach((name) => {
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
  const contentsSucc = writeFile({
    content: optionContent,
    path: imagesetPath,
    fileName: 'Contents.json'
  })
  if (!contentsSucc) {
    UI.message('Create Contents.json fails')
    log('Create Contents.json fails')
    return
  }
  // 把整个 subject 或者 imageset 目录移动到 projectRoot 下；
  let sourcePath, destPath

  var projectRoot = Settings.settingForKey('project-root')// 必须存在
  // 先检查工程里，有没有这个 dirName 存在，不存则整个目录复制，否则只复制 imageset
  if (NSFileManager.defaultManager().fileExistsAtPath(projectRoot + '/' + dirName)) {
    // 只复制 imageset
    sourcePath = imagesetPath
    destPath = projectRoot + '/' + dirName + `/${fileName}.imageset/`

    if (NSFileManager.defaultManager().fileExistsAtPath(destPath)) {
      // 给用户警告
      UI.getInputFromUser("Has same '" + `/${fileName}.imageset/` + "', should override old directory?", {
        type: UI.INPUT_TYPE.selection,
        possibleValues: ['Yes, override it', 'Abort']
      }, (err, value) => {
        if (err) {
          // most likely the user canceled the input
          return
        }
        if (value === 'Yes, override it') {
          const succ = createDir(imagesetPath)
          if (!succ) {
            UI.message('Create imageset directory fails')
            return
          }
          log('Remove old project imagesetPath, ' + destPath)
          NSFileManager.defaultManager().removeItemAtPath_error(destPath, nil)
          moveToProject(sourcePath, destPath, fileName)
        } else {
          log('用户遇到冲突后，放弃覆盖旧的图片')
        }
      })
    }
  } else {
    sourcePath = dirPath
    destPath = projectRoot + '/' + dirName
  }
  moveToProject(sourcePath, destPath, fileName)
}

function moveToProject(sourcePath, destPath, fileName) {
  log(sourcePath)
  log(destPath)
  // moveItemAtPath 函数要求目标地址是不存在的
  if (NSFileManager.defaultManager().moveItemAtPath_toPath_error(sourcePath, destPath, nil)) {
    //
    UI.message('导入工程切片成功')
    const pb = NSPasteboard.generalPasteboard()
    pb.clearContents()
    pb.writeObjects([fileName])
  } else {
    log('移动切片到工程失败')
  }
}

function writeFile(options) {
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

function getPluginRoot() {
  const scriptPath = NSString.stringWithString(context.scriptPath)
  const pluginRoot = scriptPath
    .stringByDeletingLastPathComponent()
  return pluginRoot
}

export function sliceIOS() {
  UI.message("It's alive 🙌")
  // Settings.setSettingForKey("project-root", '');
  const document = sketch.getSelectedDocument()
  const selectedLayers = document.selectedLayers
  const selectedCount = selectedLayers.length

  if (selectedCount === 0) {
    UI.alert('Warning', 'No layers are selected.')
  } else {
    checkProjectRoot((projectRoot) => {
      if (projectRoot) {
        const layerNames = []
        const tempPath = getPluginRoot() + '/temp/'
        selectedLayers.forEach(function (layer, i) {
          let scalses = '2,3'
          if (layer.name.includes('@2x')) {
            scalses = '2'
          } else if (layer.name.includes('@3x')) {
            scalses = '3'
          }
          const options = {
            scales: scalses,
            formats: 'png',
            output: tempPath
          }
          log(layer.id + ', name = ' + layer.name + ', option = ')
          log(options)
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

export function sliceAndroid() {
  log('unimplemented')
}

export function resetProjectSettings() {
  Settings.setSettingForKey('project-root', '')
}