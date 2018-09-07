'use babel';

import { spy } from 'sinon';
import sinonChai from 'sinon-chai';

import { testquire } from 'atom-coverage';
const PinnedTabsState = testquire('state.js');


Chai.use(sinonChai);

describe('PinnedTabsState', () => {

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

    let state;

    beforeEach(() => {
      state = new PinnedTabsState();
    });

    it('adds a new pane to the state', () => {
      state.addPane(42);
      expect(state).to.have.property(42);
      expect(state.indices).to.include(42);
    });

    it('does nothing if the pane is already in the state', () => {
      state[36] = [];
      state.indices = [36];

      state.addPane(36);
      expect(state).to.have.property(36);
      expect(state.indices).to.have.length(1);
    });

  });

  describe('::addPaneItem()', () => {

    let state;

    beforeEach(() => {
      state = new PinnedTabsState();
    });

    it('adds a new pane item to the state', () => {
      state.addPaneItem(42, {getTitle: () => 'foobar'});
      expect(state).to.have.property(42);
      expect(state[42]).to.have.length(1);
    });

    it('does nothing if the pane item is already in the state', () => {
      state[36] = [{id: 'Hello world!'}];

      state.addPaneItem(34, {getTitle: () => 'Hello world!'});
      expect(state[36]).to.have.length(1);
    });

  });

  describe('::forEach()', () => {

    let callback;

    beforeEach(() => {
      callback = spy();
    });

    it('does nothing if there are no pinned items', () => {
      let state = new PinnedTabsState();

      state.forEach(callback);
      expect(callback).not.to.be.called;
    });

    it('iterates over each item in one pane', () => {
      let state = new PinnedTabsState();
      state.indices = [1];
      state[1] = [{id: 'foo'}];

      state.forEach(callback);
      expect(callback).to.be.calledOnce;
    });

    it('iterates over each item in all panes', () => {
      let state = new PinnedTabsState();
      state.indices = [1, 2];
      state[1] = [{id: 'foo'}];
      state[2] = [{id: 'bar'}];

      state.forEach(callback);
      expect(callback).to.be.calledTwice;
    });

  });

  describe('::movePaneItem()', () => {

    let state;

    beforeEach(() => {
      state = new PinnedTabsState();
    });

    it('updates the state if a pinned pane item moved', () => {
      state[42] = [{id: 'foo'}, {id: 'bar'}];

      state.movePaneItem(42, {getTitle: () => 'foo'}, 1);
      expect(state[42]).to.deep.equal([{id: 'bar'}, {id: 'foo'}]);
    });

    it('does nothing if the item was not actually moved', () => {
      state[36] = [{id: 'foo'}, {id: 'bar'}];

      state.movePaneItem(36, {getTitle: () => 'foo'}, 0);
      expect(state[36]).to.deep.equal([{id: 'foo'}, {id: 'bar'}]);
    });

  });

  describe('::removePane()', () => {

    let state;

    beforeEach(() => {
      state = new PinnedTabsState();
    });

    it('removes a pane from the state', () => {
      state.indices = [42];
      state[42] = [{id: 'foobar'}];

      state.removePane(42);
      expect(state).not.to.have.property(42);
      expect(state.indices).to.have.length(0);
    });

    it('does nothing if the pane was not in the state', () => {
      state.indices = [42];
      state[42] = [{id: 'foobar'}];

      state.removePane(36);
      expect(state).to.have.property(42);
      expect(state.indices).to.deep.equal([42]);
    });

  });

  describe('::removePaneItem()', () => {

    let state;

    beforeEach(() => {
      state = new PinnedTabsState();
    });

    it('removes a pane item from the state', () => {
      state[42] = [{id: 'foo', subscriptions: {dispose: spy()}}];

      state.removePaneItem(42, {getTitle: () => 'foo'});
      expect(state[42]).to.be.empty;
    });

    it('does nothing if the pane item was not in the state', () => {
      state.removePaneItem(42, 'foo');
      expect(state[42]).not.to.exist;
    });

    it('disposes the item descriptions', () => {
      let subscriptionsDisposeSpy = spy();
      state[42] = [{id: 'foo', subscriptions: {dispose: subscriptionsDisposeSpy}}];

      state.removePaneItem(42, {getTitle: () => 'foo'});
      expect(subscriptionsDisposeSpy).to.have.been.called;
    });

  });

});
