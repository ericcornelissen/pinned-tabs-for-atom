{CompositeDisposable} = require 'atom'

module.exports =
class PinnedTabsState
    #
    atom.deserializers.add(this)

    #
    @deserialize: ({data}) -> new PinnedTabsState(data)
    constructor: (@data) ->
    serialize: -> { deserializer: 'PinnedTabsState', data: @data }
