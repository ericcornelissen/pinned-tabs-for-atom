class PinnedTabsState {

  /**
   * Create a new PinnedTabsState.
   *
   * @param {Object} state  [Optional] A serialized version of the PinnedTabsState.
   */
  constructor(state) {
    if (state === undefined) {
      return;
    }

    if (state.version === 1) {
      for (let key in state.data) {
        this[key] = state.data[key];
      }
    }
  }

  /**
   * Serialize the PinnedTabsState.
   *
   * @return {Object}  The serialized version of the PinnedTabsState.
   */
  serialize() {
    return {
      data: this,
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

}

atom.deserializers.add(PinnedTabsState);
module.exports = PinnedTabsState;
