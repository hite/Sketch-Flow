# sketch-flow

## Installation

- Find the latest release of the plugin in [Release Page](https://github.com/hite/Sketch-Flow/releases/) 
- Download and Un-zip
- Double-click on sketch-flow.sketchplugin

## Features
1. one-click slicing icon into project.
2. copy code snippet with text style.
3. one-click export all app icons (including iOS/android/others) against on 1024*1024-sizing artboard

## Usage
### How to slice icon ?
1. Name your artboard to `subject`, and name your icon `subject_ico_post_bg`.![name a icon](https://github.com/hite/Sketch-Flow/blob/master/step1.png)
2. Select icon layer, and use command "`Slice for iOS`" or "`ctrl shift s`"
3. If it is your first time to use this plugin, you need to input the path of your iOS project Assets.xcassets, for example. `/Users/hite/workspace/xxx/Assets.xcassets/` without `~` in path.
4. If everything is right, the 2x3x png files will sit under Assets.xcassets directory with sub directory if it has.![slice icon done](https://github.com/hite/Sketch-Flow/blob/master/step2.png)
5. String `subject_subject_ico_post_bg` is copied into Pasteboard for you paste it into iOS source codes.
6. Repeat for another icon.
  
### How to export app icons for all device?
1. Create a Artboard, and name it.![name artboard](https://github.com/hite/Sketch-Flow/blob/master/how-to-use-export_appicon.png)
2. Make sure this artboard contains only one child of layer or image bitmap.
3. Select this artboard
4. Use command "`Export icon for all devices`" 
5. Wait for seconds, All icons sit under `~/Documents/Sketch Exports/[your artbaord name]` if everything is right.

## Development Guide

_This plugin was created using `skpm`. For a detailed explanation on how things work, checkout the [skpm Readme](https://github.com/skpm/skpm/blob/master/README.md)._

### Usage

Install the dependencies

```bash
npm install
```

Once the installation is done, you can run some commands inside the project folder:

```bash
npm run build
```

To watch for changes:

```bash
npm run watch
```

Additionally, if you wish to run the plugin every time it is built:

```bash
npm run start
```

### Publishing your plugin

```bash
skpm publish <bump>
```

(where `bump` can be `patch`, `minor` or `major`)

`skpm publish` will create a new release on your GitHub repository and create an appcast file in order for Sketch users to be notified of the update.

You will need to specify a `repository` in the `package.json`:

```diff
...
+ "repository" : {
+   "type": "git",
+   "url": "git+https://github.com/ORG/NAME.git"
+  }
...
```

