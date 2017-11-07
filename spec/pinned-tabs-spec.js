const PinnedTabs = require('../lib/pinned-tabs.js');
const PinnedTabsState = require('../lib/state.js');

describe('PinnedTabs', () => {


  let workspaceElement;

  beforeEach(done => {
    workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);

    // The "tabs" package is required for pinned-tabs
    atom.packages.activatePackage('tabs').then(done);
  });

  it('has a "config" variable', () => {
    expect(PinnedTabs.config).toBeDefined();
  });

  it('has a "state" variable', () => {
    expect(PinnedTabs.state).toBeDefined();
  });

  describe('::activate()', () => {

    it('initializes the package commands', () => {
      spyOn(PinnedTabs, 'setCommands');

      PinnedTabs.activate();
      expect(PinnedTabs.setCommands).toHaveBeenCalled();
    });

    it('initializes the package configuration', () => {
      spyOn(PinnedTabs, 'initializeConfig');

      PinnedTabs.activate();
      expect(PinnedTabs.initializeConfig).toHaveBeenCalled();
    });

    it('initializes the package observers', () => {
      spyOn(PinnedTabs, 'setObservers');

      PinnedTabs.activate();
      expect(PinnedTabs.setObservers).toHaveBeenCalled();
    });

    it('does not restore a state without a previous state', () => {
      spyOn(PinnedTabs, 'restoreState');

      PinnedTabs.activate();
      expect(PinnedTabs.restoreState).not.toHaveBeenCalled();
    });

    it('restores the state from a previous state', () => {
      spyOn(PinnedTabs, 'restoreState');

      let state = new PinnedTabsState();
      PinnedTabs.activate(state.serialize());
      expect(PinnedTabs.restoreState).toHaveBeenCalled();
    });

  });

  describe('::deactivate()', () => {

    it('disposes the subscriptions', () => {
      spyOn(PinnedTabs.subscriptions, 'dispose');

      PinnedTabs.deactivate();
      expect(PinnedTabs.subscriptions.dispose).toHaveBeenCalled();
    });

  });

  describe('::serialize()', () => {

    it('serializes the state', () => {
      spyOn(PinnedTabs.state, 'serialize');

      PinnedTabs.serialize();
      expect(PinnedTabs.state.serialize).toHaveBeenCalled();
    });

  });

  describe('::setCommands()', () => {

    it('initalizes the "pinned-tabs:pin-active" command', () => {
      spyOn(PinnedTabs, 'pinActive');
      PinnedTabs.setCommands();

      let workspace = document.createElement('atom-workspace');
      atom.commands.dispatch(workspace, 'pinned-tabs:pin-active');

      expect(PinnedTabs.pinActive).toHaveBeenCalled();
    });

    it('initalizes the "pinned-tabs:pin-selected" command', () => {
      spyOn(PinnedTabs, 'pin');
      PinnedTabs.setCommands();

      let workspace = document.createElement('atom-workspace');
      atom.commands.dispatch(workspace, 'pinned-tabs:pin-selected');

      expect(PinnedTabs.pin).toHaveBeenCalled();
    });

    it('initalizes the "pinned-tabs:close-unpinned" command', () => {
      spyOn(PinnedTabs, 'closeUnpinned');
      PinnedTabs.setCommands();

      let workspace = document.createElement('atom-workspace');
      atom.commands.dispatch(workspace, 'pinned-tabs:close-unpinned');

      expect(PinnedTabs.closeUnpinned).toHaveBeenCalled();
    });

  });

  describe('::initializeConfig()', () => {

    it('initializes the "animated" configuration variable', () => {
      spyOn(atom.config, 'observe');

      PinnedTabs.initializeConfig();
      expect(atom.config.observe).toHaveBeenCalledWith('pinned-tabs.animated', jasmine.any(Function));
    });

    it('initializes the "visualStudio" configuration variable', () => {
      spyOn(atom.config, 'observe');

      PinnedTabs.initializeConfig();
      expect(atom.config.observe).toHaveBeenCalledWith('pinned-tabs.visualStudio', jasmine.any(Function));
    });

    it('initializes the "closeUnpinned" configuration variable', () => {
      spyOn(atom.config, 'observe');

      PinnedTabs.initializeConfig();
      expect(atom.config.observe).toHaveBeenCalledWith('pinned-tabs.closeUnpinned', jasmine.any(Function));
    });

    it('initializes the "modified" configuration variable', () => {
      spyOn(atom.config, 'observe');

      PinnedTabs.initializeConfig();
      expect(atom.config.observe).toHaveBeenCalledWith('pinned-tabs.modified', jasmine.any(Function));
    });

  });

  describe('::setObservers()', () => {

    it('should start observing opening new Panes', () => {
      spyOn(atom.workspace, 'onDidAddPane').and.returnValue({dispose: jasmine.createSpy('dispose')});

      PinnedTabs.setObservers();
      expect(atom.workspace.onDidAddPane).toHaveBeenCalled();
    });

    it('should start observing closing Panes', () => {
      spyOn(atom.workspace, 'onDidDestroyPane').and.returnValue({dispose: jasmine.createSpy('dispose')});

      PinnedTabs.setObservers();
      expect(atom.workspace.onDidDestroyPane).toHaveBeenCalled();
    });

    it('should start observing opening new Pane Items', () => {
      spyOn(atom.workspace, 'onDidAddPaneItem').and.returnValue({dispose: jasmine.createSpy('dispose')});

      PinnedTabs.setObservers();
      expect(atom.workspace.onDidAddPaneItem).toHaveBeenCalled();
    });

  });

  describe('::restoreState()', () => {

    let chickenPath, loremPath;

    beforeEach(done => {
      jasmine.unspy(window, 'setTimeout');

      atom.workspace.open('fixtures/chicken.md')
        .then(editor => { chickenPath = editor.getPath(); })
        .then(done);
      atom.workspace.open('fixtures/lorem.txt')
        .then(editor => { loremPath = editor.getPath(); })
        .then(done);
    });

    it('does nothing when the state specifies no tabs', done => {
      spyOn(PinnedTabs, 'pin');

      let state = new PinnedTabsState();
      PinnedTabs.restoreState(state)
        .then(() => expect(PinnedTabs.pin).not.toHaveBeenCalled())
        .then(done);
    });

    it('pins one tab that is specified in the state', done => {
      spyOn(PinnedTabs, 'pin');

      let state = new PinnedTabsState();
      let paneId = 81;// TODO: Adjusting state
      state[paneId] = [
        { type: 'TextEditor', id: chickenPath, subscriptions: () => { } }
      ];

      PinnedTabs.restoreState(state)
        .then(() => {
          let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
          expect(PinnedTabs.pin).toHaveBeenCalledWith(tab, true);
        })
        .then(done);
    });

    it('pins multiple tabs that are specified in the state', done => {
      spyOn(PinnedTabs, 'pin');

      let state = new PinnedTabsState();
      let paneId = 85;// TODO: Adjusting state
      state[paneId] = [
        { type: 'TextEditor', id: chickenPath, subscriptions: () => { } },
        { type: 'TextEditor', id: loremPath, subscriptions: () => { } }
      ];

      PinnedTabs.restoreState(state)
        .then(() => {
          let tabChicken = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
          expect(PinnedTabs.pin).toHaveBeenCalledWith(tabChicken, true);

          let tabLorem = workspaceElement.querySelector('.tab .title[data-name="lorem.txt"]').parentNode;
          expect(PinnedTabs.pin).toHaveBeenCalledWith(tabLorem, true);
        })
        .then(done);
    });

  });

  describe('::pinActive()', () => {

    beforeEach(done => {
      atom.workspace.open('fixtures/lorem.txt').then(done);
    });

    it('calls ::pin() with the active item', () => {
      spyOn(PinnedTabs, 'pin');

      let tab = workspaceElement.querySelector('.tab .title[data-name="lorem.txt"]').parentNode;
      PinnedTabs.pinActive();
      expect(PinnedTabs.pin).toHaveBeenCalledWith(tab);
    });

  });

  describe('::pin()', () => {

    beforeEach(done => {
      atom.workspace.open('fixtures/chicken.md').then(done);
    });

    it('pins unpinned tabs', () => {
      PinnedTabs.state[93] = []; // TODO: Adjusting state

      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      PinnedTabs.pin(tab);
      expect(tab.classList.contains('pinned')).toBeTruthy();
    });

    it('unpins pinned tabs', () => {
      PinnedTabs.state[97] = []; // TODO: Adjusting state

      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      tab.classList.add('pinned');

      PinnedTabs.pin(tab);
      expect(tab.classList.contains('pinned')).toBeFalsy();
    });

    it('changes the PinnedTabs state', () => {
      let paneId = 101;
      PinnedTabs.state[paneId] = []; // TODO: Adjusting state

      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      PinnedTabs.pin(tab);
      expect(PinnedTabs.state[paneId][0].id).toContain('chicken.md');
    });

    xit('pins a new (unsaved) file', done => {
      atom.workspace.open('')
        .then(() => {
          let paneId = 105;
          PinnedTabs.state[paneId] = []; // TODO: Adjusting state

          let tab = workspaceElement.querySelector('.tab .title:not([data-name])').parentNode;
          PinnedTabs.pin(tab);
          expect(tab.classList.contains('pinned')).toBeTruthy();
        })
        .then(done);
    });

  });

  describe('::isPinned()', () => {

    it('returns true if the tab is pinned', () => {
      let tab = document.createElement('li');
      tab.classList.add('pinned');
      expect(PinnedTabs.isPinned(tab)).toBeTruthy();
    });

    it('returns false if the tab isn\'t pinned', () => {
      let tab = document.createElement('li');
      expect(PinnedTabs.isPinned(tab)).toBeFalsy();
    });

  });

});
