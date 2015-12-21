PinnedTabs = require '../lib/pinned-tabs'

describe 'PinnedTabs', ->

    describe 'When the configuration is edited', ->
        it 'toggles the pin tab animation', ->
            PinnedTabs.toggleAnimation() # This will make sure the config has a proper value.
            currentState = atom.config.get('pinned-tabs.enable-animation')

            PinnedTabs.toggleAnimation()
            expect(atom.config.get('pinned-tabs.enable-animation')).not.toBe currentState

            PinnedTabs.toggleAnimation()
            expect(atom.config.get('pinned-tabs.enable-animation')).toBe currentState
