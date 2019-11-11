import sketch from "sketch";
// documentation: https://developer.sketchapp.com/reference/api/

console.log("This is an example Sketch script.");

import dom from "sketch/dom";
import UI from "sketch/ui";
import Settings from "sketch/settings";

function writeFile(options) {
    var content = NSString.stringWithString(options.content),
        savePathName = [];

    NSFileManager.defaultManager().createDirectoryAtPath_withIntermediateDirectories_attributes_error(
        options.path,
        true,
        nil,
        nil
    );

    savePathName.push(options.path, "/", options.fileName);
    savePathName = savePathName.join("");

    content.writeToFile_atomically_encoding_error(savePathName, false, 4, null);
}

function checkProjectRoot(callback) {
    var projectRoot = Settings.settingForKey("project-root");
    if (!projectRoot) {
        UI.getInputFromUser(
            "The root of your project ,iOS or Android", {
                initialValue: "~/workspace/yanxuan-ios/NeteaseYanxuan/Assets.xcassets"
            },
            (err, value) => {
                if (err) {
                    // most likely the user canceled the input
                    callback(null)
                    return;
                }
                Settings.setSettingForKey("project-root", value);
                callback(projectRoot)
            }
        );
    } else {
        callback(projectRoot)
    }
}

function exportSliceToProjectFolder(projectRoot, layer) {
    const options = {
        scales: "2, 3",
        formats: "png",
        output: projectRoot
    };
    console.log(layer.id + ', name = ' + layer.name);
    dom.export(layer, options);
}

export default function () {
    sketch.UI.message("It's alive 🙌");

    const document = sketch.getSelectedDocument();
    const selectedLayers = document.selectedLayers
    const selectedCount = selectedLayers.length

    if (selectedCount === 0) {
        console.log('No layers are selected.')
    } else {
        checkProjectRoot((projectRoot) => {
            if (projectRoot) {
                selectedLayers.forEach(function (layer, i) {
                    exportSliceToProjectFolder(projectRoot, layer)
                })
            } else {
                log('projectRoot is null')
            }
        })
    }
}