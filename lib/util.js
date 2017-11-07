const { CompositeDisposable } = require('atom');


let getTabId = function(tab) {
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
};


module.exports = {

  /**
   * Find an item (e.g. TextEditor) given a tab node.
   *
   * @param  {Node} tab   The Node of the tab of interested.
   * @param  {Pane} pane  The pane that is the parent of `tab`.
   * @return {Object}     The item (e.g. TextEditor).
   */
  findItemByTab: function(tab, pane) {
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
  },

  /**
   * Get the identifier for a tab.
   *
   * @param  {Node} tab  The Node of the tab of interested.
   * @return {String}    The identifier for the tab.
   */
  getTabId: getTabId,

  /**
   * Get the state item given a tab.
   *
   * @param  {Node} tab  The Node of the tab of interested.
   * @return {Object}    An object for the state with the following properties:
   *                        - id: A string with the id of the tab (from getTabId).
   *                        - type: A string with the type of the tab.
   *                        - subscriptions: A CompositeDisposable.
   */
  getStateItemForTab: function(tab) {
    return {
      id: getTabId(tab),
      type: tab.getAttribute('data-type'),
      subscriptions: new CompositeDisposable()
    };
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
