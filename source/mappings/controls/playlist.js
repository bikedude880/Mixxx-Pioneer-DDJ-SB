var manager = require('./../../../control-manager.js');

manager.add('Playlist', 'PioneerDDJSB.RotarySelectorClick', 0x96, 0x41);
manager.add('Playlist', 'PioneerDDJSB.RotarySelector', 0xB6, 0x40);

module.exports = manager.controls;
