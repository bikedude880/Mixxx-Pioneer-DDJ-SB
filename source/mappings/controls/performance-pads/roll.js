var manager = require('./../../../../control-manager.js');

for (var channelIndex = 0; channelIndex < 2; channelIndex++)
{
	var group = 'Channel' + (channelIndex + 1);

	for (var padIndex = 0; padIndex < 4; padIndex++)
	{
		manager.add(group, 'PioneerDDJSB.RollPerformancePad', 0x9p + channelIndex, 0x50 + padIndex);
	}
}

module.exports = manager.controls;
