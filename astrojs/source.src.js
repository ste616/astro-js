// this is "/astrojs/source"
define([ "./base", "dojo/_base/lang", "./skyCoordinate", "./time", "./angle",
	 "dojo/_base/Deferred", "./coordinate" ],
  function(astrojs, lang, astroSkyCoordinate, astroTime, astroAngle, Deferred,
    astroCoord) {

    /*
     * This routine enables the user to make a new source.
     */
    var rObj = {};

    // This file's error parameters.
    var ERR = {
      'file': 'source'
    };

    /**
     * This function allows the user to specify an astronomical source and then
     * get useful information about it, such as its rise and set times, its
     * coordinates in other systems, etc.
     * @param {object} constructor Specifications for the object setup.
     */
    rObj.new = function(constructor) {
      /**
       * The object we return to our callers.
       * @type {object}
       */
      var that = {};

      // Set some sensible defaults in the constructor object.
      constructor = constructor || {};
      constructor.name = constructor.name || '';
      constructor.coordinate = constructor.coordinate || null;

      /**
       * The name of this source, or primary identifier.
       * @type {string}
       */
      var sourceName;

      /**
       * The sky coordinates for the source.
       * @type {astroSkyCoordinate}
       */
      var sourceCoordinate;

      /**
       * Alternative names for this source.
       * @type {array}
       */
      var sourceAlternativeNames = [];

      /**
       * Is construction complete?
       * @type {Boolean}
       */
      var sourceValid = false;

      /**
       * A set of any other parameters the user may want the
       * source to have.
       * @type {object}
       */
      var sourceParameters = constructor.parameters || {};

      // Our methods follow.

      // Our private methods.
      /**
       * Try to make a new source object using the information we were given
       * during construction.
       */
      var initialise = function() {
	// Check for a valid name.
	try {
	  if (!lang.isString(constructor.name) ||
	      constructor.name === '') {
	    // Not a valid name.
	    throw(new TypeError('Not supplied with a valid source name.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['initialise', x]);
	  return;
	}

	// Check for something in the coordinate field.
	try {
	  if (typeof constructor.coordinate === 'undefined' ||
	      constructor.coordinate === null) {
	    throw(new TypeError('Not supplied with a valid source position.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['initialise', x]);
	  return;
	}

	// Is the coordinate already a sky coordinate?
	var nsc;
	if (!astrojs.isSkyCoordinate(constructor.coordinate)) {
	  // Try to make it a sky coordinate.
	  nsc = astroSkyCoordinate.new(constructor.coordinate);
	  // Check if the assignment worked.
	  try {
	    if (astrojs.isSkyCoordinate(nsc) === false) {
	      // No, we've failed.
	      throw(new TypeError('Unable to use supplied source position.'));
	    }
	  } catch (x) {
	    astrojs.catchError.apply(ERR, ['initialise', x]);
	    return;
	  }
	} else {
	  nsc = constructor.coordinate;
	}

	// We have enough information to finish construction.
	sourceName = constructor.name;
	sourceCoordinate = nsc;
	sourceValid = true;

	// Check for alternative names.
	if (typeof constructor.altNames !== 'undefined' &&
	    lang.isArray(constructor.altNames) === true) {
	  // Check that each element is a string.
	  for (var i = 0; i < constructor.altNames.length; i++) {
	    if (lang.isString(constructor.altNames[i]) === true) {
	      astrojs.uniquePush(sourceAlternativeNames, constructor.altNames[i]);
	    }
	  }
	}
      };

      /**
       * Calculate the source's hour angle.
       */
      var hourAngle = function() {
	// Get our coordinate's HA/Dec.
	var haDec = sourceCoordinate.getCoordinates('HADec');

	return haDec.hourAngle;
      };

      /**
       * Calculate the source's azimuth & elevation.
       */
      var calculateAzEl = function() {
	// Get our coordinate's HA/Dec.
	var azEl = sourceCoordinate.getCoordinates('AzEl');

	return azEl;
      };

      /**
       * Calculate the source's rise/set hour angle.
       */
      var calculateHaSet = function() {
	// Get the declination of the source, if possible.
	var oCoords = sourceCoordinate.getCoordinates();
	var oLocation = astrojs.getLocation(sourceCoordinate.getLocation());
	var declination = undefined;
	var haSet = undefined;
	if (oCoords.frame === astroCoord.COORDMODE_J2000 ||
	    oCoords.frame === astroCoord.COORDMODE_B1950 ||
	    oCoords.frame === astroCoord.COORDMODE_HADEC ||
	    oCoords.frame === astroCoord.COORDMODE_DATE ||
	    oCoords.frame === astroCoord.COORDMODE_GALACTIC) {
	  // The source is moving across the sky, and thus can set.
	  var pCoords = sourceCoordinate.getCoordinates('J2000');
	  declination = pCoords.declination;
	} else {
	  // The source isn't moving, so we check if we are
	  // above or below the elevation limit.
	  var pCoords = sourceCoordinate.getCoordinates(oLocation.mount);
	  if (oLocation.mount === 'AzEl') {
	    if (oCoords.elevation.toDegrees() >=
		oLocation.limits.elevationLow.toDegrees()) {
	      haSet = astroAngle.new(-720); // Never sets.
	    } else {
	      haSet = astroAngle.new(720); // Never rises.
	    }
	  }
	}

	if (oLocation.mount === 'AzEl' && declination !== undefined) {
	  haSet = astroCoord.haSetAzEl(declination, oLocation.latitude,
	    oLocation.limits);
	}

	return haSet;
      };

      // Our public methods.
      /**
       * Assemble and return all of our details.
       */
      that.details = function() {
	if (sourceValid === true) {
	  return {
	    name: sourceName,
	    coordinate: sourceCoordinate,
	    altName: sourceAlternativeNames
	  };
	} else {
	  return null;
	}
      };

      /**
       * Change our coordinate's time to an astroTime object that the user
       * supplies.
       * @param {astroTime} timeObj The astroTime object to use.
       */
      that.useTime = function(timeObj) {
	if (astrojs.isTime(timeObj) === true) {
	  sourceCoordinate.setTime(timeObj);
	}

	return that;
      };

      /**
       * Tell our coordinate to use the current time.
       */
      that.timeIsNow = function() {
	sourceCoordinate.setTime();

	return that;
      };

      /**
       * Set a new location in our coordinate handler.
       * @param {string} locName The name of the location to use, or
       *                         an empty string '' to use the default
       *                         location.
       */
      that.setLocation = function(locName) {
	sourceCoordinate.setLocation(locName);

	return that;
      };

      /**
       * Return the hour angle, as an astroAngle.
       */
      that.hourAngle = function() {
	return hourAngle();
      };

      /**
       * Return the source's az/el as astroAngles.
       */
      that.getAzEl = function() {
	return calculateAzEl();
      };

      /**
       * Return the source's rise/set hour angle as an astroAngle.
       * @param {astroAngle} elevationLimit The rise/set elevation limit.
       */
      that.setHourAngle = function() {
	return calculateHaSet();
      };

      /**
       * Return the time until the source next crosses a specified elevation.
       * @param {astroAngle} crossElevation The elevation crossing angle.
       */
      that.timeUntilElevation = function(crossElevation) {
	// Get the hour angle at our elevation crossing.
	var crossHa = that.setHourAngle(crossElevation);
	// Get the current hour angle.
	var currHa = that.hourAngle();

	if (crossHa.toTurns() > 1 || crossHa.toTurns() < -1) {
	  return crossHa;
	}

	var haValue;
	if (crossHa.toTurns() > Math.abs(currHa.toTurns())) {
	  haValue = crossHa.toTurns() - currHa.toTurns();
	} else {
	  haValue = (-1 * crossHa.toTurns()) - currHa.toTurns();
	  if (haValue < 0) {
	    haValue += 1;
	  }
	}

	return astroAngle.new({
	  value: haValue,
	  units: 'turns'
	});
      };

      /**
       * Return the HA at rise/set, or at elevation.
       * @param {astroAngle} elevation The elevation to reach at
       *                              rise/set. Will use the location
       *                              specific elevation limit as
       *                              default.
       */
      that.haRiseSet = function(elevation) {
	// Check our parameters.
	if (typeof elevation === 'undefined') {
	  elevation = astrojs.getLocation(
	    sourceCoordinate.getLocation()).limits.elevationLow;
	}
	try {
	  if (typeof elevation == 'undefined' ||
	      !astrojs.isAngle(elevation)) {
	    throw(new TypeError('Supplied argument must be an astroAngle'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['haRiseSet', x]);
	  return undefined;
	}

	// Call the appropriate routine to determine the rising LST,
	// depending on the telescope mount.
	var tLoc = astrojs.getLocation(sourceCoordinate.getLocation());
	var rHa;
	if (tLoc.mount === 'AzEl') {
	  var tDec = sourceCoordinate.toJ2000().declination;
	  var tLim = {
	    'elevationLow': elevation
	  };
	  rHa = astroCoord.haSetAzEl(tDec, tLoc.latitude, tLim);
	} else if (tLoc.mount === 'XY') {
	  console.log('astrojs Javascript library does not properly support XY' +
		      ' mounts yet.');
	  rHa = astroAngle.new(0);
	}

	return rHa;
      };

      /**
       * Return the LST at rise, or at some rising elevation.
       * @param {astroAngle} elevation The elevation to reach for rise.
       */
      that.lstRise = function(elevation) {
	// Get the HA for this elevation.
	var rHa;
	try {
	  rHa = that.haRiseSet(elevation);
	  if (rHa === undefined) {
	    throw(new Error('Could not determine rising HA.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['lstRise', x]);
	}

	// Subtract the HA from the RA to get the LST at rise.
	if (rHa.toTurns() < -1 || rHa.toTurns() > 1) {
	  // This source doesn't get to this value.
	  return rHa;
	}
	var lr = sourceCoordinate.toJ2000().rightAscension.subtract(rHa);
	if (lr.toTurns() < 0) {
	  lr = lr.add(astroAngle.new(360));
	}

	return lr;
      };

      /**
       * Return the LST at set, or at some setting elevation.
       * @param {astroAngle} elevation The elevation to reach for set.
       */
      that.lstSet = function(elevation) {
	// Get the HA for this elevation.
	var sHa;
	try {
	  sHa = that.haRiseSet(elevation);
	  if (sHa === undefined) {
	    throw(new Error('Could not determine setting HA.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['lstSet', x]);
	}

	// Add the HA from the RA to get the LST at set.
	if (sHa.toTurns() < -1 || sHa.toTurns() > 1) {
	  // This source doesn't get to this value.
	  return sHa;
	}
	var ls = sourceCoordinate.toJ2000().rightAscension.add(sHa);
	if (ls.toTurns() >= 1) {
	  ls = ls.subtract(astroAngle.new(360));
	}

	return ls;
      };

      /**
       * Return a named source parameter, or a set of parameters, or
       * all parameters.
       * @param {variable} paramList The parameters to return.
       *                             Leave blank to receive all.
       */
      that.getParameters = function(paramList) {
	var retObj = {};

	if (typeof paramList === 'undefined') {
	  // Return all the parameters.
	  retObj = lang.clone(sourceParameters);
	} else if (lang.isString(paramList) === true) {
	  // Return only a single parameter.
	  if (typeof sourceParameters[paramList] !== 'undefined') {
	    retObj[paramList] = lang.clone(sourceParameters[paramList]);
	  }
	} else if (lang.isArray(paramList) === true) {
	  // Return all the named parameters.
	  for (var i = 0; i < paramList.length; i++) {
	    if (typeof sourceParameters[paramList[i]] !== 'undefined') {
	      retObj[paramList[i]] = lang.clone(sourceParameters[paramList[i]]);
	    }
	  }
	}

	return retObj;
      };

      // Try to initialise.
      initialise();

      return that;

    };

    return rObj;

  });
