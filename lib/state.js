class PinnedTabsState {

  /**
   * Create a new PinnedTabsState.
   *
   * @param {Object} state  [Optional] A serialized version of the PinnedTabsState.
   */
  constructor(state={}) {
    this.indices = [];

    // Initialize an array in the state for every pane in the Atom workspace
    atom.workspace.getPanes().forEach(pane => this.addPane(pane));

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
      data[index] = this[index].map(item => ({ id: item.id, type: item.type }));
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
   * Add a new pane to the PinnedTabsState.
   *
   * @param {Pane} pane    The Pane instance of the pane to add.
   * @param {Array} state  An initial state for the Pane.
   */
  addPane(pane, state=[]) {
    if (this[pane.id] === undefined || state.length !== 0) this[pane.id] = state;
    if (!this.indices.includes(pane.id)) this.indices.push(pane.id);
  }

  /**
   * Iterate over each item (e.g. TextEditor) in the state.
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
   * Get the state array of a pane given its identifier.
   *
   * @param  {Number} id  The identifier of the pane.
   * @return {Array}      The state array for the pane.
   */
  getPane(id) {
    return this[id];
  }

  /**
   * Remove a pane from the PinnedTabsState.
   *
   * @param {Pane} pane  The Pane instance of the pane to remove.
   */
  removePane(pane) {
    if (this[pane.id] !== undefined) delete this[pane.id];
    let index = this.indices.indexOf(pane.id);
    if (index >= 0) this.indices.splice(index, 1);
  }

}

atom.deserializers.add(PinnedTabsState);
module.exports = PinnedTabsState;
