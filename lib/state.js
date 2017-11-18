const { CompositeDisposable } = require('atom');

const { getPaneItemId } = require('./util.js');


class PinnedTabsState {

  /**
   * Create a new PinnedTabsState.
   *
   * @param {Object} state  [Optional] A serialized version of the PinnedTabsState.
   */
  constructor(state={}) {
    this.indices = [];

    // Restore a previous state
    if (state.version === 1) {
      for (let key in state.data) {
        this.addPane({id: key}, state.data[key]);
      }
    }
  }

  // -- Atom -- //

  /**
   * Serialize the PinnedTabsState.
   *
   * @return {Object}  The serialized version of the PinnedTabsState.
   */
  serialize() {
    let data = { };
    this.indices.forEach(index => {
      data[index] = this[index].map(item => ({ id: item.id }));
    });

    return {
      data: data,
      deserializer: 'PinnedTabsState',
      version: 1
    };
  }

  /**
   * Deserialize a PinnedTabsState.
   *
   * @param  {Object} serialized  The serialized version of the PinnedTabsState.
   * @return {PinnedTabsState}    The new PinnedTabsState.
   */
  static deserialize(serialized) {
    return new PinnedTabsState(serialized);
  }

  // -- Management -- //

  /**
   * Add a new Pane to the PinnedTabsState.
   *
   * @param {Pane} pane    The Pane to add.
   * @param {Array} state  [Optional] An initial state for the Pane.
   */
  addPane(pane, state=[]) {
    if (this[pane.id] === undefined || state.length !== 0) this[pane.id] = state;
    if (!this.indices.includes(pane.id)) this.indices.push(pane.id);
  }

  /**
   * Add a new PaneItem to the PinnedTabsState.
   *
   * @param {Pane} pane    The Pane the `item` is in.
   * @param {Object} item  The PaneItem to add.
   */
  addPaneItem(pane, item) {
    let itemId = getPaneItemId(item);
    let index = this[pane.id].findIndex(item => item.id === itemId);
    if (index === -1) {
      let stateItem = { id: itemId, subscriptions: new CompositeDisposable() };

      // Update the state when the title or path changes
      if (item.onDidChangeTitle !== undefined) {
        stateItem.subscriptions.add(
          item.onDidChangeTitle(() => {
            let index = this[pane.id].findIndex(item => item.id === itemId);
            if (index >= 0) {
              setTimeout(() => {
                this[pane.id][index].id = getPaneItemId(item);
              });
            }
          })
        );
      }

      this[pane.id].push(stateItem);
    }
  }

  /**
   * Iterate over each PaneItem (e.g. TextEditor) in the state.
   *
   * @param  {Function} callback  Function to execute for each element, taking three arguments:
   *                                - currentValue: The value of the current element being processed in the array.
   *                                - index: The index of the current element being processed in the array.
   *                                - array: The array that forEach() is being applied to.
   * @param  {Boolean}  thisArg   Value to use as this when executing callback.
   */
  forEach(callback, thisArg) {
    for (let i = 0; i < this.indices.length; i++) {
      let index = this.indices[i];
      this[index].forEach(callback, thisArg);
    }
  }

  /**
   * Update state when a (pinned) PaneItem (e.g. TextEditor) moved.
   *
   * @param {Pane} pane        The Pane the `item` is in.
   * @param {Object} item      The PaneItem that is moved.
   * @param {Number} newIndex  The new index of the `item`.
   */
  movePaneItem(pane, item, newIndex) {
    let itemId = getPaneItemId(item);
    let index = this[pane.id].findIndex(item => item.id === itemId);
    if (index === newIndex) return; // No change needed if the index didn't change

    // Remove the stateItem of the moved item
    let stateItem = this[pane.id].splice(index, 1)[0];

    // And insert it back at the new index
    this[pane.id].splice(newIndex, 0, stateItem);
  }

  /**
   * Remove a Pane from the PinnedTabsState.
   *
   * @param {Pane} pane  The Pane to remove.
   */
  removePane(pane) {
    if (this[pane.id] !== undefined) delete this[pane.id];
    let index = this.indices.indexOf(pane.id);
    if (index >= 0) this.indices.splice(index, 1);
  }

  /**
   * Remove a PaneItem from the PinnedTabsState.
   *
   * @param {Pane} pane    The Pane the `item` is in.
   * @param {Object} item  The PaneItem to remove.
   */
  removePaneItem(pane, item) {
    let itemId = getPaneItemId(item);
    let index = this[pane.id].findIndex(item => item.id === itemId);
    if (index >= 0) {
      this[pane.id][index].subscriptions.dispose();
      this[pane.id].splice(index, 1);
    }
  }

}


atom.deserializers.add(PinnedTabsState);
module.exports = PinnedTabsState;
