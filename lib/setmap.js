// wraps the code in a function with local variables and undefined as variable for safe comparison
(function ( window, $, undefined ) {

    // force strict ECMAScript mode
    'use strict';

    /**
     * Local variables for faster and reliable access
     */

    var navigator = window.navigator,

        // the google maps namespace from the js API
        gmaps = (window.google && window.google.maps) ?
            window.google.maps :
            undefined,

        // geocoder object for geocoding and reversed geocoding
        geocoder = gmaps ? new gmaps.Geocoder() : undefined,

        /**
         * Default options which could be overridden by user
         */
        defaultOptions = {

            // the map options
            map: {
                zoom: 12,
                type: 'hybrid',
                draggable: true,
                streetView: false,
                disabled: false,

                // Map would be centered to Los Angeles by default
                center: {
                    lat: 34.051,
                    lng: -118.246
                },
                current: false,
                zoomControlStyle: 'large',
                panControl: true,
                mapTypeControl: true
            },

            // the markers array
            markers: [],

            // global marker options
            markerOptions: {
                animation: 'drop',
                draggable: true,
                title: '',
                current: false,
                icon: false
            },

            // Drop callback. Called when a marker is dragged and then dropped.
            drop: false,

            // return components flag: default value is false
            components: false
        },

        /**
         * Constants from google.maps JS SDK
         */

        // possible map types
        mapTypes = [ 'hybrid', 'terrain', 'roadmap', 'satellite' ],

        // possible marker animations
        markerAnimations = [ 'DROP', 'BOUNCE' ],

        // possible zoom controls styles
        zoomControlStyles = [ 'SMALL', 'LARGE' ],

        addressComponents = 'address_components',

        longName = 'long_name',

        centerChangedEvent = 'center_changed',

        mapTypeChangedEvent = 'maptypeid_changed',

        /**
         * Helper variables
         */

        // namespace for data and events
        dotNamespace = '.setmap';

    /*
     ********************
     *
     * Helper functions
     *
     *******************
     */

    // Checks if google maps JavaScript API script is loaded
    if ( !gmaps ) {
        return;
    }

    function Setmap( options, element ) {
        this.element = $( element );
        this.options = $.setmap.defaultOptions;
        this.option( options );
        this._init( true );
    }

    $.extend( Setmap.prototype, {

        markerObjects: [],

        // initializes the map instance
        _init: function ( initial ) {

            if (!initial) {
                return;
            }

            this._saveStyles();

            this.options.latlng = this.options.map.center.latlng ||
                new gmaps.LatLng(
                    this.options.map.center.lat,
                    this.options.map.center.lng
                );

            try {
                this
                    ._resolveInitOptions()
                    ._createMap()
                    ._initCenterCallback()
                    ._initTypeCallback()
                    .setMarkers(this.options.markers);
            } catch ( exception ) {
                $.error(exception.message);
            }

            if ( this.options.map.current ) {
                this.setCurrentLocation();
            }
        },

        _saveStyles: function() {
            if ( this.element.attr('style') !== undefined ) {
                this.element.data(
                    'style' + dotNamespace,
                    this.element.attr('style') + ''
                );
            }

            return this;
        },

        // Change the center of the map
        _setPosition: function( lat, lng ) {
            var loc;

            if (!lng ) {
                loc = lat;
            } else {
                loc = new gmaps.LatLng(lat, lng);
            }

            this.getMap().setCenter(loc);

            return loc;
        },

        // Set the position of the map programatically with a string address
        _setAddress: function( address, callback ) {
            var _this = this;

            address = $.trim(address);

            this._codeAddress(address, function ( loc ) {
                _this._setPosition(loc);
                _this._decodeAddress(loc, function ( address ) {
                    if ( $.isFunction(callback) ) {
                        callback(loc.lat(), loc.lng(), address);
                    }
                });
            });
        },

        _resolveInitOptions: function() {
            
            // sets the map type
            this.options.map.type = this._resolveType(this.options.map.type);

            // sets the animation
            this.options.markerOptions.animation = this._resolveAnimation(
                this.options.markerOptions.animation
            );

            // set the disabled property
            this.options.map.disabled = this.options.map.disabled !== false;

            // sets the zoom controls style
            this.options.map.zoomControlStyle = this._resolveZoomControlStyle(
                this.options.map.zoomControlStyle
            );

            return this;
        },

        _resolveType: function( type ) {
            type = mapTypes[$.inArray(type, mapTypes)];
            return type || mapTypes[0];
        },

        _resolveAnimation: function( animation ) {
            animation = markerAnimations[
                $.inArray(animation.toUpperCase(), markerAnimations)
            ];
            return animation || markerAnimations[0];
        },

        _resolveZoomControlStyle: function( zoomControlStyle ) {
            zoomControlStyle = zoomControlStyles[
                $.inArray(zoomControlStyle.toUpperCase(), zoomControlStyles)
            ];

            return gmaps.ZoomControlStyle[
                zoomControlStyle || zoomControlStyles[0]
            ];
        },

        _initCenterCallback: function() {
            var _this = this;

            if ( $.isFunction(this.options.center) ) {
                this.mapCenterListener = gmaps.event.addListener(
                    this.getMap(),
                    centerChangedEvent,
                    function () {
                        _this.options.center.call({
                            center: {
                                lat: this.getCenter().lat(),
                                lng: this.getCenter().lng()
                            }
                        });
                    }
                );
            }

            return this;
        },

        _initTypeCallback: function() {
            var _this = this;

            if ( $.isFunction(this.options.type) ) {
                this.mapTypeChangeListener = gmaps.event.addListener(
                    this.getMap(),
                    mapTypeChangedEvent,
                    function () {
                        _this.options.type.call({
                            type: this._getType()
                        });
                    }
                );
            }

            return this;
        },

        _createMap: function() {
            this.map = new gmaps.Map(this.element[0], {
                zoom: this.options.map.zoom,
                center: this.options.latlng,
                mapTypeId: this.options.map.type,
                zoomControlOptions: {
                    style: this.options.map.zoomControlStyle
                },
                panControl: this.options.map.panControl,
                mapTypeControl: this.options.map.mapTypeControl,
                draggable: this.options.map.draggable,
                disableDefaultUI: this.options.map.disabled === true,
                scrollwheel: this.options.map.disabled === false,
                keyboardShortcuts: this.options.map.disabled === false,
                disableDoubleClickZoom: this.options.map.disabled === true,
                streetViewControl: this.options.map.streetView
            });

            return this;
        },

        _getType: function() {
            return this.getMap().getMapTypeId();
        },

        // Set the map type
        _setType: function ( type ) {
            var newType = this._resolveType(type);
            if ( newType ) {
                this.getMap().setMapTypeId(newType);
            }
        },

        // Reversed geocoding: convert coordinates to address
        // Call callback when ready
        _decodeAddress: function( latlong, callback ) {
            var _this = this;

            geocoder.geocode({
                latLng: latlong
            }, function ( results, status ) {
                var val = '';
                if ( status === gmaps.GeocoderStatus.OK ) {
                    if ( _this.options.components ) {
                        val = results[0][addressComponents];
                    } else {
                        $.each(results[0][addressComponents], function (key, value ) {
                            if ( key > 0 ) {
                                val = val + ', ';
                            }
                            val = val + value[longName];
                        });
                    }
                    callback(val);
                } else {
                    $.error('Geocode was not successful for the following reason: ' + status);
                    callback(false);
                }
            });
        },

        // Geocoding: convert address to coordinates, calls callback when ready
        _codeAddress: function( address, callback) {
            geocoder.geocode({
                address: address
            }, function ( results, status ) {
                if ( status === gmaps.GeocoderStatus.OK ) {
                    callback(results[0].geometry.location);
                } else {
                    $.error('Geocode was not successful for the following reason: ' + status);
                    callback(false);
                }
            });
        },

        setMarkers: function(markers) {
            var _this = this;

            $.each(markers, function ( index, value ) {
                var markerOptions = {
                    map: _this.getMap(),
                    animation: value.animation || _this.options.markerOptions.animation,
                    draggable: value.draggable || _this.options.markerOptions.draggable,
                    position: value.position ?
                        new gmaps.LatLng(
                            value.position.lat,
                            value.position.lng
                        ) :
                        new gmaps.LatLng(
                            _this.options.markerOptions.position.lat,
                            _this.options.markerOptions.position.lng
                        ),
                    title: value.title || _this.options.markerOptions.title
                },
                    markerObj = new gmaps.Marker(markerOptions),
                    dropCallback = value.drop || _this.options.markerOptions.drop,
                    clickCallback = value.click || _this.options.markerOptions.click,
                    marker = {
                        id: index,
                        obj: markerObj,
                        dropListener: false,
                        clickListener: false,
                        data: value.data,
                        map: _this.element[0]
                    };

                if ( $.isFunction(dropCallback) &&
                    markerOptions.draggable === true ) {
                    marker.dropListener = gmaps.event.addListener(
                        markerObj,
                        'dragend',
                        function ( event ) {
                            _this._decodeAddress(
                                event.latLng,
                                function ( address ) {
                                    dropCallback.call($.extend(true, {}, marker, {
                                        position: {
                                            lat: event.latLng.lat(),
                                            lng: event.latLng.lng(),
                                            address: address
                                        }
                                    }));
                                }
                            );
                        }
                    );
                }

                if ( $.isFunction(clickCallback)) {
                    marker.clickListener = gmaps.event.addListener(
                        markerObj,
                        'click',
                        function ( event ) {
                            _this._decodeAddress(
                                event.latLng,
                                function ( address ) {
                                    clickCallback.call($.extend(true, {}, marker, {
                                        position: {
                                            lat: event.latLng.lat(),
                                            lng: event.latLng.lng(),
                                            address: address
                                        }
                                    }));
                                }
                            );
                        }
                    );
                }

                _this.markerObjects.push(marker);
            });
        },

        // Get the google.maps.Map instance of the map
        getMap: function () {
            return this.map;
        },

        // Get array of the google.maps.Marker instances
        getMarkerObjects: function () {
            return this.markerObjects;
        },

        // Get or set the zoom level of the map
        zoom: function ( zoomLevel ) {

            if ( zoomLevel === undefined ) {
                return this.getMap().getZoom();
            }

            if ( typeof zoomLevel === 'number' && zoomLevel > 0 ) {
                this.getMap().setZoom(zoomLevel);
            }
        },

        // Get or set the center of the map
        center: function ( lat, lng, callback ) {
            if ( typeof lat === 'number' &&
                ( typeof lng === 'number' || lng === undefined ) &&
                $.isFunction(callback)) {
                this._decodeAddress(
                    this._setPosition(lat, lng),
                    callback
                );

                return;
            }

            if ( typeof lat === 'string' &&
                ( lng === undefined || $.isFunction(lng) ) ) {
                this._setAddress(lat, lng, callback);
                return;
            }

            return this.getMap().getCenter();
        },

        setCurrentLocation: function() {
            var _this = this;

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function ( position ) {
                        _this._setPosition(
                            position.coords.latitude,
                            position.coords.longitude
                        );
                    }
                );
            }
        },

        // Get or set the map type
        type: function ( type ) {
            if ( type === undefined ) {
                return this._getType();
            }

            this._setType(type);
        },

        // Set option(s) or get a single option
        option: function ( options, value ) {
            if (!options ) {
                return;
            }

            if ( value !== undefined ) {
                this.options[ options ] = value;
            } else if ( typeof options === 'string' ) {
                return this.options[ options ];
            } else {
                this.options = $.extend( true, {}, this.options, options );
            }
        },

        // Destroy the Setmap instance - returns the DOM to its previous state
        destroy: function () {
            var styles;

            if ($.isPlainObject(this.options) ) {
                return;
            }

            styles = this.element.data('style' + dotNamespace);

            if ( styles !== undefined ) {
                this.element.attr('style', styles);
            } else {
                this.element.removeAttr('style');
            }

            this.element
                .removeData('object' + dotNamespace)
                .removeData('style' + dotNamespace)
                .unbind(dotNamespace)
                .empty();

            if ( this.mapCenterListener ) {
                gmaps.event.removeListener(this.mapCenterListener);
            }

            if ( this.mapTypeChangeListener ) {
                gmaps.event.removeListener(this.mapTypeChangeListener);
            }
        }
    });

    $.fn.setmap = function( options ) {

        if ( typeof options === 'string' ) {

            // call method
            var args = Array.prototype.slice.call( arguments, 1 ),
                returned;

            this.each(function () {

                var instance = $.data( this, 'setmap.setmap');

                if (!instance ) {
                    throw new Error(
                        '[setmap] Cannot call methods on setmap prior to initialization; ' +
                        'attempted to call method \'' + options + '\''
                    );
                }

                if (!$.isFunction( instance[ options ] ) ||
                    options.charAt( 0 ) === '_' ) {

                    throw new Error(
                        '[setmap] no such method \'' + options + '\' for setmap instance'
                    );
                }

                // apply method
                returned = instance[ options ].apply( instance, args );

                if ( returned !== undefined ) {
                    return false;
                }
            });

            return returned;
        } else {
            this.each(function () {
                var instance = $.data( this, 'setmap.setmap' );
                if ( instance ) {
                    // apply options & init
                    instance.option( options || {} );
                    instance._init( false );
                } else {
                    // initialize new instance
                    instance = new Setmap( options, this );
                    $.data( this, 'setmap.setmap', instance );
                }
            });
        }
        return this;
    };

    $.setmap = Setmap;
    $.setmap.defaultOptions = defaultOptions;

}( window, window.jQuery ));
