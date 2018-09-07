'use babel';

import { testquire } from 'atom-coverage';
const PinnedTabsState = testquire('state.js');


describe('PinnedTabsState', function() {

  it('can be initialized without a previous state', () => {
    let state = new PinnedTabsState();
    expect(state).to.have.property('indices');
    expect(state.indices).to.be.an('array').that.is.empty;
  });

  it('can be initialized with a previous state', () => {
    let state = new PinnedTabsState({
      data: {
        1: [{id: 'foo'}, {id: 'bar'}]
      },
      deserializer: 'PinnedTabsState',
      version: 1
    });

    expect(state).to.have.property('indices');
    expect(state.indices).to.be.an('array').that.has.length(1);
    expect(state).to.have.property('1');
  });

  it('is backwards compatible with older state objects', () => {
    let state = new PinnedTabsState({
      data: { },
      deserializer: 'PinnedTabsState',
      version: 0.1
    });

    expect(state).to.have.property('indices');
    expect(state.indices).to.be.an('array').that.is.empty;
  });

  describe('::serialize()', () => {

    let state;

    beforeEach(() => {
      state = new PinnedTabsState();
    });

    it('serializes an empty state', () => {
      let serializedState = state.serialize();
      expect(serializedState).to.exist;
    });

    it('has the necessary properties', () => {
      let serializedState = state.serialize();
      expect(serializedState).to.have.property('data');
      expect(serializedState).to.have.property('deserializer');
      expect(serializedState).to.have.property('version');
    });

    it('serializes a non-emtpy state', () => {
      let index = 1;
      state.indices.push(index);
      state[index] = [{id: 'foo'}, {id: 'bar'}];

      let serializedState = state.serialize();
      expect(serializedState).to.have.property('data');
      expect(serializedState.data).to.have.property(index);
      expect(serializedState.data[index]).to.have.length(2);
    });

  });

  describe('::deserialize()', () => {

    it('deserializes an empty state', () => {
      let deserializedState = PinnedTabsState.deserialize({});
      expect(deserializedState).to.be.an.instanceOf(PinnedTabsState);
    });

    it('deserializes a non-empty state', () => {
      let deserializedState = PinnedTabsState.deserialize({
        data: {
          1: [{id: 'foo'}, {id: 'bar'}]
        },
        deserializer: 'PinnedTabsState',
        version: 1
      });
      expect(deserializedState).to.have.property('1');
      expect(deserializedState[1]).to.have.length(2);
    });

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
