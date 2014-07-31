/**
 * http://www.openjs.com/scripts/events/keyboard_shortcuts/
 * Version : 2.01.B
 * By Binny V A
 * License : BSD
 */
shortcut = {
  'all_shortcuts': {}, //All the shortcuts are stored in this array
  'add': function (shortcut_combination, callback, opt) {
    //Provide a set of default options
    var default_options = {
      'type': 'keydown',
      'propagate': false,
      'disable_in_input': false,
      'target': document,
      'keycode': false
    };
    if (!opt) opt = default_options;
    else {
      for (var dfo in default_options) {
        if (typeof opt[dfo] == 'undefined') opt[dfo] = default_options[dfo];
      }
    }

    var ele = opt.target;
    if (typeof opt.target == 'string') ele = document.getElementById(opt.target);
    var ths = this;
    shortcut_combination = shortcut_combination.toLowerCase();

    //The function to be called at keypress
    var func = function (e) {
      e = e || window.event;

      if (opt['disable_in_input']) { //Don't enable shortcut keys in Input, Textarea fields
        var element;
        if (e.target) element = e.target;
        else if (e.srcElement) element = e.srcElement;
        if (element.nodeType == 3) element = element.parentNode;

        if (element.tagName == 'INPUT' || element.tagName == 'TEXTAREA') return;
      }

      //Find Which key is pressed
      if (e.keyCode) code = e.keyCode;
      else if (e.which) code = e.which;
      var character = String.fromCharCode(code).toLowerCase();

      if (code == 188) character = ","; //If the user presses , when the type is onkeydown
      if (code == 190) character = "."; //If the user presses , when the type is onkeydown

      var keys = shortcut_combination.split("+");
      //Key Pressed - counts the number of valid keypresses - if it is same as the number of keys, the shortcut function is invoked
      var kp = 0;

      //Work around for stupid Shift key bug created by using lowercase - as a result the shift+num combination was broken
      var shift_nums = {
        "`": "~",
        "1": "!",
        "2": "@",
        "3": "#",
        "4": "$",
        "5": "%",
        "6": "^",
        "7": "&",
        "8": "*",
        "9": "(",
        "0": ")",
        "-": "_",
        "=": "+",
        ";": ":",
        "'": "\"",
        ",": "<",
        ".": ">",
        "/": "?",
        "\\": "|"
      };
      //Special Keys - and their codes
      var special_keys = {
        'esc': 27,
        'escape': 27,
        'tab': 9,
        'space': 32,
        'return': 13,
        'enter': 13,
        'backspace': 8,

        'scrolllock': 145,
        'scroll_lock': 145,
        'scroll': 145,
        'capslock': 20,
        'caps_lock': 20,
        'caps': 20,
        'numlock': 144,
        'num_lock': 144,
        'num': 144,

        'pause': 19,
        'break': 19,

        'insert': 45,
        'home': 36,
        'delete': 46,
        'end': 35,

        'pageup': 33,
        'page_up': 33,
        'pu': 33,

        'pagedown': 34,
        'page_down': 34,
        'pd': 34,

        'left': 37,
        'up': 38,
        'right': 39,
        'down': 40,

        'f1': 112,
        'f2': 113,
        'f3': 114,
        'f4': 115,
        'f5': 116,
        'f6': 117,
        'f7': 118,
        'f8': 119,
        'f9': 120,
        'f10': 121,
        'f11': 122,
        'f12': 123
      };

      var modifiers = {
        shift: {
          wanted: false,
          pressed: false
        },
        ctrl: {
          wanted: false,
          pressed: false
        },
        alt: {
          wanted: false,
          pressed: false
        },
        meta: {
          wanted: false,
          pressed: false
        } //Meta is Mac specific
      };

      if (e.ctrlKey) modifiers.ctrl.pressed = true;
      if (e.shiftKey) modifiers.shift.pressed = true;
      if (e.altKey) modifiers.alt.pressed = true;
      if (e.metaKey) modifiers.meta.pressed = true;

      for (var i = 0; k = keys[i], i < keys.length; i++) {
        //Modifiers
        if (k == 'ctrl' || k == 'control') {
          kp++;
          modifiers.ctrl.wanted = true;

        } else if (k == 'shift') {
          kp++;
          modifiers.shift.wanted = true;

        } else if (k == 'alt') {
          kp++;
          modifiers.alt.wanted = true;
        } else if (k == 'meta') {
          kp++;
          modifiers.meta.wanted = true;
        } else if (k.length > 1) { //If it is a special key
          if (special_keys[k] == code) kp++;

        } else if (opt['keycode']) {
          if (opt['keycode'] == code) kp++;

        } else { //The special keys did not match
          if (character == k) kp++;
          else {
            if (shift_nums[character] && e.shiftKey) { //Stupid Shift key bug created by using lowercase
              character = shift_nums[character];
              if (character == k) kp++;
            }
          }
        }
      }

      if (kp == keys.length &&
        modifiers.ctrl.pressed == modifiers.ctrl.wanted &&
        modifiers.shift.pressed == modifiers.shift.wanted &&
        modifiers.alt.pressed == modifiers.alt.wanted &&
        modifiers.meta.pressed == modifiers.meta.wanted) {
        callback(e);

        if (!opt['propagate']) { //Stop the event
          //e.cancelBubble is supported by IE - this will kill the bubbling process.
          e.cancelBubble = true;
          e.returnValue = false;

          //e.stopPropagation works in Firefox.
          if (e.stopPropagation) {
            e.stopPropagation();
            e.preventDefault();
          }
          return false;
        }
      }
    };
    this.all_shortcuts[shortcut_combination] = {
      'callback': func,
      'target': ele,
      'event': opt['type']
    };
    //Attach the function with the event
    if (ele.addEventListener) ele.addEventListener(opt['type'], func, false);
    else if (ele.attachEvent) ele.attachEvent('on' + opt['type'], func);
    else ele['on' + opt['type']] = func;
  },

  //Remove the shortcut - just specify the shortcut and I will remove the binding
  'remove': function (shortcut_combination) {
    shortcut_combination = shortcut_combination.toLowerCase();
    var binding = this.all_shortcuts[shortcut_combination];
    delete(this.all_shortcuts[shortcut_combination]);
    if (!binding) return;
    var type = binding['event'];
    var ele = binding['target'];
    var callback = binding['callback'];

    if (ele.detachEvent) ele.detachEvent('on' + type, callback);
    else if (ele.removeEventListener) ele.removeEventListener(type, callback, false);
    else ele['on' + type] = false;
  }
}
/**
 * Copyright (c) 2012 Denis Ciccale (@tdecs)
 * MIT License
 */
/*
(function(window) {
  var document = window.document,
    nativeColorPicker = {
      // initialized flag
      started: false,

      // start color
      color: '#000000',

      // inputs where plugin was initialized
      inputs: {},

      // flag to know if color input is supported
      hasNativeColorSupport: false,

      // inits the plugin on specified input
      init: function (inputId) {
        // start the plugin
        this.start();

        if (this.hasNativeColorSupport) {
          return;
        }

        if (typeof inputId !== 'string') {
          throw 'inputId have to be a string id selector';
        }

        // set the input
        this.input = (this.inputs[inputId] = this.inputs[inputId]) || document.getElementById(inputId);

        if (!this.input) {
          throw 'There was no input found with id: "' + inputId + '"';
        }

        // input defaults
        this.input.value = this.color;
        this.input.unselectable = 'on';
        this.css(this.input, {
          backgroundColor: this.color,
          borderWidth: '0.4em 0.3em',
          width: '3em',
          cursor: 'default'
        });

        // register input event
        this.input.onfocus = function () {
          nativeColorPicker.onFocus(this.id);
        };
      },

      // initialize once
      start: function () {
        // is already started
        if (this.started) {
          return;
        }

        // test if browser has native support for color input
        try {
          this.hasNativeColorSupport = !!(document.createElement('input').type = 'color');
        } catch (e) {}

        if (!this.hasNativeColorSupport) {
          // create object element
          var object_element = document.createElement('object');
          object_element.classid = 'clsid:3050f819-98b5-11cf-bb82-00aa00bdce0b';
          // set attributes
          object_element.id = 'colorHelperObj';
          this.css(object_element, {
            width: '0',
            height: '0'
          });
          document.body.appendChild(object_element);
        }
        // mark as started
        this.started = true;
      },

      // destroys the plugin
      destroy: function (inputId) {
        var i;
        // destroy one input or all the plugin if no input id
        if (typeof inputId === 'string') {
          this.off(this.inputs[inputId]);
        } else {
          // remove helper object
          document.body.removeChild(document.getElementById('colorHelperObj'));
          // remove input events and styles
          for (i in this.inputs) {
            this.off(this.inputs[i]);
          }
          // mark not started
          this.started = false;
        }
      },

      off: function (input) {
        input.onfocus = null;
        this.css(input, {
          backgroundColor: '',
          borderWidth: '',
          width: '',
          cursor: ''
        });
      },

      // input focus function
      onFocus: function (inputId) {
        this.input = this.inputs[inputId];
        this.color = this.getColor();
        this.input.value = this.color;
        nativeColorPicker.css(this.input, {
          backgroundColor: this.color,
          color: this.color
        });
        this.input.blur();
      },

      // gets the color from the object
      // and normalize it
      getColor: function () {
        // get decimal color, (passing the previous one)
        // and change to hex
        var hex = colorHelperObj.ChooseColorDlg(this.color.replace(/#/, '')).toString(16);

        // add extra zeroes if hex number is less than 6 digits
        if (hex.length < 6) {
          var tmpstr = '000000'.substring(0, 6 - hex.length);
          hex = tmpstr.concat(hex);
        }

        return '#' + hex;
      },

      // set css properties
      css: function (el, props) {
        for (var prop in props) {
          el.style[prop] = props[prop];
        }
      }
    };

  // expose to global
  window.nativeColorPicker = nativeColorPicker;
})(window);
*/