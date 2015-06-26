var manager = require('./../../../control-manager.js');

manager.add('Master', 'crossfader', 0xB6, 0x1F, 'soft-takeover');
manager.add('Master', 'headMix', 0xB6, 0x05, 'soft-takeover');


module.exports = manager.controls;
