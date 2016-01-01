PinnedTabsState = require './pinned-tabs-state'
{CompositeDisposable} = require 'atom'

module.exports = PinnedTabs =
    # Configuration of the package
    config:
        coloredIcons:
            title: 'Use colored icons'
            type: 'boolean'
            default: true
            description: 'Untick this for colorless icons'
        disableTabAnimation:
            title: 'Disable tab animation'
            description: 'Disable the animation used to pin a tab'
            type: 'boolean'
            default: false
        disableIconAnimation:
            title: 'Disable icon animation'
            description: 'Disable the animation of the icon of a pinned tab'
            type: 'boolean'
            default: false

    # Attribute used to store the workspace state.
    PinnedTabsState: undefined

    activate: (state) ->
        @setCommands()
        @configObservers()
        @observers()

        # Recover the serialized session or start a new serializable state.
        @PinnedTabsState =
            if state.deserializer == 'PinnedTabsState'
                atom.deserializers.deserialize state
            else
                new PinnedTabsState {}

        # Restore the serialized session.
        self = this # This object has to be stored in self because the callback function will create its own 'this'
        # This timeout ensures that the DOM elements can be edited.
        setTimeout (->
            # Get the panes DOM object.
            panes = document.querySelector '.panes .pane-row'
            panes = document.querySelector('.panes') if panes == null

            # Loop through each pane that the previous
            # state has information about.
            for key of self.PinnedTabsState.data
                try
                    # Find the pane and tab-bar DOM objects for
                    # this pane.
                    pane = panes.children[parseInt key, 10]
                    tabbar = pane.querySelector '.tab-bar'

                    # Pin the first N tabs, since pinned tabs are
                    # always the left-most tabs. The N is given
                    # by the previous state.
                    for i in [0...self.PinnedTabsState.data[key]]
                        tabbar.children[i].classList.add 'pinned'
                catch
                    # If an error occured, the workspace has changed
                    # and the old configuration should be ignored.
                    delete self.PinnedTabsState.data[key]
            ), 1

    serialize: ->
        @PinnedTabsState.serialize()


    # Register commands for this package.
    setCommands: ->
        @subscriptions = new CompositeDisposable
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:pin': => @pinActive()
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:pin-selected': => @pinSelected()

    # Add an event listener for when the value of the settings are changed.
    configObservers: ->
        body = document.querySelector 'body'
        atom.config.observe 'pinned-tabs.disableTabAnimation', (newValue) ->
            if newValue
                body.classList.remove 'pinned-tabs-enable-tabanimation'
            else
                body.classList.add 'pinned-tabs-enable-tabanimation'
        atom.config.observe 'pinned-tabs.disableIconAnimation', (newValue) ->
            if newValue
                body.classList.remove 'pinned-tabs-enable-iconanimation'
            else
                body.classList.add 'pinned-tabs-enable-iconanimation'
        atom.config.observe 'pinned-tabs.coloredIcons', (newValue) =>
            body = document.querySelector 'body'
            if newValue
                body.classList.remove 'pinned-icons-colorless'
            else
                body.classList.add 'pinned-icons-colorless'

    #
    observers: ->
        self = this # This object has to be stored in self because the callback function will create its own 'this'
        atom.workspace.onDidAddPaneItem (event) ->
            setTimeout (->
                # Get information about the tab
                r = self.getTabInformation document.querySelector('.tab-bar .tab.active'), event.index

                # Move it if necessary
                if r.newIndex > r.oldIndex
                    r.pane.moveItem r.item, r.newIndex
            ), 1


    # Method to pin the active tab.
    pinActive: ->
        @pin document.querySelector('.tab-bar .tab.active')

    # Method to pin the selected (via contextmenu) tab.
    pinSelected: ->
        @pin atom.contextMenu.activeElement

    # Method that pins/unpins a tab given its element.
    pin: (e) ->
        # Get information about the tab
        r = @getTabInformation e

        # Calculate the new index for this tab based
        # on the amount of pinned tabs within this pane.
        if e.classList.contains 'pinned'
            # If the element has the element 'pinned', it
            # is currently being unpinned. So the new index
            # is one off when look at the amount of pinned
            # tabs, because it actually includes the tab
            # that is being unpinned.
            r.newIndex -= 1

            # Removed one pinned tab from the state key for this pane.
            @PinnedTabsState.data[r.paneIndex] -= 1
        else
            # Initialize the state kye for this pane if needed.
            @PinnedTabsState.data[r.paneIndex] = 0 if @PinnedTabsState.data[r.paneIndex] == undefined

            # Add one pinned tab from the state key for this pane.
            @PinnedTabsState.data[r.paneIndex] += 1

        # Move the tab to its new index
        r.pane.moveItem r.item, r.newIndex

        # Finally, toggle the 'pinned' class on the tab after a
        # timout of 1 millisecond. This will ensure the animation
        # of pinning the tab will run.
        callback = -> e.classList.toggle 'pinned'
        setTimeout callback, 1


    # Get information about a tab
    getTabInformation: (e, i) ->
        # Get related nodes
        tabbar = e.parentNode
        pane = tabbar.parentNode
        axis = pane.parentNode

        # Get the index values of relevant elements
        selectedIndex = i || Array.prototype.indexOf.call tabbar.children, e
        paneIndex = Array.prototype.indexOf.call axis.children, pane
        newIndex = e.parentNode.querySelectorAll('.pinned').length

        # Get the related pane & texteditor
        pane = atom.workspace.getPanes()[paneIndex / 2]
        item = pane.itemAtIndex selectedIndex

        # Return relevant information
        return {
            newIndex: newIndex,
            oldIndex: i
            pane: pane,
            paneIndex: paneIndex,
            item: item
        };
