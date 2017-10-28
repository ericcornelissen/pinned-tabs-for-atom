class PinnedTabsState {

  /**
   * Create a new PinnedTabsState.
   *
   * @param {Object} data      The data to iitialize the PinnedTabsState with.
   * @return {PinnedTabsState} The new PinnedTabsState.
   */
  constructor(data) {
    this.data = data;
  }

  /**
   * Serialize the PinnedTabsState.
   *
   * @return {Object} Serialized version of the PinnedTabsState.
   */
  serialize() {
    return {
      deserializer: 'PinnedTabsState',
      data: this.data
    };
  }

  /**
   * [deserializer description]
   * @param  {Object} params   Object containing the data to create a new PinnedTabsState.
   * @return {PinnedTabsState} The new PinnedTabsState.
   */
  static deserialize({data}) {
    return new PinnedTabsState(data);
  }

}

atom.deserializers.add(PinnedTabsState);

module.exports = PinnedTabsState;
