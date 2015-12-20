PinnedTabsView = require './pinned-tabs-view'
{CompositeDisposable} = require 'atom'

module.exports = PinnedTabs =
    activate: (state) ->
        # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable.
        @subscriptions = new CompositeDisposable

        # Register commands to pin a tab.
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:pin': => @pinActive()
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:pin-selected': => @pinSelected()

    deactivate: ->
        @pinnedTabsView.destroy()

    serialize: ->
        pinnedTabsViewState: @pinnedTabsView.serialize()


    pinActive: ->
        @pin(document.querySelector '.tab.active')
    pinSelected: ->
        @pin(atom.contextMenu.activeElement)

    pin: (e) ->
        e.classList.toggle 'pinned'

        # Move the tab to the front if it is being pinned.
        if e.classList.contains 'pinned'
            try
                # Get a list of all the pinned tabs.
                pinned_tabs = e.parentNode.querySelectorAll '.tab.pinned'

                # Insert the newly pinned tab at the last
                # place of pinned tabs.
                # For some reason, the pinned tab at the
                # end is (as far is a I know) always at
                # the (n - 2)th place.
                e.parentNode.insertBefore e, pinned_tabs[pinned_tabs.length - 2].nextSibling
            catch
                # If that failed, there is no pinned tab
                # yet and this tab should be inserted as
                # first child.
                e.parentNode.insertBefore e, e.parentNode.firstChild
        else
            try
                # Get a list of all the pinned tabs.
                pinned_tabs = e.parentNode.querySelectorAll '.tab.pinned'

                # Insert the newly pinned tab at the first
                # spot of unpinned tabs.
                e.parentNode.insertBefore e, pinned_tabs[pinned_tabs.length - 1].nextSibling
