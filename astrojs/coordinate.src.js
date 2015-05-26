// this is "/astrojs/coordinate"
define([ "./base", "./time", "./angle" ],
  function(astrojs, astroTime, astroAngle) {

    /**
     * This is a set of coordinate manipulation functions.
     */

    // This file's error parameters.
    var ERR = {
      file: 'coordinate'
    };

    var that = {
      /**
       * Some constants that we require for coordinate conversions.
       */
      BEPOCH: 1950.0,
      JULIAN_DAY_REFERENCE: 2400000.5,
      JULIAN_DAY_J2000: 2451545.0,
      JULIAN_DAY_J2000_astroTime: astroTime.new({
	'utcString': '2000-01-01T00:00:00'
      }),
      JULIAN_DAYS_IN_CENTURY: 36525.0,
      D2PI: 6.283185307179586476925287,
      SOLAR2SIDEREAL: 1.002737909350795,
      // A small number to avoid arithmetic problems.
      TINY: 1e-30,
      // The conversion ratio km/sec to AU/tropical century.
      VF: 21.094502,
      // The E-terms vector for FK4 <--> other coordinate system
      // transforms.
      ETERM: [ -1.62557E-06, -0.31919E-06, -0.13843E-06 ],
      // The precession matrix for FK4 <--> Galactic conversions.
      ETOG: [ [-0.066988739415, -0.872755765852, -0.483538914632],
	      [+0.492728466075, -0.450346958020, +0.744584633283],
	      [-0.867600811151, -0.188374601723, +0.460199784784] ],
      A: [ -1.62557e-6, -0.31919e-6, -0.13843e-6,
	  +1.245e-3,   -1.580e-3,   -0.659e-3 ],
      AD: [ +1.245e-3, -1.580e-3, -0.659e-3 ],
      EM: [ [+0.9999256782, -0.0111820611, -0.0048579477],
	    [+0.0111820610, +0.9999374784, -0.0000271765],
	    [+0.0048579479, -0.0000271474, +0.9999881997],
	    [-0.000551,	    -0.238565,     +0.435739],
	    [+0.238514,     -0.002667,     -0.008541],
	    [-0.435623,     +0.012254,     +0.002117]	],
      EMI: [ [+0.9999256795,     +0.0111814828,     +0.0048590039,
	      -0.00000242389840, -0.00000002710544, -0.00000001177742],
	     [-0.0111814828,     +0.9999374849,     -0.0000271771,
	      +0.00000002710544, -0.00000242392702, +0.00000000006585],
	     [-0.0048590040,     -0.0000271557,     +0.9999881946,
	      +0.00000001177742, +0.00000000006585, -0.00000242404995],
	     [-0.000551,         +0.238509,         -0.435614,
	      +0.99990432,       +0.01118145,       +0.00485852],
	     [-0.238560,         -0.002667,         +0.012254,
	      -0.01118145,       +0.99991613,       -0.00002717],
	     [+0.435730,         -0.008541,         +0.002117,
	      -0.00485852,       -0.00002716,       +0.99996684] ],
      COORDMODE_EWXY: 0,
      COORDMODE_AZEL: 1,
      COORDMODE_HADEC: 2,
      COORDMODE_DATE: 3,
      COORDMODE_J2000: 4,
      COORDMODE_B1950: 5,
      COORDMODE_GALACTIC: 6
    };

    var xyz = ['x', 'y', 'z'];

    // We need to extend the object now with some co-dependent constants
    // and functions.

    // The conversion ratio radians/year to arcseconds/century.
    that.PMF = 100 * 60 * 60 * 360 / that.D2PI;
    // The conversion ratio km/sec to AU/year multiplied by 1 arcsecond in
    // radians.
    that.VFR = (that.VF / 100) * 0.484813681109535994e-5;

    /**
     * Convert a position in polar coordinates into rectangular coordinates.
     * @param {astroAngle} polar1 A polar angle to convert, part 1.
     * @param {astroAngle} polar2 A polar angle to convert, part 2.
     */
    that.pol2r = function(polar1, polar2) {
      // Check for angles.
      try {
	if (!astrojs.isAngle(polar1) ||
	    !astrojs.isAngle(polar2)) {
	  throw(new TypeError('Arguments must be astroAngle objects.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['pol2r', x]);
      }

      var rect = {};
      rect.x = astrojs.checkNumber(Math.cos(polar1.toRadians()) *
	Math.cos(polar2.toRadians()));
      rect.y = astrojs.checkNumber(Math.sin(polar1.toRadians()) *
	Math.cos(polar2.toRadians()));
      rect.z = astrojs.checkNumber(Math.sin(polar2.toRadians()));

      return rect;
    };

    /**
     * Convert a position in rectangular coordinates into polar coordinates.
     * @param {number} x The x-component of the rectangular coordinates.
     * @param {number} y The y-component of the rectangular coordinates.
     * @param {number} z The z-component of the rectangular coordinates.
     */
    that.r2pol = function(x, y, z) {
      // Check for numeric arguments.
      try {
	if (!astrojs.isNumeric(x) ||
	    !astrojs.isNumeric(y) ||
	    !astrojs.isNumeric(z)) {
	  throw(new TypeError('Arguments must be Numbers.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['r2pol', x]);
      }

      var tmp = Math.atan2(y, x) / that.D2PI;

      var polar = {};

      if (tmp < 0) {
	tmp += 1;
      }

      polar.left = astroAngle.new({
	value: astrojs.checkNumber(tmp),
	units: 'turns'
      });
      tmp = Math.sqrt(x * x + y * y + z * z);

      polar.right = astroAngle.new({
	value: Math.asin(z / tmp) / that.D2PI,
	units: 'turns'
      });

      return polar;
    };

    /**
     * Convert a telescope position in X,Y coordinates into Az,El
     * coordinates.
     * @param {astroAngle} x The x coordinate.
     * @param {astroAngle} y The y coordinate.
     */
    that.xy2azel = function(x, y) {
      // Check for angles.
      try {
	if (!astrojs.isAngle(x) ||
	    !astrojs.isAngle(y)) {
	  throw(new TypeError('Arguments must be astroAngle objects.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['xy2azel', x]);
      }

      var polar = that.pol2r(x, y);

      // Move the coordinates around.
      var r = that.r2pol(polar.y, polar.z, polar.x);
      return {
	'azimuth': r.left,
	'elevation': r.right
      };
    };

    /**
     * Converts a position in Az,El coordinates into an X,Y position.
     * @param {astroAngle} az The azimuth coordinate.
     * @param {astroAngle} el The elevation coordinate.
     */
    that.azel2xy = function(az, el) {
      // Check for angles.
      try {
	if (!astrojs.isAngle(az) ||
	    !astrojs.isAngle(el)) {
	  throw(new TypeError('Arguments must be astroAngle objects.'));
	}
      } catch (x) {
	astrojs.catchError(ERR, ['azel2xy', x]);
      }

      var polar = that.pol2r(az, el);
      var r = that.r2pol(polar.z, polar.x, polar.y);
      if (r.left > 0.5) {
	r.left = r.left.subtract(astroAngle.new({
	  'value': 1.0,
	  'units': 'turns'
	}));
      }
      if (r.right > 0.5) {
	r.right = r.right.subtract(astroAngle.new({
	  'value': 1.0,
	  'units': 'turns'
	}));
      }

      return {
	'x': r.left,
	'y': r.right
      };
    };

    /**
     * Converts HA,Dec coordinates to Az,El and vice versa.
     * @param {astroAngle} left The left coordinate.
     * @param {astroAngle} right The right coordinate.
     * @param {astroAngle} latitude The latitude.
     * @param {boolean} allowNegative If true, allow negative hour-angle
     *                                or azimuth on return (optional).
     */
    that.eqazel = function(left, right, latitude, allowNegative) {
      if (typeof allowNegative === 'undefined') {
	allowNegative = false;
      }

      // Check for appropriate argument types.
      try {
	if (!astrojs.isAngle(left) ||
	    !astrojs.isAngle(right) ||
	    !astrojs.isAngle(latitude) ||
	    !astrojs.isBoolean(allowNegative)) {
	  throw(new TypeError('Arguments must be (astroAngle, astroAngle,' +
			      ' astroAngle[, Boolean])'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['eqazel', x]);
      }

      var sphi = Math.sin(latitude.toRadians());
      var cphi = Math.cos(latitude.toRadians());
      var sleft = Math.sin(left.toRadians());
      var cleft = Math.cos(left.toRadians());
      var sright = Math.sin(right.toRadians());
      var cright = Math.cos(right.toRadians());

      var leftOut = Math.atan2(-1 * sleft,
	-1 * cleft * sphi + sright * cphi / cright) / (2 * Math.PI);
      if (!allowNegative && leftOut < 0) {
	leftOut += 1.0;
      }
      var rightOut = Math.asin(cleft * cright * cphi + sright * sphi) /
	(2 * Math.PI);

      return {
	'azimuth': astroAngle.new({
	  'value': leftOut,
	  'units': 'turns'
	}),
	'elevation': astroAngle.new({
	  'value': rightOut,
	  'units': 'turns'
	})
      };
    };

    /**
     * Convert B1950.0 FK4 coordinates to J2000.0 FK5 assuming zero proper
     * motion in the FK5 frame.
     * @param {astroAngle} bRa  The FK4/B1950.0 right ascension.
     * @param {astroAngle} bDec The FK4/B1950.0 declination.
     */
    that.fk4fk5 = function(bRa, bDec) {
      // Check for angles.
      try {
	if (!astrojs.isAngle(bRa) ||
	    !astrojs.isAngle(bDec)) {
	  throw(new TypeError('Arguments must be astroAngle objects.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['fk4fk5', x]);
      }

      // First convert our coordinates into the rectangular frame.
      var r0 = that.pol2r(bRa, bDec);

      // Adjust vector A to give zero proper motion in FK5.
      var w = (that.BEPOCH - 1950) / that.PMF;
      var a1 = [];
      for (var i = 0; i < 3; i++) {
	a1[i] = that.A[i] + w * that.AD[i];
      }
      // Remove e-terms.
      w = r0.x * a1[0] + r0.y * a1[1] + r0.z + a1[2];
      var v1 = [];
      v1[0] = r0.x - a1[0] + w * r0.x;
      v1[1] = r0.y - a1[1] + w * r0.y;
      v1[2] = r0.z - a1[2] + w * r0.z;

      // Convert the position vector to the Fricke system.
      var v2 = [];
      for (i = 0; i < 6; i++) {
	w = 0;
	for (var j = 0; j < 3; j++) {
	  w += that.EM[i][j] * v1[j];
	}
	v2[i] = w;
      }

      // Allow for fictitious proper motion in FK4.
      w = (that.epj(that.epb2d(that.BEPOCH)) - 2000) /
	that.PMF;
      for (i = 0; i < 3; i++) {
	v2[i] += w * v2[i + 3];
      }

      // Go back to polar coordinates.
      var pr = that.r2pol(v2[0], v2[1], v2[2]);
      var jAngles = {
	'rightAscension': pr.left,
	'declination': pr.right
      };

      return jAngles;
    };

    /**
     * Convert J2000.0 FK5 coordinates to B1950.0 FK4.
     * @param {astroAngle} jRa  The FK5/J2000.0 right ascension.
     * @param {astroAngle} jDec The FK5/J2000.0 declination.
     */
    that.fk5fk4 = function(jRa, jDec) {
      // Check for angles.
      try {
	if (!astrojs.isAngle(jRa) ||
	    !astrojs.isAngle(jDec)) {
	  throw(new TypeError('Arguments must be astroAngle objects.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['fk5fk4', x]);
      }

      // First convert our coordinates into the rectangular frame.
      var v1 = that.pol2r(jRa, jDec);

      // Convert position + velocity vector to the BN system.
      var w;
      var v2 = [];
      for (var i = 0; i < 6; i++) {
	v2[i] = that.EMI[i][0] * v1.x +
	  that.EMI[i][1] * v1.y +
	  that.EMI[i][2] * v1.z;
      }

      // Position vector components and magnitude.
      var x = v2[0];
      var y = v2[1];
      var z = v2[2];
      var rxyz = Math.sqrt(x * x + y * y + z * z);

      // Apply E-terms to the position.
      w = x * that.A[0] + y * that.A[1] + z * that.A[2];
      x += that.A[0] * rxyz - w * x;
      y += that.A[1] * rxyz - w * y;
      z += that.A[2] * rxyz - w * z;

      // Recompute the magnitude.
      rxyz = Math.sqrt(x * x + y * y + z * z);

      // Apply E-terms to both the position and velocity.
      x = v2[0];
      y = v2[1];
      z = v2[2];
      w = x * that.A[0] + y * that.A[1] + z * that.A[2];
      var wd = x * that.A[3] + y * that.A[4] + z * that.A[5];
      x += that.A[0] * rxyz - w * x;
      y += that.A[1] * rxyz - w * y;
      z += that.A[2] * rxyz - w * z;

      // Go back to polar coordinates.
      var pr = that.r2pol(x, y, z);
      var bAngles = {
	'rightAscension': pr.left,
	'declination': pr.right
      };

      return bAngles;
    };

    /**
     * Conversion of Modified Julian Date to Julian epoch.
     * @param {number} julDate The Modified Julian Date.
     */
    that.epj = function(julDate) {
      // Check for numeric.
      try {
	if (!astrojs.isNumeric(julDate)) {
	  throw(new TypeError('Argument must be a Number.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['epj', x]);
      }

      return (2000 + (julDate - 51544.5) / 365.25);
    };

    /**
     * Conversion of Besselian Epoch to Modified Julian Date.
     * @param {number} besEpoch The Besselian Epoch.
     */
    that.epb2d = function(besEpoch) {
      // Check for numeric.
      try {
	if (!astrojs.isNumeric(besEpoch)) {
	  throw(new TypeError('Argument must be a Number.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['epb2d', x]);
      }

      return (15019.81352 + (besEpoch - 1900) * 365.242198781);
    };

    /**
     * Convert an FK4 position (B1950.0) to the IAU 1958 Galactic coordinate
     * system.
     * @param {astroAngle} bRa  The right ascension.
     * @param {astroAngle} bDec The declination.
     */
    that.fk4gal = function(bRa, bDec) {
      // Check for angles.
      try {
	if (!astrojs.isAngle(bRa) ||
	    !astrojs.isAngle(bDec)) {
	  throw(new TypeError('Arguments must be astroAngle objects.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['fk4gal', x]);
      }

      // First convert our coordinates into the rectangular frame.
      var rc = that.pol2r(bRa, bDec);

      // Allow for e-terms.
      var w = rc.x * that.ETERM[0] +
	rc.y * that.ETERM[1] +
	rc.z * that.ETERM[2];
      var temp = [];
      temp[0] = rc.x - that.ETERM[0] + w * rc.x;
      temp[1] = rc.y - that.ETERM[1] + w * rc.y;
      temp[2] = rc.z - that.ETERM[2] + w * rc.z;

      // Precess.
      var gal = [];
      for (var i = 0; i < 3; i++) {
	gal[i] = 0;
	for (var j = 0; j < 3; j++) {
	  gal[i] += that.ETOG[i][j] * temp[j];
	}
      }

      // Return the Galactic coordinates as astroAngles.
      var pg = that.r2pol(gal[0], gal[1], gal[2]);
      var galAngles = {
	'latitude': pg.left,
	'longitude': pg.right
      };

      return galAngles;
    };

    /**
     * Convert an IAU 1958 Galactic position to the FK4 (B1950.0) system.
     * @param {astroAngle} lat The Galactic latitude.
     * @param {astroAngle} longi The Galactic longitude.
     */
    that.galfk4 = function(lat, longi) {
      // Check for angles.
      try {
	if (!astrojs.isAngle(lat) ||
	    !astrojs.isAngle(longi)) {
	  throw(new TypeError('Arguments must be astroAngle objects.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['galfk4', x]);
      }

      // First convert our coordinates into the rectangular frame.
      var r = that.pol2r(lat, longi);

      // Precess. Note that the same matrix is used as for the FK4 -> Galactic
      // transformation, but we have transposed it here.
      var fk4 = [];
      fk4[0] = that.ETOG[0][0] * r.x +
	that.ETOG[1][0] * r.y +
	that.ETOG[2][0] * r.z;
      fk4[1] = that.ETOG[0][1] * r.x +
	that.ETOG[1][1] * r.y +
	that.ETOG[2][1] * r.z;
      fk4[2] = that.ETOG[0][2] * r.x +
	that.ETOG[1][2] * r.y +
	that.ETOG[2][2] * r.z;

      // Allow for e-terms.
      var w = r.x * that.ETERM[0] +
	r.y * that.ETERM[1] +
	r.z * that.ETERM[2] + 1;
      for (var i = 0; i < 3; i++) {
	fk4[i] = (fk4[i] + that.ETERM[i])/w;
      }

      // Return the coordinates as astroAngles.
      var pr = that.r2pol(fk4[0], fk4[1], fk4[2]);
      var bAngles = {
	'rightAscension': pr.left,
	'declination': pr.right
      };

      return bAngles;
    };

    /**
     * Converts a J2000 position into a date coordinate.
     * @param {astroAngle} ra J2000 right ascension.
     * @param {astroAngle} dec J2000 declination.
     * @param {astroTime} epoch The date to convert to.
     */
    that.j2000ToDate = function(ra, dec, epoch) {
      // Check for appropriate argument types.
      try {
	if (!astrojs.isAngle(ra) ||
	    !astrojs.isAngle(dec) ||
	    !astrojs.isTime(epoch)) {
	  throw(new TypeError('Arguments must be (astroAngle, astroAngle,' +
			      ' astroTime)'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['j2000ToDate', x]);
      }

      var mjd = epoch.mjd();

      var J2000 = that.pol2r(ra, dec);

      // Compute the general precession matrix.
      var gp = that.precsn(that.JULIAN_DAY_J2000_astroTime, epoch);

      // Determine ephemeris quantities.
      var ephemVals = that.ephem_vars(epoch);
      var nutateVals = that.nutate(ephemVals.omega, ephemVals.F, ephemVals.D,
	ephemVals.manom, ephemVals.mlanom, ephemVals.eps0);

      var prcmat = [];
      for (var i = 0; i < 3; i++) {
	prcmat[i] = [];
	for (var j = 0; j < 3; j++) {
	  var xx = 0.0;
	  for (var k = 0; k < 3; k++) {
	    xx += gp[i][k] * nutateVals.N[k][j];
	  }
	  prcmat[i][j] = xx;
	}
      }

      var date = [];
      for (var i = 0; i < 3; i++) {
	date[i] = 0.0;
	for (var j = 0; j < 3; j++) {
	  date[i] += prcmat[i][j] * J2000[xyz[j]];
	}
      }

      // Revert to spherical coordinates.
      var polar = that.r2pol(date[0], date[1], date[2]);
      return {
	'rightAscension': polar.left,
	'declination': polar.right
      };

    };

    /**
     * Calculate the "on-the-sky" distance between two polar coordinates.
     * @param {object} referencePoint Reference point.
     * @param {object} targetPoint    Target point.
     */
    that.angularDistance = function(referencePoint, targetPoint) {
      // Move to left and right coordinates.
      var refCo = that.pointLeftRight(referencePoint);
      var tgtCo = that.pointLeftRight(targetPoint);

      // Prepare for the calculation.
      var dLat = tgtCo.left.subtract(refCo.left).toRadians();
      var dLon = tgtCo.right.subtract(refCo.right).toRadians();
      var lat1 = refCo.left.toRadians();
      var lat2 = tgtCo.left.toRadians();

      // Do the calculations, using the 'haversine' formula.
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
	Math.sin(dLon / 2) * Math.sin(dLon / 2) *
	Math.cos(lat1) * Math.cos(lat2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      // Return this distance as an astroAngle.
      var rd = astroAngle.new({
	'value': astrojs.checkNumber(c),
	'units': 'radians'
      });

      return rd;
    };

    /**
     * Move any supported coordinate names to left/right names.
     * @param {object} point The point to standardise.
     */
    that.pointLeftRight = function(point) {
      var retCo = {};

      try {
	if (typeof point.rightAscension !== 'undefined' &&
	    typeof point.declination !== 'undefined') {
	  retCo.left = point.rightAscension;
	  retCo.right = point.declination;
	} else if (typeof point.latitude !== 'undefined' &&
		   typeof point.longitude !== 'undefined') {
	  retCo.left = point.latitude;
	  retCo.right = point.longitude;
	} else if (typeof point.azimuth !== 'undefined' &&
		   typeof point.elevation !== 'undefined') {
	  retCo.left = point.azimuth;
	  retCo.right = point.elevation;
	} else {
	  throw(new TypeError('Do not recognise coordinate axes.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['pointLeftRight', x]);
      }

      return retCo;
    };

    /**
     * Calculate the precession matrix P for dates AFTER 1984.0
     * (JD = 2445700.5).
     * @param {astroTime} jdStart The current epoch of the coordinates.
     * @param {astroTime} jdStop The required epoch for the conversion.
     */
    that.precsn = function(jdStart, jdStop) {
      // Check for appropriate argument types.
      try {
	if (!astrojs.isTime(jdStart) ||
	    !astrojs.isTime(jdStop)) {
	  throw(new TypeError('Arguments must be astroTime'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['precsn', x]);
      }

      var a = [ 0.011180860865024,
		0.000006770713945,
		-0.000000000673891,
		0.000001463555541,
		-0.000000001667759,
		0.000000087256766 ];
      var b =  [ 0.011180860865024,
		 0.000006770713945,
		 -0.000000000673891,
		 0.000005307158404,
		 0.000000000319977,
		 0.000000088250634 ];
      var d =  [ 0.009717173455170,
		 -0.000004136915141,
		 -0.000000001052046,
		 0.000002068457570,
		 0.000000001052046,
		 -0.000000202812107 ];

      var t = ((jdStart.mjd() + that.JULIAN_DAY_REFERENCE) -
	that.JULIAN_DAY_J2000) / that.JULIAN_DAYS_IN_CENTURY;
      var st = (jdStop.mjd() - jdStart.mjd()) / that.JULIAN_DAYS_IN_CENTURY;
      var t2 = t * t;
      var st2 = st * st;
      var st3 = st2 * st;

      /**
       * Calculate the equitorial precession parameters.
       * (ref. USNO Circular no. 163 19821,
       *       Lieske et al., Astron. & Astrophys., 58, 1 1977)
       */
      var zeta = (a[0] + a[1] * t + a[2] * t2) * st +
	(a[3] + a[4] * t) * st2 + a[5] * st3;
      var z = (b[0] + b[1] * t + b[2] * t2) * st +
	(b[3] + b[4] * t) * st2 + b[5] * st3;
      var theta = (d[0] + d[1] * t + d[2] * t2) * st -
	(d[3] + d[4] * t) * st2 + d[5] * st3;

      // Calculate the P matrix.
      var precession = [ [ 0.0, 0.0, 0.0 ],
			 [ 0.0, 0.0, 0.0 ],
			 [ 0.0, 0.0, 0.0 ] ];
      precession[0][0] = Math.cos(zeta) * Math.cos(z) * Math.cos(theta) -
	Math.sin(zeta) * Math.sin(z);
      precession[0][1] = -1 * Math.sin(zeta) * Math.cos(z) * Math.cos(theta) -
	Math.cos(zeta) * Math.sin(z);
      precession[0][2] = -1 * Math.cos(z) * Math.sin(theta);
      precession[1][0] = Math.cos(zeta) * Math.sin(z) * Math.cos(theta) +
	Math.sin(zeta) * Math.cos(z);
      precession[1][1] = -1 * Math.sin(zeta) * Math.sin(z) * Math.cos(theta) +
	Math.cos(zeta) * Math.cos(z);
      precession[1][2] = -1 * Math.sin(z) * Math.sin(theta);
      precession[2][0] = Math.cos(zeta) * Math.sin(theta);
      precession[2][1] = -1 * Math.sin(zeta) * Math.sin(theta);
      precession[2][2] = Math.cos(theta);

      return precession;
    };

    /**
     * Given a date, this routine calculates the ephemeris values
     * required by the prcmat and nutate routines.
     * @param {astroTime} date The date to use in the calculation.
     */
    that.ephem_vars = function(date) {
      // Check for appropriate argument types.
      try {
	if (!astrojs.isTime(date)) {
	  throw(new TypeError('Argument must be astroTime'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['ephem_vars', x]);
      }

      var epoch = date.mjd() + that.JULIAN_DAY_REFERENCE;
      // Calculate the interval to/from J2000 in Julian centuries.
      var jcents = (epoch - that.JULIAN_DAY_J2000) /
	that.JULIAN_DAYS_IN_CENTURY;

      // Calculate the longitude of the mean ascending node of the
      // lunar orbit on the ecliptic [A.A. Suppl. 1984, p S26]
      var omega = (((0.000000039 * jcents + 0.000036143) *
		    jcents - 33.757045934) *
		   jcents + 2.182438624) / (2.0 * Math.PI);
      omega = omega % 1.0;
      if (omega < 0) {
	omega += 1;
      }

      // Calculate the mean anomaly. [A.A. Suppl. 1984, p S26]
      var manom = (6.240035939 - ((5.818e-8 * jcents +2.797e-6) * jcents -
	628.301956024) * jcents) / (2.0 * Math.PI);
      manom = manom % 1.0;
      if (manom < 0) {
	manom += 1;
      }

      // Calculate the mean anomaly of the Moon. [A.A. Suppl. 1984, p S26]
      var mlanom = (((0.000000310 * jcents + 0.000151795) * jcents
	+8328.691422884) * jcents + 2.355548394) / (2.0 * Math.PI);
      mlanom = mlanom % 1.0;
      if (mlanom < 0) {
	mlanom += 1;
      }

      // Calculate the longitude of the Moon from the ascending node.
      // [A.A. Suppl. 1984, p S26]
      var F = (((0.000000053 * jcents - 0.000064272) * jcents + 8433.466158318)
	* jcents + 1.627901934) / (2.0 * Math.PI);
      F = F % 1.0;
      if (F < 0) {
	F += 1;
      }

      // Calculate the mean elongation of the Moon from the Sun.
      // [A.A. Suppl. 1984, p S26]
      var D = (((0.000000092 * jcents + 0.000033409) * jcents + 7771.377146171)
	* jcents + 5.198469514) / (2.0 * Math.PI);
      D = D % 1.0;
      if (D < 0) {
	D += 1;
      }

      // Calculate the mean obliquity of the ecliptic = mean obliquity.
      // [A.A. Suppl. 1984, p S26]
      var eps0 = (((0.000000009 * jcents - 0.000000003) * jcents - 0.000226966)
	* jcents + 0.409092804) / (2.0 * Math.PI);

      return {
	'omega': omega,
	'manom': manom,
	'mlanom': mlanom,
	'F': F,
	'D': D,
	'eps0': eps0
      };
    };

    /**
     * Calculate the nutation in longitude and obliquity according to the
     * 1980 IAU Theory of Nutation including terms with amplitudes greater
     * than 0.01 arcsecond.
     * @param {number} omega Longitude of the ascending node of the Moon's
     *                       mean orbit on the ecliptic, measured from the
     *                       mean equinox of date.
     * @param {number} rma Mean anomaly of the Sun.
     * @param {number} mlanom Mean anomaly of the Moon.
     * @param {number} F L - omega, where L is the mean longitude of the Moon.
     * @param {number} D Mean elongation of the Moon from the Sun.
     * @param {number} eps0 Mean obliquity of the ecliptic.
     */
    that.nutate = function(omega, rma, mlanom, F, D, eps0) {
      // Check for numeric.
      try {
	if (!astrojs.isNumeric(omega) ||
	    !astrojs.isNumeric(rma) ||
	    !astrojs.isNumeric(mlanom) ||
	    !astrojs.isNumeric(F) ||
	    !astrojs.isNumeric(D) ||
	    !astrojs.isNumeric(eps0)) {
	  throw(new TypeError('Arguments must all be Number type'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['nutate', x]);
      }

      var arg1 = omega;
      var arg2 = 2 * omega;
      var arg9 = 2 * (F - D + omega);
      var arg10 = rma;
      var arg11 = arg9 + arg10;
      var arg12 = arg9 - arg10;
      var arg13 = arg9 - arg1;
      var arg31 = 2 * (F + omega);
      var arg32 = mlanom;
      var arg33 = arg31 - arg1;
      var arg34 = arg31 + arg32;
      var arg35 = mlanom - 2 * D;
      var arg36 = arg31 - arg32;

      var dpsi = (-0.000083386 * Math.sin(arg1 * 2.0 * Math.PI)
	+0.000001000 * Math.sin(arg2 * 2.0 * Math.PI)
	-0.000006393 * Math.sin(arg9 * 2.0 * Math.PI)
	+0.000000691 * Math.sin(arg10 * 2.0 * Math.PI)
	-0.000000251 * Math.sin(arg11 * 2.0 * Math.PI)
	+0.000000105 * Math.sin(arg12 * 2.0 * Math.PI)
	+0.000000063 * Math.sin(arg13 * 2.0 * Math.PI)
	-0.000001102 * Math.sin(arg31 * 2.0 * Math.PI)
	+0.000000345 * Math.sin(arg32 * 2.0 * Math.PI)
	-0.000000187 * Math.sin(arg33 * 2.0 * Math.PI)
	-0.000000146 * Math.sin(arg34 * 2.0 * Math.PI)
	-0.000000077 * Math.sin(arg35 * 2.0 * Math.PI)
	+0.000000060 * Math.sin(arg36 * 2.0 * Math.PI)) / (2.0 * Math.PI);

      var deps = (0.000044615 * Math.cos(arg1 * 2.0 * Math.PI)
	-0.000000434 * Math.cos(arg2 * 2.0 * Math.PI)
	+0.000002781 * Math.cos(arg9 * 2.0 * Math.PI)
	+0.000000109 * Math.cos(arg11 * 2.0 * Math.PI)
	+0.000000474 * Math.cos(arg31 * 2.0 * Math.PI)
	+0.000000097 * Math.cos(arg33 * 2.0 * Math.PI)
	+0.000000063 * Math.cos(arg34 * 2.0 * Math.PI)) / (2.0 * Math.PI);

      var eps = eps0 + deps;

      var N = [ [1.0, -1 * dpsi * 2 * Math.PI * Math.cos(eps * 2 * Math.PI),
		 -1 * dpsi * 2 * Math.PI * Math.sin(eps * 2 * Math.PI) ],
		[0.0, 1.0, -1 * deps * 2 * Math.PI],
		[0.0, deps * 2 * Math.PI, 1.0] ];
      N[1][0] = -1 * N[0][1];
      N[2][0] = -1 * N[0][2];

      return {
	'deps': deps,
	'dpsi': dpsi,
	'N': N
      };
    };

    /**
     * Convert between any two of the supported coordinate systems.
     * @param {astroAngle} left The input left coordinate.
     * @param {astroAngle} right The input right coordinate.
     * @param {Number} inputMode The type of input coordinates.
     * @param {Number} outputMode The type of output coordinates.
     * @param {Object} options Optional parameters (epoch, longitude,
     *                                              latitude, ref0).
     * @param {astroAngle} longitude The longitude of the observatory
     *                              (optional).
     * @param {astroAngle} latitude The latitude of the observatory
     *                             (optional).
     * @param {Number} ref0 The refraction constant.
     */
    that.coordConvert = function(left, right, inputMode, outputMode, options) {
      // Check the parameter types.
      try {
	if (!astrojs.isAngle(left) ||
	    !astrojs.isAngle(right) ||
	    !astrojs.isNumeric(inputMode) ||
	    !astrojs.isNumeric(outputMode)) {
	  throw(new TypeError('Required parameters are astroAngle, ' +
			      'astroAngle, Number, Number'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['coordConvert', x]);
      }

      // Check the input and output modes.
      try {
	if (inputMode < that.COORDMODE_EWXY ||
	    inputMode > that.COORDMODE_GALACTIC) {
	  throw(new RangeError('Input mode is not recognised.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['coordConvert', x]);
      }
      try {
	if (outputMode < that.COORDMODE_EWXY ||
	    outputMode > that.COORDMODE_GALACTIC) {
	  throw(new RangeError('Output mode is not recognised.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['coordConvert', x]);
      }

      // Check the optional parameters.
      options = options || {};
      options.ref0 =
	(typeof options.ref0 !== 'undefined') ?
	options.ref0 : 0.00005; // Default refraction.
      try {
	if ((typeof options.longitude !== 'undefined' &&
	     !astrojs.isAngle(options.longitude)) ||
	    (typeof options.latitude !== 'undefined' &&
	     !astrojs.isAngle(options.latitude)) ||
	    (typeof options.epoch !== 'undefined' &&
	     !astrojs.isTime(options.epoch)) ||
	    (typeof options.ref0 !== 'undefined' &&
	     !astrojs.isNumeric(options.ref0))) {
	  throw(new TypeError('Optional parameters have wrong type.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['coordConvert', x]);
      }

      // If necessary determine ephemeris quantities (if either of
      // the modes are date, HA/Dec, AzEl or EWXY).
      var ephemVals;
      var nutateVals;
      if ((inputMode <= that.COORDMODE_DATE &&
	   outputMode >= that.COORDMODE_DATE) ||
	  (inputMode >= that.COORDMODE_DATE &&
	   outputMode <= that.COORDMODE_DATE)) {
	try {
	  if (typeof options.epoch === 'undefined') {
	    throw(new ReferenceError('Epoch required but none supplied.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['coordConvert', x]);
	}
	var mjd = options.epoch.mjd();
	ephemVals = that.ephem_vars(options.epoch);
	nutateVals = that.nutate(ephemVals.omega, ephemVals.F, ephemVals.D,
	  ephemVals.manom, ephemVals.mlanom, ephemVals.eps0);
      }

      var vonc = [];
      if ((inputMode <= that.COORDMODE_HADEC &&
	   outputMode >= that.COORDMODE_DATE) ||
	  (inputMode >= that.COORDMODE_DATE &&
	   outputMode <= that.COORDMODE_HADEC)) {
	try {
	  if (typeof options.epoch === 'undefined') {
	    throw(new ReferenceError('Epoch required but none supplied.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['coordConvert', x]);
	}
	var mjd = options.epoch.mjd();
	// Calculate the interval to/from J2000 in Julian centuries.
	var jcents = (mjd + that.JULIAN_DAY_REFERENCE -
	  that.JULIAN_DAY_J2000) / that.JULIAN_DAYS_IN_CENTURY;

	// Compute the eccentricity of the Earth's orbit (in radians)
	// [Explanatory supplement to the Astronomical Ephemeris 1961, p 98]
	var e = (-0.000000126 * jcents - 0.00004205) * jcents + 0.016709114;

	// Compute the eccentric anomaly, by iteratively solving:
	//   ea = e * sin(ea) - rma
	var ea = ephemVals.manom;
	var xx;
	do {
	  xx = ea;
	  ea = xx + (ephemVals.manom - xx + e * Math.sin(xx)) /
	    (1 - e * Math.cos(xx));
	} while (Math.abs(ea - xx) > 1e-9);

	// Compute the mean longitude of perihelion, in radians
	// (reference as for `e').
	var perihl = ((0.00000005817764 * jcents + 0.000008077) * jcents
	  + 0.030010190) * jcents + 1.796613066;

	// Compute the abberation vector.
	var eps = ephemVals.eps0 + nutateVals.deps;
	xx = 0.00009936508 / (1 - e * Math.cos(ea));
	var efac = Math.sqrt(1 - e * e);
	vonc[0] = xx * (-1 * Math.cos(perihl) * Math.sin(ea) -
	  efac * Math.sin(perihl) * Math.cos(ea));
	vonc[1] = xx * (-1 * Math.sin(perihl) * Math.cos(eps) * Math.sin(ea) +
	  efac * Math.cos(perihl) * Math.cos(eps) * Math.cos(ea));
	vonc[2] = xx * (-1 * Math.sin(perihl) * Math.sin(eps) * Math.sin(ea) +
	  efac * Math.cos(perihl) * Math.sin(eps) * Math.cos(ea));
      }

      var prcmat = [];
      if ((inputMode <= that.COORDMODE_DATE &&
	   outputMode >= that.COORDMODE_J2000) ||
	  (inputMode >= that.COORDMODE_J2000 &&
	   outputMode <= that.COORDMODE_DATE)) {
	try {
	  if (typeof options.epoch === 'undefined') {
	    throw(new ReferenceError('Epoch required but none supplied.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['coordConvert', x]);
	}
	var mjd = options.epoch.mjd();
	// Compute the general precession matrix.
	var gp = that.precsn(that.JULIAN_DAY_J2000_astroTime, options.epoch);

	// The matrices returned from nutate and precsn can be used
	// to convert J2000 coordinates to date by:
	// (coords at date) = gp * nu * (coords at J2000)
	for (var i = 0; i < 3; i++) {
	  prcmat[i] = [];
	  for (var j = 0; j < 3; j++) {
	    var xx = 0;
	    for (var k = 0; k < 3; k++){
	      xx += gp[i][k] * nutateVals.N[k][j];
	    }
	    prcmat[i][j] = xx;
	  }
	}
      }

      var lmst;
      if ((inputMode <= that.COORDMODE_HADEC &&
	   outputMode >= that.COORDMODE_DATE) ||
	  (inputMode >= that.COORDMODE_DATE &&
	   outputMode <= that.COORDMODE_HADEC)) {
	try {
	  if (typeof options.epoch === 'undefined') {
	    throw(new ReferenceError('Epoch required but none supplied.'));
	  }
	} catch (x) {
	  astrojs.catchError.apply(ERR, ['coordConvert', x]);
	}
	lmst = options.epoch.lmst();
      }

      // Perform the conversion.
      var lb, b1950, j2000, date, ra, ha, dec, az, el, x, y;
      if (inputMode === that.COORDMODE_GALACTIC) {
	lb = { 'latitude': left, 'longitude': right };
      } else if (inputMode === that.COORDMODE_B1950) {
	b1950 = { 'rightAscension': left, 'declination': right };
      } else if (inputMode === that.COORDMODE_J2000) {
	j2000 = { 'rightAscension': left, 'declination': right };
      } else if (inputMode === that.COORDMODE_DATE) {
	date = { 'rightAscension': left, 'declination': right };
      } else if (inputMode === that.COORDMODE_HADEC) {
	ha = left;
	dec = right;
      } else if (inputMode === that.COORDMODE_AZEL) {
	az = left;
	el = right;
      } else {
	x = left;
	y = right;
      }

      // Conversion is to a "lower" mode.
      if (outputMode < inputMode) {
	// Convert from Galactic to B1950.
	if (inputMode === that.COORDMODE_GALACTIC) {
	  b1950 = that.galfk4(lb.latitude, lb.longitude);
	}

	// Convert from B1950 to J2000.
	if (inputMode >= that.COORDMODE_B1950 &&
	    outputMode < that.COORDMODE_B1950) {
	  j2000 = that.fk4fk5(b1950.rightAscension,
	    b1950.declination);
	}

	// Precess from J2000 to date.
	if (inputMode >= that.COORDMODE_J2000 &&
	    outputMode < that.COORDMODE_J2000) {
	  date = that.j2000ToDate(j2000.rightAscension,
	    j2000.declination, options.epoch);
	}

	// Convert from date to HA/Dec.
	if (inputMode >= that.COORDMODE_DATE &&
	    outputMode < that.COORDMODE_DATE) {
	  var dater = that.pol2r(date.rightAscension, date.declination);
	  for (var i = 0; i < 3; i++) {
	    dater[xyz[i]] += vonc[i];
	  }

	  // Convert from rectangular back to polar coordinates.
	  var rd = that.r2pol(dater.x, dater.y, dater.z);
	  dec = rd.right;

	  // Convert to hour angle.
	  var tHa = lmst.toTurns() - rd.left.toTurns();
	  if (tHa > 0.5) {
	    tHa = tHa - 1;
	  }
	  ha = astroAngle.new({
	    'value': tHa,
	    'units': 'turns'
	  });
	}

	// Convert from HA/Dec to Az/El.
	if (inputMode >= that.COORDMODE_HADEC &&
	    outputMode < that.COORDMODE_HADEC) {
	  try {
	    if (typeof options.latitude === 'undefined') {
	      throw(new ReferenceError('Latitude required but not supplied.'));
	    }
	  } catch (x) {
	    astrojs.catchError.apply(ERR, ['coordConvert', x]);
	  }
	  var ae = that.eqazel(ha, dec, options.latitude);

	  // Correct for refraction.
	  el = ae.elevation.add(astroAngle.new({
	    'value': (options.ref0 / Math.tan(ae.elevation.toRadians())),
	    'units': 'turns'
	  }));
	  az = ae.azimuth;
	}

	// Convert from Az/El to X/Y.
	if (inputMode >= that.COORDMODE_AZEL &&
	    outputMode < that.COORDMODE_AZEL) {
	  var xy = that.azel2xy(az, el);
	  x = xy.x;
	  y = xy.y;
	}
      } else {
	// Convert from X/Y to Az/El
	if (inputMode === that.COORDMODE_EWXY &&
	    outputMode > that.COORDMODE_EWXY) {
	  var ae = that.xy2azel(x, y);
	  az = ae.azimuth;
	  el = ae.elevation;
	}

	// Convert from Az/El to HA/Dec.
	if (inputMode <= that.COORDMODE_AZEL &&
	    outputMode > that.COORDMODE_AZEL) {
	  try {
	    if (typeof options.latitude === 'undefined') {
	      throw(new ReferenceError('Latitude required but not supplied.'));
	    }
	  } catch (x) {
	    astrojs.catchError.apply(ERR, ['coordConvert', x]);
	  }
	  // First, numerically invert the refraction correction.
	  var upper = el.subtract(astroAngle.new({
	    'value': (options.ref0 / Math.tan(el.toRadians())),
	    'units': 'turns'
	  }));
	  var lower = el.subtract(astroAngle.new({
	    'value': 1.5 * (options.ref0 / Math.tan(el.toRadians())),
	    'units': 'turns'
	  }));
	  var root = lower.add(upper).divide(2);
	  var niter = 0;
	  do {
	    var check = root.add(astroAngle.new({
	      'value': (options.ref0 / Math.tan(root.toRadians())),
	      'units': 'turns'
	    })).subtract(el);
	    if (check.toTurns() > 0) {
	      upper = root;
	    } else {
	      lower = root;
	    }
	    root = lower.add(upper).divide(2);
	    niter++;
	  } while (niter <= 10 &&
		   upper.subtract(root).toTurns() > 7e-8);
	  el = root;

	  // Now do the conversion.
	  var hd = that.eqazel(az, el, options.latitude);
	  ha = hd.azimuth;
	  dec = hd.elevation;
	}

	// Convert from HA/Dec to date.
	if (inputMode <= that.COORDMODE_HADEC &&
	    outputMode > that.COORDMODE_HADEC) {
	  try {
	    if (typeof options.epoch === 'undefined') {
	      throw(new ReferenceError('Epoch required but none supplied.'));
	    }
	  } catch (x) {
	    astrojs.catchError.apply(ERR, ['coordConvert', x]);
	  }
	  lmst = astroAngle.new({
	    'value': options.epoch.lmst().toTurns(),
	    'units': 'turns'
	  });
	  ra = lmst.subtract(ha);
	  if (ra.toTurns < 0) {
	    ra = ra.add(astroAngle.new(360));
	  }

	  // Remove the abberation vector.
	  var dater = that.pol2r(ra, dec);
	  for (var i = 0; i < 3; i++) {
	    dater[xyz[i]] -= vonc[i];
	  }
	  var datet = that.r2pol(dater.x, dater.y, dater.z);
	  date = {
	    'rightAscension': datet.left,
	    'declination': datet.right
	  };
	}

	// Precess from date to J2000.
	if (inputMode <= that.COORDMODE_DATE &&
	    outputMode > that.COORDMODE_DATE) {
	  var dater = that.pol2r(date.rightAscension, date.declination);
	  var j2k = [];
	  for (var i = 0; i < 3; i++) {
	    j2k[i] = 0;
	    for (var j = 0; j < 3; j++) {
	      j2k[i] += prcmat[j][i] * dater[xyz[j]];
	    }
	  }
	  var j2000t = that.r2pol(j2k[0], j2k[1], j2k[2]);
	  j2000 = {
	    'rightAscension': j2000t.left,
	    'declination': j2000t.right
	  };
	}

	// Convert from J2000 to B1950.
	if (inputMode <= that.COORDMODE_J2000 &&
	    outputMode > that.COORDMODE_J2000) {
	  b1950 = that.fk5fk4(j2000.rightAscension, j2000.declination);
	}

	// Convert from B1950 to Galactic.
	if (inputMode <= that.COORDMODE_B1950 &&
	    outputMode > that.COORDMODE_B1950) {
	  lb = that.fk4gal(b1950.rightAscension, b1950.declination);
	}

      }

      if (outputMode === that.COORDMODE_EWXY) {
	return ({
	  'x': x, 'y': y
	});
      } else if (outputMode === that.COORDMODE_AZEL) {
	return ({
	  'azimuth': az, 'elevation': el
	});
      } else if (outputMode === that.COORDMODE_HADEC) {
	return ({
	  'hourAngle': ha, 'declination': dec
	});
      } else if (outputMode === that.COORDMODE_DATE) {
	return date;
      } else if (outputMode === that.COORDMODE_J2000) {
	return j2000;
      } else if (outputMode === that.COORDMODE_B1950) {
	return b1950;
      } else if (outputMode === that.COORDMODE_GALACTIC) {
	return lb;
      } else {
	return undefined;
      }
    };

    /**
     * Calculates the setting hour angle using an AzEl mounted telescope
     * for a source.
     * @param {astroAngle} declination The declination of the source.
     * @param {astroAngle} latitude The latitude of the observatory.
     * @param {object} limits An object describing the limits of the mount.
     */
    that.haSetAzEl = function(declination, latitude, limits) {
      // Check that the required keys are present.
      try {
	if (typeof limits === 'undefined' ||
	    typeof limits.elevationLow === 'undefined' ||
	    !astrojs.isAngle(limits.elevationLow) ||
	    typeof latitude === 'undefined' ||
	    !astrojs.isAngle(latitude) ||
	    typeof declination === 'undefined' ||
	    !astrojs.isAngle(declination)) {
	  throw(new TypeError('Incorrect arguments specified.'));
	}
      } catch (x) {
	astrojs.catchError(ERR, ['haSetAzEl', x]);
	return undefined;
      }

      var cosHaSet = (Math.cos(Math.PI / 2 - limits.elevationLow.toRadians()) -
		      Math.sin(latitude.toRadians()) *
		      Math.sin(declination.toRadians())) /
	(Math.cos(declination.toRadians()) * Math.cos(latitude.toRadians()));

      var haSet;
      if (cosHaSet > 1 || cosHaSet < -1) {
	haSet = astroAngle.new({
	  'value': astrojs.checkNumber(cosHaSet),
	  'units': 'turns'
	});
      } else {
	haSet = astroAngle.new({
	  'value': astrojs.checkNumber(Math.acos(cosHaSet)),
	  'units': 'radians'
	});
      }

      return haSet;
    };

    /**
     * Calculate the apparent coordinates of the Sun, based on the
     * formula presented in the Astronomical Almanac 2013. These are
     * low-precision estimates, accurate to 1'.0 between 1950 and 2050.
     * @param {astroTime} epoch The time to compute for.
     */
    that.solarRADec = function(epoch) {
      // Check for the astroTime argument.
      try {
	if (!astrojs.isTime(epoch)) {
	  throw(new TypeError('Argument must be an astroTime.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['solarSkyCoordinate', x]);
	return undefined;
      }

      // Calculate the number of days since J2000.
      var n = epoch.mjd() - that.JULIAN_DAY_J2000_astroTime.mjd();

      // The Mean longitude of the Sun, corrected for aberration.
      var L = 280.460 + 0.9856474 * n; // In degrees.
      L = astrojs.boundNumber(L, 0, 360);

      // The mean anomaly of the Sun.
      var g = 357.528 + 0.9856003 * n; // In degrees.
      g = astrojs.boundNumber(g, 0, 360);

      // The ecliptic longitude.
      var lambda = L + 1.915 * Math.sin(g * Math.PI / 180) +
	0.020 * Math.sin(2 * g * Math.PI / 180);
      // The ecliptic latitude.
      var beta = 0;

      // The obliquity of the ecliptic.
      var epsilon = 23.439 - 0.0000004 * n;

      // The right ascension.
      var f = 180 / Math.PI;
      var t = Math.pow(Math.tan(epsilon * Math.PI / (180 * 2)), 2);
      var alpha = lambda - f * t * Math.sin(2 * lambda * Math.PI / 180) +
	(f / 2) * t * t * Math.sin(4 * lambda * Math.PI / 180);

      // The declination.
      var delta = Math.asin(Math.sin(epsilon * Math.PI / 180) *
			    Math.sin(lambda * Math.PI / 180));

      var sunCoord = {
	'rightAscension': astroAngle.new(astrojs.checkNumber(alpha)),
	'declination': astroAngle.new(astrojs.checkNumber(delta * 180 / Math.PI)),
	'frame': 'J2000'
      };

      return sunCoord;
    };

    /**
     * Determine if a source with a given rise time and set time is
     * up at the specified sidereal time.
     * @param {astroAngle} riseLst The LST at source rise.
     * @param {astroAngle} setLst The LST at source set.
     * @param {astroAngle} lst The LST now.
     */
    that.sourceIsUp = function(riseLst, setLst, lst) {
      // Check for astroAngle arguments.
      try {
	if (typeof riseLst === 'undefined' ||
	    !astrojs.isAngle(riseLst) ||
	    typeof setLst === 'undefined' ||
	    !astrojs.isAngle(setLst) ||
	    typeof lst === 'undefined' ||
	    !astrojs.isAngle(lst)) {
	  throw(new TypeError('Arguments must be of type astroTime.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['sourceIsUp', x]);
	return undefined;
      }

      if ((lst.toTurns() >= riseLst.toTurns() &&
	   (lst.toTurns() <= setLst.toTurns() ||
	    riseLst.toTurns() > setLst.toTurns())) ||
	  (lst.toTurns() <= setLst.toTurns() &&
	   (lst.toTurns() >= riseLst.toTurns() ||
	    riseLst.toTurns() > setLst.toTurns()))) {
	return true;
      } else {
	return false;
      }
    };

    return that;

  });
