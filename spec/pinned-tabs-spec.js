'use babel';

import { CompositeDisposable } from 'atom';
import fs from 'fs';

import PinnedTabs from '../lib/pinned-tabs.js';
import PinnedTabsState from '../lib/state.js';


describe('PinnedTabs', () => {

  let workspaceElement;

  beforeEach(done => {
    // Attach the workspace to the DOM
    workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);

    // The "tabs" package is required for pinned-tabs
    atom.packages.activatePackage('tabs')
      .then(() => atom.packages.activatePackage('settings-view'))
      .then(done);
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
      spyOn(PinnedTabs, 'observeConfig');

      PinnedTabs.activate();
      expect(PinnedTabs.observeConfig).toHaveBeenCalled();
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

    let itemId, paneId;

    beforeEach(done => {
      atom.workspace.open('chicken.md')
        .then(editor => {
          itemId = editor.getURI();
          paneId = atom.workspace.getPanes().find(pane => pane.getItems().includes(editor)).id;
        })
        .then(done);
    });

    it('disposes subscriptions', () => {
      spyOn(PinnedTabs.subscriptions, 'dispose');

      let itemSubscriptions = new CompositeDisposable();
      spyOn(itemSubscriptions, 'dispose');
      PinnedTabs.state.addPane(paneId, [{ id: itemId, subscriptions: itemSubscriptions }]);

      PinnedTabs.deactivate();
      expect(PinnedTabs.subscriptions.dispose).toHaveBeenCalled();
      expect(itemSubscriptions.dispose).toHaveBeenCalled();
    });

    it('removes all \'.pinned-tab\' classes', () => {
      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      tab.classList.add('pinned-tab');

      PinnedTabs.deactivate();
      expect(tab.classList.contains('pinned-tab')).toBeFalsy();
    });

    it('removes all configuration classes', () => {
      let body = document.querySelector('body');
      body.classList.add('pinned-tabs-animated');
      body.classList.add('pinned-tabs-modified-always');
      body.classList.add('pinned-tabs-modified-hover');
      body.classList.add('pinned-tabs-visualstudio');

      PinnedTabs.deactivate();
      expect(body.classList.contains('pinned-tabs-animated')).toBeFalsy();
      expect(body.classList.contains('pinned-tabs-modified-always')).toBeFalsy();
      expect(body.classList.contains('pinned-tabs-modified-hover')).toBeFalsy();
      expect(body.classList.contains('pinned-tabs-visualstudio')).toBeFalsy();
    });

  });

  describe('::serialize()', () => {

    it('serializes the state', () => {
      spyOn(PinnedTabs.state, 'serialize');

      PinnedTabs.serialize();
      expect(PinnedTabs.state.serialize).toHaveBeenCalled();
    });

  });

  describe('::observeConfig()', () => {

    it('observes the "animated" configuration variable', () => {
      spyOn(atom.config, 'observe');

      PinnedTabs.observeConfig();
      expect(atom.config.observe).toHaveBeenCalledWith('pinned-tabs.animated', jasmine.any(Function));
    });

    it('observes the "closeUnpinned" configuration variable', () => {
      spyOn(atom.config, 'observe');

      PinnedTabs.observeConfig();
      expect(atom.config.observe).toHaveBeenCalledWith('pinned-tabs.closeUnpinned', jasmine.any(Function));
    });

    it('observes the "modified" configuration variable', () => {
      spyOn(atom.config, 'observe');

      PinnedTabs.observeConfig();
      expect(atom.config.observe).toHaveBeenCalledWith('pinned-tabs.modified', jasmine.any(Function));
    });

    it('observes the "visualStudio" configuration variable', () => {
      spyOn(atom.config, 'observe');

      PinnedTabs.observeConfig();
      expect(atom.config.observe).toHaveBeenCalledWith('pinned-tabs.visualstudio.enable', jasmine.any(Function));
    });

    it('observes the "minimumWidth" configuration variable', () => {
      spyOn(atom.config, 'observe');

      PinnedTabs.observeConfig();
      expect(atom.config.observe).toHaveBeenCalledWith('pinned-tabs.visualstudio.minimumWidth', jasmine.any(Function));
    });

  });

  describe('::restoreState()', () => {

    let chickenId, paneId, state;

    beforeEach(done => {
      // Initialize a state to work with
      state = new PinnedTabsState();

      // Unspy setTimeout since ::restoreState() uses it
      jasmine.unspy(window, 'setTimeout');

      // Open two files in the workspace to work with
      atom.workspace.open('chicken.md')
        .then(editor => {
          chickenId = editor.getURI();
          paneId = atom.workspace.getPanes().find(pane => pane.getItems().includes(editor)).id;
        })
        .then(() => atom.workspace.open('lorem.txt'))
        .then(done);
    });

    it('does nothing when the state specifies no tabs', done => {
      spyOn(PinnedTabs, 'pin');

      PinnedTabs.restoreState(state)
        .then(() => expect(PinnedTabs.pin).not.toHaveBeenCalled())
        .then(done);
    });

    it('pins tabs that are specified in the state', done => {
      spyOn(PinnedTabs, 'pin');

      state[paneId] = [{ id: chickenId }];
      PinnedTabs.restoreState(state)
        .then(() => {
          let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
          expect(PinnedTabs.pin).toHaveBeenCalledWith(tab, true);
        })
        .then(done);
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

  describe('::setObservers()', () => {

    it('should start observing opening new Panes', () => {
      spyOn(atom.workspace, 'observePanes').and.returnValue(new CompositeDisposable());

      PinnedTabs.setObservers();
      expect(atom.workspace.observePanes).toHaveBeenCalled();
    });

    it('should start observing destroying Panes', () => {
      spyOn(atom.workspace, 'onDidDestroyPane').and.returnValue(new CompositeDisposable());

      PinnedTabs.setObservers();
      expect(atom.workspace.onDidDestroyPane).toHaveBeenCalled();
    });

    it('should start observing removing PaneItems', () => {
      spyOn(atom.workspace, 'onDidDestroyPaneItem').and.returnValue(new CompositeDisposable());

      PinnedTabs.setObservers();
      expect(atom.workspace.onDidDestroyPaneItem).toHaveBeenCalled();
    });

  });

  describe('::closeUnpinned()', () => {

    beforeEach(done => {
      atom.workspace.open('chicken.md')
        .then(() => atom.workspace.open('lorem.txt'))
        .then(done);
    });

    it('closes all unpinned tabs', () => {
      let pane = atom.workspace.getActivePane();

      PinnedTabs.closeUnpinned();
      expect(pane.getItems().length).toBe(0);
    });

    it('doesn\'t close pinned tabs', () => {
      let pane = atom.workspace.getActivePane();

      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      tab.classList.add('pinned-tab');

      PinnedTabs.closeUnpinned();
      expect(pane.getItems().length).toBe(1);
    });

  });

  describe('::pinActive()', () => {

    beforeEach(done => {
      atom.workspace.open('lorem.txt').then(done);
    });

    it('calls ::pin() with the active item', () => {
      spyOn(PinnedTabs, 'pin');

      let tab = workspaceElement.querySelector('.tab .title[data-name="lorem.txt"]').parentNode;
      PinnedTabs.pinActive();
      expect(PinnedTabs.pin).toHaveBeenCalledWith(tab);
    });

  });

  describe('::pin()', () => {

    let itemEditor, itemId, itemPane;

    beforeEach(done => {
      PinnedTabs.activate();

      // Open a file in the workspace to work with
      atom.workspace.open('chicken.md')
        .then(editor => {
          itemEditor = editor;
          itemId = editor.getURI();
          itemPane = atom.workspace.getPanes().find(pane => pane.getItems().includes(editor));
        })
        .then(done);
    });

    it('pins an unpinned TextEditor', () => {
      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      PinnedTabs.pin(tab);
      expect(tab.classList.contains('pinned-tab')).toBeTruthy();
    });

    it('unpins a pinned TextEditor', () => {
      let subscriptions = new CompositeDisposable();
      spyOn(subscriptions, 'dispose');

      PinnedTabs.state[itemPane.id] = [
        { id: itemId, subscriptions: subscriptions }
      ];

      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      tab.classList.add('pinned-tab');

      PinnedTabs.pin(tab);
      expect(tab.classList.contains('pinned-tab')).toBeFalsy();
      expect(subscriptions.dispose).toHaveBeenCalled();
    });

    it('updates the state when a tab is pinned', () => {
      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      PinnedTabs.pin(tab);
      expect(PinnedTabs.state[itemPane.id][0].id).toContain('chicken.md');
    });

    it('updates the state when a tab is unpinned', () => {
      PinnedTabs.state[itemPane.id] = [
        { id: itemId, subscriptions: new CompositeDisposable() }
      ];

      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      tab.classList.add('pinned-tab');

      PinnedTabs.pin(tab);
      expect(PinnedTabs.state[itemPane.id].length).toBe(0);
    });

    it('is possible to pin new (unsaved) editors', done => {
      atom.workspace.open('')
        .then(() => {
          let tab = workspaceElement.querySelector('.tab .title:not([data-name])').parentNode;
          PinnedTabs.pin(tab);
          expect(tab.classList.contains('pinned-tab')).toBeTruthy();
        })
        .then(done);
    });

    it('pins the settings tab', done => {
      atom.commands.dispatch(workspaceElement, 'settings-view:open');

      // Opening the settings view takes some time
      setTimeout(() => {
        let tab = workspaceElement.querySelector('.tab[data-type="SettingsView"]');
        PinnedTabs.pin(tab);
        expect(tab.classList.contains('pinned-tab')).toBeTruthy();
        done();
      });
    });

    xit('pins the about tab', done => {
      atom.commands.dispatch(workspaceElement, 'application:about');

      // Opening the about view takes some time
      setTimeout(() => {
        let tab = workspaceElement.querySelector('.tab[data-type="AboutView"]');
        PinnedTabs.pin(tab);
        expect(tab.classList.contains('pinned-tab')).toBeTruthy();
        done();
      });
    });

    it('calls ::onDidChangeTitle() when a pinned tab\'s name is changed', done => {
      spyOn(itemEditor, 'onDidChangeTitle').and.returnValue(new CompositeDisposable());

      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      PinnedTabs.pin(tab);

      itemEditor.saveAs('temporary-file')
        .then(() => {
          expect(itemEditor.onDidChangeTitle).toHaveBeenCalled();
          fs.unlinkSync('temporary-file'); // Remove created file
        })
        .then(done);
    });

    it('updates the state when a pinned tab\'s name is changed', done => {
      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      PinnedTabs.pin(tab);

      itemEditor.saveAs('temporary-file')
        .then(() => {
          setTimeout(() => {
            expect(PinnedTabs.state[itemPane.id][0].id).not.toBe(itemId); // The new path depends on the system
            fs.unlinkSync('temporary-file'); // Remove created file
            done();
          });
        });
    });

    it('updates the state if a pinned tab is closed', done => {
      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      PinnedTabs.pin(tab);

      itemPane.destroyItem(itemEditor, true)
        .then(() => expect(PinnedTabs.state[itemPane.id].length).toBe(0))
        .then(done);
    });

  });

  describe('::isPinned()', () => {

    it('returns true if the tab is pinned', () => {
      let tab = document.createElement('li');
      tab.classList.add('pinned-tab');
      expect(PinnedTabs.isPinned(tab)).toBeTruthy();
    });

    it('returns false if the tab isn\'t pinned', () => {
      let tab = document.createElement('li');
      expect(PinnedTabs.isPinned(tab)).toBeFalsy();
    });

  });

  describe('::reorderTab()', () => {

    let pane, chickenEditor, loremEditor;

    beforeEach(done => {
      atom.workspace.open('chicken.md')
        .then(editor => {
          chickenEditor = editor;
          pane = atom.workspace.getPanes().find(pane => pane.getItems().includes(editor));
          PinnedTabs.state[pane.id] = [];
        })
        .then(() => atom.workspace.open('lorem.txt'))
        .then(editor => {
          loremEditor = editor;
        })
        .then(done);
    });

    it('does nothing if an unpinned tab is moved to a valid index', () => {
      spyOn(pane, 'moveItem');

      PinnedTabs.reorderTab(pane, loremEditor, 0);
      expect(pane.moveItem).not.toHaveBeenCalled();
    });

    it('does not reorder if a pinned tab is moved to a valid index', () => {
      spyOn(pane, 'moveItem');

      let chickenTab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      chickenTab.classList.add('pinned-tab');
      let loremTab = workspaceElement.querySelector('.tab .title[data-name="lorem.txt"]').parentNode;
      loremTab.classList.add('pinned-tab');

      PinnedTabs.reorderTab(pane, loremEditor, 0);
      expect(pane.moveItem).not.toHaveBeenCalled();
    });

    it('moves unpinned tabs after pinned tabs', () => {
      spyOn(pane, 'moveItem');

      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      tab.classList.add('pinned-tab');

      PinnedTabs.state[pane.id] = [{ id: chickenEditor.getURI() }];

      PinnedTabs.reorderTab(pane, loremEditor, 0);
      expect(pane.moveItem).toHaveBeenCalledWith(loremEditor, 1);
    });

    it('moves pinned tabs before unpinned tabs', () => {
      spyOn(pane, 'moveItem');

      let tab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      tab.classList.add('pinned-tab');

      PinnedTabs.state[pane.id].push({id: chickenEditor.getURI()});

      PinnedTabs.reorderTab(pane, chickenEditor, 1);
      expect(pane.moveItem).toHaveBeenCalledWith(chickenEditor, 0);
    });

    it('updates the state if a pinned tab is moved', () => {
      spyOn(PinnedTabs.state, 'movePaneItem');

      let chickenTab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      chickenTab.classList.add('pinned-tab');
      let loremTab = workspaceElement.querySelector('.tab .title[data-name="chicken.md"]').parentNode;
      loremTab.classList.add('pinned-tab');

      PinnedTabs.state[pane.id] = [
        { id: chickenEditor.getURI() },
        { id: loremEditor.getURI() }
      ];

      PinnedTabs.reorderTab(pane, chickenEditor, 1);
      expect(PinnedTabs.state.movePaneItem).toHaveBeenCalled();
    });

  });

});
