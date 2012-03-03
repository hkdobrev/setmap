
// preceding comma in case there is broken code before the plugin is included
;

// wraps the code in a function with local variables and undefined as variable for safe comparison
(function ( $, navigator, google, undefined ) {

	// force strict ECMAScript mode
	"use strict";

	/*
	 ********************
	 *
	 * Helper functions
	 * 
	 *******************
	 */

	// logs error messages using $.error
	function e ( code, message ) {
		$.error(
			( typeof code === stringString ) ?
			code + ( message !== undefined ? er[message] : "" ) :
			er[code] + ( message ? message : emptyString )
			);
	}

	// change the center of the map
	function setPosition ( options, lat, lng ) {
		var loc;
		if ( ! lng ) {
			loc = lat;
		} else {
			loc = new gmaps.LatLng(lat, lng);
		}
		options["mapObj"].setCenter(loc);
		//		options["markerObj"].setPosition(loc);
		return loc;
	}

	// sets the position of the map programatically with a string address
	function setAddress ( address, options, callback ) {
		address = $.trim(address);
		codeAddress(address, options, function ( loc ) {
			setPosition(options, loc);
			decodeAddress(loc, options, function ( address ) {
				if ( typeof callback === functionString ) {
					callback(loc.lat(), loc.lng(), address);
				}
			});
		});
	}

	// sets the position of the map programatically with a coordinates
	function setCoords ( lat, lng, options, fn ) {
		var loc = setPosition( options, lat, lng);
		if ( typeof fn === functionString ) {
			decodeAddress(loc, options, fn);
		}
	}

	function resolveType ( type, initial ) {
		type = mapTypes[$.inArray(type, mapTypes)];
		return type || ( initial ? mapTypes[0] : f);
	}

	function getType ( map ) {
		return map.getMapTypeId();
	}

	// sets the map type
	var setType = function ( map, type ) {
		var newType = resolveType(type, t);
		if ( newType ) {
			map.setMapTypeId(newType);
		}
	}

	// initializes the map and markers; calls initCallback with a success/fail flag when ready
	function initialize ( mapDOMElement, options, initCallback ) {

		function callback () {
			options.latlng = new gmaps.LatLng(options.map["center"].lat, options.map["center"].lng);
			try {
				options["mapObj"] = new gmaps.Map(mapDOMElement, {
					"zoom": options.map.zoom,
					"center": options.latlng,
					"mapTypeId": options.map.type,
					"zoomControlOptions": {
						"style": options.map.zoomControls
					},
					"draggable": options.map.draggable,
					"disableDefaultUI": options.map.disabled === t,
					"scrollwheel": options.map.disabled === f,
					"keyboardShortcuts": options.map.disabled === f,
					"disableDoubleClickZoom": options.map.disabled === t,
					"streetViewControl": options.map.streetView
				});

				if ( typeof options["center"] === functionString ) {

					options.mapCenterListener = gmaps.event.addListener(options["mapObj"], "center_changed", function ( e ) {
						options["center"].call({
							"center": {
								"lat": this.getCenter().lat(),
								"lng": this.getCenter().lng()
							}
						});
					});

				}

				if ( typeof options["type"] === functionString ) {

					options.mapCenterListener = gmaps.event.addListener(options["mapObj"], "maptypeid_changed", function ( e ) {
						options["type"].call({
							"type": getType(this)
						});
					});

				}

				if( ! $.isArray(options["markers"] ) ) {
					e(5);
					initCallback(f);
					return false;
				}

				options["markerObjects"] = [];

				$.each(options["markers"], function ( index, value ) {
					var markerOptions = {
						"map": options["mapObj"], 
						"animation": value["animation"] || options["markerOptions"].animation,
						"draggable": value["draggable"] || options["markerOptions"].draggable,
						"position": value["position"] ? new gmaps.LatLng(value["position"].lat, value["position"].lng) : new gmaps.LatLng(options["markerOptions"].position.lat, options["markerOptions"].position.lng),
						"title": value.title || options["markerOptions"].title
					},
					markerObj = new gmaps.Marker(markerOptions),
					listener;

					if ( typeof options["drop"] === functionString && markerOptions.draggable === t ) {
						listener = gmaps.event.addListener(markerObj, "dragend", function ( event ) {
							decodeAddress(event.latLng, options, function ( address ) {
								options["drop"].call({
									"id": index,
									"position": {
										"lat": event.latLng.lat(),
										"lng": event.latLng.lng(),
										"address": address
									},
									"map": mapDOMElement
								});
							});
						});
					}

					options["markerObjects"].push({
						obj: markerObj,
						listener: listener,
						id: index
					});

				});

				initCallback(t);
			} catch ( ex ) {
				e(ex.message);
				initCallback(f);
			}
		}

		if ( options.map["current"] ) {
			if ( navigator.geolocation ) {
				navigator.geolocation.getCurrentPosition(function ( position ) {
					options.map["center"] = {
						lat: position.coords.latitude,
						lng: position.coords.longitude
					};
					callback();
				}, function () {
					// user refuses HTML geolocation or the geolocation service failed
					e(0);
					callback();
				});
			} else {
				// Browser doesn't support Geolocation
				e(1);
				callback();
			}
		} else {
			callback();
		}
	}

	// Reversed geocoding: convert coordinates to address, calls callback when ready
	function decodeAddress ( latlong, options, callback ) {
		geocoder.geocode({
			"latLng": latlong
		}, function ( results, status ) {
			var val = emptyString;
			if ( status === gmaps.GeocoderStatus.OK ) {
				if ( options.components ) {
					val = results[0].address_components;
				} else {
					$.each(results[0].address_components, function (key, value ) {
						if ( key > 0 ) {
							val = val + ", ";
						}
						val = val + value["long_name"];
					});
				}
				callback(val);
			} else {
				e(2, status);
				callback(f);
			}
		});
	}

	// Geocoding: convert address to coordinates, calls callback when ready
	function codeAddress ( address, options, callback) {
		geocoder.geocode({
			"address": address
		}, function ( results, status ) {
			if ( status === gmaps.GeocoderStatus.OK ) {
				callback(results[0].geometry.location);
			} else {
				e(2, status);
				callback(f);
			}
		});
	}

	// Checks if google maps JavaScript API script is loaded
	if ( typeof google !== objectString || typeof google.maps !== objectString ) {
		e(4);
		return;
	}

	// the google maps namespace from the js API
	var gmaps = google.maps,

	// geocoder object for geocoding and reversed geocoding
	geocoder = new gmaps.Geocoder(),

	// namespace for data and events
	dotNamespace = ".setmap",

	// false
	f = false,

	// true
	t = true,

	// object string
	objectString = "object",

	// style string
	styleString = "style",

	// number string
	numberString = "number",

	// function string
	functionString = "function",

	// empty string
	emptyString = "",

	// string string
	stringString = "string",

	// the default options
	defaultOptions = {

		// the map options
		"map": {
			"zoom": 12,
			"type": "hybrid",
			"draggable": t,
			"streetView": f,
			"disabled": f,
			"center": {
				"lat": 34.051,
				"lng": -118.246
			},
			"current": false,
			"zoomControls": "large"
		},

		// the markers array
		"markers": [],

		// global marker options
		"markerOptions": {
			"animation": "drop",
			"draggable": t,
			"title": emptyString,
			"current": f,
			"icon": f
		},

		"drop": f,

		// return components flag: default value is false
		"components": f
	},

	// possible map types
	mapTypes = ["hybrid", "terrain", "roadmap", "satellite"],

	// possible marker animations
	markerAnimations = ["DROP", "BOUNCE"],

	// possible zoom controls styles
	zoomControls = ["SMALL", "LARGE"],

	// error messages
	er = [
	"The Geolocation service failed",
	"Your browser doesn't support geolocation",
	"Geocode was not successful for the following reason: ",
	"You should destroy the setmap instance first!",
	"The Gogle Maps Javascript API is not loaded!",
	"The markers property must be an array!",
	" does not exist on the setmap plugin!"
	];

	// the actual jQuery plugin
	$.fn.setmap = function ( method ) {

		var mainArguments = arguments,
		options, element,
		methods = {

			// initializes the map instance
			"init": function ( settings ) {

				if ( typeof options === objectString && ! $.isPlainObject(options) ) {
					e(3);
					return element;
				}

				$.extend(t, options, defaultOptions, settings);

				if ( element.attr(styleString) !== undefined ) {
					element.data(styleString + dotNamespace, element.attr(styleString) + emptyString);
				}

				// sets the map type
				options.map["type"] = resolveType(options.map["type"], t);

				// sets the animation
				options["markerOptions"]["animation"] = gmaps.Animation[
				markerAnimations[$.inArray(options["markerOptions"]["animation"].toUpperCase(), markerAnimations)] || markerAnimations[0]
				];

				// set the disabled property
				if ( options.map.disabled !== f ) {
					options.map.disabled = t;
				}

				// sets the zoom controls style
				options.map["zoomControls"] = gmaps.ZoomControlStyle[
				zoomControls[$.inArray(options.map["zoomControls"].toUpperCase(), zoomControls)] || zoomControls[0]
				];

				// initialize the map and the map overlays, calls the callback with success flag
				initialize(this, options, function ( success ) {
					if ( success ) {
						element.data(objectString + dotNamespace, options);
					}
				});
				return element;
			},

			// returns the google.maps.Map object of the map
			"getMap": function () {
				return options["mapObj"];
			},

			// gets or sets the zoom level of the map
			"zoom": function ( zoomLevel ) {

				if ( zoomLevel === undefined ) {
					return options["mapObj"].getZoom();
				}

				if ( typeof zoomLevel === numberString && zoomLevel > 0 ) {
					options["mapObj"].setZoom(zoomLevel);
				}
				return element;
			},

			// gets or sets the center of the map
			"center": function ( lat, lng, callback ) {
				if ( typeof lat === numberString && ( typeof lng === numberString || lng === undefined ) ) {
					setCoords(lat, lng, options, callback);
					return element;
				} else if ( typeof lat === stringString && ( lng === undefined || typeof lng === functionString ) ) {
					setAddress(lat, options, lng);
					return element;
				} else {
					return options["mapObj"].getCenter();
				}
			},

			// gets or sets the map type
			"type": function ( type ) {
				if ( type === undefined ) {
					return getType(options["mapObj"]);
				}

				setType.call(options["mapOjb"], type);

				return element;
			},

			// destroy the map instance
			"destroy": function () {
				if ( ! $.isPlainObject(options) ) {
					if ( element.data(styleString + dotNamespace) !== undefined ) {
						element.attr(styleString, element.data(styleString + dotNamespace));
					} else {
						element.removeAttr(styleString);
					}
					element.removeData(objectString + dotNamespace);
					element.removeData(styleString + dotNamespace);
					element.unbind(dotNamespace);
					element.empty();
					if ( options.listener ) {
						gmaps.event.removeListener(options.listener);
					}
					return element;
				} else {
					return element;
				}
			}
		},

		returnValue;

		// calls the provided method for each element from the selected jQuery collection
		this.each(function () {

			// keeps the original jQuery collection on which the plugin was called
			element = $(this);

			// keeps the data for every jQuery element on the collection
			options = element.data(objectString + dotNamespace) || {};

			if ( returnValue === undefined ) {

				// calls the appropriate method if available
				if ( methods[method] && method !== "init" ) {
					returnValue = methods[ method ].apply( this, Array.prototype.slice.call( mainArguments, 1 ) );
				} else {
					if ( typeof method === objectString || ! method ) {
						methods["init"].apply( this, mainArguments );
					} else {
						e( "Method " +  method, 6 );
						returnValue = f;
					}
				}
			}

		});

		if (returnValue === undefined ) {
			return element;
		}

		return returnValue;

	};
}(jQuery, navigator, google));
