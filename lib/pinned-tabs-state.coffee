module.exports = class PinnedTabsState
  atom.deserializers.add this

  constructor: (@data) ->

  serialize: -> { deserializer: 'PinnedTabsState', data: @data }

  @deserialize: ({data}) -> new PinnedTabsState data
