// this is "/astrojs/angle"
define([ "./base", "dojo/_base/lang" ],
  function(astrojs, lang) {

    /*
     * This routine enables the user to make a new angle.
     */
    var rObj = {};

    // This file's error parameters.
    var ERR = {
      'file': 'angle'
    };

    rObj.new = function(constructor) {
      /**
       * The object we return to our callers.
       * @type {object}
       */
      var that = {};

      /**
       * The value of our angle.
       * @type {number}
       */
      var angleValue;

      /**
       * The units of the angle.
       * @type {string}
       */
      var angleUnits;

      /**
       * Do we have an angle?
       * @type {boolean}
       */
      var angleSet = false;

      /**
       * The units that we can deal with.
       * @type {array}
       */
      var usableUnitNames = ['degrees', 'hours', 'turns', 'radians',
			     'arcminutes', 'arcseconds'];

      // Our methods follow.

      // Our private methods.
      /**
       * Use our constructor to set our values.
       * @param {variable} constructor The coordinate that this object should
       *                               represent.
       */
      var initialise = function() {
	// Check we have a constructor.
	if (typeof constructor === 'undefined') {
	  return;
	}

	// Do different things depending the type of the constructor.
	// if (typeof constructor === 'number') {
	if (astrojs.isNumeric(constructor)) {
	  // We accept this number as our angle in decimal degrees.
	  angleValue = constructor;
	  angleUnits = 'degrees';
	  angleSet = true;
	} else if (lang.isString(constructor) === true) {
	  // Try converting the string using the astrojs library extension.
	  var t = astrojs.hexa2turns(constructor);
	  if (astrojs.isNumeric(t)) {
	    // The conversion worked, so we now have the angle in turns.
	    angleValue = t;
	    angleUnits = 'turns';
	    angleSet = true;
	  } else {
	    // The conversion failed, so we try to interpret the string ourselves.
	    if (/^[\d\.]+\s*\D+$/.test(constructor) === true) {
	      // We have a number followed by some letters.
	      var am = /^([\d\.]+)\s*(\D+)$/.exec(constructor);
	      for (var u = 0; u < usableUnitNames.length; u++) {
		if (astrojs.minimumMatch(am[2], usableUnitNames[u]) === true) {
		  angleValue = parseFloat(am[1]);
		  angleUnits = usableUnitNames[u];
		  angleSet = true;
		  break;
		}
	      }
	    }
	  }
	} else if (lang.isArray(constructor) === false &&
		   lang.isObject(constructor) === true &&
		   constructor !== null) {
	  // The constructor is an object. We check for the required parameters.
	  if (typeof constructor.value !== 'undefined' &&
	      typeof constructor.units !== 'undefined') {
	    if (typeof constructor.value === 'number') {
	      for (var u = 0; u < usableUnitNames.length; u++) {
		if (astrojs.minimumMatch(constructor.units,
		  usableUnitNames[u]) === true) {
		  // We can use this constructor.
		  angleValue = constructor.value;
		  angleUnits = usableUnitNames[u];
		  angleSet = true;
		  break;
		}
	      }
	    }
	  }
	}
      };

      /**
       * Convert our angle into degrees, for a return value.
       */
      var convertToDegrees = function() {
	// Check for our own units.
	if (angleUnits === 'degrees') {
	  return angleValue;
	} else if (angleUnits === 'hours') {
	  return astrojs.hours2degrees(angleValue);
	} else if (angleUnits === 'turns') {
	  return astrojs.turns2degrees(angleValue);
	} else if (angleUnits === 'radians') {
	  return astrojs.turns2degrees(astrojs.radians2turns(angleValue));
	} else if (angleUnits === 'arcminutes') {
	  return astrojs.arcmin2degrees(angleValue);
	} else if (angleUnits === 'arcseconds') {
	  return astrojs.arcsec2degrees(angleValue);
	} else {
	  // This is an error.
	  return 0;
	}
      };

      /**
       * Convert our angle into hours, for a return value.
       */
      var convertToHours = function() {
	// Check for our own units.
	if (angleUnits === 'degrees') {
	  return astrojs.degrees2hours(angleValue);
	} else if (angleUnits === 'hours') {
	  return angleValue;
	} else if (angleUnits === 'turns') {
	  return astrojs.degrees2hours(astrojs.turns2degrees(angleValue));
	} else if (angleUnits === 'radians') {
	  return astrojs
	    .degrees2hours(astrojs
			   .turns2degrees(astrojs.radians2turns(angleValue)));
	} else if (angleUnits === 'arcminutes') {
	  return astrojs.degrees2hours(astrojs.arcmin2degrees(angleValue));
	} else if (angleUnits === 'arcseconds') {
	  return astrojs.degrees2hours(astrojs.arcsec2degrees(angleValue));
	} else {
	  // This is an error.
	  return 0;
	}
      };

      /**
       * Convert our angle into turns, for a return value.
       */
      var convertToTurns = function() {
	// Check for our own units.
	if (angleUnits === 'degrees') {
	  return astrojs.degrees2turns(angleValue);
	} else if (angleUnits === 'hours') {
	  return astrojs.degrees2turns(astrojs.hours2degrees(angleValue));
	} else if (angleUnits === 'turns') {
	  return angleValue;
	} else if (angleUnits === 'radians') {
	  return astrojs.radians2turns(angleValue);
	} else if (angleUnits === 'arcminutes') {
	  return astrojs.degrees2turns(astrojs.arcmin2degrees(angleValue));
	} else if (angleUnits === 'arcseconds') {
	  return astrojs.degrees2turns(astrojs.arcsec2degrees(angleValue));
	} else {
	  // This is an error.
	  return 0;
	}
      };

      /**
       * Convert our angle into radians, for a return value.
       */
      var convertToRadians = function() {
	// Check for our own units.
	if (angleUnits === 'degrees') {
	  return astrojs.turns2radians(astrojs.degrees2turns(angleValue));
	} else if (angleUnits === 'hours') {
	  return astrojs
	    .turns2radians(astrojs
			   .degrees2turns(astrojs.hours2degrees(angleValue)));
	} else if (angleUnits === 'turns') {
	  return astrojs.turns2radians(angleValue);
	} else if (angleUnits === 'radians') {
	  return angleValue;
	} else if (angleUnits === 'arcminutes') {
	  return astrojs
	    .turns2radians(astrojs
			   .degrees2turns(astrojs.arcmin2degrees(angleValue)));
	} else if (angleUnits === 'arcseconds') {
	  return astrojs
	    .turns2radians(astrojs
			   .degrees2turns(astrojs.arcsec2degrees(angleValue)));
	} else {
	  // This is an error.
	  return 0;
	}
      };

      /**
       * Convert our angle into arcminutes, for a return value.
       */
      var convertToArcminutes = function() {
	// Check for our own units.
	if (angleUnits === 'degrees') {
	  return astrojs.degrees2arcmin(angleValue);
	} else if (angleUnits === 'hours') {
	  return astrojs.degrees2arcmin(astrojs.hours2degrees(angleValue));
	} else if (angleUnits === 'turns') {
	  return astrojs.degrees2arcmin(astrojs.turns2degrees(angleValue));
	} else if (angleUnits === 'radians') {
	  return astrojs
	    .degrees2arcmin(astrojs
			    .turns2degrees(astrojs.radians2turns(angleValue)));
	} else if (angleUnits === 'arcminutes') {
	  return angleValue;
	} else if (angleUnits === 'arcseconds') {
	  return astrojs.degrees2arcmin(astrojs.arcsec2degrees(angleValue));
	} else {
	  // This is an error.
	  return 0;
	}
      };

      /**
       * Convert our angle into arcseconds, for a return value.
       */
      var convertToArcseconds = function() {
	// Check for our own units.
	if (angleUnits === 'degrees') {
	  return astrojs.degrees2arcsec(angleValue);
	} else if (angleUnits === 'hours') {
	  return astrojs.degrees2arcsec(astrojs.hours2degrees(angleValue));
	} else if (angleUnits === 'turns') {
	  return astrojs.degrees2arcsec(astrojs.turns2degrees(angleValue));
	} else if (angleUnits === 'radians') {
	  return astrojs
	    .degrees2arcsec(astrojs
			    .turns2degrees(astrojs.radians2turns(angleValue)));
	} else if (angleUnits === 'arcminutes') {
	  return astrojs.degrees2arcsec(astrojs.arcmin2degrees(angleValue));
	} else if (angleUnits === 'arcseconds') {
	  return angleValue;
	} else {
	  // This is an error.
	  return 0;
	}
      };


      // Our public methods.
      /**
       * Return the value, as it is right now, as an object.
       */
      that.value = function() {
	if (angleSet === true) {
	  return {
	    value: astrojs.checkNumber(angleValue),
	    units: angleUnits
	  };
	} else {
	  return null;
	}
      };

      /**
       * Return the constructor.
       */
      that.constructor = function() {
	return constructor;
      };

      /**
       * Return the value as a number in the specified units.
       * @param {string} units The units to return the number in.
       */
      that.to = function(units) {
	if (lang.isString(units) === false) {
	  return 0;
	}

	var out;

	// Simple output if the requested units are the same as the
	// units we already have.
	if (astrojs.minimumMatch(units, angleUnits) === true) {
	  return astrojs.checkNumber(angleValue);
	}

	if (astrojs.minimumMatch(units, 'degrees') === true) {
	  return astrojs.checkNumber(convertToDegrees());
	} else if (astrojs.minimumMatch(units, 'hours') === true) {
	  return astrojs.checkNumber(convertToHours());
	} else if (astrojs.minimumMatch(units, 'turns') === true) {
	  return astrojs.checkNumber(convertToTurns());
	} else if (astrojs.minimumMatch(units, 'radians') === true) {
	  return astrojs.checkNumber(convertToRadians());
	} else if (astrojs.minimumMatch(units, 'arcminutes') === true) {
	  return astrojs.checkNumber(convertToArcminutes());
	} else if (astrojs.minimumMatch(units, 'arcseconds') === true) {
	  return astrojs.checkNumber(convertToArcseconds());
	}

	// We should never get here.
	return 0;
      };

      /**
       * Return the value as a number in degrees.
       */
      that.toDegrees = function() {
	return that.to('degrees');
      };

      /**
       * Return the value as a number in hours.
       */
      that.toHours = function() {
	return that.to('hours');
      };

      /**
       * Return the value as a number in turns.
       */
      that.toTurns = function() {
	return that.to('turns');
      };

      /**
       * Return the value as a number in radians.
       */
      that.toRadians = function() {
	return that.to('radians');
      };

      /**
       * Return the value as a number in arcminutes.
       */
      that.toArcminutes = function() {
	return that.to('arcminutes');
      };

      /**
       * Return the value as a number in arcseconds.
       */
      that.toArcseconds = function() {
	return that.to('arcseconds');
      };

      /**
       * Add another angle to this one and return a new angle.
       * @param {angle} aAngle The angle to add to this one.
       */
      that.add = function(aAngle) {
	// Check that we have been passed an angle object.
	if (astrojs.isAngle(aAngle) === false) {
	  return that;
	}

	// Get the angle's value in our units.
	var a = aAngle.to(angleUnits);

	// Make a new object.
	var n = rObj.new({
	  value: astrojs.checkNumber(a + angleValue),
	  units: angleUnits
	});

	return n;
      };

      /**
       * Subtract another angle from this one and return a new angle.
       * @param {angle} aAngle The angle to subtract from this one.
       */
      that.subtract = function(aAngle) {
	// Check that we have been passed an angle object.
	if (astrojs.isAngle(aAngle) === false) {
	  return that;
	}

	// Get the angle's value in our units.
	var a = aAngle.to(angleUnits);

	// Make a new object.
	var n = rObj.new({
	  value: astrojs.checkNumber(angleValue - a),
	  units: angleUnits
	});

	return n;
      };

      /**
       * Divide this angle by another angle and return a number.
       * @param {angle} aAngle The angle to divide this one by.
       */
      that.ratio = function(aAngle) {
	// Check that we have been passed an angle object.
	if (astrojs.isAngle(aAngle) === false) {
	  return that;
	}

	// Get the angle's value in our units.
	var a = aAngle.to(angleUnits);

	return astrojs.checkNumber(angleValue / a);

      };

      /**
       * Divide this angle by a number and return a new angle.
       * @param {Number} divisor The number to divide this angle by.
       */
      that.divide = function(divisor) {
	// Check that we have been passed a number.
	try {
	  if (!astrojs.isNumeric(divisor)) {
	    throw (new TypeError('Require a number for the divisor.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['divide', x]);
	}

	try {
	  if (divisor === 0) {
	    throw(new RangeError('Divisor cannot be zero.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['divide', x]);
	}

	// Make a new object.
	var n = rObj.new({
	  value: astrojs.checkNumber(angleValue / divisor),
	  units: angleUnits
	});

	return n;
      };

      /**
       * Our valueOf replacement.
       */
      that.valueOf = function() {
	return that.toTurns();
      };

      initialise();

      return that;

    };

    /**
     * Convert numbers in locations to angle values.
     */
    rObj.prepareLocations = function() {

      // We convert the ATNF telescope locations into angles.
      for (var i = 0; i < astrojs.locations.all.length; i++) {
	if (typeof astrojs.locations.all[i].latitude === 'undefined') {
	  astrojs.locations.all[i].latitude =
	    rObj.new(astrojs.locations.all[i].Latitude);
	}
	if (typeof astrojs.locations.all[i].longitude === 'undefined') {
	  astrojs.locations.all[i].longitude =
	    rObj.new(astrojs.locations.all[i].Longitude);
	}
	if (typeof astrojs.locations.all[i].limits !== 'undefined' &&
	    typeof astrojs.locations.all[i].limits.elevationLow === 'undefined' &&
	    typeof astrojs.locations.all[i].limits.ElevationLow !== 'undefined') {
	  astrojs.locations.all[i].limits.elevationLow =
	    rObj.new(astrojs.locations.all[i].limits.ElevationLow);
	}
      }
    };

    // Do the conversion of the default locations upon loading this module.
    rObj.prepareLocations();

    return rObj;
  });
