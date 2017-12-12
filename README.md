# Pinned tabs for Atom
A simple package for the Atom text editor from GitHub that allows you to pin tabs. Inspired by the pin tab feature from Browsers, also supports Visual Studio style pinning.

For the best experience of this package, I recommend using it with the [file-icons](https://atom.io/packages/file-icons) package.

![preview gif](http://i.imgur.com/zdzpBnd.gif)

* * *

### Usage
There are three ways to pin/unpin a tab using this package.
- Via the context menu of a tab.
- Via the keyboard shortcut <kbd>ctrl</kbd> + <kbd>alt</kbd> + <kbd>p</kbd>.
- Via the command-palette, by typing `Pin Active`.

* * *

### Installation
Via the Atom Package Manager (APM)
```bash
$ apm install pinned-tabs
```

Or via Git clone
```bash
$ cd ~/.atom/packages
$ git clone https://github.com/ericcornelissen/pinned-tabs-for-atom --depth=1
```

# Customization
You can add custom styles for pinned tabs. Use your [Stylesheet](https://flight-manual.atom.io/using-atom/sections/basic-customization/#style-tweaks) and target `.tab.pinned` to tweak a pinned tab. You can consult the [package stylesheet](./styles/pinned-tabs.less) to see what classes are used.

Below are a few examples of ways to customize the styling of pinned tabs.

#### Edit active pinned tab
```css
.tab-bar .tab.pinned.active {
  background-color: salmon;
}

/* Or all not active pinned tabs */
.tab-bar .tab.pinned:not(.active) {
  background-color: olive;
}
```

#### Choose your own icon for pinned tabs
```css
.tab-bar .tab.pinned > .title::before {
  content: "\f135";
  font-family: FontAwesome;
  font-size: 18px;
}
```

If you're using file-icons, you can check out its [customization documentation](https://github.com/file-icons/atom#customisation) as well.

#### Change the icon of a modified tab
```css
.tab-bar .tab.pinned.modified:hover .title::before {
  border: none; /* The default icon uses border, so you might want to remove it */
  content: "\f044";
  font-family: FontAwesome;
  font-size: 18px;
}
```

#### Change the 'pinned' icon for Visual Studio mode
```css
.tab-bar .tab.pinned .close-icon::before {
  content: "\f276";
  font-family: FontAwesome;
  font-size: 18px;
}
```

* * *

Copyright © Eric Cornelissen | MIT license
