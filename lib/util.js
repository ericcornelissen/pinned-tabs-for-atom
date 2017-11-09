let getPaneItemId = function(item) {
  if (item.getURI && item.getURI()) {
    return item.getURI();
  } else {
    return item.getTitle();
  }
};

let findTabById = function(id, pane) {
  let index = pane.getItems().findIndex(item => getPaneItemId(item) === id);
  let tabs = pane.element.querySelectorAll('.tab-bar .tab');
  return tabs[index];
};


module.exports = {

  /**
   * Find the PaneItem (e.g. TextEditor) given its tab Node.
   *
   * @param  {Node} tab   The Node of the tab of interested.
   * @param  {Pane} pane  The pane that is the parent of `tab`.
   * @return {Object}     An object with two properties:
   *                        - item: The PaneItem (e.g. TextEditor).
   *                        - itemIndex: The index of `item` in `pane`.
   */
  findPaneItem: function(tab, pane) {
    let tabs = pane.element.querySelectorAll('.tab-bar .tab');
    let items = Array.from(tabs).map((el, index) => el === tab ? pane.itemAtIndex(index) : null);
    return {
      item: items.find(item => item !== null),
      itemIndex: items.findIndex(item => item !== null)
    };
  },

  /**
   * Find the tab Node given the identifier of its PaneItem.
   *
   * @param  {String} id  The identifier of the PaneItem of the tab.
   * @param  {Pane} pane  The pane in which the PaneItem can be found.
   * @return {Node}       The tab node of for the identifier.
   */
  findTabById: findTabById,

  /**
   * Find the tab Node given a PaneItem.
   *
   * @param  {Object} item  The PaneItem of the tab.
   * @param  {Pane} pane    The pane in which the PaneItem can be found.
   * @return {Node}         The tab node of for the identifier.
   */
  findTabByItem: function(item, pane) {
    let id = getPaneItemId(item);
    return findTabById(id, pane);
  },

  /**
   * Get the identifier of a PaneItem.
   *
   * @param  {Object} item  The PaneItem of interest.
   * @return {String}       The identifier for `PaneItem`.
   */
  getPaneItemId: getPaneItemId,

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
