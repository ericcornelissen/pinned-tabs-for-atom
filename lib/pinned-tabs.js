const PinnedTabsState = require('./pinned-tabs-state.js');
const { CompositeDisposable } = require('atom');

let body = document.querySelector('body');

class PinnedTabs {

  /**
   * Create a new PinnedTabs with the following properties:
   *  - state: The PinnedTabsState for the instance.
   *  - subscriptions: An instace of Atom's CompositeDisposable.
   *  - config: A configuration object for Atom.
   */
  constructor() {
    this.state = new PinnedTabsState();
    this.subscriptions = new CompositeDisposable();

    // Package configuration
    this.config = {
      animated: {
        title: 'Enable animations',
        description: 'Tick this to enable all animation related to pinned tabs',
        default: true,
        type: 'boolean',
        order: 1,
        _change: enable => body.classList.toggle('pinned-tabs-animated', enable)
      },
      visualStudio: {
        title: 'Visual Studio style pinning',
        description: 'Tick this to use Microsoft Visual Studio style pinned tabs (**Modified indicator** will be ignored)',
        default: false,
        type: 'boolean',
        order: 2,
        _change: enable => body.classList.toggle('pinned-tabs-visualstudio', enable)
      },
      closeUnpinned: {
        title: 'Enable the \'Close Unpinned Tabs\' option',
        description: 'Tick this to show the \'Close Unpinned Tabs\' from the context menu',
        default: false,
        type: 'boolean',
        order: 3,
        _change: enable => body.classList.toggle('close-unpinned', enable)
      },
      modified: {
        title: 'Modified indicator',
        default: 'always',
        type: 'string',
        order: 4,
        enum: [
          { value: 'dont', description: 'Don\'t use this feature' },
          { value: 'hover', description: 'Only show this when I hover over the tab' },
          { value: 'always', description: 'Always show this when a tab is modified' }
        ],
        _change: value => {
          if (value === 'dont') {
            body.classList.remove('pinned-tabs-modified-always');
            body.classList.remove('pinned-tabs-modified-hover');
          } else if (value === 'hover') {
            body.classList.remove('pinned-tabs-modified-always');
            body.classList.add('pinned-tabs-modified-hover');
          } else {
            body.classList.add('pinned-tabs-modified-always');
            body.classList.remove('pinned-tabs-modified-hover');
          }
        }
      }
    };
  }

  // -- Atom -- //

  /**
   * Activate the PinnedTabs instance.
   *
   * @param {Object} state  [Optional] A previous state of pinned-tabs for the Atom workspace.
   */
  activate(state={}) {
    if (state.deserializer === 'PinnedTabsState') {
      this.state = atom.deserializers.deserialize(state);
    }

    this.initCommands();
    this.initConfig();
    this.initObservers();
    this.initTabs();
  }

  /**
   * Deactivate the pinned-tabs package.
   */
  deactivate() {
    this.subscriptions.dispose();
  }

  /**
   * Serialize the state of the PinnedTabs.
   *
   * @return {Object}  The serialized version of pinned-tabs for the Atom workspace.
   */
  serialize() {
    return this.state.serialize();
  }

  // -- Activation -- //

  /**
   * Initialize the commands for pinned-tabs.
   */
  initCommands() {
    let pinActive = atom.commands.add('atom-workspace', 'pinned-tabs:pin-active', () => this.pinActive());
    this.subscriptions.add(pinActive);

    let pinSelected = atom.commands.add('atom-workspace', 'pinned-tabs:pin-selected', () => this.pinSelected());
    this.subscriptions.add(pinSelected);

    let closeUnpinned = atom.commands.add('atom-workspace', 'pinned-tabs:close-unpinned', () => this.closeUnpinned());
    this.subscriptions.add(closeUnpinned);
  }

  /**
   * Initialize the configuration of pinned-tabs.
   */
  initConfig() {
    atom.config.onDidChange('pinned-tabs.animated', ({newValue}) => this.config.animated._change(newValue));
    this.config.animated._change(atom.config.get('pinned-tabs.animated'));

    atom.config.onDidChange('pinned-tabs.visualStudio', ({newValue}) => this.config.visualStudio._change(newValue));
    this.config.visualStudio._change(atom.config.get('pinned-tabs.visualStudio'));

    atom.config.onDidChange('pinned-tabs.closeUnpinned', ({newValue}) => this.config.closeUnpinned._change(newValue));
    this.config.closeUnpinned._change(atom.config.get('pinned-tabs.closeUnpinned'));

    atom.config.onDidChange('pinned-tabs.modified', ({newValue}) => this.config.modified._change(newValue));
    this.config.modified._change(atom.config.get('pinned-tabs.modified'));
  }

  /**
   * Initialize the observers for pinned-tabs.
   */
  initObservers() {
    atom.workspace.onDidAddPane(({index, item, pane}) => {
      setTimeout(() => {
        let tab = document.querySelector('.tab-bar .tab.active');
        let pinnedTabs = tab.parentNode.querySelectorAll('.pinned');
        if (index < pinnedTabs.length) {
          pane.moveItem(item, pinnedTabs.length);
        }
      }, 1);
    });

    atom.workspace.onDidDestroyPane(({pane}) => {
      if (this.state[pane.id] !== undefined) {
        delete this.state[pane.id];
      }
    });

    atom.workspace.onWillDestroyPane(({item, pane}) => {
      if (!Array.isArray(this.state[pane.id])) {
        return;
      }

      this.state[pane.id] = this.state[pane.id].filter(id => id !== this.getItemID(item));
    });
  }

  /**
   * Initialize the tabs that should be pinned by pinned-tabs.
   */
  initTabs() {
    let activePane = atom.workspace.getActivePane();
    atom.workspace.getPanes().forEach(pane => {
      if (this.state[pane.id] === undefined) {
        return;
      }

      this.state[pane.id].forEach(target =>
        pane.getItems().forEach(item => {
          if (target !== this.getItemID(item)){
            return;
          }

          setTimeout((pane, item) => {
            // Find the pane
            let paneNode = pane.element;
            if (paneNode === undefined) {
              pane.activate();
              paneNode = document.querySelector('.pane.active');
              if (paneNode === null) return;

              // Reactive the active pane
              if (activePane !== undefined) activePane.activate();
            }

            // Find the tab
            let tab;
            if (item.getTitle()) {
              let titleNode = paneNode.querySelector('.title[data-name="' + item.getTitle() + '"]');
              if (titleNode !== null) tab = titleNode.parentNode;
            }
            if (tab === undefined && item.filePath) {
              let title = paneNode.querySelector('.title[data-path="' + item.filePath.replace(/\\/g, '\\\\') + '"]');
              if (title !== null) tab = title.parentNode;
            }
            if (item.element !== undefined && item.element.classList.contains('about')) {
              tab = paneNode.querySelector('.tab[data-type="AboutView"]');
            }
            if (item.element !== undefined && item.element.classList.contains('settings-view')) {
              tab = paneNode.querySelector('.tab[data-type="SettingsView"]');
            }

            // Pin the tab if found
            if (tab !== undefined) {
              this.pin(item, tab);
            }
          }, 1, pane, item);
        })
      );
    });
  }

  // -- Pinning tabs -- //

  /**
   * Close all tabs that are not pinned by pinned-tabs within
   * a pane in the Atom workspace.
   */
  closeUnpinned() {
    let activePaneNode = document.querySelector('.pane.active');
    let tabbar = activePaneNode.querySelector('.tab-bar');
    let tabs = tabbar.querySelectorAll('.tab');

    let activePane = atom.workspace.getActivePane();
    for (let i = tabs.length - 1; i >= 0; i--) {
      if (!tabs[i].classList.contains('pinned')) {
        let pane = activePane.itemAtIndex(i);
        activePane.destroyItem(pane);
      }
    }
  }

  /**
   * Pin the active tab in the Atom workspace.
   */
  pinActive() {
    let tab = document.querySelector('.tab.active:not([data-type="TreeView"])');
    let item = atom.workspace.getActivePaneItem();

    if (tab !== null && item !== null) {
      this.pin(item, tab);
    }
  }

  /**
   * Pin the selected tab in the Atom workspace.
   */
  pinSelected() {
    let tab = atom.contextMenu.activeElement;
    let item = this.getEditor(tab);

    if (tab !== null && item !== null) {
      this.pin(item, tab);
    }
  }

  /**
   * Pin a tab in the Atom workspace.
   *
   * @param  {Object} item  The Atom representation of the tab of interest.
   * @param  {Node} tab     The DOM node of the tab of interest.
   */
  pin(item, tab) {
    if (item === null || tab === null) {
      return;
    }

    let pane = atom.workspace.paneForItem(item);
    let pinnedTabs = tab.parentNode.querySelectorAll('.pinned');

    if (this.state[pane.id] === undefined) {
      this.state[pane.id] = [];
    }

    if (this.isPinned(tab)) {
      this.state[pane.id] = this.state[pane.id].filter(id => id !== this.getItemID(item));
      pane.moveItem(item, pinnedTabs.length - 1);
      tab.classList.remove('pinned');
    } else {
      if (!this.state[pane.id].includes(this.getItemID(item))) {
        this.state[pane.id].push(this.getItemID(item));
      }

      pane.moveItem(item, pinnedTabs.length);
      tab.classList.add('pinned');

      if (item.onDidChangeTitle !== undefined) {
        let oldId = this.getItemID(item);
        item.onDidChangeTitle(() => {
          if (!this.state[pane.id].includes(oldId)) {
            return;
          }

          this.state[pane.id] = this.state[pane.id].filter(id => id !== oldId);

          if (!this.state[pane.id].includes(this.getItemID(item))) {
            this.state[pane.id].push(this.getItemID(item));
          }
        });
      }
    }
  }

  // -- Utiliy -- //

  /**
   * Get the Atom's Editor instance given a tab's DOM Node.
   *
   * @param  {Node} tab  The DOM Node of the tab of interest.
   * @return {Object}    The Editor belonging to the tab.
   */
  getEditor(tab) {
    if (tab === null) {
      return null;
    }

    let target = null;
    atom.workspace.getPanes().find(pane => {
      if (target !== null) {
        return;
      }

      target = pane.items.find(item =>
        (item.filePath !== undefined && tab.querySelector('.title[data-path="' + item.filePath.replace(/\\/g, '\\\\') + '"]'))
          || (item.getTitle !== undefined && tab.querySelector('.title[data-name="' + item.getTitle() + '"]'))
          || (item.element !== undefined && item.element.classList.contains('about') && tab.getAttribute('data-type') === 'AboutView')
          || (item.element !== undefined && item.element.classList.contains('settings-view') && tab.getAttribute('data-type') === 'SettingsView')
      );
    });

    return target;
  }

  /**
   * Get the ID of an item.
   *
   * @param  {Object} item  The item of interest.
   * @return {String}       The identifier of the item.
   */
  getItemID(item) {
    if (item.getURI !== undefined && item.getURI()) {
      let uri = item.getURI();

      if (uri.match(/markdown-preview:\/\//)) {
        let editor = item.editorForId(item.editorId);
        if (editor === null) {
          return uri;
        }

        uri = 'markdown-preview://' + editor.getFileName();
      }

      return uri;
    } else if (item.getTitle) {
      return item.getTitle();
    }
  }

  /**
   * Find out if a given tab is currently pinned.
   * @param  {Node}    tab  The tab of the item of interest.
   * @return {Boolean}      The indication of whether the tab is pinned.
   */
  isPinned(tab) {
    return tab.classList.contains('pinned');
  }

}

module.exports = new PinnedTabs();
