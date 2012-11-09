window.type = window.QUnit.type = function(item, expected, msg) {
	var actual = typeof item;
	window.QUnit.strictEqual(actual, expected, msg || ("Item is of type " + expected));
};
