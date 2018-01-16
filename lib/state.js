'use babel';

import { CompositeDisposable } from 'atom';

import { getPaneItemId } from './util.js';


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
        this.addPane(key, state.data[key]);
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
   * @param {Number} paneId  The identifier of the the Pane to add.
   * @param {Array} state    [Optional] An initial state for the Pane.
   */
  addPane(paneId, state=[]) {
    if (this[paneId] === undefined || state.length !== 0) this[paneId] = state;
    if (!this.indices.includes(paneId)) this.indices.push(paneId);
  }

  /**
   * Add a new PaneItem to the PinnedTabsState.
   *
   * @param {Number} paneId  The identifier of the the Pane the `item` is in.
   * @param {Object} item    The PaneItem to add.
   */
  addPaneItem(paneId, item) {
    let itemId = getPaneItemId(item);
    let index = this[paneId].findIndex(item => item.id === itemId);
    if (index === -1) {
      let stateItem = { id: itemId, subscriptions: new CompositeDisposable() };

      // Update the state when the title or path changes
      if (item.onDidChangeTitle !== undefined) {
        stateItem.subscriptions.add(
          item.onDidChangeTitle(() => {
            let index = this[paneId].findIndex(item => item.id === itemId);
            if (index >= 0) {
              setTimeout(() => {
                this[paneId][index].id = getPaneItemId(item);
              });
            }
          })
        );
      }

      this[paneId].push(stateItem);
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
   * @param {Number} paneId    The identifier of the the Pane the `item` is in.
   * @param {Object} item      The PaneItem that is moved.
   * @param {Number} newIndex  The new index of the `item`.
   */
  movePaneItem(paneId, item, newIndex) {
    let itemId = getPaneItemId(item);
    let index = this[paneId].findIndex(item => item.id === itemId);
    if (index === newIndex) return; // No change needed if the index didn't change

    // Remove the stateItem of the moved item
    let stateItem = this[paneId].splice(index, 1)[0];

    // And insert it back at the new index
    this[paneId].splice(newIndex, 0, stateItem);
  }

  /**
   * Remove a Pane from the PinnedTabsState.
   *
   * @param {Number} paneId The identifier of the Pane to remove.
   */
  removePane(paneId) {
    if (this[paneId] !== undefined) delete this[paneId];
    let index = this.indices.indexOf(paneId);
    if (index >= 0) this.indices.splice(index, 1);
  }

  /**
   * Remove a PaneItem from the PinnedTabsState.
   *
   * @param {Number} paneId  The identifier of the Pane the `item` is in.
   * @param {Object} item    The PaneItem to remove.
   */
  removePaneItem(paneId, item) {
    let itemId = getPaneItemId(item);
    let index = this[paneId].findIndex(item => item.id === itemId);
    if (index >= 0) {
      this[paneId][index].subscriptions.dispose();
      this[paneId].splice(index, 1);
    }
  }

}


atom.deserializers.add(PinnedTabsState);
export default PinnedTabsState;
