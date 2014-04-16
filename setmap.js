// wraps the code in a function with local variables and undefined as variable for safe comparison
(function ( window, $, undefined ) {

    // force strict ECMAScript mode
    'use strict';

    // Local variables for faster and reliable access
    var navigator = window.navigator,

        // the google maps namespace from the js API
        gmaps = (window.google && window.google.maps) ?
            window.google.maps :
            undefined,

        // geocoder object for geocoding and reversed geocoding
        geocoder = gmaps ? new gmaps.Geocoder() : undefined,

        // namespace for data and events
        dotNamespace = '.setmap',

        // the default options
        defaultOptions = {

            // the map options
            map: {
                zoom: 12,
                type: 'hybrid',
                draggable: true,
                streetView: false,
                disabled: false,
                center: {
                    lat: 34.051,
                    lng: -118.246
                },
                current: false,
                zoomControls: 'large'
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

            drop: false,

            // return components flag: default value is false
            components: false,

            requireInit: true
        },

        // possible map types
        mapTypes = ['hybrid', 'terrain', 'roadmap', 'satellite'],

        // possible marker animations
        markerAnimations = ['DROP', 'BOUNCE'],

        // possible zoom controls styles
        zoomControls = ['SMALL', 'LARGE'],

        // error messages
        errorMessages = [
            'The Geolocation service failed',
            'Your browser does not support geolocation',
            'Geocode was not successful for the following reason: ',
            'You should destroy the setmap instance first!',
            'The Gogle Maps Javascript API is not loaded!',
            'The markers property must be an array!',
            ' does not exist on the setmap plugin!'
        ];


    /*
     ********************
     *
     * Helper functions
     *
     *******************
     */

    // logs error messages using $.error
    function triggerError ( code, message ) {
        $.error(
            ( typeof code === 'string' ) ?
                code + ( message !== undefined ? errorMessages[message] : '' ) :
                errorMessages[code] + ( message ? message : '' )
        );
    }


    // Checks if google maps JavaScript API script is loaded
    if ( !gmaps ) {
        triggerError(4);
        return;
    }

    // change the center of the map
    function setPosition ( options, lat, lng ) {
        var loc;
        if ( ! lng ) {
            loc = lat;
        } else {
            loc = new gmaps.LatLng(lat, lng);
        }
        options.mapObj.setCenter(loc);
        //      options.markerObj.setPosition(loc);
        return loc;
    }

    // sets the position of the map programatically with a string address
    function setAddress ( address, options, callback ) {
        address = $.trim(address);
        codeAddress(address, function ( loc ) {
            setPosition(options, loc);
            decodeAddress(loc, options, function ( address ) {
                if ( $.isFunction(callback) ) {
                    callback(loc.lat(), loc.lng(), address);
                }
            });
        });
    }

    // sets the position of the map programatically with coordinates
    function setCoords ( lat, lng, options, fn ) {
        var loc = setPosition( options, lat, lng);
        if ( $.isFunction(fn) ) {
            decodeAddress(loc, options, fn);
        }
    }

    function resolveType ( type, initial ) {
        type = mapTypes[$.inArray(type, mapTypes)];
        return type || ( initial ? mapTypes[0] : false);
    }

    function getType ( map ) {
        return map.getMapTypeId();
    }

    // sets the map type
    var setType = function ( map, type ) {
        var newType = resolveType(type, true);
        if ( newType ) {
            map.setMapTypeId(newType);
        }
    };

    // Reversed geocoding: convert coordinates to address, calls callback when ready
    function decodeAddress ( latlong, options, callback ) {
        geocoder.geocode({
            latLng: latlong
        }, function ( results, status ) {
            var val = '';
            if ( status === gmaps.GeocoderStatus.OK ) {
                if ( options.components ) {
                    val = results[0].address_components;
                } else {
                    $.each(results[0].address_components, function (key, value ) {
                        if ( key > 0 ) {
                            val = val + ', ';
                        }
                        val = val + value.long_name;
                    });
                }
                callback(val);
            } else {
                triggerError(2, status);
                callback(false);
            }
        });
    }

    // Geocoding: convert address to coordinates, calls callback when ready
    function codeAddress ( address, callback) {
        geocoder.geocode({
            address: address
        }, function ( results, status ) {
            if ( status === gmaps.GeocoderStatus.OK ) {
                callback(results[0].geometry.location);
            } else {
                triggerError(2, status);
                callback(false);
            }
        });
    }

    function Setmap( options, element ) {
        this.element = $( element );
        this.options = $.setmap.defaultOptions;
        this.option( options );
        this._init( true );
    }

    $.extend( Setmap.prototype, {

        // initializes the map instance
        _init: function ( initial ) {

            var _this, mapDOMElement;

            if (!initial) {
                return;
            }

            _this = this;
            mapDOMElement = this.element[0];

            if ( this.element.attr('style') !== undefined ) {
                this.element.data(
                    'style' + dotNamespace,
                    this.element.attr('style') + ''
                );
            }

            // sets the map type
            this.options.map.type = resolveType(this.options.map.type, true);

            // sets the animation
            this.options.markerOptions.animation = gmaps.Animation[
                markerAnimations[
                    $.inArray(
                        this.options.markerOptions.animation.toUpperCase(),
                        markerAnimations
                    )
                ] || markerAnimations[0]
            ];

            // set the disabled property
            if ( this.options.map.disabled !== false ) {
                this.options.map.disabled = true;
            }

            // sets the zoom controls style
            this.options.map.zoomControls = gmaps.ZoomControlStyle[
                zoomControls[
                    $.inArray(
                        this.options.map.zoomControls.toUpperCase(),
                        zoomControls
                    )
                ] || zoomControls[0]
            ];

            function callback () {
                var initCallback = $.isFunction(_this.options.init) ?
                    _this.options.init :
                    $.noop;

                _this.options.latlng = new gmaps.LatLng(_this.options.map.center.lat, _this.options.map.center.lng);
                try {
                    _this.options.mapObj = new gmaps.Map(mapDOMElement, {
                        zoom: _this.options.map.zoom,
                        center: _this.options.latlng,
                        mapTypeId: _this.options.map.type,
                        zoomControlOptions: {
                            style: _this.options.map.zoomControls
                        },
                        draggable: _this.options.map.draggable,
                        disableDefaultUI: _this.options.map.disabled === true,
                        scrollwheel: _this.options.map.disabled === false,
                        keyboardShortcuts: _this.options.map.disabled === false,
                        disableDoubleClickZoom: _this.options.map.disabled === true,
                        streetViewControl: _this.options.map.streetView
                    });

                    if ( $.isFunction(_this.options.center) ) {

                        _this.options.mapCenterListener = gmaps.event.addListener(
                            _this.optionsmapObj,
                            'center_changed',
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

                    if ( $.isFunction(_this.options.type) ) {

                        _this.options.mapCenterListener = gmaps.event.addListener(
                            _this.options.mapObj,
                            'maptypeid_changed',
                            function () {
                                _this.options.type.call({
                                    type: getType(this)
                                });
                            }
                        );
                    }

                    if( ! $.isArray(_this.options.markers ) ) {
                        triggerError(5);
                        initCallback(false);
                        return false;
                    }

                    _this.options.markerObjects = [];

                    $.each(_this.options.markers, function ( index, value ) {
                        var markerOptions = {
                            map: _this.options.mapObj,
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
                        listener;

                        if ( $.isFunction(_this.options.drop) &&
                            markerOptions.draggable === true ) {
                            listener = gmaps.event.addListener(
                                markerObj,
                                'dragend',
                                function ( event ) {
                                    decodeAddress(event.latLng, _this.options, function ( address ) {
                                        _this.options.drop.call({
                                            id: index,
                                            position: {
                                                lat: event.latLng.lat(),
                                                lng: event.latLng.lng(),
                                                address: address
                                            },
                                            map: mapDOMElement
                                        });
                                    });
                                }
                            );
                        }

                        _this.options.markerObjects.push({
                            obj: markerObj,
                            listener: listener,
                            id: index
                        });

                    });

                    initCallback(true);
                } catch ( ex ) {
                    triggerError(ex.message);
                    initCallback(false);
                }
            }

            if ( _this.options.map.current ) {
                if ( navigator.geolocation ) {
                    navigator.geolocation.getCurrentPosition(function ( position ) {
                        _this.options.map.center = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        callback();
                    }, function () {
                        // user refuses HTML geolocation or the geolocation service failed
                        triggerError(0);
                        callback();
                    });
                } else {
                    // Browser doesn'true support Geolocation
                    triggerError(1);
                    callback();
                }
            } else {
                callback();
            }
        },

        // returns the google.maps.Map object of the map
        getMap: function () {
            return this.options.mapObj;
        },

        // gets or sets the zoom level of the map
        zoom: function ( zoomLevel ) {

            if ( zoomLevel === undefined ) {
                return this.options.mapObj.getZoom();
            }

            if ( typeof zoomLevel === 'number' && zoomLevel > 0 ) {
                this.options.mapObj.setZoom(zoomLevel);
            }
        },

        // gets or sets the center of the map
        center: function ( lat, lng, callback ) {
            if ( typeof lat === 'number' &&
                ( typeof lng === 'number' || lng === undefined ) ) {
                setCoords(lat, lng, this.options, callback);
                return;
            }

            if ( typeof lat === 'string' &&
                ( lng === undefined || $.isFunction(lng) ) ) {
                setAddress(lat, this.options, lng);
                return;
            }

            return this.options.mapObj.getCenter();
        },

        // gets or sets the map type
        type: function ( type ) {
            if ( type === undefined ) {
                return getType(this.options.mapObj);
            }

            setType.call(this.options.mapOjb, type);
        },

        // set option(s) or get a single option
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

        // destroy the map instance
        destroy: function () {
            if ( ! $.isPlainObject(this.options) ) {
                if ( this.element.data('style' + dotNamespace) !== undefined ) {
                    this.element.attr('style', this.element.data('style' + dotNamespace));
                } else {
                    this.element.removeAttr('style');
                }
                this.element.removeData('object' + dotNamespace);
                this.element.removeData('style' + dotNamespace);
                this.element.unbind(dotNamespace);
                this.element.empty();
                if ( this.options.listener ) {
                    gmaps.event.removeListener(this.options.listener);
                }
                return this.element;
            } else {
                return this.element;
            }
        }
    });

    $.fn.setmap = function( options ) {

        if ( typeof options === 'object' && ! $.isPlainObject(options) ) {
            triggerError(3);
            return this;
        }

        if ( typeof options === 'string' ) {

            // call method
            var args = Array.prototype.slice.call( arguments, 1 );

            this.each(function () {

                var instance = $.data( this, 'setmap.setmap'),
                    returned;

                if (!instance ) {
                    if ( Setmap.defaultOptions.requireInit === false ) {
                        $( this ).setmap();
                        instance = $.data( this, 'setmap.setmap' );
                    } else {
                        throw new Error(
                            '[setmap] Cannot call methods on setmap prior to initialization; ' +
                            'attempted to call method \'' + options + '\''
                        );
                    }
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
                    return returned;
                }

            });
        } else {
            this.each(function () {
                var instance = $.data( this, 'setmap.setmap' );
                if ( instance ) {
                    // apply options & init
                    instance.option( options || {} );
                    instance._init( false );
                } else {
                    // initialize new instance
                    options = $.extend( true, {}, $.data( this ), options );
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
