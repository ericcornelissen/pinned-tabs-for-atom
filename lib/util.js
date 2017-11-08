module.exports = {

  /**
   * Find a PaneItem (e.g. TextEditor) given a tab node and pane.
   *
   * @param  {Node} tab   The Node of the tab of interested.
   * @param  {Pane} pane  The pane that is the parent of `tab`.
   * @return {Object}     The PaneItem (e.g. TextEditor).
   */
  findPaneItem: function(tab, pane) {
    let tabs = pane.element.querySelectorAll('.tab-bar .tab');
    return Array.from(tabs)
      .map((el, index) => el === tab ? pane.itemAtIndex(index) : null)
      .find(item => item !== null);
  },

  /**
   * Get the identifier for a tab.
   *
   * @param  {Node} tab  The Node of the tab of interested.
   * @return {String}    The identifier for the tab.
   */
  getTabId: function(tab) {
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
  },

  /**
   * Get the tab node given the state item (from getStateItemForTab).
   *
   * @param  {Object} [stateItem={}]  An object for the state with (at least) the following properties:
   *                                    - id: A string with the id of the tab (from getTabId).
   *                                    - type: A string with the type of the tab.
   * @param  {Pane} pane              The pane that is the parent of tab.
   * @return {Node}                   The Node of the tab.
   */
  getTabNodeByStateItem: function(stateItem={}, pane) {
    switch (stateItem.type) {
      case 'TextEditor':
      case 'ImageEditor':
        let dataPath = stateItem.id.replace(/\\/g, '\\\\');
        let title = pane.element.querySelector(`.tab .title[data-path="${dataPath}"]`);
        return title ? title.parentNode : undefined;
      case 'SettingsView':
        return pane.element.querySelector('.tab[data-type="SettingsView"]');
      case 'AboutView':
        return pane.element.querySelector('.tab[data-type="AboutView"]');
    }
  },

  /**
   * Find out if an element is the ancestor of another element.
   *
   * @param  {Node} ancestor    The element that is expected to be the ancestor.
   * @param  {Node} descendant  The element that is expected to be the descendant.
   * @return {Boolean}          An indication of whether `ancestor` is an ancestor of `descendant`.
   */
  isAncestor: function(ancestor, descendant) {
    let found = false;
    while (descendant) {
      descendant = descendant.parentNode;
      if (descendant === ancestor) {
        found = true;
        break;
      }
    }

    return found;
  }

};
