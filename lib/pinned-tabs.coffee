PinnedTabsView = require './pinned-tabs-view'
{CompositeDisposable} = require 'atom'

module.exports = PinnedTabs =
    pinnedTabsView: null
    modalPanel: null
    subscriptions: null

    activate: (state) ->
        @pinnedTabsView = new PinnedTabsView(state.pinnedTabsViewState)
        @modalPanel = atom.workspace.addModalPanel(item: @pinnedTabsView.getElement(), visible: false)

        # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        @subscriptions = new CompositeDisposable

        # Register command that toggles this view
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:toggle': => @toggle()

    deactivate: ->
        @modalPanel.destroy()
        @subscriptions.dispose()
        @pinnedTabsView.destroy()

    serialize: ->
        pinnedTabsViewState: @pinnedTabsView.serialize()

    toggle: ->
        console.log 'PinnedTabs was toggled!'

        if @modalPanel.isVisible()
            @modalPanel.hide()
        else
            @modalPanel.show()

    pin: ->
        if @modalPanel.isVisible()
            @modalPanel.hide()
        else
            @modalPanel.show()
