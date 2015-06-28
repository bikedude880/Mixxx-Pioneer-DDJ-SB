var PioneerDDJSB = function() { }

PioneerDDJSB.init = function(id)
{
	var alpha = 1.0 / 8;
	
	PioneerDDJSB.channels = 
		{	
			0x00: {},
			0x01: {},
		};
	
	PioneerDDJSB.settings = 
		{
			alpha: alpha,
			beta: alpha / 32,
			jogResolution: 720,
			vinylSpeed: 33 + 1/3,
			loopIntervals: ['0.03125', '0.0625', '0.125', '0.25', '0.5', '1', '2', '4', '8', '16', '32', '64'],
			safeScratchTimeout: 20 // 20ms is the minimum allowed here.
		};
		
	PioneerDDJSB.enumerations = 
		{
			rotarySelector:
				{
					targets:
						{
							libraries: 0,
							tracklist: 1
						}
				},
			channelGroups:
				{
					'[Channel1]': 0x00,
					'[Channel2]': 0x01,
				}
		};
		
	PioneerDDJSB.status = 
		{
			rotarySelector: 
				{
					target: PioneerDDJSB.enumerations.rotarySelector.targets.tracklist
				}
		};
				
	PioneerDDJSB.BindControlConnections(false);
}

PioneerDDJSB.BindControlConnections = function(isUnbinding)
{
	for (var channelIndex = 1; channelIndex <= 2; channelIndex++)
	{
		var channelGroup = '[Channel' + channelIndex + ']';
	
		// Play / Pause LED
		engine.connectControl(channelGroup, 'play', 'PioneerDDJSB.PlayLeds', isUnbinding);
		
		// Cue LED
		engine.connectControl(channelGroup, 'cue_default', 'PioneerDDJSB.CueLeds', isUnbinding);
		
		// PFL / Headphone Cue LED
		engine.connectControl(channelGroup, 'pfl', 'PioneerDDJSB.HeadphoneCueLed', isUnbinding);
		
		// Keylock LED
		engine.connectControl(channelGroup, 'keylock', 'PioneerDDJSB.KeyLockLeds', isUnbinding);
		
		// Hook up the hot cue performance pads
		for (var i = 0; i < 4; i++)
		{
			engine.connectControl(channelGroup, 'hotcue_' + (i + 1) +'_enabled', 'PioneerDDJSB.HotCuePerformancePadLed', isUnbinding);
		}
		
		// Hook up the roll performance pads
		for (var interval in PioneerDDJSB.settings.loopIntervals)
		{
			engine.connectControl(channelGroup, 'beatloop_' + interval + '_enabled', 'PioneerDDJSB.RollPerformancePadLed', isUnbinding);
		}
	}
};

// This handles LEDs related to the PFL / Headphone Cue event.
PioneerDDJSB.HeadphoneCueLed = function(value, group, control) 
{
	var channel = PioneerDDJSB.enumerations.channelGroups[group];	
	midi.sendShortMsg(0x90 + channel, 0x54, value ? 0x7F : 0x00); // Headphone Cue LED
};

// This handles LEDs related to the cue_default event.
PioneerDDJSB.CueLeds = function(value, group, control) 
{
	var channel = PioneerDDJSB.enumerations.channelGroups[group];	
	midi.sendShortMsg(0x90 + channel, 0x0C, value ? 0x7F : 0x00); // Cue LED
};

// This handles LEDs related to the keylock event.
PioneerDDJSB.KeyLockLeds = function(value, group, control) 
{
	var channel = PioneerDDJSB.enumerations.channelGroups[group];	
	midi.sendShortMsg(0x90 + channel, 0x1A, value ? 0x7F : 0x00); // Keylock LED
};

// This handles LEDs related to the play event.
PioneerDDJSB.PlayLeds = function(value, group, control) 
{
	var channel = PioneerDDJSB.enumerations.channelGroups[group];	
	midi.sendShortMsg(0x90 + channel, 0x0B, value ? 0x7F : 0x00); // Play / Pause LED
	midi.sendShortMsg(0x90 + channel, 0x0C, value ? 0x7F : 0x00); // Cue LED
};

// Lights up the LEDs for beat-loops. Only works with the number 1, 2, 
// 4 and 8 unfortunately, so 0.5 and 0.125, 16 and 32 will not show up.
// We work around this by highlighting the pads when you press them, but 
// if you change the loop interval while still holding the pad, it may not 
// always reflect.
PioneerDDJSB.RollPerformancePadLed = function(value, group, control) 
{
	var channel = PioneerDDJSB.enumerations.channelGroups[group];
	
	var padIndex = 0;
	for (var i = 0; i < 8; i++)
	{
		if (control === 'beatloop_' + PioneerDDJSB.settings.loopIntervals[i + 2] + '_enabled')
		{
			break;
		}
	
		padIndex++;
	}
	
	// Toggle the relevant Performance Pad LED
	midi.sendShortMsg(0x97 + channel, 0x10 + padIndex, value ? 0x7F : 0x00); 
};

PioneerDDJSB.HotCuePerformancePadLed = function(value, group, control) 
{
	var channel = PioneerDDJSB.enumerations.channelGroups[group];
	
	var padIndex = null;
	
	for (var i = 0; i < 4; i++)
	{
		if (control === 'hotcue_' + i + '_enabled')
		{
			break;
		}
		
		padIndex = i;
	}
	
	// Pad LED without shift key
	midi.sendShortMsg(0x97 + channel, 0x00 + padIndex, value ? 0x7F : 0x00);
	
	// Pad LED with shift key
	midi.sendShortMsg(0x97 + channel, 0x00 + padIndex + 0x08, value ? 0x7F : 0x00);
};

// Work out the jog-wheel change / delta
PioneerDDJSB.getJogWheelDelta = function(value)
{
	// The Wheel control centers on 0x40; find out how much it's moved by.
	return value - 0x40;
}

// Toggle scratching for a channel
PioneerDDJSB.toggleScratch = function(channel, isEnabled)
{
	var deck = channel + 1; 
	if (isEnabled) 
	{
        engine.scratchEnable(
			deck, 
			PioneerDDJSB.settings.jogResolution, 
			PioneerDDJSB.settings.vinylSpeed, 
			PioneerDDJSB.settings.alpha, 
			PioneerDDJSB.settings.beta);
    }
    else 
	{
        engine.scratchDisable(deck);
    }
};

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
};

// Schedule disabling scratch. We don't do this immediately on 
// letting go of the jog wheel, as that result in a pitch-bend.
// Instead, we set up a time that disables it, but cancel and
// re-register that timer whenever we need to to postpone the disable.
// Very much a hack, but it works, and I'm yet to find a better solution.
PioneerDDJSB.scheduleDisableScratch = function(channel)
{
	PioneerDDJSB.channels[channel].disableScratchTimer = engine.beginTimer(
		PioneerDDJSB.settings.safeScratchTimeout, 
		'PioneerDDJSB.toggleScratch(' + channel + ', false)', 
		true);
};

// If scratch-disabling has been schedule, then unschedule it.
PioneerDDJSB.unscheduleDisableScratch = function(channel)
{
	if (PioneerDDJSB.channels[channel].disableScratchTimer)
	{
		engine.stopTimer(PioneerDDJSB.channels[channel].disableScratchTimer);
	}
};

// Postpone scratch disabling by a few milliseconds. This is
// useful if you were scratching, but let of of the jog wheel.
// Without this, you'd end up with a pitch-bend in that case.
PioneerDDJSB.postponeDisableScratch = function(channel)
{
	PioneerDDJSB.unscheduleDisableScratch(channel);
	PioneerDDJSB.scheduleDisableScratch(channel);
};

// Detect when the user touches and releases the jog-wheel while 
// jog-mode is set to vinyl to enable and disable scratching.
PioneerDDJSB.jogScratchTouch = function(channel, control, value, status) 
{
	if (value == 0x7F)
	{
		PioneerDDJSB.unscheduleDisableScratch(channel);	
		PioneerDDJSB.toggleScratch(channel, true);
	}
	else
	{
		PioneerDDJSB.scheduleDisableScratch(channel);
	}
};
 
// Scratch or seek with the jog-wheel.
PioneerDDJSB.jogScratchTurn = function(channel, control, value, status) 
{
	var deck = channel + 1; 
	
    // Only scratch if we're in scratching mode, when 
	// user is touching the top of the jog-wheel.
    if (engine.isScratching(deck)) 
	{
		engine.scratchTick(deck, PioneerDDJSB.getJogWheelDelta(value));
	}
};

// Pitch bend using the jog-wheel, or finish a scratch when the wheel 
// is still turning after having released it.
PioneerDDJSB.jogPitchBend = function(channel, control, value, status) 
{
	var deck = channel + 1; 
	var group = '[Channel' + deck +']';

	if (engine.isScratching(deck))
	{
		engine.scratchTick(deck, PioneerDDJSB.getJogWheelDelta(value));
		PioneerDDJSB.postponeDisableScratch(channel);
	}
	else
	{	
		// Only pitch-bend when actually playing
		if (engine.getValue(group, 'play'))
		{
			PioneerDDJSB.pitchBend(channel, PioneerDDJSB.getJogWheelDelta(value));
		}
	}
};

// Called when the jog-mode is not set to vinyl, and the jog wheel is touched.
PioneerDDJSB.jogSeekTouch = function(channel, control, value, status) 
{
	var deck = channel + 1; 
	var group = '[Channel' + deck +']';
	
	// Only enable scratching if we're in scratching mode, when user is  
	// touching the top of the jog-wheel and the 'Vinyl' jog mode is 
	// selected.
	if (!engine.getValue(group, 'play'))
	{
		// Scratch if we're not playing; otherwise we'll be 
		// pitch-bending here, which we don't want.
		PioneerDDJSB.toggleScratch(channel, value == 0x7F);
	}
};

// Call when the jog-wheel is turned. The related jogSeekTouch function 
// sets up whether we will be scratching or pitch-bending depending 
// on whether a song is playing or not.
PioneerDDJSB.jogSeekTurn = function(channel, control, value, status) 
{
	var deck = channel + 1; 
	
    if (engine.isScratching(deck)) 
	{
		engine.scratchTick(deck, PioneerDDJSB.getJogWheelDelta(value));
	}
	else
	{
		PioneerDDJSB.pitchBend(channel, PioneerDDJSB.getJogWheelDelta(value));
	}
};

// This handles the eight performance pads below the jog-wheels 
// that deal with rolls or beat loops.
PioneerDDJSB.RollPerformancePad = function(performanceChannel, control, value, status) 
{
	var deck = performanceChannel - 6;  
	var group = '[Channel' + deck +']';
	var interval = PioneerDDJSB.settings.loopIntervals[control - 0x10 + 2];
	
	if (value == 0x7F)
	{
		engine.setValue(group, 'beatlooproll_' + interval + '_activate', 1);
	}
	else
	{
		engine.setValue(group, 'beatlooproll_' + interval + '_activate', 0);
	}
	
	midi.sendShortMsg(0x97 + deck - 1, control, value);
};

// Handles the rotary selector for choosing tracks, library items, crates, etc.
PioneerDDJSB.RotarySelector = function(channel, control, value, status) 
{
	if (value >= 0x01 && value <= 0x1e) {
		value = value;
	} else if (value >= 0x62 && value <= 0x7f) {
		value = 0 - (0x7f-value+1);
	} else {
		return;
	}
	engine.setValue('[Playlist]', 'SelectTrackKnob', value);
};

PioneerDDJSB.RotarySelectorClick = function(channel, control, value, status) 
{
	// Only trigger when the button is pressed down, not when it comes back up.
	if (value == 0x7F)
	{
		var target = PioneerDDJSB.enumerations.rotarySelector.targets.tracklist;
		
		var tracklist = PioneerDDJSB.enumerations.rotarySelector.targets.tracklist;
		var libraries = PioneerDDJSB.enumerations.rotarySelector.targets.libraries;
		
		switch(PioneerDDJSB.status.rotarySelector.target)
		{
			case tracklist:
				target = libraries;
				break;
			case libraries:
				target = tracklist;
				break;
		}
		
		PioneerDDJSB.status.rotarySelector.target = target;
	}
};

PioneerDDJSB.shutdown = function()
{
	PioneerDDJSB.BindControlConnections(true);
};
