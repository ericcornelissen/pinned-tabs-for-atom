const { CompositeDisposable } = require('atom');

const PinnedTabsState = require('./state.js');
const { isAncestor } = require('./util.js');


function findItemByTab(tab, pane) {
  switch (tab.getAttribute('data-type')) {
    case 'TextEditor':
    case 'ImageEditor':
      let title = tab.querySelector('.title');
      return pane.getItems().find(item => item.getPath ? item.getPath() === title.getAttribute('data-path') : false);
    case 'SettingsView':
      return pane.getItems().find(item => item.uri === 'atom://config');
    case 'AboutView':
      return pane.getItems().find(item => item.element ? item.element.classList.contains('about') : false);
  }
}

function getTabId(tab) {
  switch (tab.getAttribute('data-type')) {
    case 'TextEditor':
    case 'ImageEditor':
      let title = tab.querySelector('.title');
      return title.getAttribute('data-path');
    case 'SettingsView':
      return 'SettingsView';
    case 'AboutView':
      return 'AboutView';
    default:
      return;
  }
}

function getStateItemForTab(tab) {
  return {
    id: getTabId(tab),
    type: tab.getAttribute('data-type'),
    subscriptions: new CompositeDisposable()
  };
}

function getTabNodeByStateItem(stateItem, pane) {
  switch (stateItem.type) {
    case 'TextEditor':
    case 'ImageEditor':
      let dataPath = stateItem.id.replace(/\\/g, '\\\\');
      let title = pane.element.querySelector(`.tab .title[data-path="${dataPath}"]`);
      return title.parentNode;
    case 'SettingsView':
      return pane.element.querySelector('.tab[data-type="SettingsView"]');
    case 'AboutView':
      return pane.element.querySelector('.tab[data-type="AboutView"]');
  }
}


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
    let body = document.querySelector('body');
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
        description: 'Tick this to use Microsoft Visual Studio pinned tabs (**Modified indicator** will be ignored)',
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
   * Activate the pinned-tabs package.
   *
   * @param {Object} state  [Optional] A previous state of pinned-tabs for the Atom workspace.
   */
  activate(state={}) {
    if (state.deserializer === 'PinnedTabsState') {
      this.state = atom.deserializers.deserialize(state);
    }

    this.setCommands();
    this.setObservers();
    this.initializeConfig();

    this.restoreState();
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
   * Initialize the configuration of pinned-tabs.
   */
  initializeConfig() {
    // TODO: update
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
   * Restore the state of pinned-tabs. I.e. pin all tabs that should be pinned.
   */
  restoreState() {
    return new Promise(resolve => {
      // Timeout required for Atom to load the DOM
      setTimeout(() => {
        atom.workspace.getPanes().forEach(pane => {
          if (this.state[pane.id] === undefined) return;

          this.state[pane.id].forEach(stateItem => {
            let tab = getTabNodeByStateItem(stateItem, pane);
            this.pin(tab, true);
          });
        });

        resolve();
      }, 1);
    });
  }

  /**
   * Initialize the commands for pinned-tabs.
   */
  setCommands() {
    // Pin active command
    this.subscriptions.add(
        atom.commands.add(
            'atom-workspace',
            'pinned-tabs:pin-active',
            () => this.pinActive()
        )
    );

    // Pin selected command
    this.subscriptions.add(
        atom.commands.add(
            'atom-workspace',
            'pinned-tabs:pin-selected',
            event => this.pin(event.target)
        )
    );

    // Close unpinned tabs command
    this.subscriptions.add(
        atom.commands.add(
            'atom-workspace',
            'pinned-tabs:close-unpinned',
            () => this.closeUnpinned()
        )
    );
  }

  /**
   * Initialize the observers for pinned-tabs.
   */
  setObservers() {
    // Initialize an array in the state for every new pane
    this.subscriptions.add(
      atom.workspace.onDidAddPane(({pane}) => this.state.addPane(pane))
    );

    // Delete the state of a pane when it is destroyed
    this.subscriptions.add(
      atom.workspace.onDidDestroyPane(({pane}) => this.state.removePane(pane))
    );

    // Move newly opened tabs after pinned tabs in the pane
    this.subscriptions.add(
      atom.workspace.onDidAddPaneItem(({index, item, pane}) => {
        let pinnedCount = pane.element.querySelectorAll('.tab.pinned').length;
        if (index < pinnedCount) {
          pane.moveItem(item, pinnedCount);
        }
      })
    );
  }

  // -- Pinning tabs -- //

  /**
   * Close all tabs that are not pinned within a pane in the Atom workspace.
   */
  closeUnpinned() {
    // TODO: update
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
    let pane = atom.workspace.getActivePane();
    let tab = pane.element.querySelector('.active');
    if (tab !== null) this.pin(tab);
  }

  /**
   * Pin a tab in the Atom workspace.
   *
   * @param {Node} tab       The DOM node of the tab to pin.
   * @param {Boolean} force  Force the tab to be pinned (i.e. don't unpin if it was already pinned).
   */
  pin(tab, force) {
    let pane = atom.workspace.getPanes().find(pane => isAncestor(pane.element, tab));
    let pinnedTabsCount = pane.element.querySelectorAll('.tab.pinned').length;
    if (pane === undefined) return;

    let item = findItemByTab(tab, pane);
    if (item === undefined) return;

    let tabId = getTabId(tab);
    if (tabId === undefined) return;

    if (!this.isPinned(tab) || force) {
      pane.moveItem(item, pinnedTabsCount);
      tab.classList.add('pinned');

      // Add the pinned tab to the state
      let stateItem = getStateItemForTab(tab);
      let index = this.state[pane.id].findIndex(item => item.id === tabId);
      if (index === -1) this.state[pane.id].push(stateItem);

      // Update the state when the tab is changed
      if (item.onDidChangeTitle !== undefined) {
        stateItem.subscriptions.add(
          item.onDidChangeTitle(() => {
            let index = this.state[pane.id].findIndex(item => item.id === stateItem.id);
            if (index === -1) return;

            let newStateItem = getStateItemForTab(tab);
            this.state[pane.id].splice(index, 1, newStateItem);
          })
        );
      }
    } else {
      pane.moveItem(item, pinnedTabsCount - 1);
      tab.classList.remove('pinned');

      // Remove the unpinned tab from the state
      let index = this.state[pane.id].findIndex(item => item.id === tabId);
      if (index >= 0) {
        let stateItem = this.state[pane.id].splice(index, 1)[0];
        stateItem.subscriptions.dispose();
      }
    }
  }

  // -- Utiliy -- //

  /**
   * Find out if a given tab is currently pinned.
   * @param  {Node}    tab  The tab of the item of interest.
   * @return {Boolean}      An indication of whether the tab is pinned.
   */
  isPinned(tab) {
    return tab.classList.contains('pinned');
  }

}


module.exports = new PinnedTabs();
