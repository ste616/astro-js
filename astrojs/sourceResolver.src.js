define([ "./base", "dojo/_base/lang", "./skyCoordinate", "./time", "./angle",
	 "dojo/_base/Deferred", "./source", "dojo/_base/xhr" ],
  function(astrojs, lang, astroSkyCoordinate, astroTime, astroAngle,
    Deferred, astroSource, xhr) {

    /*
     * This routine enables the user to make a new source.
     */
    var rObj = {};

    var sourcesResolved = {};

    /**
     * This function makes it easy to take an astronomical source name and
     * get its source coordinates using some online services.
     *
     * Source query server-side expects only a 'name' parameter, to search for.
     * You will get back a JSON object describing the position.
     *
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

      /**
       * The location of the script to call for name resolution.
       * @type {string}
       */
      constructor.resolverScript = constructor.resolverScript ||
	'/cgi-bin/Calibrators/new/sourcequery.pl';

      /**
       * The name of the source to search for.
       * @type {string}
       */
      constructor.sourceName = constructor.sourceName || '';

      /**
       * Our promise for when the name has been resolved.
       * @type {Deferred}
       */
      var resolvePromise = null;

      // Our methods follow.

      // Our private methods.
      /**
       * The routine used to do the name resolution.
       */
      var nameResolve = function() {
	// Make a deferred promise that we will resolve when the
	// name resolution has completed.
	resolvePromise = new Deferred();

	var postDeferred = xhr.post({
	  url: constructor.resolverScript,
	  sync: false,
	  content: {
	    name: constructor.sourceName
	  },
	  handleAs: 'json',
	  failOK: true
	});

	// Set up the data and error handlers.
	postDeferred.then(resolveActions, resolveError);

	return resolvePromise;
      };

      /**
       * The routine called when the name resolution has finished.
       * @param {object} data The data coming back from the server call.
       * @param {object} ioargs Other information.
       */
      var resolveActions = function(data, ioargs) {
	// Check that we don't get an error.
	if (typeof data.error !== 'undefined') {
	  // Something went wrong with the name resolution process.
	  // We resolve our promise now with an error.
	  resolvePromise.reject(data.error);
	} else if (typeof data.position !== 'undefined') {
	  // Make a new source object.
	  var rSource = {
	    source: astroSource.new({
	      name: data.name,
	      coordinate: {
		ra: {
		  value: astrojs.hexa2turns(data.position.ra, {
		      units: 'hours'
		    }),
		  'units': 'turns'
		},
		dec: data.position.dec,
		frame: data.position.epoch
	      }
	    }),
	    resolver: data.resolver
	  };

	  // Resolve our promise now by returning the source.
	  resolvePromise.resolve(rSource);
	}
      };

      /**
       * The routine called if our call to the name resolving script fails.
       * @param {object} err Information about the error.
       * @param {object} ioargs Other information.
       */
      var resolveError = function(err, ioargs) {
	// We resolve our promise now with an error.
	resolvePromise.reject('Call to server script "' +
	  constructor.resolverScript + '" failed.');
      };

      // Our public methods.
      /**
       * Start the resolution process.
       */
      that.resolveName = function() {
	// Check we actually have a name to resolve.
	if (constructor.sourceName === '') {
	  return null;
	} else {
	  return nameResolve();
	}
      };

      /**
       * Set the source name to search for after construction.
       * @param {string} sourceName The name of the source to search for.
       */
      that.setSourceName = function(sourceName) {
	if (lang.isString(sourceName)) {
	  constructor.sourceName = sourceName;
	}

	// Return ourselves to allow for method chains.
	return that;
      };

      return that;
    };

    return rObj;

  });
