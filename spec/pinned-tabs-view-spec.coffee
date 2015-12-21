PinnedTabsState = require '../lib/pinned-tabs-state'

describe 'PinnedTabsState', ->
    [testclass] = []

    beforeEach ->
        testclass = new PinnedTabsState {}

    describe 'testclass the serializer', ->
        it 'Is an empty case', ->
            expect(testclass.serialize()).toEqual { deserializer: 'PinnedTabsState', data: {} }

        it 'Is an non-empty case', ->
            testclass.data.foo = 'bar'
            expect(testclass.serialize()).toEqual { deserializer: 'PinnedTabsState', data: {foo: 'bar'} }

    describe 'testclass the deserializer', ->
        it 'Is an empty case', ->
            testclass = new PinnedTabsState {}
            expect(PinnedTabsState.deserialize { deserializer: 'PinnedTabsState', data: {} }).toEqual testclass

        it 'Is an non-empty case', ->
            testclass.data.foo = 'bar'
            expect(PinnedTabsState.deserialize { deserializer: 'PinnedTabsState', data: {foo: 'bar'} }).toEqual testclass
