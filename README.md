# sketch-flow

## Installation

- Find the latest release of the plugin in [Release Page](https://github.com/hite/Sketch-Flow/releases/) 
- Download and Un-zip
- Double-click on sketch-flow.sketchplugin

## Usage
1. Name your artboard to `subject`, and name your icon `subject_ico_post_bg`.![name a icon](https://github.com/hite/Sketch-Flow/blob/master/step1.png)
2. Select icon layer, and use command "`Slice for iOS`" or "`ctrl shift s`"
3. If it is your first time to use this plugin, you need to input the path of your iOS project Assets.xcassets, for example. `/Users/hite/workspace/xxx/Assets.xcassets/` without `~` in path.
4. If everything is ok, the 2x3x png files will sit under Assets.xcassets directory with sub directory if it has.![slice icon done](https://github.com/hite/Sketch-Flow/blob/master/step2.png)
5. String `subject_subject_ico_post_bg` is copied into Pasteboard for you paste it into iOS source codes.
6. Repeat for another icon.

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

### Custom Configuration

#### Babel

To customize Babel, you have two options:

- You may create a [`.babelrc`](https://babeljs.io/docs/usage/babelrc) file in your project's root directory. Any settings you define here will overwrite matching config-keys within skpm preset. For example, if you pass a "presets" object, it will replace & reset all Babel presets that skpm defaults to.

- If you'd like to modify or add to the existing Babel config, you must use a `webpack.skpm.config.js` file. Visit the [Webpack](#webpack) section for more info.

#### Webpack

To customize webpack create `webpack.skpm.config.js` file which exports function that will change webpack's config.

```js
/**
 * Function that mutates original webpack config.
 * Supports asynchronous changes when promise is returned.
 *
 * @param {object} config - original webpack config.
 * @param {boolean} isPluginCommand - whether the config is for a plugin command or a resource
 **/
module.exports = function(config, isPluginCommand) {
  /** you can change config here **/
}
```

### Debugging

To view the output of your `console.log`, you have a few different options:

- Use the [`sketch-dev-tools`](https://github.com/skpm/sketch-dev-tools)
- Run `skpm log` in your Terminal, with the optional `-f` argument (`skpm log -f`) which causes `skpm log` to not stop when the end of logs is reached, but rather to wait for additional data to be appended to the input

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
