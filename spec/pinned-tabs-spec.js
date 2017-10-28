const PinnedTabs = require('../lib/pinned-tabs.js');

describe('PinnedTabs', () => {

  it('has a "config" variable', () => {
    expect(PinnedTabs.config).toBeDefined();
  });

  it('has a "state" variable', () => {
    expect(PinnedTabs.state).toBeDefined();
  });

  describe('::activate()', () => {

    it('initializes the package commands', () => {
      spyOn(PinnedTabs, 'initCommands');

      PinnedTabs.activate();
      expect(PinnedTabs.initCommands).toHaveBeenCalled();
    });

    it('initializes the package configuration', () => {
      spyOn(PinnedTabs, 'initConfig');

      PinnedTabs.activate();
      expect(PinnedTabs.initConfig).toHaveBeenCalled();
    });

    it('initializes the package observers', () => {
      spyOn(PinnedTabs, 'initObservers');

      PinnedTabs.activate();
      expect(PinnedTabs.initObservers).toHaveBeenCalled();
    });

    it('initializes the pinned tabs from a previous state', () => {
      spyOn(PinnedTabs, 'initTabs');

      PinnedTabs.activate();
      expect(PinnedTabs.initTabs).toHaveBeenCalled();
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

  describe('::initCommands()', () => {

    it('initalizes the "pinned-tabs:pin-active" command', () => {
      spyOn(PinnedTabs, 'pinActive');
      PinnedTabs.initCommands();

      let workspace = document.createElement('atom-workspace');
      atom.commands.dispatch(workspace, 'pinned-tabs:pin-active');

      expect(PinnedTabs.pinActive).toHaveBeenCalled();
    });

    it('initalizes the "pinned-tabs:pin-selected" command', () => {
      spyOn(PinnedTabs, 'pinSelected');
      PinnedTabs.initCommands();

      let workspace = document.createElement('atom-workspace');
      atom.commands.dispatch(workspace, 'pinned-tabs:pin-selected');

      expect(PinnedTabs.pinSelected).toHaveBeenCalled();
    });

    it('initalizes the "pinned-tabs:close-unpinned" command', () => {
      spyOn(PinnedTabs, 'closeUnpinned');
      PinnedTabs.initCommands();

      let workspace = document.createElement('atom-workspace');
      atom.commands.dispatch(workspace, 'pinned-tabs:close-unpinned');

      expect(PinnedTabs.closeUnpinned).toHaveBeenCalled();
    });

  });

  describe('::initConfig()', () => {

    it('initializes observers for the config options', () => {
      spyOn(atom.config, 'onDidChange');

      PinnedTabs.initConfig();
      expect(atom.config.onDidChange).toHaveBeenCalled();
    });

    it('initializes the "animated" configuration variable', () => {
      spyOn(PinnedTabs.config.animated, '_change');

      PinnedTabs.initConfig();
      expect(PinnedTabs.config.animated._change).toHaveBeenCalled();
    });

    it('initializes the "closeUnpinned" configuration variable', () => {
      spyOn(PinnedTabs.config.closeUnpinned, '_change');

      PinnedTabs.initConfig();
      expect(PinnedTabs.config.closeUnpinned._change).toHaveBeenCalled();
    });

    it('initializes the "modified" configuration variable', () => {
      spyOn(PinnedTabs.config.modified, '_change');

      PinnedTabs.initConfig();
      expect(PinnedTabs.config.modified._change).toHaveBeenCalled();
    });

    it('performs the _change method for "animated" when it has been changed', () => {
      let spy = spyOn(PinnedTabs.config.animated, '_change');

      PinnedTabs.initConfig();
      atom.config.set('pinned-tabs.animated', false);

      expect(spy.callCount).toBe(2);
    });

    it('performs the _change method for "closeUnpinned" when it has been changed', () => {
      let spy = spyOn(PinnedTabs.config.closeUnpinned, '_change');

      PinnedTabs.initConfig();
      atom.config.set('pinned-tabs.closeUnpinned', true);

      expect(spy.callCount).toBe(2);
    });

    it('performs the _change method for "modified" when it has been changed', () => {
      let spy = spyOn(PinnedTabs.config.modified, '_change');

      PinnedTabs.initConfig();
      atom.config.set('pinned-tabs.modified', 'dont');

      expect(spy.callCount).toBe(2);
    });

  });

  describe('::initObservers()', () => {

    it('should start observing opening new PaneItems', () => {
      spyOn(atom.workspace, 'onDidAddPane');

      PinnedTabs.initObservers();
      expect(atom.workspace.onDidAddPane).toHaveBeenCalled();
    });

    it('should start observing closing PaneItems', () => {
      spyOn(atom.workspace, 'onDidDestroyPane');
      spyOn(atom.workspace, 'onWillDestroyPane');

      PinnedTabs.initObservers();
      expect(atom.workspace.onDidDestroyPane).toHaveBeenCalled();
      expect(atom.workspace.onWillDestroyPane).toHaveBeenCalled();
    });

  });

  describe('::initTabs()', () => {

    let done = false;

    beforeEach(() => {
      waitsForPromise(() => atom.workspace.open('fixtures/chicken.md'));
      waitsForPromise(() => atom.workspace.open('fixtures/lorem.txt'));
    });

    it('does nothing when the state specifies no tabs', () => {
      spyOn(PinnedTabs, 'pin');

      PinnedTabs.initTabs();
      expect(PinnedTabs.pin).not.toHaveBeenCalled();
    });

    it('pins any tabs that are specified in the state', () => {
      jasmine.unspy(window, 'setTimeout');
      spyOn(PinnedTabs, 'pin');

      let paneNode = document.createElement('div');
      paneNode.classList.add('pane', 'active');
      let tabNode = document.createElement('div');
      let titleNode = document.createElement('div');
      titleNode.classList.add('title');
      titleNode.setAttribute('data-name', 'chicken.md');

      document.body.appendChild(paneNode);
      paneNode.appendChild(tabNode);
      tabNode.appendChild(titleNode);

      let pane = atom.workspace.getPanes()[0];
      pane.activate();

      let paneId = pane.id;
      let items = atom.workspace.getPaneItems();

      PinnedTabs.state[paneId] = [];
      PinnedTabs.state[paneId].push(items[0].getURI());

      PinnedTabs.initTabs();

      setTimeout(() => { done = true; }, 10);
      waitsFor(() => done);
      runs(() => expect(PinnedTabs.pin).toHaveBeenCalledWith(items[0], tabNode));
    });

  });

  describe('::pinActive()', () => {

    let tab = undefined;

    beforeEach(() => {
      tab = document.createElement('li');
      tab.classList.add('tab', 'active');
      document.body.appendChild(tab);
    });

    afterEach(() => {
      document.body.removeChild(tab);
    });

    it('calls ::pin() with the active item', () => {
      spyOn(PinnedTabs, 'pin');

      waitsForPromise(() =>
        atom.workspace.open('fixtures/chicken.md').then(item => {
          PinnedTabs.pinActive();
          expect(PinnedTabs.pin).toHaveBeenCalledWith(item, tab);
        })
      );
    });

    it('doesn\'t call ::pin() when there is no active item', () => {
      spyOn(atom.workspace, 'getActivePaneItem').andReturn(null);
      spyOn(PinnedTabs, 'pin');

      PinnedTabs.pinActive();
      expect(PinnedTabs.pin).not.toHaveBeenCalled();
    });

  });

  describe('::pinSelected()', () => {

    beforeEach(() => {
      waitsForPromise(() => atom.workspace.open('fixtures/chicken.md'));
    });

    it('does nothing when no tab was selected', () => {
      spyOn(PinnedTabs, 'pin');

      PinnedTabs.pinSelected();
      expect(PinnedTabs.pin).not.toHaveBeenCalled();
    });

    xit('calls ::pin() with the selected item', () => {
      spyOn(PinnedTabs, 'pin');

      atom.contextMenu.activeElement = tab;
      PinnedTabs.pinSelected();

      expect(PinnedTabs.pin).toHaveBeenCalledWith(items[0], tab);
    });

  });

  describe('::pin()', () => {

    beforeEach(() => {
      waitsForPromise(() => atom.workspace.open('fixtures/chicken.md'));
    });

    it('pins unpinned tabs', () => {
      let item = atom.workspace.getPaneItems()[0];

      let tabbar = document.createElement('div');
      let tab = document.createElement('div');
      document.body.appendChild(tabbar);
      tabbar.appendChild(tab);

      PinnedTabs.pin(item, tab);
      expect(tab.classList.contains('pinned')).toBeTruthy();
    });

    it('unpins pinned tabs', () => {
      let item = atom.workspace.getPaneItems()[0];

      let tabbar = document.createElement('div');
      let tab = document.createElement('div');
      document.body.appendChild(tabbar);
      tabbar.appendChild(tab);

      tab.classList.add('pinned');
      PinnedTabs.pin(item, tab);
      expect(tab.classList.contains('pinned')).toBeFalsy();
    });

    it('changes the PinnedTabs state', () => {
      let paneId = atom.workspace.getPanes()[0].id;
      let item = atom.workspace.getPaneItems()[0];

      let tabbar = document.createElement('div');
      let tab = document.createElement('div');
      document.body.appendChild(tabbar);
      tabbar.appendChild(tab);

      PinnedTabs.pin(item, tab);
      expect(PinnedTabs.state[paneId]).toContain(item.getURI());
    });

    it('pins a new file', () => {
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

    it('doesn\'t fail when pinning a file w/o onDidChangeTitle', () => {
      let item = atom.workspace.getPaneItems()[0];
      item.onDidChangeTitle = undefined;

      let tabbar = document.createElement('div');
      let tab = document.createElement('div');
      document.body.appendChild(tabbar);
      tabbar.appendChild(tab);

      PinnedTabs.pin(item, tab);
      expect(tab.classList.contains('pinned')).toBeTruthy();
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
