/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
(function( $, window, navigator, gmaps, undefined ) {

	/*
		======== A Handy Little QUnit Reference ========
		http://docs.jquery.com/QUnit

		Test methods:
			expect(numAssertions)
			stop(increment)
			start(decrement)
		Test assertions:
			ok(value, [message])
			equal(actual, expected, [message])
			notEqual(actual, expected, [message])
			deepEqual(actual, expected, [message])
			notDeepEqual(actual, expected, [message])
			strictEqual(actual, expected, [message])
			notStrictEqual(actual, expected, [message])
			raises(block, [expected], [message])
	*/

	module( "jQuery#setmap", {
		setup: function() {
			this.elems = $( "#qunit-fixture" ).children();
		}
	});

	test( "is chainable", 1, function() {
		// Not a bad test to run on collection methods.
		strictEqual( this.elems.setmap(), this.elems, "should be chainable" );
	});

	test( "is setmap", 1, function() {
		type( this.elems.setmap().data( "setmap" ), "object", "should be thoroughly setmap" );
	});

	module( "jQuery.setmap", {
		setup: function() {
			this.elems = $( "#qunit-fixture" ).children();
		}
	});

	test( "is setmap", 2, function() {
		type( $.setmap, "function", "should be thoroughly setmap" );
		ok( new $.setmap( this.elems[0] ) instanceof $.setmap );
	});

	module( "jQuery.setmap.helpers" );

	test( "createLatLng", 4, function() {
		var lat = 50.4,
		lng = -138.005,
		latLng = $.setmap.createLatLng( lat, lng );
		ok( latLng instanceof gmaps.LatLng, "should create google.maps.LatLng instance");
		ok ( new gmaps.LatLng( lat, lng ).equals( latLng ) , "original LatLng's position should have equal position" );
		strictEqual( latLng.lat(), lat, "LatLng instance should have given latitude" );
		strictEqual( latLng.lng(), lng, "LatLng instance should have given longitude" );
	});

	test( "createPoint", 4, function() {
		var x = 45,
		y = -34,
		point = $.setmap.createPoint( x, y);
		ok( point instanceof gmaps.Point, "should create google.maps.Point instance");
		ok ( new gmaps.Point( x, y ).equals( point ) , "original Point's position should have equal position" );
		strictEqual( point.x, x, "Point instance should have given x" );
		strictEqual( point.y, y, "Point instance should have given y" );
	});

	test( "createMarker", 1, function() {
		var opts = {},
		marker = $.setmap.createMarker( opts );
		ok( marker instanceof gmaps.Marker );
	});

	test( "createLatLng", 1, function() {
		ok( $.setmap.createLatLng() instanceof gmaps.LatLng );
	});

	module( ":setmap selector", {
		setup: function() {
			this.elems = $( "#qunit-fixture" ).children().last().setmap().end();
		}
	});

	test( "is setmap", 1, function() {
		// Use deepEqual & .get() when comparing jQuery objects.
		deepEqual( this.elems.filter( ":setmap" ).get(), this.elems.last().get(), "knows setmap when it sees it" );
	});

}( jQuery, window, window.navigator, window.google.maps ));
