PinnedTabsView = require './pinned-tabs-view'
{CompositeDisposable} = require 'atom'

module.exports = PinnedTabs =
    pinnedTabsView: null

    activate: (state) ->
        @pinnedTabsView = new PinnedTabsView(state.pinnedTabsViewState)

        # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        @subscriptions = new CompositeDisposable

        # Register command that will pin the current tab
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:pin-selected': => @pinSelected()
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:pin': => @pinActive()

    deactivate: ->
        @pinnedTabsView.destroy()

    serialize: ->
        pinnedTabsViewState: @pinnedTabsView.serialize()


    pinActive: ->
        if tab = document.querySelector('.tab.active')
            tab.classList.toggle('pinned')
    pinSelected: ->
        if tab = atom.contextMenu.activeElement
            tab.classList.toggle('pinned')
