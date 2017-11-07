const { CompositeDisposable } = require('atom');

const PinnedTabs = require('../lib/pinned-tabs.js');
const PinnedTabsState = require('../lib/state.js');

describe('PinnedTabs', () => {

  let workspaceElement;

  beforeEach(done => {
    // Attach the workspace to the DOM
    workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);

    // The "tabs" package is required for pinned-tabs
    atom.packages.activatePackage('tabs')
      .then(atom.packages.activatePackage('settings-view'))
      .then(done);
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
    let state, paneId;

    beforeEach(done => {
      // Initialize a state to work with
      state = new PinnedTabsState();

      // Unspy setTimeout since ::restoreState() uses it
      jasmine.unspy(window, 'setTimeout');

      // Open two files in the workspace
      atom.workspace.open('fixtures/chicken.md')
        .then(editor => {
          chickenPath = editor.getPath();
        })
        .then(() => atom.workspace.open('fixtures/lorem.txt'))
        .then(editor => {
          loremPath = editor.getPath();
          paneId = atom.workspace.getPanes().find(pane => pane.getItems().includes(editor)).id;
        })
        .then(done);
    });

    it('does nothing when the state specifies no tabs', done => {
      spyOn(PinnedTabs, 'pin');

      PinnedTabs.restoreState(state)
        .then(() => expect(PinnedTabs.pin).not.toHaveBeenCalled())
        .then(done);
    });

    it('pins one tab that is specified in the state', done => {
      spyOn(PinnedTabs, 'pin');

      state[paneId] = [
        { type: 'TextEditor', id: chickenPath, subscriptions: new CompositeDisposable() }
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

      state[paneId] = [
        { type: 'TextEditor', id: chickenPath, subscriptions: new CompositeDisposable() },
        { type: 'TextEditor', id: loremPath, subscriptions: new CompositeDisposable() }
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

    let chickenPath;
    let paneId;

    beforeEach(done => {
      // Initialize a state to work with
      PinnedTabs.state = new PinnedTabsState();

      // Open a file in the workspace
      atom.workspace.open('fixtures/chicken.md')
        .then(editor => {
          chickenPath = editor.getPath();
          paneId = atom.workspace.getPanes().find(pane => pane.getItems().includes(editor)).id;
        })
        .then(done);
    });

    it('pins an unpinned TextEditor', () => {
      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      PinnedTabs.pin(tab);
      expect(tab.classList.contains('pinned')).toBeTruthy();
    });

    it('unpins a pinned TextEditor', () => {
      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      tab.classList.add('pinned');

      PinnedTabs.pin(tab);
      expect(tab.classList.contains('pinned')).toBeFalsy();
    });

    it('changes the PinnedTabs state when a tab is pinned', () => {
      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      PinnedTabs.pin(tab);
      expect(PinnedTabs.state[paneId][0].id).toContain('chicken.md');
    });

    it('changes the PinnedTabs state when a tab is unpinned', () => {
      PinnedTabs.state[paneId] = [
        { id: chickenPath, subscriptions: new CompositeDisposable() }
      ];

      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      tab.classList.add('pinned');

      PinnedTabs.pin(tab);
      expect(PinnedTabs.state[paneId].length).toBe(0);
    });

    it('is not possible to pin new (unsaved) editors', done => {
      spyOn(atom.notifications, 'addWarning');

      atom.workspace.open('')
        .then(() => {
          let tab = workspaceElement.querySelector('.tab .title:not([data-name])').parentNode;
          PinnedTabs.pin(tab);
          expect(tab.classList.contains('pinned')).toBeFalsy();
          expect(atom.notifications.addWarning).toHaveBeenCalled();
        })
        .then(done);
    });

    it('pins the settings tab', done => {
      atom.commands.dispatch(workspaceElement, 'settings-view:open');

      // Opening the settings view takes some time
      setTimeout(() => {
        let tab = workspaceElement.querySelector('.tab[data-type="SettingsView"]');
        PinnedTabs.pin(tab);
        expect(tab.classList.contains('pinned')).toBeTruthy();
        done();
      });
    });

    xit('pins the about tab', done => {
      atom.commands.dispatch(workspaceElement, 'application:about');

      // Opening the about view takes some time
      setTimeout(() => {
        let tab = workspaceElement.querySelector('.tab[data-type="AboutView"]');
        PinnedTabs.pin(tab);
        expect(tab.classList.contains('pinned')).toBeTruthy();
        done();
      });
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
