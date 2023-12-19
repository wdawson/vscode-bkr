# Better Kill Ring

This extension is designed to be a better kill ring for VS Code. It can be used with other key maps to bring the full power of kill/yank (and a history) to bear.

## Features

![animation](https://github.com/wdawson/vscode-bkr/raw/main/images/bkr.gif)

### Kill

`⌃ Ctrl` + `k` will kill (remove) the text from your cursor to the end of the line.

### Yank

`⌃ Ctrl` + `y` will yank (paste) the text that you last killed to where your cursor is.

### History

- Windows: `⌃ Ctrl` + `⌥ Alt` + `y`

- Mac: `⌃ Ctrl` + `⌘ Cmd` + `y`

View the kill ring (history of kills you've done) and choose a kill to yank. The maximum
size is 20 by default, but can be configured in the settings.

![history](https://github.com/wdawson/vscode-bkr/raw/main/images/history.png)

## Requirements

You may want to ensure that there are no duplicated key mappings. You can do that after installing the extension by going to the **Keyboard Shortcuts** settings and searching for "Better Kill Ring" and then right-clicking on the Keybinding and selecting "**Show Same Keybindings**."

## Extension Settings

This extension contributes two configuration options. Please file an issue if you want to customize the behavior further.

### `betterKillRing.ringSize`

The maximum number of kills to keep in the kill ring. The default is 20.

### `betterKillRing.multiLineKill.enabled`

When enabled, if the cursor is in the same position as the last kill, the next kill will be appended to the last kill, resulting in a single entry in the kill ring.

## Known Issues

See [the Issues page](https://github.com/wdawson/vscode-bkr/issues)

## Release Notes

See [the Releases page](https://github.com/wdawson/vscode-bkr/releases) or [the CHANGELOG](CHANGELOG.md).

# Contributing

See [VS Code docs](https://code.visualstudio.com/api/working-with-extensions/testing-extension).

## Running the tests

There is a launch configuration for the extension tests.

## Bundling

The extension is bundled using using
[esbuild](https://code.visualstudio.com/api/working-with-extensions/bundling-extension#using-esbuild)
automatically when
[vsce](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#vsce)
is run.

## Publishing

See [VS Code docs](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).
