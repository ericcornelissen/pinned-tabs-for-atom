{CompositeDisposable} = require 'atom'

module.exports = PinnedTabs =
    # Configuration of pinned-tabs
    config:
        enableAnimation:
            title: 'Enable animation'
            description: 'Enable the animation used to pin a tab'
            type: 'boolean'
            default: true


    # Method that is ran when the package is started.
    activate: (state) ->
        # Register commands to pin a tab.
        @subscriptions = new CompositeDisposable
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:pin': => @pinActive()
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:pin-selected': => @pinSelected()
        @subscriptions.add atom.commands.add 'atom-workspace', 'pinned-tabs:toggle-animation': => @toggleAnimation()


        # Add an event listener for when the value of the 'enable-animation'
        # settings is changed.
        atom.config.observe 'pinned-tabs.enable-animation', (newValue) ->
            callback = ->
                e = document.querySelector('.tab-bar')
                if newValue
                    e.classList.add 'pinned-tabs-enable-animation'
                else
                    e.classList.remove 'pinned-tabs-enable-animation'

            # This timeout is required for when Atom is launched, and
            # it does not influence other times the setting is changed.
            setTimeout callback, 1


    # Method that is ran to serialize the package.
    serialize: ->
        @PinnedTabsState.serialize()


    # Method to pin the active tab.
    pinActive: ->
        @pin document.querySelector('.tab-bar .tab.active')

    # Method to pin the selected (via contextmenu) tab.
    pinSelected: ->
        @pin atom.contextMenu.activeElement

    # Method that pins/unpins a tab given its element.
    pin: (e) ->
        # Get an instance of the Pane class to be able
        # to move the tabs around.
        pane = atom.workspace.getActivePane()

        # Get the index of the tab that should be pinned,
        # and get the item of the tab, so it can be moved.
        selectedIndex = Array.prototype.indexOf.call e.parentNode.children, e
        item = pane.itemAtIndex selectedIndex

        # Get the new index for the item.
        newIndex = e.parentNode.querySelectorAll('.pinned').length
        if e.classList.contains 'pinned'
            # If the element has the element 'pinned', it
            # is currently being unpinned. So the new index
            # is one off when look at the amount of pinned
            # tabs, because it actually includes the tab
            # that is being unpinned.
            newIndex -= 1

        # Actually move the item to its new index.
        pane.moveItem item, newIndex

        # Finally, toggle the 'pinned' class on the tab after a
        # timout of 1 millisecond. This will ensure the animation
        # of pinning the tab will run.
        callback = -> e.classList.toggle 'pinned'
        setTimeout callback, 1


    # Toggle the animation class in the DOM of Atom.
    toggleAnimation: ->
        #
        current = atom.config.get('pinned-tabs.enable-animation')
        atom.config.set('pinned-tabs.enable-animation', !current)
