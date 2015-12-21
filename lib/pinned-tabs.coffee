PinnedTabsView = require './pinned-tabs-view'
{CompositeDisposable} = require 'atom'

module.exports = PinnedTabs =
    # Method that is ran when the package is started.
    activate: (state) ->
        # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable.
        @subscriptions = new CompositeDisposable

        # Register commands to pin a tab.
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:pin': => @pinActive()
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:pin-selected': => @pinSelected()

    # Method that is ran when the package is stopped.
    deactivate: ->
        @pinnedTabsView.destroy()

    # Method that is ran to serialize the package.
    serialize: ->
        pinnedTabsViewState: @pinnedTabsView.serialize()


    # Method to pin the active tab.
    pinActive: ->
        @pin(document.querySelector '.tab.active')

    # Method to pin the selected (via contextmenu) tab.
    pinSelected: ->
        @pin(atom.contextMenu.activeElement)

    pin: (e) ->
        if e.classList.contains 'pinned'
            # If the element has the class 'pinned', it will be unpinned with
            # this function call.

            # First move it to the front, this is the amount of pinned tabs at
            # worst. Because a tab being unpinned must be in the range of
            # pinned tabs.
            limit = document.querySelector('.tab-bar').querySelectorAll('.tab.pinned').length
            for i in [0...limit]
                atom.workspace.getActivePane().moveItemLeft()

            # Then, move it back to the right for the amount of pinned tabs
            # minus 1. The minus 1 is there because this tab should be now be
            # the first unpinned tab which is the spot of the current last
            # pinned tab.
            limit = document.querySelector('.tab-bar').querySelectorAll('.tab.pinned').length - 1
            for i in [0...limit]
                atom.workspace.getActivePane().moveItemRight()
        else
            # If the element does not have has the class 'pinned', it will be
            # pinned with this function call.

            # First move the current tab to the front. This can be, in the
            # worst case scenario, the amount of opened tabs if the last tab
            # should be pinned.
            limit = document.querySelector('.tab-bar').querySelectorAll('.tab').length
            for i in [0...limit]
                atom.workspace.getActivePane().moveItemLeft()

            # Then move the tab to the last spot of the pinned tabs. To
            # achieve this the tab should be moved as many times as there
            # are pinned tabs.
            limit = document.querySelector('.tab-bar').querySelectorAll('.tab.pinned').length
            for i in [0...limit]
                atom.workspace.getActivePane().moveItemRight()

        # Finally, toggle the 'pinned' class on the tab after a
        # timout of 1 millisecond. This will ensure the animation
        # of pinning the tab will run.
        callback = -> e.classList.toggle('pinned')
        setTimeout callback, 1
