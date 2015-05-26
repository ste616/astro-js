// this is "/astrojs/time"
define([ "./base", "./angle", "dojo/_base/lang", "dojo/date" ],
  function(astrojs, astroAngle, lang, date) {

    /**
     * This routine enables the user to make a new time object.
     */
    var rObj = {};

    // This file's error parameters.
    var ERR = {
      file: 'time'
    };

    /**
     * Conversion factor between solar and sidereal time.
     */
    var solar2sidereal = 1.002737909350795;

    rObj.new = function(constructor) {
      /**
       * The object we return to our caller.
       * @type {object}
       */
      var that = {};

      /**
       * Defaults for the constructor.
       */
      constructor = constructor || {};

      /**
       * Our time, which by default is set now.
       * @type {Date}
       */
      var time = new Date();

      /**
       * The name of our location.
       * @type {String}
       */
      var location;

      // Our methods follow.

      // Our private methods.
      /**
       * Initialise our instance.
       */
      var initialise = function(spec) {
	// Check for our constructor options.
	if (spec.utcString) {
	  // The user has supplied us with a string representation of
	  // the time we should be set to.
	  var calTime = string2cal(spec.utcString);
	  cal2time(calTime);
	} else if (spec.date) {
	  // The user has supplied a Date object to match.
	  time.setTime(spec.date.getTime());
	} else if (spec.mjd) {
	  // The user has supplied an MJD.
	  cal2time(mjd2cal(spec.mjd));
	}

	// Do we have a specified location?
	try {
	  if (typeof spec.location !== 'undefined' &&
	      astrojs.isLocation(spec.location)) {
	    // The user has tried to supply us with a location object, which
	    // is no longer a supported method. They should use
	    // astrojs.addLocation to add this location first, then give
	    // us the location's name.
	    throw(new TypeError('Please add custom location to universal ' +
				'location list and supply time object with ' +
				'the location name only.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['initialise', x]);
	}

	if (typeof spec.location !== 'undefined' &&
	    lang.isString(spec.location)) {
	  // We simply copy the location name.
	  location = spec.location;
	}

      };

      /**
       * Turn a string representation of the time into a calendar object.
       * @param {string} stringTime The string representation of the time.
       */
      var string2cal = function(stringTime) {
	if (!lang.isString(stringTime)) {
	  return null;
	}

	var calendarObj = {};

	var tElements = stringTime.split(/[\s\-\:T]/g);
	if (tElements[0]) {
	  calendarObj.year = tElements[0];
	} else {
	  return null;
	}
	if (tElements[1]) {
	  calendarObj.month = tElements[1];
	} else {
	  return null;
	}
	if (tElements[2]) {
	  calendarObj.day = tElements[2];
	} else {
	  return null;
	}
	if (tElements[3]) {
	  calendarObj.hour = tElements[3];
	} else {
	  return null;
	}
	if (tElements[4]) {
	  calendarObj.minute = tElements[4];
	} else {
	  return null;
	}
	if (tElements[5]) {
	  calendarObj.second = tElements[5];
	} else {
	  return null;
	}

	return calendarObj;
      };

      /**
       * Set our object time by a UTC calendar object.
       * @param {object} calendarObj The calendar object specifying the time.
       */
      var cal2time = function(calendarObj) {
	if (!calendarObj) {
	  return;
	}
	if (typeof calendarObj.year !== 'undefined' &&
	    typeof calendarObj.month !== 'undefined' &&
	    typeof calendarObj.day !== 'undefined' &&
	    typeof calendarObj.hour !== 'undefined' &&
	    typeof calendarObj.minute !== 'undefined' &&
	    typeof calendarObj.second !== 'undefined') {
	    time.setUTCFullYear(calendarObj.year, calendarObj.month - 1,
				calendarObj.day);
	  // time.setUTCDate(calendarObj.day);
	  // time.setUTCMonth(calendarObj.month - 1);
	  time.setUTCHours(calendarObj.hour);
	  time.setUTCMinutes(calendarObj.minute);
	  time.setUTCSeconds(calendarObj.second);
	  time.setUTCMilliseconds(0);
	}
      };

      /**
       * Turn a calendar object into an MJD.
       * @param {object} calendarObj The calendar object.
       */
      var cal2mjd = function(calendarObj) {
	var dayFraction = getDayFraction(calendarObj);
	var m, y;
	if (calendarObj.month <= 2) {
	  m = calendarObj.month + 9;
	  y = calendarObj.year - 1;
	} else {
	  m = calendarObj.month - 3;
	  y = calendarObj.year;
	}

	var c = parseInt(y / 100);
	y -= c * 100;
	var x1 = parseInt(146097.0 * c / 4.0);
	var x2 = parseInt(1461.0 * y / 4.0);
	var x3 = parseInt((153.0 * m + 2.0) / 5.0);

	var mjd = x1 + x2 + x3 + calendarObj.day - 678882 + dayFraction;

	return mjd;
      };

      /**
       * Turn an MJD into a calendar object.
       * @param {number} mjd The MJD.
       */
      var mjd2cal = function(mjd) {
	try {
	  if (typeof mjd === 'undefined' ||
	      !astrojs.isNumeric(mjd)) {
	    throw(new TypeError('Requires a numeric argument.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['mjd2cal', x]);
	  return undefined;
	}

	// Start with JD.
	var jd = mjd + 2400000.5;
	jd += 0.5;

	var ut = jd % 1.0;
	if (ut < 0) {
	  ut += 1;
	  jd -= 1;
	}
	var F = ut;

	var I = Math.floor(jd);
	var A = Math.floor((I - 1867216.25)/36524.25);
    
	var B;
	if (I > 2299160) {
            B = I + 1 + A - Math.floor(A / 4);
	} else {
            B = I;
	}
        
	var C = B + 1524;
    
	var D = Math.floor((C - 122.1) / 365.25);
    
	var E = Math.floor(365.25 * D);
    
	var G = Math.floor((C - E) / 30.6001);
    
	var day = C - E + F - Math.floor(30.6001 * G);
    
	var month;
	if (G < 13.5) {
            month = G - 1;
	} else {
            month = G - 13;
	}
        
	var year;
	if (month > 2.5) {
            year = D - 4716;
	} else {
            year = D - 4715;
	}

	var calendarObj = {
	    'year': year,
	    'month': month,
	    'day': day
	};
	var tcal = dayFraction2cal(ut);
	calendarObj.hour = tcal.hour;
	calendarObj.minute = tcal.minute;
	calendarObj.second = tcal.second;

	return calendarObj;
      };

      /**
       * Calculate the fraction of the day from a calendar object.
       * @param {object} calendarObj The calendar object.
       */
      var getDayFraction = function(calendarObj) {
	var dayFrac = (calendarObj.hour + calendarObj.minute / 60 +
	  calendarObj.second / 3600) / 24;

	return dayFrac;
      };

      /**
       * Turn a day fraction into a partial calendar object.
       * @param {Number} dayFrac The day fraction.
       */
      var dayFraction2cal = function(dayFrac) {
	var calendarObj = {};
	var tmp = dayFrac * 24.0;
	calendarObj.hour = Math.floor(tmp);
	tmp -= calendarObj.hour;
	tmp *= 60.0;
	calendarObj.minute = Math.floor(tmp);
	tmp -= calendarObj.minute;
	tmp *= 60.0;
	calendarObj.second = Math.floor(tmp);

	return calendarObj;
      };

      /**
       * Turn any time into a localtime calendar object.
       * @param {Date} lTime The time to convert.
       */
      var anytime2localCal = function(lTime) {
	var calendarObj = {};

	calendarObj.year = lTime.getFullYear();
	calendarObj.month = lTime.getMonth() + 1;
	calendarObj.day = lTime.getDate();
	calendarObj.hour = lTime.getHours();
	calendarObj.minute = lTime.getMinutes();
	calendarObj.second = lTime.getSeconds();

	return calendarObj;
      };

      /**
       * Turn any time into a UTC calendar object.
       * @param {Date} uTime The time to convert.
       */
      var anytime2utcCal = function(uTime) {
	var calendarObj = {};

	calendarObj.year = uTime.getUTCFullYear();
	calendarObj.month = uTime.getUTCMonth() + 1;
	calendarObj.day = uTime.getUTCDate();
	calendarObj.hour = uTime.getUTCHours();
	calendarObj.minute = uTime.getUTCMinutes();
	calendarObj.second = uTime.getUTCSeconds();

	return calendarObj;
      };

      /**
       * Turn our time into a calendar object.
       */
      var time2cal = function() {
	return anytime2utcCal(time);
      };

      /**
       * Turn an MJD into the GMST.
       * @param {Number} mjd The MJD.
       */
      var mjd2gmst = function(mjd) {
	/**
	 * The Julian date at the start of the epoch.
	 */
	var jdJ2000 = 2451545.0;
	/**
	 * The number of days in a century.
	 */
	var jdCentury = 36525.0;

	var dUT1 = 0.0;
	var lLocation = astrojs.getLocation(location);
	if (typeof lLocation.dUT1 !== 'undefined') {
	  dUT1 = lLocation.dUT1;
	}

	var a = 101.0 + 24110.54841 / 86400.0;
	var b = 8640184.812866 / 86400.0;
	var e = 0.093104 / 86400.0;
	var d = 0.0000062 / 86400.0;

	var tu = (Math.floor(mjd) - (jdJ2000 - 2400000.5)) / jdCentury;
	var sidTim = a + tu * (b + tu * (e - tu * d));
	sidTim -= Math.floor(sidTim);
	if (sidTim < 0.0) {
	  sidTim += 1.0;
	}

	var gmst = sidTim + (mjd - Math.floor(mjd) + dUT1 / 86400.0) *
	  solar2sidereal;
	while(gmst < 0.0) {
	  gmst += 1.0;
	}
	while (gmst > 1.0) {
	  gmst -= 1.0;
	}

	return gmst;
      };

      /**
       * Turn a GMST into the LMST, according to our location.
       * @param {Number} gmst The GMST.
       */
      var gmst2lmst = function(gmst) {
	var lLocation = astrojs.getLocation(location);
	var lst = gmst + lLocation.longitude.toTurns();
	while (lst > 1.0) {
	  lst -= 1.0;
	}
	while (lst < 0.0) {
	  lst += 1.0;
	}
	var lmst = astroAngle.new({
	  'value': lst,
	  'units': 'turns'
	});

	return lmst;
      };

      /**
       * Convert an LMST to MJD, on the current day.
       * @param {number} lmst The local sidereal time.
       */
      var lmst2mjd = function(lmst) {
	var calObj = time2cal();
	calObj.hour = 0;
	calObj.minute = 0;
	calObj.second = 0;
	var mjd = cal2mjd(calObj);
	var gmst = mjd2gmst(mjd);
	var dlst = gmst2lmst(gmst);
	var delay = lmst - dlst;

	if (delay < 0) {
	  delay += 1;
	}

	return (mjd + delay / solar2sidereal);
      };

      /**
       * Turn a calendar object into a string.
       * @param {object} calendarObj The calendar object.
       * @param {string} timeFormat An optional format specification.
       */
      var cal2string = function(calendarObj, timeFormat) {
	timeFormat = timeFormat || '%y-%m-%d %H:%M:%S';

	// Some days.
	var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
			  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	var timeString = timeFormat;
	var r;
	// Go through our supported specifiers and replace them with the
	// proper quantities.
	if (/\%y/.test(timeString) === true) {
	  // The year.
	  r = calendarObj.year;
	  timeString = timeString.replace(/\%y/, '' + r);
	}
	if (/\%m/.test(timeString) === true) {
	  // The month.
	  r = astrojs.zeroPad(calendarObj.month, 10);
	  timeString = timeString.replace(/\%m/, r);
	}
	if (/\%d/.test(timeString) === true) {
	  // The date.
	  r = astrojs.zeroPad(calendarObj.day, 10);
	  timeString = timeString.replace(/\%d/, r);
	}
	if (/\%H/.test(timeString) === true) {
	  // The hour.
	  r = astrojs.zeroPad(calendarObj.hour, 10);
	  timeString = timeString.replace(/\%H/, r);
	}
	if (/\%M/.test(timeString) === true) {
	  // The minute.
	  r = astrojs.zeroPad(calendarObj.minute, 10);
	  timeString = timeString.replace(/\%M/, r);
	}
	if (/\%S/.test(timeString) === true) {
	  // The second.
	  r = astrojs.zeroPad(calendarObj.second, 10);
	  timeString = timeString.replace(/\%S/, r);
	}
	if (/\%O/.test(timeString) === true) {
	  // The month name.
	  r = monthNames[calendarObj.month - 1];
	  timeString = timeString.replace(/\%O/, r);
	}

	return timeString;
      };

      /**
       * Return the difference between a specified offset and the
       * timezone on this computer.
       * @param {number} offsetMinutes An offset in minutes.
       */
      var tzDifference = function(offsetMinutes) {
	// Get the current timezone offset for our dates.
	var cOffset = -1 * time.getTimezoneOffset();
	// Now subtract this from the requested offset.
	var rOffset = offsetMinutes - cOffset;

	return rOffset;
      };

      /**
       * Move our time to find the prior or next occurrence
       * of a specified sidereal time.
       * @param {astroAngle} lmst The LMST to set to.
       * @param {number} dir Direction to move (positive forward,
       *                     negative back).
       */
      var findLmst = function(lmst, dir) {
	try {
	  if (typeof lmst === 'undefined' ||
	      !astrojs.isAngle(lmst)) {
	    throw(new TypeError('First argument must be an astroAngle.'));
	  }
	  if (typeof dir === 'undefined' ||
	      !astrojs.isNumeric(dir)) {
	    throw(new TypeError('Second argument must be a number.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['findLmst', x]);
	}

	// Get our current LMST.
	var olmst = that.lmst().toTurns();
	// Find the target LMST as turns.
	var tlmst = lmst.toTurns();

	// Adjust the target as required.
	var dlmst = tlmst - olmst;
	if (dlmst <= 1e-4 &&
	    dir > 0) {
	  // We have to cross a day boundary.
	  tlmst += 1;
	} else if (dlmst >= -1e-4 &&
		   dir < 0) {
	  // We have to cross a day boundary.
	  tlmst -= 1;
	}

	// Move the time now.
	dlmst = tlmst - olmst;
	var mtime = dlmst * (86400 / solar2sidereal); // In seconds.
	time.setTime(time.getTime() + mtime * 1000);

	// And now move the time by small amounts until we
	// get the right result.
	tlmst = lmst.toTurns();
	olmst = that.lmst().toTurns();
	var it = 0;
	while (olmst !== tlmst &&
	       it < 3) {
	  var d = tlmst - olmst;
	  if (it === 2) {
	    // Start getting drastic.
	    var s = (d > 0) ? 1 : -1;
	    time.setTime(time.getTime() + s * 1000);
	  } else {
	    var m = d * 86400;
	    time.setTime(time.getTime() + m * 1000);
	  }
	  olmst = that.lmst().toTurns();
	  it++;
	}
      };

      // Our public methods.
      /**
       * Return a primitive value for comparisons etc.
       */
      that.valueOf = function() {
	return time.getTime();
      };

      /**
       * Return our MJD.
       */
      that.mjd = function() {
	var calObj = time2cal();
	var mjd = cal2mjd(calObj);

	return mjd;
      };

      /**
       * Return our time in string form.
       * @param {string} timeFormat An optional time format specification.
       */
      that.timeString = function(timeFormat) {
	var calObj = time2cal();
	var ts = cal2string(calObj, timeFormat);

	return ts;
      };

      /**
       * Return our time in Date object form.
       */
      that.time = function() {
	return time;
      };

      /**
       * Return the local time at the telescope in string form.
       * @param {string} timeFormat An optional time format specification.
       */
      that.localtimeString = function(timeFormat) {
	var lLocation = astrojs.getLocation(location);
	var rDate = date.add(time, 'minute',
	  tzDifference(lLocation.timezoneOffset));
	var calObj = anytime2localCal(rDate);
	var ts = cal2string(calObj, timeFormat);

	return ts;
      };

      /**
       * Return our LMST as a fraction of a day.
       */
      that.lmst = function() {
	var calObj = time2cal();
	var mjd = cal2mjd(calObj);
	var gmst = mjd2gmst(mjd);
	var lmst = gmst2lmst(gmst);

	return lmst;
      };

      /**
       * Return our LMST as a string.
       * @param {string} timeFormat An optional time format specification.
       */
      that.lmstString = function(timeFormat) {
	timeFormat = timeFormat || '%H:%M:%S';
	var lmst = that.lmst().toTurns();
	var lmstCal = dayFraction2cal(lmst);
	var ts = cal2string(lmstCal, timeFormat);

	return ts;
      };

      /**
       * Update our time to right now.
       */
      that.now = function() {
	time = new Date();
	return that;
      };

      /**
       * Change our time by the specified number of seconds.
       * @param {number} s The number of seconds to add to our current
       *                   time (negative numbers will give an earlier time).
       */
      that.addSeconds = function(s) {
	try {
	  if (typeof s === 'undefined' ||
	      !astrojs.isNumeric(s)) {
	    throw(new TypeError('Argument must be a number.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['addSeconds', x]);
	}
	time.setTime(time.getTime() + s * 1000);

	return that;
      };

      /**
       * Update our time to the next occurrence of the specified
       * sidereal time.
       * @param {astroAngle} lmst The LMST to set to.
       */
      that.nextLmst = function(lmst) {
	findLmst(lmst, 1);
	return that;
      };

      /**
       * Update our time to the last occurrence of the specified
       * sidereal time.
       * @param {astroAngle} lmst The LMST to set to.
       */
      that.previousLmst = function(lmst) {
	findLmst(lmst, -1);
	return that;
      };

      /**
       * Return the location we're using.
       */
      that.getLocation = function() {
	return location;
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

	// Return ourselves for method chaining.
	return that;
      };

      // Perform the initialisation.
      initialise(constructor);

      return that;
    };

    return rObj;

  });
