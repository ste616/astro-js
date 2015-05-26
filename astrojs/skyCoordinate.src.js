// this is "/astrojs/skyCoordinate"
define([ "./base", "dojo/_base/lang", "./angle", "./coordinate", "./time" ],
       function(astrojs, lang, astroAngle, astroCoord, astroTime) {

    /*
     * This routine enables the user to make a new coordinate.
     */
    var rObj = {};

    // This file's error parameters.
    var ERR = {
      file: 'skyCoordinate'
    };

    /**
     * Our recognised coordinate frames, and their corresponding
     * coordinate types.
     * @type {object}
     */
    var allowedFrames = {
      'j2000': {
	'name': 'J2000',
	'mode': astroCoord.COORDMODE_J2000,
	'names': [ 'rightAscension', 'declination' ],
	'coord1': ['ra', 'rightAscension'],
	'coord2': ['dec', 'declination']
      },
      'b1950': {
	'name': 'B1950',
	'mode': astroCoord.COORDMODE_B1950,
	'names': [ 'rightAscension', 'declination' ],
	'coord1': ['ra', 'rightAscension'],
	'coord2': ['dec', 'declination']
      },
      'galactic': {
	'name': 'Galactic',
	'mode': astroCoord.COORDMODE_GALACTIC,
	'names': [ 'latitude', 'longitude' ],
	'coord1': ['l', 'latitude'],
	'coord2': ['b', 'longitude']
      },
      'azel': {
	'name': 'AzEl',
	'mode': astroCoord.COORDMODE_AZEL,
	'names': [ 'azimuth', 'elevation' ],
	'coord1': ['az', 'azimuth'],
	'coord2': ['el', 'elevation']
      },
      'hadec': {
	'name': 'HADec',
	'mode': astroCoord.COORDMODE_HADEC,
	'names': [ 'hourAngle', 'declination' ],
	'coord1': [ 'ha', 'hourAngle' ],
	'coord2': [ 'dec', 'declination' ]
      }
    };
    rObj.allowedFrames = allowedFrames;

    /**
     * skyCoordinate: a datatype used to represent sky positions.
     * @param {variable} constructor The coordinate that this object should
     *                               represent.
     */
    rObj.new = function(constructor) {
      /**
       * The object we return to our callers.
       * @type {object}
       */
      var that = {};

      /**
       * Our coordinate object.
       * @type {object}
       */
      var coordinates = {};

      /**
       * Time handler to help us calculate local sky positions.
       * @type {astroTime}
       */
      var timeHandler = astroTime.new();

      /**
       * A location that we use for local sky positions.
       * @type {String}
       */
      var location;

      // Our methods follow.

      // Our private methods.
      /**
       * Initialise our instance.
       */
      var initialise = function() {
	// Check we have a constructor.
	try {
	  if (typeof constructor === 'undefined') {
	    throw(new TypeError('skyCoordinate was not supplied with a constructor.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['initialise', x]);
	  return false;
	}

	// Do different things depending on the type of the constructor.
	// We need two quantities here, one for each of the 2D coordinates.
	if (lang.isArray(constructor)) {
	  /**
	   * With an array, the first two elements are the coordinates, and
	   * the optional third element is the frame specification, which can
	   * be one of 'J2000', 'B1950', 'Galactic', 'AzEl', 'HADec'. By default, if
	   * the third element is not given, we assume 'J2000'.
	   */
	  var inFrame = 'J2000';

	  if (constructor.length === 3) {
	    var tFrame = getFrame(constructor[2]);
	    if (tFrame !== null) {
	      inFrame = tFrame.name;
	    }
	  }

	  var angles = [];
	  // Convert the first two elements to astroAngles.
	  for (var i = 0; i < 2; i++) {
	    angles[i] = toAstroAngle(constructor[i]);
	    try {
	      if (angles[i] === null) {
		throw(new TypeError('Could not convert argument to astroAngle.'));
	      }
	    } catch (x) {
	      astrojs.catchError.apply(ERR, ['initialise', x]);
	      return false;
	    }
	  }

	  // We now have two angles and an epoch, so we form the coordinate.
	  return assignCoords(inFrame, angles);

	} else if (lang.isObject(constructor) === true &&
		   constructor !== null &&
		   lang.isFunction(constructor) === false) {
	  /**
	   * With an object, it should have at least two properties, and
	   * optionally three. If it has two, it needs one from the set
	   * [ 'ra', 'rightAscension', 'l', 'latitude', 'az', 'azimuth', 'ha', 'hourAngle' ]
	   *  and one from the set
	   * [ 'dec', 'declination', 'b', 'longitude', 'el', 'elevation' ]. If it has three
	   * properties, the third should be called 'frame' and specify
	   * which coordinate frame to expect.
	   */
	  var inFrame = '';
	  if (typeof constructor.frame !== 'undefined') {
	    inFrame = constructor.frame;
	  }

	  var angles = [];
	  if (inFrame !== '') {
	    // Check against the specified frame.
	    try {
	      if (checkFrame(constructor, getFrame(inFrame)) === null) {
		// The constructor isn't consistent with what we were given.
		throw(new TypeError('Constructor did not receive the expected' +
				    ' coordinate type.'));
	      }
	    } catch (x) {
	      astrojs.catchError.apply(ERR, ['initialise', x]);
	      return false;
	    }
	  } else {
	    for (var cFrame in allowedFrames) {
	      if (lang.isArray(checkFrame(constructor,
		  allowedFrames[cFrame])) === true) {
		// We've found a frame that works.
		inFrame = cFrame.name;
		break;
	      }
	    }
	  }
	  try {
	    if (inFrame === '') {
	      // We couldn't find a proper frame.
	      throw(new TypeError('Constructor did not find a valid coordinate' +
				  ' type.'));
	    }
	  } catch (x) {
	    astrojs.catchError.apply(ERR, ['initialise', x]);
	    return false;
	  }
	  // Convert the angles to astroAngles.
	  var nArr = checkFrame(constructor, getFrame(inFrame));
	  for (var f = 0; f < nArr.length; f++) {
	    if (astrojs.isAngle(constructor[nArr[f]]) === true) {
	      // It is already an angle, just use it.
	      angles[f] = constructor[nArr[f]];
	    } else {
	      angles[f] = astroAngle.new(constructor[nArr[f]]);
	      // Check that the constructor was interpretable.
	      try {
		if (astrojs.isAngle(angles[f]) === null) {
		  // The astroAngle constructor didn't work, so we fail.
		  throw(new TypeError('Constructor could not convert argument to' +
				      ' astroAngle.'));
		}
	      } catch (x) {
		astrojs.catchError.apply(ERR, ['initialise', x]);
		return false;
	      }
	    }
	  }
	  return assignCoords(inFrame, angles);
	}
      };

      /**
       * Turn some quantity into an astroAngle.
       * @param {variable} quantity The quantity to convert.
       */
      var toAstroAngle = function(quantity) {
	if (astrojs.isAngle(quantity) === true) {
	  return quantity;
	} else {
	  var oAngle = astroAngle.new(quantity);
	  // Check that the constructor was interpretable.
	  if (astrojs.isAngle(oAngle) === false) {
	    // The astroAngle constructor didn't work.
	    return null;
	  } else {
	    return oAngle;
	  }
	}
      };

      /**
       * Assign the local coordinates object.
       * @param {string} frame The name of the coordinate frame.
       * @param {array} angArr The array of angles to use.
       */
      var assignCoords = function(frame, angArr) {
	var tFrame = getFrame(frame);
	if (tFrame === null) {
	  // The frame isn't recognised.
	  return false;
	}

	for (var a = 0; a < tFrame.names.length; a++) {
	  coordinates[tFrame.names[a]] = angArr[a];
	}
	coordinates.frame = tFrame.mode;
	return true;
      };

      /**
       * Return the local coordinates object in a frame-agnostic way.
       */
      var noCoords = function() {
	var tFrame = getFrame(coordinates.frame);
	if (tFrame === null) {
	  return null;
	}

	var oCoords = {
	  'left': coordinates[tFrame.names[0]],
	  'right': coordinates[tFrame.names[1]]
	};
	return oCoords;
      };

      /**
       * Check for a matching allowed frame.
       * @param {variable} pFrame The type of frame to check for.
       */
      var getFrame = function(pFrame) {
	var rFrame = null;
	if (lang.isString(pFrame)) {
	  var lpFrame = pFrame.toLowerCase();
	  if (allowedFrames.hasOwnProperty(lpFrame)) {
	    rFrame = allowedFrames[lpFrame];
	  }
	} else if (astrojs.isNumeric(pFrame)) {
	  for (var aFrame in allowedFrames) {
	    if (allowedFrames.hasOwnProperty(aFrame) &&
		typeof allowedFrames[aFrame].mode !== 'undefined' &&
		allowedFrames[aFrame].mode === pFrame) {
	      rFrame = allowedFrames[aFrame];
	    }
	  }
	}

	return rFrame;
      };

      /**
       * Check for required possible object parameters.
       * @param {object} cObject The object to check.
       * @param {object} rObject The object to check with.
       */
      var checkFrame = function(cObject, rObject) {
	// This routine supports any number of coordinate axes.
	var coordsMatch = [];
	var matchedCoord = [];
	var coordN = 1;
	while (typeof rObject['coord' + coordN] !== 'undefined') {
	  coordsMatch[coordN - 1] = false;
	  var nameC = 'coord' + coordN;
	  for (var c = 0; c < rObject[nameC].length; c++) {
	    if (typeof cObject[rObject[nameC][c]] !== 'undefined') {
	      coordsMatch[coordN - 1] = true;
	      matchedCoord[coordN - 1] = rObject[nameC][c];
	      break;
	    }
	  }
	  coordN++;
	}

	var aMatch = coordsMatch[0];
	for (var c = 1; c < coordsMatch.length; c++) {
	  aMatch = aMatch && coordsMatch[c];
	}
	if (aMatch === true) {
	  return matchedCoord;
	} else {
	  return null;
	}
      };

      /**
       * Assemble the proper options required for coordinate conversions.
       * @param {object} oOptions Some options the user wants to override.
       */
      var assembleOptions = function(oOptions) {
	oOptions = oOptions || {};
	// Default to our own local options if the user hasn't supplied
	// any with this call.
	if (typeof oOptions.epoch === 'undefined') {
	  oOptions.epoch = timeHandler;
	}
	if (typeof oOptions.latitude === 'undefined' ||
	    !astrojs.isAngle(oOptions.latitude) ||
	    typeof oOptions.longitude === 'undefined' ||
	    !astrojs.isAngle(oOptions.longitude)) {
	  var gLoc = astrojs.getLocation(location);
	  oOptions.latitude = gLoc.latitude;
	  oOptions.longitude = gLoc.longitude;
	}

	return oOptions;
      };

      // Our public methods.
      /**
       * Return the current coordinates in a specified frame.
       * @param {string} outFrame The frame to return the coordinates in.
       * @param {object} oOptions Options required for frame conversion (same
       *                          options for astroCoord.coordConvert).
       */
      that.getCoordinates = function(outFrame, oOptions) {
	// Test if the coordinates have been set.
	try {
	  if (typeof coordinates.frame === 'undefined') {
	    // Construction was not successful.
	    throw(new Error('skyCoordinate was not successfully constructed.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['getCoordinates', x]);
	  return null;
	}
	// If outFrame is not specified, return the coordinates in the
	// constructor frame.
	if (typeof outFrame === 'undefined') {
	  return coordinates;
	}

	// Check if the requested coordinate frame matches our constructor.
	if (getFrame(coordinates.frame) == getFrame(outFrame)) {
	  return coordinates;
	}

	var outCoord = {};
	oOptions = assembleOptions(oOptions);
	// We can use the coordinate routine coordConvert to handle
	// whatever we need!
	var oFrame = getFrame(outFrame);
	if (oFrame !== 'null') {
	  var sFrame = noCoords();
	  outCoord = astroCoord.coordConvert(sFrame.left, sFrame.right,
	    coordinates.frame, oFrame.mode, oOptions);
	  outCoord.frame = oFrame.mode;
	}

	// Return the coordinates.
	try {
	  if (typeof outCoord.frame === 'undefined') {
	    // This is an error as we didn't recognise the outFrame.
	    return(new RangeError('The output coordinate frame is not recognised.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['getCoordinates', x]);
	  return null;
	}

	return outCoord;
      };

      /**
       * Return the coordinates in J2000.
       */
      that.toJ2000 = function(oOptions) {
	return that.getCoordinates('J2000', oOptions);
      };

      /**
       * Return the coordinates in B1950.
       */
      that.toB1950 = function(oOptions) {
	return that.getCoordinates('B1950', oOptions);
      };

      /**
       * Return the coordinates in Galactic coordinates.
       */
      that.toGalactic = function(oOptions) {
	return that.getCoordinates('Galactic', oOptions);
      };

      /**
       * Return the coordinates as local Az/El.
       */
      that.toAzEl = function(oOptions) {
	return that.getCoordinates('AzEl', oOptions);
      };

      /**
       * Return the coordinates as local HA/Dec.
       */
      that.toHADec = function(oOptions) {
	return that.getCoordinates('HADec', oOptions);
      };

      /**
       * Calculate the angular distance from this coordinate to another.
       * @param {skyCoordinate} target The target coordinate.
       */
      that.distanceTo = function(target) {
	// Check the target is a sky coordinate.
	try {
	  if (astrojs.isSkyCoordinate(target) === false) {
	    throw(new TypeError('Argument must be skyCoordinate'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['distanceTo', x]);
	  return null;
	}

	// We need to be in either B1950 or J2000, whichever is most convenient.
	var ourCo = coordinates;
	if (coordinates.frame === astroCoord.COORDMODE_GALACTIC) {
	  ourCo = that.toB1950();
	} else {
	  ourCo = that.toJ2000();
	}

	// We need to get the target coordinates in same frame as ours.
	var targetCo = target.getCoordinates(ourCo.frame);

	// Return the angular distance.
	return astroCoord.angularDistance(ourCo, targetCo);
      };

      /**
       * Set the location to use.
       * @param {string} locName The name of the location to use, or
       *                         an empty string '' to use the default
       *                         location.
       */
      that.setLocation = function(locName) {
	try {
	  if (typeof locName === 'undefined' ||
	      !lang.isString(locName)) {
	    throw(new TypeError('Argument must be a string.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['setLocation', x]);
	}

	if (locName === '') {
	  // An empty string means to use the default from now on.
	  location = undefined;
	} else {
	  location = astrojs.getLocation(locName).telescope;
	}

	// Set our time handler to have the same location.
	timeHandler.setLocation(locName);

	// Return ourselves for method chaining.
	return that;
      };

      /**
       * Return the location that we're using.
       */
      that.getLocation = function() {
	return location;
      };

      /**
       * Set our time to a value specified by the user.
       * @param {astroTime} nTime The time object to use for our time. If
       *                         this time is omitted, our own time
       *                         handler will be set to the current time.
       */
      that.setTime = function(nTime) {
	if (typeof nTime === 'undefined') {
	  // We set our own time to the current time.
	  timeHandler.now();
	} else if (astrojs.isTime(nTime)) {
	  // Use this object as our time.
	  timeHandler = nTime;
	  // Set our location to have the same location as this new time.
	  location = timeHandler.getLocation();
	}

	// Return ourselves for method chaining.
	return that;
      };

      /**
       * Return the time that we're using.
       */
      that.getTime = function() {
	return timeHandler;
      };

      // Attempt the initialisation.
      if (!initialise()) {
	return null;
      }

      return that;
    };

    return rObj;

  });
