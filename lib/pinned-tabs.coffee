PinnedTabsState = require './pinned-tabs-state'
{CompositeDisposable} = require 'atom'

module.exports = PinnedTabs =
    config:
        animated:
            title: 'Disable animations'
            description: 'Untick this to enable all animation related to Pinned Tabs'
            default: false
            type: 'boolean'
        colored:
            title: 'Disable colored icons'
            description: 'Untick this for colored icons'
            default: false
            type: 'boolean'
        closeUnpinned:
            title: 'Disable the \'Close Unpinned Tabs\' option'
            description: 'Untick this to keep the option'
            default: true
            type: 'boolean'
        modified:
            title: 'Disable the modified icon on pinned tabs'
            description: 'Untick this for the modified file-icon'
            default: false
            type: 'boolean'

    PinnedTabsState: undefined


	# Core
    activate: (state) ->
        @observers()
        @prepareConfig()
        @setCommands()

        # Recover the serialized session or start a new serializable state.
        @PinnedTabsState =
            if state.deserializer == 'PinnedTabsState'
                atom.deserializers.deserialize state
            else
                new PinnedTabsState { }

        # Restore the serialized session.
        # This timeout ensures that the DOM elements can be edited.
        setTimeout (=>
            panes = document.querySelector('.panes')
            oldState = this.PinnedTabsState.data
            for key of oldState
                try
                    pane = panes.children[parseInt(key, 10)]
                    tabbar = pane.querySelector '.tab-bar'
                    for i in [0...oldState[key]]
                        tabbar.children[i].classList.add 'pinned'
                catch
                    delete oldState[key]
            ), 1

    serialize: ->
        @PinnedTabsState.serialize()


    # Utility
    observers: ->
        # Move new tabs after pinned tabs
        atom.workspace.onDidAddPaneItem () =>
            setTimeout (=>
                e = document.querySelector('.tab-bar .tab.active')
                return unless tab = this.getTabInformation e

                if tab.pinIndex > tab.tabIndex
                    tab.pane.moveItem(tab.item, tab.pinIndex)
            ), 1

        # Reduce the amount of pinned tabs when one is destoryed
        atom.workspace.onWillDestroyPaneItem (event) =>
            paneIndex = Array.prototype.indexOf.call(atom.workspace.getPanes(), event.pane) * 2
            tabIndex = Array.prototype.indexOf.call(event.pane.getItems(), event.item)

            return unless axis = document.querySelector('.tab-bar').parentNode.parentNode
            try
                paneNode = axis.children[paneIndex].querySelector('.tab-bar')
                if paneNode.children[tabIndex].classList.contains('pinned')
                    this.PinnedTabsState.data[paneIndex] -= 1

    setCommands: ->
        @subscriptions = new CompositeDisposable
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:pin': => @pinActive()
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:pin-selected': => @pinSelected()
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:close-unpinned': => @closeUnpinnedTabs()


	# Pin tabs
    closeUnpinnedTabs: ->
        activePane = document.querySelector '.pane.active'
        tabbar = activePane.querySelector '.tab-bar'

        activePane = atom.workspace.getActivePane()
        tabs = tabbar.querySelectorAll '.tab'
        for i in [(tabs.length - 1)..0]
            if !tabs[i].classList.contains('pinned')
                #activePane.itemAtIndex i
                activePane.destroyItem activePane.itemAtIndex(i)

    pinActive: ->
        @pin document.querySelector('.tab-bar .tab.active')

    pinSelected: ->
        @pin atom.contextMenu.activeElement

    pin: (e) ->
        return unless tab = @getTabInformation e

        # Initialize the state key for this pane if needed
        if @PinnedTabsState.data[tab.paneIndex] == undefined || isNaN(@PinnedTabsState.data[tab.paneIndex])
            @PinnedTabsState.data[tab.paneIndex] = 0

        if tab.isPinned
            @PinnedTabsState.data[tab.paneIndex] -= 1
            tab.pane.moveItem(tab.item, tab.unpinIndex)
        else
            @PinnedTabsState.data[tab.paneIndex] += 1
            tab.pane.moveItem(tab.item, tab.pinIndex)

        setTimeout (->
            e.classList.toggle 'pinned'
        ), 1

    getTabInformation: (e) ->
        return if e == null
        tabbarNode = e.parentNode
        paneNode = tabbarNode.parentNode
        axisNode = paneNode.parentNode

        tabIndex = Array.prototype.indexOf.call(tabbarNode.children, e)
        paneIndex = Array.prototype.indexOf.call(axisNode.children, paneNode)
        pinIndex = paneNode.querySelectorAll('.pinned').length

        pane = atom.workspace.getPanes()[paneIndex / 2]
        item = pane.itemAtIndex(tabIndex)

        return {
            tabIndex: tabIndex,
            paneIndex: paneIndex,

            pinIndex: pinIndex,
            unpinIndex: pinIndex - 1,

            itemNode: undefined,
            paneNode: undefined,

            item: item,
            pane: pane,

            isPinned: e.classList.contains 'pinned'
        }


    # Configuration
    prepareConfig: ->
        animated = 'pinned-tabs.animated'
        atom.config.onDidChange animated, ({newValue, oldValue}) =>
            @animated newValue
        @animated atom.config.get(animated)

        coloredIcons = 'pinned-tabs.colored'
        atom.config.onDidChange coloredIcons, ({newValue, oldValue}) =>
            @colored newValue
        @colored atom.config.get(coloredIcons)

        closeUnpinned = 'pinned-tabs.closeUnpinned'
        atom.config.onDidChange closeUnpinned, ({newValue, oldValue}) =>
            @closeUnpinned newValue
        @closeUnpinned atom.config.get(closeUnpinned)

        modified = 'pinned-tabs.modified'
        atom.config.onDidChange modified, ({newValue, oldValue}) =>
            @modified newValue
        @modified atom.config.get(modified)

    animated: (enable) ->
        body = document.querySelector 'body'
        body.classList.toggle 'pinned-tabs-animated', !enable

    colored: (enable) ->
        body = document.querySelector 'body'
        body.classList.toggle 'pinned-tabs-not-colored', enable

    closeUnpinned: (enable) ->
        body = document.querySelector 'body'
        body.classList.toggle 'close-unpinned', !enable

    modified: (enable) ->
        body = document.querySelector 'body'
        body.classList.toggle 'pinned-tabs-modified', !enable
