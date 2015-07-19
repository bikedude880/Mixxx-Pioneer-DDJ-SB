var PioneerDDJSB = function() { }

PioneerDDJSB.init = function(id)
{
	var ALPHA = 1.0 / 8;
	var BETA = ALPHA / 32;
	var JOG_RESOLUTION = 720;
	var VINYL_SPEED = 33 + 1/3;
	var NUMBER_OF_ACTIVE_PERFORMANCE_PADS = 4;
	var SAFE_SCRATCH_TIMEOUT = 20; // 20ms is the minimum allowed here.
	
	PioneerDDJSB.settings = 
	{
		alpha: ALPHA,
		beta: BETA,
		jogResolution: JOG_RESOLUTION,
		vinylSpeed: VINYL_SPEED,
		numberOfActivePerformancePads: NUMBER_OF_ACTIVE_PERFORMANCE_PADS,
		safeScratchTimeout: SAFE_SCRATCH_TIMEOUT
	};

	PioneerDDJSB.channels = 
	{	
		0x00: {},
		0x01: {}
	};
		
	PioneerDDJSB.channelGroups =
	{
		'[Channel1]': 0x00,
		'[Channel2]': 0x01
	};
	
	PioneerDDJSB.loopIntervals =
	{
		PAD1: 1, 
		PAD2: 2, 
		PAD3: 4, 
		PAD4: 8
	};
	
	PioneerDDJSB.rotarySelectorTargets =
	{
		libraries: 0,
		tracklist: 1
	},
	
	// Initialize the Decks and the Library
	PioneerDDJSB.rotarySelectorMode = 1;
				
	PioneerDDJSB.BindControlConnections(false);
};

PioneerDDJSB.shutdown = function()
{
	PioneerDDJSB.BindControlConnections(true);
};

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
		
		// Vinyl LED
		engine.connectControl(channelGroup, 'slip_enabled', 'PioneerDDJSB.ToggleVinylLed', isUnbinding);
		
		// Hook up the hot cue performance pads
		for (var i = 0; i < 8; i++)
		{
			engine.connectControl(channelGroup, 'hotcue_' + (i + 1) +'_enabled', 'PioneerDDJSB.HotCuePerformancePadLed', isUnbinding);
		}
		
		// Hook up the roll performance pads
		for (var i = 1; i <= PioneerDDJSB.settings['numberOfActivePerformancePads']; i++)
		{
			engine.connectControl(channelGroup, 'beatloop_' + PioneerDDJSB.loopIntervals['PAD' + i] + '_enabled', 'PioneerDDJSB.RollPerformancePadLed', isUnbinding);
		}
	}
};

///////////////////////////////////////////////////////////////
//                         LED SECTION                       //
///////////////////////////////////////////////////////////////

// This handles LEDs related to the PFL / Headphone Cue event.
PioneerDDJSB.HeadphoneCueLed = function(value, group, control) 
{
	var channel = PioneerDDJSB.channelGroups[group];	
	midi.sendShortMsg(0x90 + channel, 0x54, value ? 0x7F : 0x00); // Headphone Cue LED
};

// This handles LEDs related to the cue_default event.
PioneerDDJSB.CueLeds = function(value, group, control) 
{
	var channel = PioneerDDJSB.channelGroups[group];	
	midi.sendShortMsg(0x90 + channel, 0x0C, value ? 0x7F : 0x00); // Cue LED
};

// This handles LEDs related to the keylock event.
PioneerDDJSB.KeyLockLeds = function(value, group, control) 
{
	var channel = PioneerDDJSB.channelGroups[group];	
	midi.sendShortMsg(0x90 + channel, 0x1A, value ? 0x7F : 0x00); // Keylock LED
};

// This handles LEDs related to the play event.
PioneerDDJSB.PlayLeds = function(value, group, control) 
{
	var channel = PioneerDDJSB.channelGroups[group];	
	midi.sendShortMsg(0x90 + channel, 0x0B, value ? 0x7F : 0x00); // Play / Pause LED
	midi.sendShortMsg(0x90 + channel, 0x0C, value ? 0x7F : 0x00); // Cue LED
};

PioneerDDJSB.ToggleVinylLed = function(value, group, control) 
{
	var channel = PioneerDDJSB.channelGroups[group];
	midi.sendShortMsg(0x90 + channel, 0x17, value ? 0x7F : 0x00); // Vinyl LED
};


// Lights up the LEDs for beat-loops. Currently there are 4 pads set.
// If you want extra pads or want to change the speed, you need to adjust
// the xml and the enumaration in the config/init setings
PioneerDDJSB.RollPerformancePadLed = function(value, group, control) 
{
	var channel = PioneerDDJSB.channelGroups[group];
	for (var i = 1; i <= PioneerDDJSB.settings['numberOfActivePerformancePads']; i++)
	{
		if (control === 'beatloop_' + PioneerDDJSB.loopIntervals['PAD' + i] + '_enabled')
		{
			midi.sendShortMsg(0x97 + channel, 0x10 + (i - 1), value ? 0x7F : 0x00); 
		}
	}
};
// Lights up the LEDs for the hotcue buttons. The buttons LEDs are disabled
// using the SHIFT button
PioneerDDJSB.HotCuePerformancePadLed = function(value, group, control) 
{
	var channel = PioneerDDJSB.channelGroups[group];
	
	var padIndex = null;
	for (var i = 0; i < 8; i++)
	{
		if (control == 'hotcue_' + i + '_enabled')
		{
			break;
		}
		
		padIndex = i;

		if (padIndex <= 3) {
			// Pad LED without shift key
			midi.sendShortMsg(0x97 + channel, 0x00 + padIndex, value ? 0x7F : 0x00);

			// Pad LED with shift key
			midi.sendShortMsg(0x97 + channel, 0x00 + padIndex + 0x08, value ? 0x7F : 0x00);

		} else {
			// Pad LED without shift key
			midi.sendShortMsg(0x97 + channel, 0x40 + padIndex, value ? 0x7F : 0x00);

			// Pad LED with shift key
			midi.sendShortMsg(0x97 + channel, 0x40 + padIndex + 0x08, value ? 0x7F : 0x00);
		}
	}
	
	// Pad LED without shift key
	midi.sendShortMsg(0x97 + channel, 0x00 + padIndex, value ? 0x7F : 0x00);
	
	// Pad LED with shift key
	midi.sendShortMsg(0x97 + channel, 0x00 + padIndex + 0x08, value ? 0x7F : 0x00);
};

PioneerDDJSB.superknob_deck1 = function(channel, value, group, control)
{
	engine.setValue("[EffectRack1_EffectUnit1]", "super1", value);
	engine.setValue("[EffectRack1_EffectUnit3]", "super1", value);
	engine.setValue("[EffectRack1_EffectUnit4]", "super1", value);
};

PioneerDDJSB.superknob_deck2 = function(channel, value, group, control)
{
	engine.setValue("[EffectRack1_EffectUnit2]", "super1", value);
	engine.setValue("[EffectRack1_EffectUnit3]", "super1", value);
	engine.setValue("[EffectRack1_EffectUnit4]", "super1", value);
};

///////////////////////////////////////////////////////////////
//                     JOGWHEEL SECTION                      //
///////////////////////////////////////////////////////////////

// Work out the jog-wheel change / delta
PioneerDDJSB.getJogWheelDelta = function(value)
{
	// The Wheel control centers on 0x40; find out how much it's moved by.
	return value - 0x40;
};

// Toggle scratching for a channel
PioneerDDJSB.toggleScratch = function(channel, isEnabled)
{
	var deck = channel + 1; 
	if (isEnabled) 
	{
        engine.scratchEnable(
			deck, 
			PioneerDDJSB.settings['jogResolution'], 
			PioneerDDJSB.settings['vinylSpeed'], 
			PioneerDDJSB.settings['alpha'], 
			PioneerDDJSB.settings['beta']);
    }
    else 
	{
        engine.scratchDisable(deck);
    }
};

// Detect when the user touches and releases the jog-wheel while 
// jog-mode is set to vinyl to enable and disable scratching.
PioneerDDJSB.jogScratchTouch = function(channel, control, value, status, group) 
{
	var deck = channel + 1; 
	
	if (!engine.getValue(group, 'play'))
	{
		PioneerDDJSB.toggleScratch(channel, value == 0x7F);
	}
	else
	{
		var activate = value > 0;
		
		if (activate) 
		{
			engine.brake(deck, true, 1, 1); // enable brake effect
			PioneerDDJSB.toggleScratch(channel, true);
		}
		else 
		{
			engine.brake(deck, false, 1, 1); // disable brake effect
			PioneerDDJSB.toggleScratch(channel, false);
		}  
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
PioneerDDJSB.jogPitchBend = function(channel, control, value, status, group) 
{
	if (!engine.getValue(group, 'play'))
		return;
		
	var deck = channel + 1; 
	PioneerDDJSB.pitchBend(channel, PioneerDDJSB.getJogWheelDelta(value));
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

// Called when the jog-mode is not set to vinyl, and the jog wheel is touched.
// If we are not playing we want to seek through it and this is done in scratch mode
PioneerDDJSB.jogSeekTouch = function(channel, control, value, status, group) 
{
	if (engine.getValue(group, 'play'))
		return;
		
	var deck = channel + 1; 
	PioneerDDJSB.toggleScratch(channel, value == 0x7F);
};

// Call when the jog-wheel is turned. The related jogSeekTouch function 
// sets up whether we will be scratching or pitch-bending depending 
// on whether a song is playing or not.
PioneerDDJSB.jogSeekTurn = function(channel, control, value, status, group) 
{
	if (engine.getValue(group, 'play'))
		return;
	
	var deck = channel + 1; 
	engine.scratchTick(deck, PioneerDDJSB.getJogWheelDelta(value));
};

///////////////////////////////////////////////////////////////
//                     JOGWHEEL SECTION                      //
///////////////////////////////////////////////////////////////
// Handles the rotary selector for choosing tracks, library items, crates, etc.
PioneerDDJSB.RotarySelector = function(channel, control, value, status) 
{
	var delta = 0x40 - Math.abs(0x40 - value);
	var isCounterClockwise = value > 0x40;
	if (isCounterClockwise)
	{
		delta *= -1;
	}
	
	var tracklist = PioneerDDJSB.rotarySelectorTargets.tracklist;
	var libraries = PioneerDDJSB.rotarySelectorTargets.libraries;
	
	switch(PioneerDDJSB.rotarySelectorMode)
	{
		case tracklist:
			engine.setValue('[Playlist]', 'SelectTrackKnob', delta);
			break;
		case libraries:
			if (delta > 0)
			{
				engine.setValue('[Playlist]', 'SelectNextPlaylist', 1);
			}
			else if (delta < 0)
			{
				engine.setValue('[Playlist]', 'SelectPrevPlaylist', 1);
			}
			
			break;
	}
};

PioneerDDJSB.RotarySelectorClick = function(channel, control, value, status) 
{
	// Only trigger when the button is pressed down, not when it comes back up.
	if (value == 0x7F)
	{
		if (PioneerDDJSB.rotarySelectorMode == 0) // library
		{
			if(engine.getValue('[Playlist]', 'ToggleSelectedSidebarItem') == 1)
				engine.setValue('[Playlist]', 'ToggleSelectedSidebarItem', 0);
			else
				engine.setValue('[Playlist]', 'ToggleSelectedSidebarItem', 1);
		}
	}
};

PioneerDDJSB.backClick = function(channel, control, value, status)
{
	// Only trigger when the button is pressed down, not when it comes back up.
	if (value == 0x7F)
	{
		if (PioneerDDJSB.rotarySelectorMode == 1)
			PioneerDDJSB.rotarySelectorMode = 0;
		else
			PioneerDDJSB.rotarySelectorMode = 1;
	}
};
