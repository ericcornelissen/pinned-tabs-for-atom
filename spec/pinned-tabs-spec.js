'use babel';

import { CompositeDisposable } from 'atom';
import fs from 'fs';
import * as path from 'path';
import { match as matchers, spy, stub } from 'sinon';
import sinonChai from 'sinon-chai';

import { testquire } from 'atom-coverage';
const PinnedTabs = testquire('pinned-tabs.js');
const PinnedTabsState = testquire('state.js');


Chai.use(sinonChai);

describe('PinnedTabs', () => {

  const outputPath = path.resolve(__dirname, './temporary-file');
  let workspaceElement;

  before(async () => {
    // The "tabs" package is required for pinned-tabs
    await atom.packages.activatePackage('tabs');

    // The "settings-view" package is used for testing purposes
    await atom.packages.activatePackage('settings-view');
  });

  beforeEach(async () => {
    // Attach the workspace to the DOM
    workspaceElement = atom.views.getView(atom.workspace);
    attachToDOM(workspaceElement);

    // Make sure the state is clean
    PinnedTabs.state = new PinnedTabsState();
  });

  it('has a "state" variable', () => {
    expect(PinnedTabs.state).to.exist;
  });

  describe('::activate()', () => {

    it('initializes the package commands', () => {
      spy(PinnedTabs, 'setCommands');

      PinnedTabs.activate();
      expect(PinnedTabs.setCommands).to.have.been.called;

      PinnedTabs.setCommands.restore();
    });

    it('initializes the package configuration', () => {
      spy(PinnedTabs, 'observeConfig');

      PinnedTabs.activate();
      expect(PinnedTabs.observeConfig).to.have.been.called;

      PinnedTabs.observeConfig.restore();
    });

    it('initializes the package observers', () => {
      spy(PinnedTabs, 'setObservers');

      PinnedTabs.activate();
      expect(PinnedTabs.setObservers).to.have.been.called;

      PinnedTabs.setObservers.restore();
    });

    it('does not restore a state without a previous state', () => {
      spy(PinnedTabs, 'restoreState');

      PinnedTabs.activate();
      expect(PinnedTabs.restoreState).not.to.have.been.called;

      PinnedTabs.restoreState.restore();
    });

    it('restores the state from a previous state', () => {
      spy(PinnedTabs, 'restoreState');

      let state = new PinnedTabsState();
      PinnedTabs.activate(state.serialize());
      expect(PinnedTabs.restoreState).to.have.been.called;

      PinnedTabs.restoreState.restore();
    });

  });

  describe('::deactivate()', () => {

    const fileName = 'chicken.md';
    const filePath = path.resolve(__dirname, './fixtures', fileName);

    let itemId, paneId;

    beforeEach(async () => {
      let editor = await atom.workspace.open(filePath);
      itemId = editor.getURI();
      paneId = atom.workspace.getPanes().find(pane => pane.getItems().includes(editor)).id;
    });

    it('disposes subscriptions', () => {
      spy(PinnedTabs.subscriptions, 'dispose');

      let itemSubscriptions = new CompositeDisposable();
      spy(itemSubscriptions, 'dispose');
      PinnedTabs.state.addPane(paneId, [{ id: itemId, subscriptions: itemSubscriptions }]);

      PinnedTabs.deactivate();
      expect(PinnedTabs.subscriptions.dispose).to.have.been.called;
      expect(itemSubscriptions.dispose).to.have.been.called;

      PinnedTabs.subscriptions.dispose.restore();
    });

    it('removes all \'.pinned-tab\' classes', () => {
      let tab = workspaceElement.querySelector(`.tab .title[data-name="${fileName}"]`).parentNode;
      tab.classList.add('pinned-tab');

      PinnedTabs.deactivate();
      expect(tab.classList.contains('pinned-tab')).to.be.false;
    });

    it('removes all configuration classes', () => {
      let body = document.querySelector('body');
      body.classList.add('pinned-tabs-animated');
      body.classList.add('pinned-tabs-modified-always');
      body.classList.add('pinned-tabs-modified-hover');
      body.classList.add('pinned-tabs-visualstudio');

      PinnedTabs.deactivate();
      expect(body.classList.contains('pinned-tabs-animated')).to.be.false;
      expect(body.classList.contains('pinned-tabs-modified-always')).to.be.false;
      expect(body.classList.contains('pinned-tabs-modified-hover')).to.be.false;
      expect(body.classList.contains('pinned-tabs-visualstudio')).to.be.false;
    });

  });

  describe('::serialize()', () => {

    it('serializes the state', () => {
      spy(PinnedTabs.state, 'serialize');

      PinnedTabs.serialize();
      expect(PinnedTabs.state.serialize).to.have.been.called;

      PinnedTabs.state.serialize.restore();
    });

  });

  describe('::observeConfig()', () => {

    beforeEach(() => {
      spy(atom.config, 'observe');
    });

    it('observes the "animated" configuration variable', () => {
      PinnedTabs.observeConfig();
      expect(atom.config.observe).to.have.been.calledWith('pinned-tabs.animated', matchers.func);
    });

    it('observes the "closeUnpinned" configuration variable', () => {
      PinnedTabs.observeConfig();
      expect(atom.config.observe).to.have.been.calledWith('pinned-tabs.closeUnpinned', matchers.func);
    });

    it('observes the "modified" configuration variable', () => {
      PinnedTabs.observeConfig();
      expect(atom.config.observe).to.have.been.calledWith('pinned-tabs.modified', matchers.func);
    });

    it('observes the "visualStudio" configuration variable', () => {
      PinnedTabs.observeConfig();
      expect(atom.config.observe).to.have.been.calledWith('pinned-tabs.visualstudio.enable', matchers.func);
    });

    it('observes the "minimumWidth" configuration variable', () => {
      PinnedTabs.observeConfig();
      expect(atom.config.observe).to.have.been.calledWith('pinned-tabs.visualstudio.minimumWidth', matchers.func);
    });

    afterEach(() => {
      atom.config.observe.restore();
    });

  });

  describe('::restoreState()', () => {

    const chickenFileName = 'chicken.md';
    const loremFileName = 'lorem.txt';
    const chickenFilePath = path.resolve(__dirname, './fixtures', chickenFileName);
    const loremFilePath = path.resolve(__dirname, './fixtures', loremFileName);

    let chickenId, paneId, state;

    beforeEach(async () => {
      spy(PinnedTabs, 'pin');

      // Initialize a state to work with
      state = new PinnedTabsState();

      // Open two files in the workspace to work with
      let editor = await atom.workspace.open(chickenFilePath);
      chickenId = editor.getURI();
      paneId = atom.workspace.getPanes().find(pane => pane.getItems().includes(editor)).id;

      await atom.workspace.open(loremFilePath);
    });

    it('does nothing when the state specifies no tabs', async () => {
      await PinnedTabs.restoreState(state);
      expect(PinnedTabs.pin).not.to.have.been.called;
    });

    it('pins tabs that are specified in the state', async () => {
      state[paneId] = [{ id: chickenId }];
      await PinnedTabs.restoreState(state);
      let tab = workspaceElement.querySelector(`.tab .title[data-name="${chickenFileName}"]`).parentNode;
      expect(PinnedTabs.pin).to.have.been.calledWith(tab, true);
    });

    afterEach(() => {
      PinnedTabs.pin.restore();
    });

  });

  describe('::setCommands()', () => {

    it('initalizes the "pinned-tabs:pin-active" command', () => {
      spy(PinnedTabs, 'pinActive');
      PinnedTabs.setCommands();

      let workspace = document.createElement('atom-workspace');
      atom.commands.dispatch(workspace, 'pinned-tabs:pin-active');

      expect(PinnedTabs.pinActive).to.have.been.called;

      PinnedTabs.pinActive.restore();
    });

    it('initalizes the "pinned-tabs:pin-selected" command', () => {
      spy(PinnedTabs, 'pin');
      PinnedTabs.setCommands();

      let workspace = document.createElement('atom-workspace');
      atom.commands.dispatch(workspace, 'pinned-tabs:pin-selected');

      expect(PinnedTabs.pin).to.have.been.called;

      PinnedTabs.pin.restore();
    });

    it('initalizes the "pinned-tabs:close-unpinned" command', () => {
      spy(PinnedTabs, 'closeUnpinned');
      PinnedTabs.setCommands();

      let workspace = document.createElement('atom-workspace');
      atom.commands.dispatch(workspace, 'pinned-tabs:close-unpinned');

      expect(PinnedTabs.closeUnpinned).to.have.been.called;

      PinnedTabs.closeUnpinned.restore();
    });

  });

  describe('::setObservers()', () => {

    it('should start observing opening new Panes', () => {
      stub(atom.workspace, 'observePanes').returns(new CompositeDisposable());

      PinnedTabs.setObservers();
      expect(atom.workspace.observePanes).to.have.been.called;

      atom.workspace.observePanes.restore();
    });

    it('should start observing destroying Panes', () => {
      stub(atom.workspace, 'onDidDestroyPane').returns(new CompositeDisposable());

      PinnedTabs.setObservers();
      expect(atom.workspace.onDidDestroyPane).to.have.been.called;

      atom.workspace.onDidDestroyPane.restore();
    });

    it('should start observing removing PaneItems', () => {
      stub(atom.workspace, 'onDidDestroyPaneItem').returns(new CompositeDisposable());

      PinnedTabs.setObservers();
      expect(atom.workspace.onDidDestroyPaneItem).to.have.been.called;

      atom.workspace.onDidDestroyPaneItem.restore();
    });

  });

  describe('::closeUnpinned()', () => {

    const chickenFileName = 'chicken.md';
    const loremFileName = 'lorem.txt';
    const chickenFilePath = path.resolve(__dirname, './fixtures', chickenFileName);
    const loremFilePath = path.resolve(__dirname, './fixtures', loremFileName);

    beforeEach(async () => {
      await atom.workspace.open(chickenFilePath);
      await atom.workspace.open(loremFilePath);
    });

    it('closes all unpinned tabs', () => {
      let pane = atom.workspace.getActivePane();

      PinnedTabs.closeUnpinned();
      expect(pane.getItems().length).to.equal(0);
    });

    it('doesn\'t close pinned tabs', () => {
      let pane = atom.workspace.getActivePane();

      let tab = workspaceElement.querySelector(`.tab .title[data-name="${chickenFileName}"]`).parentNode;
      tab.classList.add('pinned-tab');

      PinnedTabs.closeUnpinned();
      expect(pane.getItems().length).to.equal(1);
    });

  });

  describe('::pinActive()', () => {

    const fileName = 'lorem.txt';
    const filePath = path.resolve(__dirname, './fixtures', fileName);

    beforeEach(async () => {
      await atom.workspace.open(filePath);
    });

    it('calls ::pin() with the active item', () => {
      stub(PinnedTabs, 'pin');

      let tab = workspaceElement.querySelector(`.tab .title[data-name="${fileName}"]`).parentNode;
      PinnedTabs.pinActive();
      expect(PinnedTabs.pin).to.have.been.calledWith(tab);

      PinnedTabs.pin.restore();
    });

  });

  describe('::pin()', () => {

    const chickenFileName = 'chicken.md';
    const loremFileName = 'lorem.txt';
    const chickenFilePath = path.resolve(__dirname, './fixtures', chickenFileName);
    const loremFilePath = path.resolve(__dirname, './fixtures', loremFileName);

    let itemEditor, itemId, itemPane;

    beforeEach(async () => {
      PinnedTabs.activate();

      // Open a file in the workspace to work with
      let editor = await atom.workspace.open(chickenFilePath);
      itemEditor = editor;
      itemId = editor.getURI();
      itemPane = atom.workspace.getPanes().find(pane => pane.getItems().includes(editor));

      await atom.workspace.open(loremFilePath);
    });

    it('pins an unpinned TextEditor', () => {
      let tab = workspaceElement.querySelector(`.tab .title[data-name="${chickenFileName}"]`).parentNode;
      PinnedTabs.pin(tab);
      expect(tab.classList.contains('pinned-tab')).to.be.true;
    });

    it('unpins a pinned TextEditor', () => {
      let subscriptions = new CompositeDisposable();
      spy(subscriptions, 'dispose');

      PinnedTabs.state[itemPane.id] = [
        { id: itemId, subscriptions: subscriptions }
      ];

      let tab = workspaceElement.querySelector(`.tab .title[data-name="${chickenFileName}"]`).parentNode;
      tab.classList.add('pinned-tab');

      PinnedTabs.pin(tab);
      expect(tab.classList.contains('pinned-tab')).to.be.false;
      expect(subscriptions.dispose).to.have.been.called;
    });

    it('updates the state when a tab is pinned', () => {
      let tab = workspaceElement.querySelector(`.tab .title[data-name="${chickenFileName}"]`).parentNode;
      PinnedTabs.pin(tab);
      expect(PinnedTabs.state[itemPane.id][0].id).to.contain('chicken.md');
    });

    it('updates the state when a tab is unpinned', () => {
      PinnedTabs.state[itemPane.id] = [
        { id: itemId, subscriptions: new CompositeDisposable() }
      ];

      let tab = workspaceElement.querySelector(`.tab .title[data-name="${chickenFileName}"]`).parentNode;
      tab.classList.add('pinned-tab');

      PinnedTabs.pin(tab);
      expect(PinnedTabs.state[itemPane.id].length).to.equal(0);
    });

    it('is possible to pin new (unsaved) editors', async () => {
      await atom.workspace.open('');
      let tab = workspaceElement.querySelector('.tab .title:not([data-name])').parentNode;
      PinnedTabs.pin(tab);
      expect(tab.classList.contains('pinned-tab')).to.be.true;
    });

    it('pins the settings tab', function(done) {
      this.timeout(5000); // Opening the settings view can take some time

      atom.commands.dispatch(workspaceElement, 'settings-view:open');

      // Opening the settings view takes some time
      setTimeout(() => {
        let tab = workspaceElement.querySelector('.tab[data-type="SettingsView"]');
        PinnedTabs.pin(tab);
        expect(tab.classList.contains('pinned-tab')).to.be.true;
        done();
      });
    });

    it('pins the about tab'); // Opens in a separate window, therefor hard to test

    it('calls ::onDidChangeTitle() when a pinned tab\'s name is changed', async () => {
      stub(itemEditor, 'onDidChangeTitle').returns(new CompositeDisposable());

      let tab = workspaceElement.querySelector(`.tab .title[data-name="${chickenFileName}"]`).parentNode;
      PinnedTabs.pin(tab);

      await itemEditor.saveAs(outputPath);
      expect(itemEditor.onDidChangeTitle).to.have.been.called;
    });

    it('updates the state when a pinned tab\'s name is changed', done => {
      let tab = workspaceElement.querySelector(`.tab .title[data-name="${loremFileName}"]`).parentNode;
      PinnedTabs.pin(tab);

      itemEditor.saveAs(outputPath);
      setTimeout(() => {
        expect(PinnedTabs.state[itemPane.id][0].id).not.to.equal(itemId); // The new path depends on the system
        done();
      });
    });

    it('updates the state if a pinned tab is closed', async () => {
      let tab = workspaceElement.querySelector(`.tab .title[data-name="${chickenFileName}"]`).parentNode;
      PinnedTabs.pin(tab);

      await itemPane.destroyItem(itemEditor, true);
      expect(PinnedTabs.state[itemPane.id].length).to.equal(0);
    });

  });

  describe('::isPinned()', () => {

    it('returns true if the tab is pinned', () => {
      let tab = document.createElement('li');
      tab.classList.add('pinned-tab');
      expect(PinnedTabs.isPinned(tab)).to.be.true;
    });

    it('returns false if the tab isn\'t pinned', () => {
      let tab = document.createElement('li');
      expect(PinnedTabs.isPinned(tab)).to.be.false;
    });

  });

  describe('::reorderTab()', () => {

    const chickenFileName = 'chicken.md';
    const loremFileName = 'lorem.txt';
    const chickenFilePath = path.resolve(__dirname, './fixtures', chickenFileName);
    const loremFilePath = path.resolve(__dirname, './fixtures', loremFileName);

    let pane, chickenEditor, loremEditor;

    beforeEach(async () => {
      chickenEditor = await atom.workspace.open(chickenFilePath);
      loremEditor = await atom.workspace.open(loremFilePath);

      pane = atom.workspace.getPanes().find(pane => pane.getItems().includes(chickenEditor));
      spy(pane, 'moveItem');

      PinnedTabs.state[pane.id] = [];
    });

    it('does nothing if an unpinned tab is moved to a valid index', () => {
      PinnedTabs.reorderTab(pane, loremEditor, 0);
      expect(pane.moveItem).not.to.have.been.called;
    });

    it('does not reorder if a pinned tab is moved to a valid index', () => {
      let chickenTab = workspaceElement.querySelector(`.tab .title[data-name="${chickenFileName}"]`).parentNode;
      chickenTab.classList.add('pinned-tab');
      let loremTab = workspaceElement.querySelector(`.tab .title[data-name="${loremFileName}"]`).parentNode;
      loremTab.classList.add('pinned-tab');

      PinnedTabs.reorderTab(pane, loremEditor, 0);
      expect(pane.moveItem).not.to.have.been.called;
    });

    it('moves unpinned tabs after pinned tabs', () => {
      let tab = workspaceElement.querySelector(`.tab .title[data-name="${chickenFileName}"]`).parentNode;
      tab.classList.add('pinned-tab');

      PinnedTabs.state[pane.id] = [{ id: chickenEditor.getURI() }];

      PinnedTabs.reorderTab(pane, loremEditor, 0);
      expect(pane.moveItem).to.have.been.calledWith(loremEditor, 1);
    });

    it('moves pinned tabs before unpinned tabs', () => {
      let tab = workspaceElement.querySelector(`.tab .title[data-name="${chickenFileName}"]`).parentNode;
      tab.classList.add('pinned-tab');

      PinnedTabs.state[pane.id].push({id: chickenEditor.getURI()});

      PinnedTabs.reorderTab(pane, chickenEditor, 1);
      expect(pane.moveItem).to.have.been.calledWith(chickenEditor, 0);
    });

    it('updates the state if a pinned tab is moved', () => {
      spy(PinnedTabs.state, 'movePaneItem');

      let chickenTab = workspaceElement.querySelector(`.tab .title[data-name="${chickenFileName}"]`).parentNode;
      chickenTab.classList.add('pinned-tab');
      let loremTab = workspaceElement.querySelector(`.tab .title[data-name="${loremFileName}"]`).parentNode;
      loremTab.classList.add('pinned-tab');

      PinnedTabs.state[pane.id] = [
        { id: chickenEditor.getURI() },
        { id: loremEditor.getURI() }
      ];

      PinnedTabs.reorderTab(pane, chickenEditor, 1);
      expect(PinnedTabs.state.movePaneItem).to.have.been.called;

      PinnedTabs.state.movePaneItem.restore();
    });

    afterEach(() => {
      pane.moveItem.restore();
    });

  });

  afterEach(() => {
    let pane = atom.workspace.getActivePane();
    pane.destroyItems();

    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  });

});
