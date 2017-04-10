PinnedTabsState = require './pinned-tabs-state'
{CompositeDisposable} = require 'atom'

module.exports = PinnedTabs =
  config:
    animated:
      title: 'Enable animations'
      description: 'Tick this to enable all animation related to pinned tabs'
      default: true
      type: 'boolean'
    closeUnpinned:
      title: 'Enable the \'Close Unpinned Tabs\' option'
      description: 'Tick this to show the \'Close Unpinned Tabs\' from the context menu'
      default: false
      type: 'boolean'
    modified:
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
    animated = 'pinned-tabs.animated'
    atom.config.onDidChange animated, ({newValue, oldValue}) =>
      @animated newValue
    @animated atom.config.get(animated)

    closeUnpinned = 'pinned-tabs.closeUnpinned'
    atom.config.onDidChange closeUnpinned, ({newValue, oldValue}) =>
      @closeUnpinned newValue
    @closeUnpinned atom.config.get(closeUnpinned)

    modified = 'pinned-tabs.modified'
    atom.config.onDidChange modified, ({newValue, oldValue}) =>
      @modified newValue
    @modified atom.config.get(modified)

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

  # Configuration
  animated: (enable) ->
    body = document.querySelector 'body'
    body.classList.toggle 'pinned-tabs-animated', enable

  closeUnpinned: (enable) ->
    body = document.querySelector 'body'
    body.classList.toggle 'close-unpinned', enable

  modified: (value) ->
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

  # Pin tabs
  pinActive: ->
    item = atom.workspace.getActivePaneItem()
    @pin item

  pinSelected: ->
    tab = atom.contextMenu.activeElement
    return if tab == null

    tabbarNode = tab.parentNode
    paneNode = tabbarNode.parentNode
    axisNode = paneNode.parentNode
    tabIndex = Array.prototype.indexOf.call tabbarNode.children, tab
    paneIndex = Array.prototype.indexOf.call axisNode.children, paneNode
    pane = atom.workspace.getPanes()[paneIndex / 2]

    item = pane.itemAtIndex tabIndex
    @pin item

  pin: (item) ->
    return if item == null

    tab = document.querySelector('.title[data-name="' + item.getTitle() + '"]').parentNode
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
