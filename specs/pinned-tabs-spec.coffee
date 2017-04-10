PinnedTabs = require '../lib/pinned-tabs.coffee'

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

  describe '::serialize()', ->

    it 'serializes the state', ->
      spyOn PinnedTabs.state, 'serialize'

      PinnedTabs.serialize()
      expect(PinnedTabs.state.serialize).toHaveBeenCalled()
