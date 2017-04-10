PinnedTabsState = require './pinned-tabs-state'
{CompositeDisposable} = require 'atom'

module.exports = PinnedTabs =
  config:
    animated:
      _change: (enable) ->
        body = document.querySelector 'body'
        body.classList.toggle 'pinned-tabs-animated', enable
      title: 'Enable animations'
      description: 'Tick this to enable all animation related to pinned tabs'
      default: true
      type: 'boolean'
    closeUnpinned:
      _change: (enable) ->
        body = document.querySelector 'body'
        body.classList.toggle 'close-unpinned', enable
      title: 'Enable the \'Close Unpinned Tabs\' option'
      description: 'Tick this to show the \'Close Unpinned Tabs\' from the context menu'
      default: false
      type: 'boolean'
    modified:
      _change: (value) ->
        body = document.querySelector 'body'
        if value == 'dont'
          body.classList.remove 'pinned-tabs-modified-always'
          body.classList.remove 'pinned-tabs-modified-hover'
        else if value == 'hover'
          body.classList.remove 'pinned-tabs-modified-always'
          body.classList.add 'pinned-tabs-modified-hover'
        else
          body.classList.add 'pinned-tabs-modified-always'
          body.classList.remove 'pinned-tabs-modified-hover'
      title: 'Use an indicator for when a pinned tab has unsaved modifications'
      default: 'always'
      type: 'string'
      enum: [
        { value: 'dont', description: 'Don\'t use this feature' }
        { value: 'hover', description: 'Only show this when I hover over the tab' }
        { value: 'always', description: 'Always show this when a tab is modified' }
      ]
  state: new PinnedTabsState []
  subscriptions: new CompositeDisposable()

  activate: (state) ->
    @state = atom.deserializers.deserialize state if state.deserializer == 'PinnedTabsState'

    @initCommands()
    @initConfig()
    @initObservers()
    @initTabs()

  serialize: ->
    @state.serialize()

  # Initalization
  initCommands: ->
    atom.commands.add 'atom-workspace', 'pinned-tabs:pin-active', => @pinActive()
    atom.commands.add 'atom-workspace', 'pinned-tabs:pin-selected', => @pinSelected()
    atom.commands.add 'atom-workspace', 'pinned-tabs:close-unpinned', => @closeUnpinnedTabs()

  initConfig: ->
    atom.config.onDidChange 'pinned-tabs.animated', ({newValue}) =>
      @config.animated._change newValue
    @config.animated._change atom.config.get('pinned-tabs.animated')

    atom.config.onDidChange 'pinned-tabs.closeUnpinned', ({newValue}) =>
      @config.closeUnpinned._change newValue
    @config.closeUnpinned._change atom.config.get('pinned-tabs.closeUnpinned')

    atom.config.onDidChange 'pinned-tabs.modified', ({newValue}) =>
      @config.modified._change newValue
    @config.modified._change atom.config.get('pinned-tabs.modified')

  initObservers: ->
    atom.workspace.onDidAddPaneItem ({index, item, pane}) =>
      setTimeout (=>
        tab = document.querySelector '.tab-bar .tab.active'
        pinnedTabs = tab.parentNode.querySelectorAll '.pinned'
        if index < pinnedTabs.length
          pane.moveItem item, pinnedTabs.length
      ), 1

    atom.workspace.onWillDestroyPaneItem ({item}) =>
      @state.data = @state.data.filter (id) -> id isnt item.id

  initTabs: ->
    for item in atom.workspace.getPaneItems()
      if @state.data.includes item.id
        setTimeout ((item) => @pin item), 1, item

  # Pin tabs
  pinActive: ->
    item = atom.workspace.getActivePaneItem()
    tab = document.querySelector '.tab.active'
    @pin item, tab

  pinSelected: ->
    tab = atom.contextMenu.activeElement
    return false if tab == null
    title = tab.querySelector '.title'
    return false if title == null
    target = title.getAttribute 'data-name'
    return false if target == null

    for item in atom.workspace.getPaneItems()
      if item.getTitle() == target
        return @pin item, tab

  pin: (item, tab) ->
    return false if item == null

    tab = document.querySelector('.title[data-name="' + item.getTitle() + '"]').parentNode if tab == undefined
    pane = atom.workspace.paneForItem item
    pinnedTabs = tab.parentNode.querySelectorAll '.pinned'

    if @isPinned tab
      @state.data = @state.data.filter (id) -> id isnt item.id
      pane.moveItem item, pinnedTabs.length - 1
      tab.classList.remove 'pinned'
    else
      @state.data.push item.id
      pane.moveItem item, pinnedTabs.length
      tab.classList.add 'pinned'

  # Misc
  closeUnpinnedTabs: ->
    activePane = document.querySelector '.pane.active'
    tabbar = activePane.querySelector '.tab-bar'

    activePane = atom.workspace.getActivePane()
    tabs = tabbar.querySelectorAll '.tab'
    for i in [tabs.length - 1..0]
      if !tabs[i].classList.contains 'pinned'
        activePane.destroyItem activePane.itemAtIndex i

  isPinned: (tab) ->
    tab.classList.contains 'pinned'
