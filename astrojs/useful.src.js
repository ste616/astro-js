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

    // A list of 269 maximally distinct colours, for plotting purposes.
    var colourList = [ "#000000", "#FFFF00", "#1CE6FF", "#FF34FF", "#FF4A46", "#008941", "#006FA6", "#A30059",
		       "#FFDBE5", "#7A4900", "#0000A6", "#63FFAC", "#B79762", "#004D43", "#8FB0FF", "#997D87",
		       "#5A0007", "#809693", "#FEFFE6", "#1B4400", "#4FC601", "#3B5DFF", "#4A3B53", "#FF2F80",
		       "#61615A", "#BA0900", "#6B7900", "#00C2A0", "#FFAA92", "#FF90C9", "#B903AA", "#D16100",
		       "#DDEFFF", "#000035", "#7B4F4B", "#A1C299", "#300018", "#0AA6D8", "#013349", "#00846F",
		       "#372101", "#FFB500", "#C2FFED", "#A079BF", "#CC0744", "#C0B9B2", "#C2FF99", "#001E09",
		       "#00489C", "#6F0062", "#0CBD66", "#EEC3FF", "#456D75", "#B77B68", "#7A87A1", "#788D66",
		       "#885578", "#FAD09F", "#FF8A9A", "#D157A0", "#BEC459", "#456648", "#0086ED", "#886F4C",
		       
		       "#34362D", "#B4A8BD", "#00A6AA", "#452C2C", "#636375", "#A3C8C9", "#FF913F", "#938A81",
		       "#575329", "#00FECF", "#B05B6F", "#8CD0FF", "#3B9700", "#04F757", "#C8A1A1", "#1E6E00",
		       "#7900D7", "#A77500", "#6367A9", "#A05837", "#6B002C", "#772600", "#D790FF", "#9B9700",
		       "#549E79", "#FFF69F", "#201625", "#72418F", "#BC23FF", "#99ADC0", "#3A2465", "#922329",
		       "#5B4534", "#FDE8DC", "#404E55", "#0089A3", "#CB7E98", "#A4E804", "#324E72", "#6A3A4C",
		       "#83AB58", "#001C1E", "#D1F7CE", "#004B28", "#C8D0F6", "#A3A489", "#806C66", "#222800",
		       "#BF5650", "#E83000", "#66796D", "#DA007C", "#FF1A59", "#8ADBB4", "#1E0200", "#5B4E51",
		       "#C895C5", "#320033", "#FF6832", "#66E1D3", "#CFCDAC", "#D0AC94", "#7ED379", "#012C58",
		       
		       "#7A7BFF", "#D68E01", "#353339", "#78AFA1", "#FEB2C6", "#75797C", "#837393", "#943A4D",
		       "#B5F4FF", "#D2DCD5", "#9556BD", "#6A714A", "#001325", "#02525F", "#0AA3F7", "#E98176",
		       "#DBD5DD", "#5EBCD1", "#3D4F44", "#7E6405", "#02684E", "#962B75", "#8D8546", "#9695C5",
		       "#E773CE", "#D86A78", "#3E89BE", "#CA834E", "#518A87", "#5B113C", "#55813B", "#E704C4",
		       "#00005F", "#A97399", "#4B8160", "#59738A", "#FF5DA7", "#F7C9BF", "#643127", "#513A01",
		       "#6B94AA", "#51A058", "#A45B02", "#1D1702", "#E20027", "#E7AB63", "#4C6001", "#9C6966",
		       "#64547B", "#97979E", "#006A66", "#391406", "#F4D749", "#0045D2", "#006C31", "#DDB6D0",
		       "#7C6571", "#9FB2A4", "#00D891", "#15A08A", "#BC65E9", "#FFFFFE", "#C6DC99", "#203B3C",
		       
		       "#671190", "#6B3A64", "#F5E1FF", "#FFA0F2", "#CCAA35", "#374527", "#8BB400", "#797868",
		       "#C6005A", "#3B000A", "#C86240", "#29607C", "#402334", "#7D5A44", "#CCB87C", "#B88183",
		       "#AA5199", "#B5D6C3", "#A38469", "#9F94F0", "#A74571", "#B894A6", "#71BB8C", "#00B433",
		       "#789EC9", "#6D80BA", "#953F00", "#5EFF03", "#E4FFFC", "#1BE177", "#BCB1E5", "#76912F",
		       "#003109", "#0060CD", "#D20096", "#895563", "#29201D", "#5B3213", "#A76F42", "#89412E",
		       "#1A3A2A", "#494B5A", "#A88C85", "#F4ABAA", "#A3F3AB", "#00C6C8", "#EA8B66", "#958A9F",
		       "#BDC9D2", "#9FA064", "#BE4700", "#658188", "#83A485", "#453C23", "#47675D", "#3A3F00",
		       "#061203", "#DFFB71", "#868E7E", "#98D058", "#6C8F7D", "#D7BFC2", "#3C3E6E", "#D83D66",
		       
		       "#2F5D9B", "#6C5E46", "#D25B88", "#5B656C", "#00B57F", "#545C46", "#866097", "#365D25",
		       "#252F99", "#00CCFF", "#674E60", "#FC009C", "#92896B" ];
    
    // A routine that will return one or more colours from the list.
    rObj.getColour = function(index, ncol, random) {
      // Check for non-supplied values.
      if (typeof index === 'undefined') {
	// User wants us to return just 1 random colour.
	index = -1;
	ncol = 1;
	random = true;
      } else if (typeof ncol === 'undefined') {
	// User only wants one colour, probably the one in index.
	ncol = 1;
	random = false;
      } else if (typeof random === 'undefined') {
	// User wants some number of colours that they specified.
	random = false;
      }

      // Check for non-sensible values.
      try {
	if (ncol > colourList.length) {
	  // Asks for too many distinct colours.
	  throw(new Error("Requested too many distinct colours."));
	} else if (((index + ncol) > colourList.length) &&
		   (!random)) {
	  // Asks for too many distinct colours from a certain point.
	  throw(new Error("Colour range not compatible with available data."));
	}
      } catch (x) {
	astrojs.catchError.apply(ERR, [ 'getColour', x ]);
	return undefined;
      };
      
      // The list of colours we return.
      var retColours = [];
      
      // Determine random colours if asked to.
      if (random) {
	for (var i = 0; i < ncol; i++) {
	  var f = false;
	  do {
	    index = Math.floor(Math.random() * colourList.length);
	    f = false;
	    // Don't return the same colour twice.
	    for (var j = 0; j < retColours.length; j++) {
	      if (colourList[index] == retColours[j]) {
		f = true;
		break;
	      }
	    }
	  } while (f);
	  retColours.push(colourList[index]);
	}
      } else {
	// Take a slice.
	retColours = colourList.slice(index, index + ncol);
      }

      if (retColours.length === 1) {
	return (retColours[0]);
      } else {
	return (retColours);
      }
    };
    
    return rObj;
  });
