# Pinned tabs for Atom

[![Build Status](https://travis-ci.org/ericcornelissen/pinned-tabs-for-atom.svg?branch=master)](https://travis-ci.org/ericcornelissen/pinned-tabs-for-atom)

A simple package for the Atom text editor from GitHub that allows you to pin tabs. Inspired by the pin tab feature from Browsers, also supports Visual Studio style pinning.

For the best experience of this package, I recommend using it with the [file-icons](https://atom.io/packages/file-icons) package.

![preview gif](http://i.imgur.com/zdzpBnd.gif)

* * *

## Usage
There are three ways to pin/unpin a tab using this package.
- Via the context menu of a tab.
- Via the keyboard shortcut <kbd>ctrl</kbd> + <kbd>alt</kbd> + <kbd>p</kbd>.
- Via the command-palette, by typing `Pin Active`.

* * *

## Installation
Via the Atom Package Manager (APM)
```bash
$ apm install pinned-tabs
```

Or via Git clone
```bash
$ cd ~/.atom/packages
$ git clone https://github.com/ericcornelissen/pinned-tabs-for-atom --depth=1
```

* * *

## Customization
You can add custom styles for pinned tabs. Use your [Stylesheet](https://flight-manual.atom.io/using-atom/sections/basic-customization/#style-tweaks) and target `.tab.pinned-tab` to tweak a pinned tab. You can consult the [package stylesheet](./styles/pinned-tabs.less) to see what classes are used.

Below are a few examples of ways to customize the styling of pinned tabs.

#### Style the active pinned tab
```css
.tab.pinned-tab.active {
  background-color: salmon;
}

/* Or all non active pinned tabs */
.tab.pinned-tab:not(.active) {
  background-color: olive;
}
```

#### Choose your own icon for pinned tabs
```css
.tab.pinned-tab > .title::before {
  content: '\f135';
  font-family: FontAwesome;
  font-size: 18px;
}
```

If you're using file-icons, you can check out its [customization documentation](https://github.com/file-icons/atom#customisation) as well.

#### Change the 'pinned' icon for Visual Studio mode
```css
.tab.pinned-tab > .close-icon::before {
  content: '\f276';
  font-family: FontAwesome;
  font-size: 12px;
}
```

#### Style tabs that are not pinned
```css
.tab:not(.pinned-tab):not([data-type="TreeView"]):not([data-type="PanelDock"]):not([data-type="Object"]) {
  opacity: 0.5;
}
```

Where the different `:not([data-type])` exclude tabs elsewhere in Atom.

* * *

Copyright © Eric Cornelissen | MIT license
