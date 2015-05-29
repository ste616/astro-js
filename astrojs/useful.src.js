// this is "/astrojs/useful"
define([ "./base", "dojo/dom-attr", "dojox/timing", "dojo/dom",
	 "dojo/_base/lang", "dojo/on", "./coordinate", "./angle",
	 "./skyCoordinate", "./source", "dojo/dom-construct",
	 "dojo/fx", "dojo/fx/Toggler", "dojo/dom-class", "dojo/_base/Color" ],
  function(astrojs, domAttr, dTime, dom, lang, on, astroCoord, astroAngle,
	   astroSkyCoord, astroSource, domConstruct, coreFx, Toggler, domClass, Colour) {

    /**
     * This object gives the user a number of quite useful routines for
     * making nice, responsive web pages.
     */
    var rObj = {};

    // This file's error parameters.
    var ERR = {
      'file': 'useful'
    };

    /**
     * This routine makes a function to generate an animated status
     * message that cycles a number of dots at the end.
     * @param {String} message The message to display.
     * @param {String} elementId The ID of the element to display the
     *                           messsage in.
     */
    rObj.generateStatusMessage = function(message, elementId) {
      var that = {};

      /**
       * Start the message display.
       */
      that.start = function() {
	// Reset the number of dots.
	that.ndots = 1;

	// Display the initial message.
	that.display();

	// Start the timer.
	that.timer.start();
      };

      /**
       * Update the number of dots.
       */
      that.update = function() {
	// Increase the number of dots.
	that.ndots = (that.ndots === 3) ? 1 : ++that.ndots;

	// Display the message.
	that.display();
      };

      /**
       * Display the message.
       */
      that.display = function() {
	var dMessage = message;
	for (var i = 0; i < that.ndots; i++) {
	  dMessage += '.';
	}

	domAttr.set(elementId, 'innerHTML', dMessage);
      };

      /**
       * Stop the message display.
       */
      that.stop = function() {
	// Stop the timer.
	that.timer.stop();

	// Empty the element.
	domAttr.set(elementId, 'innerHTML', '');
      };

      /**
       * Our timer.
       * @type {Timer}
       */
      that.timer = new dTime.Timer();
      that.timer.setInterval(250);
      that.timer.onTick = that.update;

      return that;
    };

    /**
     * This routine fires a callback only when the user presses Enter
     * (or the numeric keypad Enter) on some element with a passed ID.
     * @param {String} elementId The ID of the element to watch.
     * @param {Function} callback The function to call when Enter is pressed.
     */
    rObj.onEnter = function(elementId, callback) {
      // Check that the element exists.
      if (dom.byId(elementId) === null) {
	return;
      }

      // Check that the callback function exists.
      if (!lang.isFunction(callback)) {
	return;
      }

      var handleKeys = function(evtObj) {
	// Check for the Enter keys.
	if (evtObj.keyCode === dojo.keys.ENTER ||
	    evtObj.keyCode === dojo.keys.NUMPAD_ENTER) {
	  // Fire the callback.
	  callback(evtObj);
	}
      };

      // Connect the onkeydown event to the element.
      on(dom.byId(elementId), 'keydown', handleKeys);

      return;
    };

    /**
     * Removes any HTML elements from the passed string,
     * leaving only the text content.
     * This code is adapted from
     * http://geekswithblogs.net/aghausman/archive/2008/10/30/how-to-remove-html-tags-from-a-string-in-javascript.aspx
     * @param {String} s The string to remove HTML from.
     */
    rObj.removeHTMLTags = function(s) {
      if (s) {
	var myDiv = document.createElement('div');
	myDiv.innerHTML = s;
	if (document.all) { // This is for IE.
	  return myDiv.innerText;
	} else { // All the other browsers.
	  return myDiv.textContent;
	}
      }

      return s;
    };

    /**
     * This routine returns the current position of the Sun, as
     * an astroSkyCoordinate.
     * @param {astroTime} epoch The time to compute for.
     */
    rObj.solarCoordinate = function(epoch) {
      var sc;
      try {
	sc = astroCoord.solarRADec(epoch);
	if (sc === undefined) {
	  throw(new Error('Unable to get solar coordinates.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['solarCoordinate', x]);
	return undefined;
      }

      return astroSkyCoord.new(sc);
    };

    /**
     * Make a container that can collapse on user click.
     * @param {object} options The options controlling the container.
     */
    rObj.collapsibleContainer = function(options) {
      var that = {};

      that.viewChanger = function(evtObj) {
	if (containerOpened == false) {
	  containerToggler.show();
	  domClass.add(containerOpener, 'collapsibleContainerOpened');
	  domClass.remove(containerOpener, 'collapsibleContainerClosed');
	  containerOpened = true;
	} else {
	  containerToggler.hide();
	  domClass.add(containerOpener, 'collapsibleContainerClosed');
	  domClass.remove(containerOpener, 'collapsibleContainerOpened');
	  containerOpened = false;
	}
      };

      that.domNode = domConstruct.create('div',
	{ 'class': 'collapsibleContainerNode' });

      // The div that will show up at the top of the container, and will
      // allow the container to be opened.
      var containerTitleNode = domConstruct.create('div',
	{ 'class': 'collapsibleContainerTitleNode' });
      that.domNode.appendChild(containerTitleNode);

      // The arrow that indicates whether the container is opened or closed.
      var containerOpener = domConstruct.create('span',
	{ 'class': 'collapsibleContainerOpened' });
      containerTitleNode.appendChild(containerOpener);

      // Which node will open/close the container when clicked?
      var containerTarget = containerOpener;
      if (options && options.target == 'titlebar') {
	containerTarget = containerTitleNode;
      }
      on(containerTarget, 'click', that.viewChanger);

      // The content shown for the container title.
      var containerTitleSpan = domConstruct.create('span',
	{ 'class': 'collapsibleContainerTitleSpan' });
      containerTitleNode.appendChild(containerTitleSpan);
      if (options && options.title) {
	domAttr.set(containerTitleSpan, 'innerHTML', options.title);
      }

      // Any content on the right of the title bar.
      var containerTitleRightSpan = domConstruct.create('span',
	{ 'class': 'collapsibleContainerRightSpan' });
      containerTitleNode.appendChild(containerTitleRightSpan);

      var clearDiv = domConstruct.create('div',
	{ 'style': 'clear: both' });
      containerTitleNode.appendChild(clearDiv);

      // The content that gets hidden.
      var containerContentStrut = domConstruct.create('div',
	{ 'class': 'collapsibleContainerStrut' });
      that.domNode.appendChild(containerContentStrut);
      that.containerContentDiv = domConstruct.create('div',
	{ 'class': 'collapsibleContainerContent' });
      containerContentStrut.appendChild(that.containerContentDiv);
      if (options && options.content) {
	domAttr.set(containerContentDiv, 'innerHTML', options.content);
      }

      // Set up the toggler.
      var containerOpened = true;
      var containerToggler = new Toggler({
	'node': containerContentStrut,
	'showFunc': coreFx.wipeIn,
	'hideFunc': coreFx.wipeOut
      });


      if (options && options.startClosed == true) {
	that.viewChanger();
      }

      return that;
    };

    /**
     * Calculate the times for sunset/sunrise/twilight on a
     * specified day.
     * @param {astroTime} epoch The day to compute the times for; include
     *                         the location within the epoch.
     */
    rObj.solarTimes = function(epoch) {
      try {
	if (typeof epoch === 'undefined' ||
	    !astrojs.isTime(epoch)) {
	  throw(new TypeError('Argument must be an astroTime'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['solarTimes', x]);
	return undefined;
      }

      // The times we determine.
      var times = {
	'riseSet': antfAngle.new(-50 / 60),
	'twilight': {
	  'civil': astroAngle.new(-6),
	  'nautical': astroAngle.new(-12),
	  'astronomical': astroAngle.new(-18)
	}
      };


      // Determine the rising times.
      // Approximate time of sunrise is 6am.
      var originalTime = epoch.time();
      epoch.time().setHours(6, 0, 0);
      var sc;
      try {
	sc = rObj.solarCoordinate(epoch);
	if (sc === undefined) {
	  throw(new Error('Unable to compute solar times.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['solarTimes', x]);
	return undefined;
      }
      var sun = astroSource.new({
	'name': 'Sol',
	'coordinate': sc
      });


    };

    // Calculate the luminosity contrast between two colours.
    // From http://www.splitbrain.org/blog/2008-09/18-calculating_color_contrast_with_php
    var calcLum = function(col) {
      try {
	if (typeof col === 'undefined' ||
	    typeof col.r === 'undefined' ||
	    typeof col.g === 'undefined' ||
	    typeof col.b === 'undefined') {
	  throw(new Error('Colour not correctly specified.'));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, ['calcLum', x]);
	return undefined;
      }
      var l = 0.2126 * Math.pow(col.r / 255, 2.2) +
	  0.7152 * Math.pow(col.g / 255, 2.2) +
	  0.0722 * Math.pow(col.b / 255, 2.2);
      
      return l;
    };
    
    var lumdiff = function(col1, col2) {
      // Each of col1 and col2 should be an object with
      // { r: val, g: val, b: val }
      var l1 = calcLum(col1);
      var l2 = calcLum(col2);
      
      if (l1 > l2) {
	return ((l1 + 0.05) / (l2 + 0.05));
      } else {
	return ((l2 + 0.05) / (l1 + 0.05));
      }
    };
    
    rObj.foregroundColour = function(bgcol) {
      // Determine which foreground colour to use for a particular
      // background colour.

      // Check for black.
      var black = new Colour({ 'r': 0, 'g': 0, 'b': 0 });
      var white = new Colour({ 'r': 255, 'g': 255, 'b': 255 });
      var blackDiff = lumdiff(bgcol, black);
      var whiteDiff = lumdiff(bgcol, white);

      if (blackDiff > whiteDiff) {
	return black;
      } else {
	return white;
      }
    };

    
    return rObj;
  });
