const PinnedTabs = require('../lib/pinned-tabs.js');

describe('PinnedTabs', () => {


  let workspaceElement;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);

    // The "tabs" package is required for pinned-tabs
    waitsForPromise(() => atom.packages.activatePackage('tabs'));
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

    it('initializes the pinned tabs from a previous state', () => {
      spyOn(PinnedTabs, 'restoreState');

      PinnedTabs.activate();
      expect(PinnedTabs.restoreState).toHaveBeenCalled();
    });

    it('doesn\'t throw when the package is being activated', () => {
      waitsForPromise(() =>
        atom.packages.activatePackage('pinned-tabs').then(() => {
          expect(atom.packages.isPackageActive('pinned-tabs')).toBe(true);
        })
      );
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

    it('initializes observers for the config options', () => {
      spyOn(atom.config, 'onDidChange');

      PinnedTabs.initializeConfig();
      expect(atom.config.onDidChange).toHaveBeenCalled();
    });

    it('initializes the "animated" configuration variable', () => {
      spyOn(PinnedTabs.config.animated, '_change');

      PinnedTabs.initializeConfig();
      expect(PinnedTabs.config.animated._change).toHaveBeenCalled();
    });

    it('initializes the "closeUnpinned" configuration variable', () => {
      spyOn(PinnedTabs.config.closeUnpinned, '_change');

      PinnedTabs.initializeConfig();
      expect(PinnedTabs.config.closeUnpinned._change).toHaveBeenCalled();
    });

    it('initializes the "modified" configuration variable', () => {
      spyOn(PinnedTabs.config.modified, '_change');

      PinnedTabs.initializeConfig();
      expect(PinnedTabs.config.modified._change).toHaveBeenCalled();
    });

  });

  describe('::setObservers()', () => {

    it('should start observing opening new Panes', () => {
      spyOn(atom.workspace, 'onDidAddPane');

      PinnedTabs.setObservers();
      expect(atom.workspace.onDidAddPane).toHaveBeenCalled();
    });

    it('should start observing closing Panes', () => {
      spyOn(atom.workspace, 'onDidDestroyPane');

      PinnedTabs.setObservers();
      expect(atom.workspace.onDidDestroyPane).toHaveBeenCalled();
    });

    it('should start observing opening new Pane Items', () => {
      spyOn(atom.workspace, 'onDidAddPaneItem');

      PinnedTabs.setObservers();
      expect(atom.workspace.onDidAddPaneItem).toHaveBeenCalled();
    });

  });

  describe('::restoreState()', () => {

    let chickenPath, loremPath;

    beforeEach(() => {
      jasmine.unspy(window, 'setTimeout');

      waitsForPromise(() =>
        atom.workspace.open('fixtures/chicken.md')
          .then(editor => { chickenPath = editor.getPath(); })
      );
      waitsForPromise(() =>
        atom.workspace.open('fixtures/lorem.txt')
          .then(editor => { loremPath = editor.getPath(); })
      );
    });

    it('does nothing when the state specifies no tabs', () => {
      spyOn(PinnedTabs, 'pin');

      waitsForPromise(() => PinnedTabs.restoreState());
      runs(() => expect(PinnedTabs.pin).not.toHaveBeenCalled());
    });

    it('pins one tab that is specified in the state', () => {
      spyOn(PinnedTabs, 'pin');

      let paneId = 81;// TODO: Adjusting state
      PinnedTabs.state[paneId] = [
        { type: 'TextEditor', id: chickenPath, subscriptions: () => { } }
      ];

      waitsForPromise(() => PinnedTabs.restoreState());
      runs(() => {
        let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
        expect(PinnedTabs.pin).toHaveBeenCalledWith(tab, true);
      });
    });

    it('pins multiple tabs that are specified in the state', () => {
      spyOn(PinnedTabs, 'pin');

      let paneId = 85;// TODO: Adjusting state
      PinnedTabs.state[paneId] = [
        { type: 'TextEditor', id: chickenPath, subscriptions: () => { } },
        { type: 'TextEditor', id: loremPath, subscriptions: () => { } }
      ];

      waitsForPromise(() => PinnedTabs.restoreState());
      runs(() => {
        let tabChicken = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
        expect(PinnedTabs.pin).toHaveBeenCalledWith(tabChicken, true);

        let tabLorem = workspaceElement.querySelector('.tab .title[data-name="lorem.txt"]').parentNode;
        expect(PinnedTabs.pin).toHaveBeenCalledWith(tabLorem, true);
      });
    });

  });

  describe('::pinActive()', () => {

    beforeEach(() => {
      waitsForPromise(() => atom.workspace.open('fixtures/lorem.txt'));
    });

    it('calls ::pin() with the active item', () => {
      spyOn(PinnedTabs, 'pin');

      let tab = workspaceElement.querySelector('.tab .title[data-name="lorem.txt"]').parentNode;
      PinnedTabs.pinActive();
      expect(PinnedTabs.pin).toHaveBeenCalledWith(tab);
    });

  });

  describe('::pin()', () => {

    beforeEach(() => {
      waitsForPromise(() => atom.workspace.open('fixtures/chicken.md'));
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

    xit('pins a new (unsaved) file', () => {
      // TODO: No longer works
      waitsForPromise(() =>
        atom.workspace.open('').then(item => {
          item = atom.workspace.getPaneItems()[1]; // [0] = package.json from beforeEach

          let tabbar = document.createElement('div');
          let tab = document.createElement('div');
          document.body.appendChild(tabbar);
          tabbar.appendChild(tab);

          PinnedTabs.pin(item, tab);
          expect(tab.classList.contains('pinned')).toBeTruthy();
        })
      );
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
