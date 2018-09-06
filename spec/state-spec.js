'use babel';

import { testquire } from 'atom-coverage';
const PinnedTabsState = testquire('state.js');


describe('PinnedTabsState', function() {

  it('can be initialized without a previous state', () => {
    let state = new PinnedTabsState();
    expect(state).to.have.property('indices');
  });

  it('can be initialized with a previous state');

  it('is backwards compatible with older state objects');

  describe('::serialize()', () => {

  });

  describe('::deserialize()', () => {

  });

  describe('::addPane()', () => {

  });

  describe('::addPaneItem()', () => {

  });

  describe('::forEach()', () => {

  });

  describe('::movePaneItem()', () => {

  });

  describe('::removePane()', () => {

  });

  describe('::removePaneItem()', () => {

  });

});
