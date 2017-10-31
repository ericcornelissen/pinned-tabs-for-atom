module.exports = {

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
