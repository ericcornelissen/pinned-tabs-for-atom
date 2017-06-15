PinnedTabsState = require './pinned-tabs-state'
{CompositeDisposable} = require 'atom'

ABOUT_URI = 'About'
CONFIG_URI = 'atom://config'

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
  state: new PinnedTabsState({ })
  subscriptions: new CompositeDisposable()

  activate: (state) ->
    @state = atom.deserializers.deserialize state if state.deserializer == 'PinnedTabsState'

    # Reset states from older versions
    @state.data = { } if @state.data == undefined
    for key, value of @state.data
      @state.data[key] = [] if value != undefined && not Array.isArray value

    # Initialize commands/config/etc.
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
      setTimeout =>
        tab = document.querySelector '.tab-bar .tab.active'
        pinnedTabs = tab.parentNode.querySelectorAll '.pinned'
        if index < pinnedTabs.length
          pane.moveItem item, pinnedTabs.length
      , 1

    atom.workspace.onDidDestroyPane ({pane}) =>
      delete @state.data[pane.id] if @state.data[pane.id] != undefined

    atom.workspace.onWillDestroyPaneItem ({item, pane}) =>
      return if not Array.isArray @state.data[pane.id]
      @state.data[pane.id] = @state.data[pane.id].filter (id) => id isnt @getItemID(item)

  initTabs: ->
    activePane = atom.workspace.getActivePane()
    for pane in atom.workspace.getPanes()
      continue if @state.data[pane.id] == undefined

      for target in @state.data[pane.id]
        for item in pane.getItems()
          if target == @getItemID item
            setTimeout (pane, item) =>
              paneNode = pane.element
              if paneNode == undefined
                pane.activate()
                paneNode = document.querySelector '.pane.active'
                return if paneNode == null

              if item.getTitle
                title = paneNode.querySelector '.title[data-name="' + item.getTitle() + '"]'
                tab = title.parentNode if title != null
              if !tab && item.filePath
                  title = paneNode.querySelector '.title[data-path="' + item.filePath.replace(/\\/g, '\\\\') + '"]'
                  tab = title.parentNode if title != null
              if item.element && item.element.classList.contains 'about'
                tab = paneNode.querySelector '.tab[data-type="AboutView"]'
              if item.element && item.element.classList.contains 'settings-view'
                tab = paneNode.querySelector '.tab[data-type="SettingsView"]'

              @pin item, tab if tab != undefined
              activePane.activate() if activePane != undefined
            , 1, pane, item

  # Pin tabs
  pinActive: ->
    tab = document.querySelector '.tab.active:not([data-type="TreeView"])'
    item = atom.workspace.getActivePaneItem()
    @pin item, tab if tab != null && item != null

  pinSelected: ->
    tab = atom.contextMenu.activeElement
    item = @getEditor tab
    @pin item, tab if tab != null && item != null

  pin: (item, tab) ->
    return false if item == null || tab == null

    pane = atom.workspace.paneForItem item
    pinnedTabs = tab.parentNode.querySelectorAll '.pinned'
    @state.data[pane.id] = [] if @state.data[pane.id] == undefined

    if @isPinned tab
      @state.data[pane.id] = @state.data[pane.id].filter (id) => id isnt @getItemID(item)
      pane.moveItem item, pinnedTabs.length - 1
      tab.classList.remove 'pinned'
    else
      @state.data[pane.id].push @getItemID(item) if not @state.data[pane.id].includes @getItemID(item)
      pane.moveItem item, pinnedTabs.length
      tab.classList.add 'pinned'

      # Watch for filename changes and update the state accordingly
      if item.onDidChangeTitle
        oldId = @getItemID item
        item.onDidChangeTitle =>
            return if not @state.data[pane.id].includes oldId # Prevent tabs that are no longer pinned from being repinned
            @state.data[pane.id] = @state.data[pane.id].filter (id) => id isnt oldId
            @state.data[pane.id].push @getItemID(item) if not @state.data[pane.id].includes @getItemID(item)

  # Misc
  closeUnpinnedTabs: ->
    activePane = document.querySelector '.pane.active'
    tabbar = activePane.querySelector '.tab-bar'

    activePane = atom.workspace.getActivePane()
    tabs = tabbar.querySelectorAll '.tab'
    for i in [tabs.length - 1..0]
      if !tabs[i].classList.contains 'pinned'
        activePane.destroyItem activePane.itemAtIndex i

  getEditor: (tab) ->
    return null if tab == null

    target = null
    atom.workspace.getPanes().forEach (pane) =>
      return if target != null
      pane.items.forEach (item) =>
        return if target != null
        if item.filePath
          target = item if tab.querySelector '.title[data-path="' + item.filePath.replace(/\\/g, '\\\\') + '"]'
        if item.getTitle
          target = item if tab.querySelector '.title[data-name="' + item.getTitle() + '"]'
        if item.element && item.element.classList.contains 'about'
          target = item if tab.getAttribute('data-type') == 'AboutView'
        if item.element && item.element.classList.contains 'settings-view'
          target = item if tab.getAttribute('data-type') == 'SettingsView'

    return target

  getItemID: (item) ->
    if item.getURI && item.getURI()
      uri = item.getURI()
      uri = 'markdown-preview://' + item.editorForId(item.editorId).getFileName() if uri.match(/markdown-preview:\/\//)
      return uri
    else if item.getTitle
      return item.getTitle()

  isPinned: (tab) ->
    tab.classList.contains 'pinned'
