const { CompositeDisposable } = require('atom');

const PinnedTabsState = require('./state.js');
const { findPaneItem, findTabById, findTabByItem, isAncestor } = require('./util.js');


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

    // Object placeholder for when a PaneItem is moved between panes
    this.movedItem = { };

    // Package configuration for Atom
    this.config = {
      animated: {
        title: 'Enable animations',
        description: 'Tick this to enable all animation related to pinned tabs',
        default: true,
        type: 'boolean',
        order: 1
      },
      visualStudio: {
        title: 'Visual Studio style pinning',
        description: 'Tick this to use Microsoft Visual Studio pinned tabs (**Modified indicator** will be ignored)',
        default: false,
        type: 'boolean',
        order: 2
      },
      closeUnpinned: {
        title: 'Enable the \'Close Unpinned Tabs\' option',
        description: 'Tick this to show the \'Close Unpinned Tabs\' from the context menu',
        default: false,
        type: 'boolean',
        order: 3
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
        ]
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
      let oldState = atom.deserializers.deserialize(state);
      this.restoreState(oldState);
    }

    this.setCommands();
    this.setObservers();
    this.initializeConfig();
  }

  /**
   * Deactivate the pinned-tabs package.
   */
  deactivate() {
    this.subscriptions.dispose();
    this.state.forEach(item => item.subscriptions.dispose());

    // Remove 'pinned' class from tabs
    let pinnedTabs = document.querySelectorAll('.tab.pinned');
    pinnedTabs.forEach(tab => tab.classList.remove('pinned'));

    // Remove settings classes
    let body = document.querySelector('body');
    body.classList.remove('pinned-tabs-animated');
    body.classList.remove('pinned-tabs-visualstudio');
    body.classList.remove('pinned-tabs-unpinned');
    body.classList.remove('pinned-tabs-modified-always');
    body.classList.remove('pinned-tabs-modified-hover');
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
    atom.config.observe('pinned-tabs.animated', enable => {
      let body = document.querySelector('body');
      body.classList.toggle('pinned-tabs-animated', enable);
    });

    atom.config.observe('pinned-tabs.visualStudio', enable => {
      let body = document.querySelector('body');
      body.classList.toggle('pinned-tabs-visualstudio', enable);
    });

    atom.config.observe('pinned-tabs.closeUnpinned', enable => {
      let body = document.querySelector('body');
      body.classList.toggle('close-unpinned', enable);
    });

    atom.config.observe('pinned-tabs.modified', value => {
      let body = document.querySelector('body');
      switch (value) {
        case 'dont':
          body.classList.remove('pinned-tabs-modified-always');
          body.classList.remove('pinned-tabs-modified-hover');
          break;
        case 'hover':
          body.classList.remove('pinned-tabs-modified-always');
          body.classList.add('pinned-tabs-modified-hover');
          break;
        default:
          body.classList.add('pinned-tabs-modified-always');
          body.classList.remove('pinned-tabs-modified-hover');
      }
    });
  }

  /**
   * Restore the state of pinned-tabs. I.e. pin all tabs that should be pinned.
   */
  restoreState(state) {
    return new Promise(resolve => {
      // Timeout required for Atom to load the DOM
      setTimeout(() => {
        atom.workspace.getPanes().forEach(pane => {
          if (state[pane.id] === undefined) return;

          state[pane.id].forEach(stateItem => {
            let tab = findTabById(stateItem.id, pane);
            this.pin(tab, true);
          });
        });

        resolve();
      });
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
    // Initialize a state for every new pane and observe moving items
    this.subscriptions.add(
      atom.workspace.observePanes(pane => {
        this.state.addPane(pane);

        // Reorder tabs, if needed, after moving a tab
        this.subscriptions.add(
          pane.onDidMoveItem(({item, newIndex}) =>
            // Timeout needed for Atom to fully update its state
            setTimeout(() => this.reorderTab(pane, item, newIndex))
          )
        );

        // Keep track of items being removed from the pane
        this.subscriptions.add(
          pane.onWillRemoveItem(({item}) => {
            let tab = findTabByItem(item, pane);
            if (tab !== undefined) {
              this.movedItem = { pane: pane, item: item, wasPinned: this.isPinned(tab) };
            }
          })
        );

        // Check if items added to the pane should be moved or pinned
        this.subscriptions.add(
          pane.onDidAddItem(({item, index}) =>
            // Timeout needed for Atom to fully update its state
            setTimeout(() => {
              if (this.movedItem.wasPinned) {
                let tab = findTabByItem(item, pane);
                this.pin(tab, true);

                // Remvoe the PaneItem from its previous Pane
                this.state.removePaneItem(this.movedItem.pane, this.movedItem.item);
              } else {
                // If the tab was not pinned in the previous
                // pane, move it after pinned tabs in the pane
                this.reorderTab(pane, item, index);
              }

              // Reset this.movedItem to avoid unexpected pinning the future
              this.movedItem = { };
            })
          )
        );
      })
    );

    // Delete the state of a pane when it is destroyed
    this.subscriptions.add(
      atom.workspace.onDidDestroyPane(({pane}) => this.state.removePane(pane))
    );

    // Remove a pinned item from the state when the tab is destroyed
    this.subscriptions.add(
      atom.workspace.onDidDestroyPaneItem(({item, pane}) => {
        this.state.removePaneItem(pane, item);

        // Reset this.movedItem to avoid unexpected pinning the future
        this.movedItem = { };
      })
    );
  }

  // -- Pinning tabs -- //

  /**
   * Close all tabs that are not pinned within a pane in the Atom workspace.
   */
  closeUnpinned() {
    let pane = atom.workspace.getActivePane();
    let tabs = pane.element.querySelectorAll('.tab-bar .tab');
    Array.from(tabs).map((tab, index) => this.isPinned(tab) ? null : pane.itemAtIndex(index))
      .filter(item => item !== null)
      .forEach(item => pane.destroyItem(item));
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
    if (pane === undefined) return;

    let { item, itemIndex } = findPaneItem(tab, pane);
    if (item === undefined) return;

    let pinnedTabsCount = pane.element.querySelectorAll('.tab.pinned').length;
    if (!this.isPinned(tab) || force) {
      if (itemIndex > pinnedTabsCount) {
        pane.moveItem(item, pinnedTabsCount);
      }

      tab.classList.add('pinned');
      this.state.addPaneItem(pane, item);
    } else {
      pane.moveItem(item, pinnedTabsCount - 1);
      tab.classList.remove('pinned');
      this.state.removePaneItem(pane, item);
    }
  }

  // -- Utiliy -- //

  /**
   * Find out if a given tab is currently pinned.
   * @param  {Node} tab  The tab of the item of interest.
   * @return {Boolean}   An indication of whether the tab is pinned.
   */
  isPinned(tab) {
    return tab.classList.contains('pinned');
  }

  /**
   * Reorder a tab within a Pane if necessary.
   *
   * @param {Pane} pane        The Pane the `item` is in.
   * @param {Object} item      The PaneItem to move.
   * @param {Number} newIndex  The index the item is moved to.
   */
  reorderTab(pane, item, newIndex) {
    let tab = findTabByItem(item, pane);
    if (tab === undefined) return;

    let pinnedTabsCount = pane.element.querySelectorAll('.tab.pinned').length;
    if (this.isPinned(tab)) {
      if (newIndex > pinnedTabsCount - 1) {
        pane.moveItem(item, pinnedTabsCount - 1);
        newIndex = pinnedTabsCount - 1;
      }

      this.state.movePaneItem(pane, item, newIndex);
    } else if (!this.isPinned(tab) && newIndex < pinnedTabsCount) {
      pane.moveItem(item, pinnedTabsCount);
    }
  }

}


module.exports = new PinnedTabs();
