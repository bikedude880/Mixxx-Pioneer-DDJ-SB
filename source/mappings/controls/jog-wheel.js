var manager = require('./../../../control-manager.js');

// Generate mappings for two channels.
for (var channelIndex = 0; channelIndex < 2; channelIndex++)
{
	var group = 'Channel' + (channelIndex + 1);

	manager.add(group, 'PioneerDDJSB.jogScratchTouch', 0x90 + channelIndex, 0x36);
	manager.add(group, 'PioneerDDJSB.jogSeekTouch',	0x90 + channelIndex, 0x35);
	manager.add(group, 'PioneerDDJSB.jogScratchTurn', 0xB0 + channelIndex, 0x22);
	manager.add(group, 'PioneerDDJSB.jogPitchBend', 0xB0 + channelIndex, 0x21);
	manager.add(group, 'PioneerDDJSB.jogSeekTurn', 0xB0 + channelIndex, 0x23);
}
			 
module.exports = manager.controls;
