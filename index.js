'use strict';

var IsCallable = require('es-abstract/2019/IsCallable');
var RequireObjectCoercible = require('es-abstract/2019/RequireObjectCoercible');
var define = require('define-properties');

var hasSets = typeof Set !== 'undefined' && IsCallable(Set);

var setValues;
if (hasSets) {
	setValues = Set.prototype.values;
}
var push = Array.prototype.push;

// polyfilled Sets with es6-shim might exist without for..of
var iterateWithWhile = function (set, receive) {
	var values = setValues.call(set);
	var next;
	do {
		next = values.next();
	} while (!next.done && receive(next.value));
};

var iterate = (function () {
	try {
		// Safari 8's native Set can't be iterated except with for..of
		return Function('setValues', 'set', 'receive', 'for (var value of setValues.call(set)) { receive(value); }').bind(null, setValues);
	} catch (e) {
		/* for..of seems to not be supported */
	}
	return iterateWithWhile;
}());

var requireSet = function requireGlobalSet() {
	if (!hasSets) {
		throw new TypeError('Set.prototype.toJSON requires Set (either native, or polyfilled with es6-shim)');
	}
};

var setToJSONshim = function toJSON() {
	RequireObjectCoercible(this);
	requireSet();
	var values = [];
	iterate(this, push.bind(values));
	return values;
};

var boundSetToJSON = function setToJSON(set) {
	RequireObjectCoercible(set);
	return setToJSONshim.call(set);
};
define(boundSetToJSON, {
	method: setToJSONshim,
	shim: function shimSetPrototypeToJSON() {
		requireSet();
		define(Set.prototype, {
			toJSON: setToJSONshim
		});
		return Set.prototype.toJSON;
	}
});

module.exports = boundSetToJSON;
