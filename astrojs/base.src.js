// this is "/astrojs/base"
define([ "dojo/_base/lang", "dojo/number" ],
  function(lang, dNumber) {

    /**
     * This is a set of helper functions for the astrojs Javascript library.
     */

    var that = {};

    // The version number.
    that.version = '1.0';

    // This file's error parameters.
    var ERR = {
      file: 'base'
    };

    /**
     * Some global options for our library.
     */
    that.options = {
      // The smallest decimal to be considered non-zero.
      minRemainder: 1e-15
    };

    /**
     * Some locations that we know about.
     * @type {array}
     */
    that.locations = {
      'all': [
	{
	  telescope: 'ATCA',
	  Longitude: 149.550138889,
	  Latitude: -30.312884722,
	  timezoneOffset: 600,
	  mount: 'AzEl',
	  limits: {
	    'ElevationLow': 12,
	    'ElevationHigh': 90
	  }
	},
	{
	  telescope: 'Parkes',
	  Latitude: '-32d59m54.263s',
	  Longitude: '148d15m48.636s',
	  timezoneOffset: 600,
	  mount: 'AzEl',
	  limits: {
	    'ElevationLow': 30
	  }
	},
	{
	  telescope: 'Mopra',
	  Latitude: '-31:16:04',
	  Longitude: '149:05:59',
	  timezoneOffset: 600,
	  mount: 'AzEl',
	  limits: {
	    'ElevationLow': 12
	  }
	},
	{
	  telescope: 'ASKAP',
	  Latitude: -26.6902167777778,
	  Longitude: 116.637134902778,
	  timezoneOffset: 480,
	  mount: 'AzEl',
	  limits: {
	    'ElevationLow': 12
	  }
	}
      ]
    };

    /**
     * Some useful constants.
     */
    that.C = 299792458; // Speed of light, m/s.

    /**
     * Our error handling function for the library.
     * @param {String} routine The routine which handled the error.
     * @param {error} error The error condition, as passed from catch.
     */
    that.catchError = function(routine, error) {
      // Construct the error message.
      var errorMessage = '[astrojs / ' + this.file + '.' +
	routine + '] ' + error.message;
      // Log to the console.
      console.warn(errorMessage);
    };

    /**
     * Check the passed argument to see if it is an angle object.
     * @param {object} cAngle The object to check.
     */
    that.isAngle = function(cAngle) {
      if (typeof cAngle === 'undefined') {
	return false;
      }
      if (lang.isFunction(cAngle.to) === false) {
	return false;
      }
      // It's also not an angle unless it has had a value set.
      if (cAngle.value() === null) {
	return false;
      }

      return true;
    };

    /**
     * Check the passed argument to see if it is a skyCoordinate object.
     * @param {object} cCoordinate The object to check.
     */
    that.isSkyCoordinate = function(cCoordinate) {
      if (typeof cCoordinate === 'undefined') {
	return false;
      }
      if (lang.isFunction(cCoordinate.getCoordinates) === false) {
	return false;
      }
      // It's also not an angle unless it has had a value set.
      if (cCoordinate.getCoordinates() === null) {
	return false;
      }

      return true;
    };

    /**
     * Check the passed argument to see if it is a source object.
     * @param {object} cSource The object to check.
     */
    that.isSource = function(cSource) {
      if (typeof cSource === 'undefined') {
	return false;
      }
      if (lang.isFunction(cSource.details) === false) {
	return false;
      }
      // It's also not a source if the construction failed.
      if (cSource.details() === null) {
	return false;
      }

      return true;
    };

    /**
     * Check the passed argument to see if it is an astrojs time object.
     * @param {object} cTime The object to check.
     */
    that.isTime = function(cTime) {
      if (typeof cTime === 'undefined') {
	return false;
      }
      if (lang.isFunction(cTime.timeString) === false) {
	return false;
      }

      return true;
    };

    /**
     * Check if something is a number.
     * @param {something} a The thing to check for numberness.
     */
    that.isNumeric = function(a) {
      return !isNaN(parseFloat(a)) && isFinite(a);
    };

    /**
     * Check if something is a Boolean.
     * @param {something} a The thing to check for Boolean-ness.
     */
    that.isBoolean = function(a) {
      return (a.constructor && a.constructor === Boolean);
    };

    /**
     * Check if an object is a valid telescope location.
     * @param {something} cLocation The object to check.
     */
    that.isLocation = function(cLocation) {
      if (typeof cLocation === 'undefined') {
	return false;
      }
      if (typeof cLocation.telescope !== 'undefined' &&
	  (typeof cLocation.longitude !== 'undefined' ||
	   typeof cLocation.Longitude !== 'undefined') &&
	  (typeof cLocation.latitude !== 'undefined' ||
	   typeof cLocation.Latitude !== 'undefined') &&
	  typeof cLocation.timezoneOffset !== 'undefined' &&
	  typeof cLocation.mount !== 'undefined' &&
	  typeof cLocation.limits !== 'undefined') {
	return true;
      }

      return false;
    };

    /**
     * Convert a number in degrees into a number in turns.
     * @param {Number} n A floating point number in degrees.
     */
    that.degrees2turns = function(n) {
      try {
	if (!that.isNumeric(n)) {
	  throw(new TypeError('Argument must be a Number'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['degrees2turns', x]);
      }

      return (that.checkNumber(n / 360.0));
    };

    /**
     * Convert a number in turns into a number in degrees.
     * @param {Number} n A floating point number in turns.
     */
    that.turns2degrees = function(n) {
      try {
	if (!that.isNumeric(n)) {
	  throw(new TypeError('Argument must be a Number'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['turns2degrees', x]);
      }

      return (that.checkNumber(n * 360.0));
    };

    /**
     * Convert a number in turns into a number in radians.
     * @param {Number} n A floating point number in turns.
     */
    that.turns2radians = function(n) {
      try {
	if (!that.isNumeric(n)) {
	  throw(new TypeError('Argument must be a Number'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['turns2radians', x]);
      }

      return (that.checkNumber(n * 2 * Math.PI));
    };

    /**
     * Convert a number in radians into a number in turns.
     * @param {Number} n A floating point number in radians.
     */
    that.radians2turns = function(n) {
      try {
	if (!that.isNumeric(n)) {
	  throw(new TypeError('Argument must be a Number'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['radians2turns', x]);
      }

      return (that.checkNumber(n / (2 * Math.PI)));
    };

    /**
     * Convert a number in arcminutes into a number in degrees.
     */
    that.arcmin2degrees = function(n) {
      try {
	if (!that.isNumeric(n)) {
	  throw(new TypeError('Argument must be a Number'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['arcmin2degrees', x]);
      }

      return (that.checkNumber(n / 60.0));
    };

    /**
     * Convert a number in degrees into a number in arcminutes.
     */
    that.degrees2arcmin = function(n) {
      try {
	if (!that.isNumeric(n)) {
	  throw(new TypeError('Argument must be a Number'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['degrees2arcmin', x]);
      }

      return (that.checkNumber(n * 60.0));
    };

    /**
     * Convert a number in arcseconds into a number in degrees.
     */
    that.arcsec2degrees = function(n) {
      try {
	if (!that.isNumeric(n)) {
	  throw(new TypeError('Argument must be a Number'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['arcsec2degrees', x]);
      }

      return (that.checkNumber(n / 3600.0));
    };

    /**
     * Convert a number in degrees into a number in arcseconds.
     */
    that.degrees2arcsec = function(n) {
      try {
	if (!that.isNumeric(n)) {
	  throw(new TypeError('Argument must be a Number'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['degrees2arcsec', x]);
      }

      return (that.checkNumber(n * 3600.0));
    };

    /**
     * Convert a number in hours into a number in degrees.
     */
    that.hours2degrees = function(n) {
      try {
	if (!that.isNumeric(n)) {
	  throw(new TypeError('Argument must be a Number'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['hours2degrees', x]);
      }

      return (that.checkNumber(n * 15.0));
    };

    /**
     * Convert a number in degrees into a number in hours.
     */
    that.degrees2hours = function(n) {
      try {
	if (!that.isNumeric(n)) {
	  throw(new TypeError('Argument must be a Number'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['degrees2hours', x]);
      }

      return (that.checkNumber(n / 15.0));
    };

    /**
     * Convert a number in turns into its string representation.
     * @param {object} options An object containing conversion information.
     */
    that.turns2hexa = function(n, options) {
      // Default options.
      options = options || {};

      if (typeof options.units === 'undefined') {
	options.units = 'degrees';
      }
      if (typeof options.delimiter === 'undefined') {
	options.delimiter = ':';
      }
      if (typeof options.precision === 'undefined') {
	options.precision = 3;
      };
      if (typeof options.alwaysSigned === 'undefined') {
	options.alwaysSigned = false;
      };

      // Check for numberness.
      try {
	if (!that.isNumeric(n)) {
	  throw(new TypeError('First argument must be a Number'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['turns2hexa', x]);
      }

      // Convert the number into degrees.
      var m = that.turns2degrees(n);

      // Do we need to convert it to hours?
      if (typeof options.units !== 'undefined' &&
	  options.units === 'hours') {
	m = that.degrees2hours(m);
      }

      // We'll deal only with positive numbers and add the sign later.
      var sign = 1;
      if (m < 0) {
	sign = -1;
      }
      m *= sign;

      var fields = [];
      fields[0] = Math.floor(m);
      m -= fields[0];
      m = that.degrees2arcmin(m);
      fields[1] = Math.floor(m);
      m -= fields[1];
      m = that.arcmin2degrees(m);
      m = that.degrees2arcsec(m);
      // Trim the last part to the appropriate precision.
      fields[2] = dNumber.round(m, options.precision);

      // Turn it into a string.
      var output = '';
      for (var i = 0; i < fields.length; i++) {
	fields[i] = that.zeroPad(fields[i], 10);
	if (i > 0) {
	  output += options.delimiter;
	}
	output += fields[i];
      }

      // Put the sign back.
      if (sign < 0) {
	output = '-' + output;
      } else if (options.alwaysSigned === true) {
	output = '+' + output;
      }

      return output;
    };

    /**
     * Convert a number into a string with leading zeroes if required.
     * @param {number} n The number to pad.
     * @param {number} bound The largest number (+1) to pad with leading zeroes.
     */
    that.zeroPad = function(n, bound) {
      var b = bound || 1;
      try {
	if (!that.isNumeric(n) ||
	    !that.isNumeric(b)) {
	  throw(new TypeError('Arguments must both be Numbers'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['zeroPad', x]);
      }

      var o = '';
      var m = n;

      var sign = 1;
      if (m < 0) {
	sign = -1;
	m *= sign;
      }

      while (m < b && b >= 10) {
	o += '0';
	b /= 10;
      }

      if (sign === -1) {
	o = '-' + o;
      }

      return o + m;
    };

    /**
     * Add a plus sign to the front of a string if it doesn't already have
     * a minus sign.
     */
    that.leadingPlus = function(s) {
      // Check for stringiness.
      try {
	if (!lang.isString(s)) {
	  throw(new TypeError('Argument must be a String'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['leadingPlus', x]);
      }

      if (/^\-/.test(s) === true) {
	return s;
      }

      return '+' + s;
    };

    /**
     * Add zeroes to the end of a string to make it a specified length.
     * @param {number} reqLength The required string length.
     */
    that.zeroTrail = function(s, reqLength) {
      // Check for stringiness.
      try {
	if (!lang.isString(s)) {
	  throw(new TypeError('Argument must be a String'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['zeroTrail', x]);
      }
      var t = s;
      reqLength = reqLength || s.length;

      // Check that the string isn't already at the right length.
      if (s.length >= reqLength) {
	return t;
      }

      // Check that the number has a decimal point, and add one if it doesn't.
      if (/\./.test(t) === false) {
	t += '.';
      }

      // Add the trailing zeroes.
      while (t.length < reqLength) {
	t += '0';
      }

      return t;
    };

    /**
     * Convert a string formatted as "DD:DD:DD.D" (or close to this)
     * into a decimal number representing the number of turns.
     * @param {object} options An object containing conversion information.
     */
    that.hexa2turns = function(s, options) {
      // Check for stringiness.
      try {
	if (!lang.isString(s)) {
	  throw(new TypeError('Argument must be a String'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['hexa2turns', x]);
      }

      // Default options.
      options = options || {};
      if (typeof options.units === 'undefined') {
	options.units = 'degrees';
      };

      // Check for the sign of the number.
      var sign = 1;
      // Remove any plus sign at the start of the string.
      var h = s.replace(/^\+/, '');
      // Remove some things that may sometimes be present in angle strings.
      h = h.replace(/[\?\u00B0\']/g, ':');
      h = h.replace(/\"/g, '');
      if (/^\-/.test(h)) {
	// The string appears to be a negative number.
	sign = -1;
      }
      if (sign === -1) {
	// We need to get rid of the negative sign at the front of the string.
	h = h.replace(/^\-/, '');
      }

      // Break it into the component elements.
      if (/^\d+h\d+m[\d\.]+s*$/.test(h) === true) {
	// The string is in hours.
	options.units = 'hours';
	h = h.replace(/[hm]/g, ' ');
	h = h.replace(/s/, '');
      } else if (/^\d+d\d+m[\d\.]+s*$/.test(h) === true) {
	// The string is in degrees.
	options.units = 'degrees';
	h = h.replace(/[dm]/g, ' ');
	h = h.replace(/s/, '');
      }
      var hexaSplit = h.split(/[\s\:]/g);

      // Check that we only get 3 elements.
      if (hexaSplit.length !== 3) {
	// The string doesn't look right.
	return s;
      }
      // And that each element consists only of numerals.
      for (var i = 0; i < hexaSplit.length; i++) {
	if (/^[\d\.]+$/.test(hexaSplit[i]) === false) {
	  // A non-numeric value showed up.
	  return s;
	}
      }

      // Replace any leading zeroes in the split components.
      for (i = 0; i < hexaSplit.length; i++) {
	if (hexaSplit[i] !== '0') {
	  hexaSplit[i] = hexaSplit[i].replace(/^0/, '');
	}
      }

      // Convert it into decimal now.
      var decimal = parseInt(hexaSplit[0]) +
	that.arcmin2degrees(parseInt(hexaSplit[1])) +
	that.arcsec2degrees(parseFloat(hexaSplit[2]));

      // Correct the sign now.
      decimal *= sign;

      // Apply any options.
      if (typeof options.units !== 'undefined' &&
	  options.units === 'hours') {
	// The string was representing hours.
	decimal = that.hours2degrees(decimal);
      }

      // Convert it into turns now.
      return that.degrees2turns(decimal);
    };

    /**
     * Check if a string could be a minimum match for another specified string.
     * @param {String} longString The string to check against.
     */
    that.minimumMatch = function(s, longString) {
      // Check that s and longString really are strings.
      try {
	if (!lang.isString(longString) || !lang.isString(s)) {
	  throw(new TypeError('Arguments must be Strings'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['minimumMatch', x]);
	return false;
      }

      // Check that the length of this string is not longer than
      // the longString.
      if (s.length > longString.length) {
	return false;
      }

      // Extract the right number of characters from the longString.
      var e = longString.substr(0, s.length);

      if (e == s) {
	return true;
      } else {
	return false;
      }
    };

    /**
     * Convert a value in microseconds into a string representation of the
     * time period.
     */
    that.durationString = function(us) {
      try {
	if (!that.isNumeric(us)) {
	  throw(new TypeError('Argument must be a Number'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['durationString', x]);
      }
      // Convert to seconds.
      var s = us / 1000000;
      // The days part.
      var d = Math.floor(s / 86400);
      s -= d * 86400;
      // The hours.
      var h = Math.floor(s / 3600);
      s -= h * 3600;
      // The minutes.
      var m = Math.floor(s / 60);
      s -= m * 60;
      // Now round the number of seconds.
      s = Math.round(s);

      var dString = '';
      if (d > 0) {
	dString += d + 'd';
      }
      if (h > 0 || d > 0) {
	dString += h + 'h';
      }
      if (m > 0 || h > 0 || d > 0) {
	if (h > 0 || d > 0) {
	  dString += that.zeroPad(m, 10) + 'm';
	} else {
	  dString += m + 'm';
	}
      }
      if (s > 0 || m > 0 || h > 0 || d > 0) {
	if (m > 0 || h > 0 || d > 0) {
	  dString += that.zeroPad(s, 10) + 's';
	} else {
	  dString += s + 's';
	}
      }

      return dString;
    };

    /**
     * Push a value onto an array only if the value doesn't already
     * exist in the array.
     */
    that.uniquePush = function(arr, val) {
      // Check that arr is an array.
      try {
	if (!lang.isArrayLike(arr)) {
	  throw(new TypeError('First argument must be array-like'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['uniquePush', x]);
      }
      // Search through the array for the val.
      var nAdd = true;
      for (var i = 0; i < arr.length; i++) {
	if (arr[i] == val) {
	  nAdd = false;
	  break;
	}
      }
      if (nAdd) {
	arr.push(val);
      }
    };

    /**
     * Calculate the average value of an array.
     */
    that.average = function(arr) {
      try {
	if (!lang.isArrayLike(arr)) {
	  throw(new TypeError('Argument must be array-like'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['average', x]);
      }
      var n = 0;
      var s = 0;
      for (var i = 0; i < arr.length; i++) {
	s += arr[i];
	n++;
      }

      return (n > 0) ? that.checkNumber(s/n) : 0;
    };

    /**
     * Check a number for a small decimal portion.
     * @param {Number} n The number to check.
     */
    that.checkNumber = function(n) {
      try {
	if (!that.isNumeric(n)) {
	  throw(new TypeError('Argument must be a Number'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['checkNumber', x]);
      }

      var m = n % 1;
      if (Math.abs(m) < that.options.minRemainder ||
	  (1 - Math.abs(m)) < that.options.minRemainder) {
	return Math.round(n);
      }

      return n;
    };

    /**
     * Find a location that we know about from the site name.
     * @param {String} name The name of the location to return.
     *                      If this is omitted, the default location
     *                      is returned.
     */
    that.getLocation = function(name) {
      if (typeof name === 'undefined') {
	// Return the default location.
	if (typeof that.locations.default !== 'undefined') {
	  return that.locations.default;
	} else {
	  return that.locations.all[0];
	}
      }
      if (lang.isString(name)) {
	for (var i = 0; i < that.locations.all.length; i++) {
	  if (that.locations.all[i].telescope === name) {
	    // This is the location we have been asked for.
	    return that.locations.all[i];
	  }
	}
      }
      // We have not found the site, so we report an error but
      // return the default site.
      try {
	throw(new Error('Site not found.'));
      } catch (x) {
	that.catchError.apply(ERR, ['getLocation', x]);
	return that.locations.default;
      }
    };

    /**
     * Set a location to be the default for all routines that need
     * a location.
     * @param {String} locName The name of the location to set as default.
     */
    that.setDefaultLocation = function(locName) {
      try {
	if (typeof locName == 'undefined' ||
	    !lang.isString(locName)) {
	  throw(new TypeError('Location name must be a string.'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['setDefaultLocation', x]);
	return;
      }

      // Search for this location name.
      var nd = that.getLocation(locName);
      try {
	if (nd === null) {
	  throw(new Error('Unable to find named location.'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['setDefaultLocation', x]);
	return;
      }

      // Set it as default now.
      that.locations.default = nd;
    };

    /**
     * Add a location to the list.
     * @param {object} nLoc The new location to add.
     */
    that.addLocation = function(nLoc) {
      try {
	if (typeof nLoc === 'undefined' ||
	    (typeof nLoc.telescope === 'undefined' ||
	     !lang.isString(nLoc.telescope)) ||
	    (typeof nLoc.latitude === 'undefined' ||
	     !that.isAngle(nLoc.latitude)) ||
	    (typeof nLoc.longitude === 'undefined' ||
	     !that.isAngle(nLoc.longitude)) ||
	    (typeof nLoc.timezoneOffset === 'undefined' ||
	     !that.isNumeric(nLoc.timezoneOffset))) {
	  // We don't have enough information.
	  throw(new TypeError('Insufficient information supplied.'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['addLocation', x]);
	return;
      }

      // Check for a duplicate.
      var canAdd = true;
      try {
	for (var i = 0; i < that.locations.all.length; i++) {
	  if (that.locations.all[i].telescope === nLoc.telescope) {
	    throw(new Error('Location with same name already exists.'));
	    canAdd = false;
	  }
	}
      } catch (x) {
	that.catchError.apply(ERR, ['addLocation', x]);
	return;
      }

      // Add the new location if possible.
      if (canAdd) {
	// Add some default information if required.
	if (typeof nLoc.mount === 'undefined' ||
	    !lang.isString(nLoc.mount)) {
	  nLoc.mount = 'AzEl';
	}
	if (typeof nLoc.limits === 'undefined') {
	  nLoc.limits = {
	    'ElevationLow': 12
	  };
	}
	that.locations.all.push(nLoc);
      }
    };

    // Set the default location to the ATCA.
    that.setDefaultLocation('ATCA');

    /**
     * Put a number between two bounds.
     * @param {number} a The number to alter.
     * @param {number} l The lower bound.
     * @param {number} u The upper bound.
     */
    that.boundNumber = function(a, l, u) {
      // Check for numbers.
      try {
	if (typeof a === 'undefined' ||
	    !that.isNumeric(a) ||
	    typeof l === 'undefined' ||
	    !that.isNumeric(l) ||
	    typeof u === 'undefined' ||
	    !that.isNumeric(u)) {
	  throw(new TypeError('Must supply three numeric arguments.'));
	}
      } catch (x) {
	that.catchError.apply(ERR, ['boundNumber', x]);
	return undefined;
      }

      var d = u - l;
      while (a < l) {
	a += d;
      }
      while (a >= u) {
	a -= d;
      }

      return that.checkNumber(a);
    };

    return that;

  });
