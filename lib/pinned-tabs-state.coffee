module.exports = class PinnedTabsState
    # Add the serializer of this class to atom library of serializers.
    atom.deserializers.add(this)

    # The constructor of this class, sets the initial data attribute.
    constructor: (@data) ->

    # The (static) deserialize method of this class.
    @deserialize: ({data}) -> new PinnedTabsState(data)

    # The serialize method of this class, converts the an instance into a JSON string.
    serialize: -> { deserializer: 'PinnedTabsState', data: @data }
