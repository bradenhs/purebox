module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const ReactPureBox_1 = __webpack_require__(2);
	exports.createBox = ReactPureBox_1.ReactPureBox.createBox;


/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	class PureBox {
	    constructor() {
	        console.log('Hey there');
	    }
	    /**
	     * This is so cool.
	     * @returns PureBox hello
	     */
	    static createBox() {
	        return new PureBox();
	    }
	    /**
	     * Logs a message to the console
	     * @param message The message to log
	     */
	    say(message) {
	        console.log(message);
	    }
	}
	exports.PureBox = PureBox;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const PureBox_1 = __webpack_require__(1);
	class ReactPureBox extends PureBox_1.PureBox {
	    static createBox() {
	        return new ReactPureBox();
	    }
	    shout(message) {
	        this.say(message.toUpperCase());
	    }
	}
	exports.ReactPureBox = ReactPureBox;


/***/ }
/******/ ]);