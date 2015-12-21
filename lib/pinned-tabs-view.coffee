module.exports =
class PinnedTabsView
    constructor: (serializedState) ->
        console.log 'PinnedTabsView', 'constructor', serializedState

    serialize: ->
        console.log 'PinnedTabsView', 'serialize'

    destroy: ->
        console.log 'PinnedTabsView', 'destroy'
