function PioneerDDJSB() {}

PioneerDDJSB.init = function(id) {}
PioneerDDJSB.shutdown = function(id) {}

PioneerDDJSB.offset = 0x40

// Handles the track selection rotation, lifted from CDJ-850
PioneerDDJSB.RotarySelector = function(channel, control, value, status)
{
	if (value >= 0x01 && value <= 0x1e) {
		value = value;
	} else if (value >= 0x62 && value <= 0x7f) {
		value = 0 - (0x7f-value+1);
	} else {
		return;
	}
	engine.setValue('[Playlist]','SelectTrackKnob',value);
}

PioneerDDJSB.JogWheelSide = function(channel, control, value, status, group)
{
	var delta = (value - PioneerDDJB.offset)
	engine.setValue(group,'jog',delta)
}
