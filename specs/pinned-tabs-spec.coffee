PinnedTabs = require '../lib/pinned-tabs.coffee'
{CommandRegistry, TextEditor} = require 'atom'


fakeSetTimeout = (funcToCall, millis) ->
  if jasmine.Clock.installed.setTimeout.apply
    return jasmine.Clock.installed.setTimeout.apply this, arguments
  else
    return jasmine.Clock.installed.setTimeout funcToCall, millis


describe 'PinnedTabs', ->
  it 'has a "config" variable', ->
    expect(PinnedTabs.config).toBeDefined()

  it 'has a "state" variable', ->
    expect(PinnedTabs.state).toBeDefined()

  describe '::activate()', ->
    it 'initializes the package commands', ->
      spyOn PinnedTabs, 'initCommands'

      PinnedTabs.activate { }
      expect(PinnedTabs.initCommands).toHaveBeenCalled()

    it 'initializes the package configuration', ->
      spyOn PinnedTabs, 'initConfig'

      PinnedTabs.activate { }
      expect(PinnedTabs.initConfig).toHaveBeenCalled()

    it 'initializes the package observers', ->
      spyOn PinnedTabs, 'initObservers'

      PinnedTabs.activate { }
      expect(PinnedTabs.initObservers).toHaveBeenCalled()

    it 'initializes the pinned tabs from a previous state', ->
      spyOn PinnedTabs, 'initTabs'

      PinnedTabs.activate { }
      expect(PinnedTabs.initTabs).toHaveBeenCalled()

    it 'doesn\'t throw when the package is being activated', ->
      waitsForPromise ->
        atom.packages.activatePackage('pinned-tabs').then ->
          expect(atom.packages.isPackageActive('pinned-tabs')).toBe true

  describe '::serialize()', ->

    it 'serializes the state', ->
      spyOn PinnedTabs.state, 'serialize'

      PinnedTabs.serialize()
      expect(PinnedTabs.state.serialize).toHaveBeenCalled()

  describe '::initCommands()', ->
    beforeEach ->
      PinnedTabs.initCommands()

    it 'initalizes the "pinned-tabs:pin-active" command', ->
      spyOn PinnedTabs, 'pinActive'

      workspace = document.createElement 'atom-workspace'
      atom.commands.dispatch workspace, 'pinned-tabs:pin-active'

      expect(PinnedTabs.pinActive).toHaveBeenCalled()

    it 'initalizes the "pinned-tabs:pin-selected" command', ->
      spyOn PinnedTabs, 'pinSelected'

      workspace = document.createElement 'atom-workspace'
      atom.commands.dispatch workspace, 'pinned-tabs:pin-selected'

      expect(PinnedTabs.pinSelected).toHaveBeenCalled()

    it 'initalizes the "pinned-tabs:close-unpinned" command', ->
      spyOn PinnedTabs, 'closeUnpinnedTabs'

      workspace = document.createElement 'atom-workspace'
      atom.commands.dispatch workspace, 'pinned-tabs:close-unpinned'

      expect(PinnedTabs.closeUnpinnedTabs).toHaveBeenCalled()

  describe '::initObservers()', ->
    it 'should start observing opening new PaneItems', ->
      spyOn atom.workspace, 'onDidAddPaneItem'

      PinnedTabs.initObservers()
      expect(atom.workspace.onDidAddPaneItem).toHaveBeenCalled()

    it 'should start observing closing PaneItems', ->
      spyOn atom.workspace, 'onWillDestroyPaneItem'

      PinnedTabs.initObservers()
      expect(atom.workspace.onWillDestroyPaneItem).toHaveBeenCalled()

  describe '::initTabs()', ->
    [done] = [false]

    beforeEach ->
      waitsForPromise ->
        atom.workspace.open 'package.json'
      waitsForPromise ->
        atom.workspace.open 'README.md'

    it 'does nothing when the state specifies no tabs', ->
      spyOn PinnedTabs, 'pin'

      PinnedTabs.initTabs()
      expect(PinnedTabs.pin).not.toHaveBeenCalled()

    it 'pins any tabs that are specified in the state', ->
      jasmine.unspy window, 'setTimeout'
      spyOn PinnedTabs, 'pin'

      items = atom.workspace.getPaneItems()
      PinnedTabs.state.data.push items[0].id

      PinnedTabs.initTabs()
      setTimeout (=> done = true), 10

      waitsFor ->
        done

      runs ->
        expect(PinnedTabs.pin).toHaveBeenCalledWith(items[0])
        expect(PinnedTabs.pin).not.toHaveBeenCalledWith(items[1])
