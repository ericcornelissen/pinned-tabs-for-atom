PinnedTabsView = require './pinned-tabs-view'
{CompositeDisposable} = require 'atom'

module.exports = PinnedTabs =
    pinnedTabsView: null

    activate: (state) ->
        @pinnedTabsView = new PinnedTabsView(state.pinnedTabsViewState)

        # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        @subscriptions = new CompositeDisposable

        # Register command that will pin the current tab
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:pin': => @pin()

    deactivate: ->
        @pinnedTabsView.destroy()

    serialize: ->
        pinnedTabsViewState: @pinnedTabsView.serialize()

    pin: ->
        if pane = atom.workspace.getActivePaneItem()
            atom.contextMenu.activeElement.classList.toggle('pinned')
