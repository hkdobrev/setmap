/*
 * jquery.setmap
 * https://g.ithub.com/hkdobrev/setmap
 *
 * Copyright (c) 2012 Haralan Dobrev
 * Licensed under the MIT license
 */

(function( $, window, navigator, gmaps, undefined) {

	// Constructor
	$.setmap = function( element, options ) {
		this.element = $( element );
		this._create( options );
		this._init();
	};

	// Non-static methods
	$.extend( true, $.setmap.prototype, {

		// Protected methods
		
		_create: function( options ) {
			this.options = $.extend( true, {}, $.setmap.defaults, options );
			this.enabled = false;
			this.originalStyle = this.element.length ? this.element[0].style : false;
			this.element.addClass( "setmap" );
		},
		
		_init: function() {

		},

		// Public methods
		
		option: function( key, value ) {
			if ( $.isPlainObject( key ) ) {
				this.options = $.extend( true, this.options, key );
			} else {
				if ( typeof key === "string" ) {
					if ( value !== undefined ) {
						this.options[ key ] = value;
						return;
					}
					return this.options[ key ];
				}
				return this.options;
			}
		},

		enable: function() {
			this.enabled = true;
		},

		disable: function () {
			this.enabled = false;
		},

		destroy: function() {

			if ( this.originalStyle ) {
				// re-apply saved container styles
				var elemStyle = this.element[0].style;
				for ( var prop in this.originalStyle ) {
					elemStyle[ prop ] = this.originalStyle[ prop ];
				}
			}

			this.element
				.unbind( ".setmap" )
				.removeClass( "setmap" )
				.removeData( "setmap" );
		}
	});

	// Static methods
	$.extend( true, $.setmap, {

		// Default options,
		defaults: {
			lat: 34.051,
			lng: -118.246,
			markers: [],
			components: false,
			decode: true,
			drop: false,
			background: "#3C3C3C",
			zoom: 12,
			type: "hybrid",
			draggable: true,
			streetview: false,
			pan: true,
			keyboard: true,
			doubleClick: true,
			scrollwheel: true,
			zoomControl: "large",
			disabled: false,
			mapTypeControl: true,
			
			// Global marker options
			markersOptions: {
				animation: "drop",
				draggable: true,
				title: "",
				current: false,
				icon: false,
				cursor: "pointer"
			},
			directionsOptions: {
				units: "metric",
				draggable: true,
				markers: {
					cursor: "pointer",
					draggable: false,
					animation: "drop"
				}
			}
		},

		// Static log function
		// The first argument defines the log level
		// The rest of the arguments are logged on the console if it's present
		log: function( level, message ) {
			(window.console ? window.console[ level ] : $.noop).apply(window, Array.prototype.slice.call(arguments, 1));
		},

		// possible map types
		mapTypes: ["hybrid", "terrain", "roadmap", "satellite"],

		// possible marker animations
		markerAnimations: ["DROP", "BOUNCE"],

		// possible zoom controls styles
		zoomControls: ["SMALL", "LARGE"],

		// Possible travel modes for directions
		// Bicycling is for US only
		// Public transport is accessible only on maps.google.com
		// Default: WALKING
		travelModes: ["WALKING", "DRIVING", "BICYCLING"],
		
		// Possible unit systems; used for directions; default: METRIC
		unitSystems: ['METRIC', 'IMPERIAL'],

		// Error messages used by $.setmap.error
		errors: [
			"The Geolocation service failed",
			"Your browser doesn't support geolocation",
			"Geocode was not successful for the following reason: ",
			"You should destroy the setmap instance first!",
			"The Gogle Maps Javascript API is not loaded!",
			"The markers property must be an array!",
			" does not exist on the setmap plugin!"
		],

		// Smart log for specific error messages
		error: function( code, message ) {
			$.setmap.log( "error", $.isNumeric( code ) ?
				$.setmap.errors[ code ] + ( message || "" ) :
				code + ( message !== undefined ? $.setmap.errors[ message ] : "" )
			);
		},

		// Change the center of the map
		setPosition: function( map, lat, lng ) {
			var loc = lng ? $.setmap.createLatLng( lat, lng ) : lat;
			map.setCenter( loc );
			return loc;
		},
	
		// Returns new LatLng object
		createLatLng: function( lat, lng ) {
			return new gmaps.LatLng( lat, lng );
		},
		
		// Returns new Point object
		createPoint: function( x, y ) {
			return new gmaps.Point( x, y );
		},
		
		// Returns new Marker object
		createMarker: function( opts ) {
			return new gmaps.Marker( opts );
		},
		
		// Move a Marker object
		moveMarker: function( markerObject, lat, lng ) {
			markerObject.setPosition( $.setmap.createLatLng( lat, lng ) );
		}
	});

	// Private helpers

	// Collection method
	$.fn.setmap = function( options ) {

		var args, returned;

		if ( typeof options === "string" ) {
			args = Array.prototype.slice.call( arguments, 1 );
			this.each(function() {
				var instance = $.data( this, "setmap" );
				if ( ! instance ) {
					$.setmap.log( "error", "cannot call methods on setmap prior to initialization; " +
						"attempted to call method '" + options + "'" );
					return;
				}
				if ( ! $.isFunction( instance[options]) || options.charAt(0) === "_" ) {
					$.setmap.log( "error", "no such method'" + options + "' for setmap instance" );
				}

				//apply public method
				returned = instance[ options ].apply( instance, args );
			});
		} else {
			this.each(function() {
				var instance = $.data( this, "setmap" );
				if ( instance ) {

					//apply options
					instance.option( options || {} );
					instance._init();
				} else {

					// initialize new instance
					$.data( this, "setmap", new $.setmap( options, this ) );
				}
			});
		}
		return returned !== undefined ? returned : this;
	};

	// Custom selector
	$.expr[ ":" ].setmap = function( elem ) {
		return !! $( elem ).data( "setmap" );
	};

}( jQuery, window, window.navigator, window.google.maps ));
