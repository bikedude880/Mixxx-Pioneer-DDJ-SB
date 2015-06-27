function PioneerDDJSB() {}

PioneerDDJSB.init = function(id) {}
PioneerDDJSB.shutdown = function(id) {}

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

// Work out the jog-wheel change / delta
PioneerDDJSB.getJogWheelDelta = function(value)
{
	// The Wheel control centers on 0x40; find out how much it's moved by.
	return value - 0x40;
}

// Pitch bend a channel
PioneerDDJSB.pitchBend = function(channel, movement)
{
	var deck = channel + 1;
	var group = '[Channel' + deck +']';

	// Make this a little less sensitive.
	movement = movement / 5;

	// Limit movement to the range of -3 to 3.
	movement = movement > 3 ? 3 : movement;
	movement = movement < -3 ? -3 : movement;

	engine.setValue(group, 'jog', movement);
}

PioneerDDJSB.JogWheelSide = function(channel, control, value, status, group)
{
	var deck = channel + 1;
	var group = '[Channel' + deck +']';

	// Only pitch-bend when actually playing
	if (engine.getValue(group, 'play'))
	{
		PioneerDDJSB.pitchBend(channel, PioneerDDJSB.getJogWheelDelta(value));
	}
}
