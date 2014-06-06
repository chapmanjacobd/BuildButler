// bbutler.js
// Copyright Jacob Chapman 2013-2014
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation version 3 of the License.
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

var buildButler = (function(bbutler, window, document) {

  'use strict';

  bbutler.Helpers = (function() {

    var pub = {};

    pub.toggleClass = function(el, className) {
      if (el.classList) {
        el.classList.toggle(className);
      } else {
        // This implementation works for >= IE9
        var classes = el.className.split(' ');
        var existingIndex = classes.indexOf(className);

        if (existingIndex >= 0)
          classes.splice(existingIndex, 1);
        else
          classes.push(className);

        el.className = classes.join(' ');
      }
    }

    pub.addClass = function(el, className) {
      if (el.classList)
        el.classList.add(className);
      else
        el.className += ' ' + className;
    }

    pub.removeClass = function(el, className) {
      if (el.classList)
        el.classList.remove(className);
      else
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }

    pub.getXml = function(url, mimeType, success) {
      var request = new XMLHttpRequest();
      request.open('GET', url, true);

      request.responseType = 'document';
      request.overrideMimeType(mimeType);

      request.onload = function() {
        if (request.status >= 200 && request.status < 400){
          // Success!
          success(request.responseXML);
        } else {
          // We reached our target server, but it returned an error
          console.log("oops");
        }
      };

      request.onerror = function() {
        console.log("There was a connection error of some sort");
      };

      request.send();
    }

    /**
     * Create an application event. (IE9+)
     *
     * @param {string} type The type of event
     * @param {any} detail Custom information to pass along with the event
     */
    pub.createApplicationEvent = function(type, detail) {
      if (window.CustomEvent)
        var event = new CustomEvent(type, { bubbles: true, cancelable: true, detail: detail });
      else {
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent(type, true, true, detail);
      }

      return event;
    }

    pub.contains = function(array, search) {
      return (array.indexOf(search) >= 0)
    }

    return pub;
  })();

  bbutler.Schematic = (function(svgPanZoom, helpers) {

    var build = document.querySelector('#build');

    var svgNS = 'http://www.w3.org/2000/svg',
      xlinkNS = 'http://www.w3.org/1999/xlink';

    var selectedPart, panZoomSchematic;

    /**
     * Fetches an SVG file asynchronously from the server and imports a copy of it into the current document.
     *
     * @param {string} filename The filename of the file to fetch from the server
     * @param {function} callback The callback that will be called (with the imported document node) after the SVG is received
     */
    var importSVG = function(filename, callback) {
      helpers.getXml(filename, 'image/svg+xml', function(xml) {
        var imported = document.importNode(xml.documentElement, true);
        callback(imported);
      });
    }

    var extractPartNumber = function(htmlId) {
      return htmlId.indexOf('_') === 0 ? htmlId.substring(1) : htmlId;
    }

    /**
     * Assembles schematic and inserts into the document tree.
     *
     * @param {function} callback The function to call when the assembly is complete.
     */
    var assemble = function(callback) {

      // dirty hack
      function withSchematicDimensions(svg) {
        var rect = svg.createSVGRect();
        rect.width = parseFloat(svg.getAttribute('width'));
        rect.height = parseFloat(svg.getAttribute('height'));

        return rect;
      }

      /**
       * Creates an <image> element of the base schematic.
       *
       * @param {SVGRect} rect the dimensions of the SVG.
       * @param {string} filename the name of the schematic image file
       * @returns {Element} an <image> element ready to insert into a document tree
       */
      function createBaseSchematic(rect, filename) {
        var baseImage = document.createElementNS(svgNS, 'image');
        baseImage.setAttributeNS(xlinkNS, 'href', filename);
        baseImage.setAttribute('x', 0);
        baseImage.setAttribute('y', 0);
        baseImage.setAttribute('width', rect.width);
        baseImage.setAttribute('height', rect.height);

        return baseImage;
      }

      function appendSchematic(svg) {
        var baseSchematicElement = createBaseSchematic(withSchematicDimensions(svg), 'base.svg');
        svg.insertBefore(baseSchematicElement, svg.firstChild);

        return build.appendChild(svg);
      }

      function setupTooltips(schematic) {

      }

      function registerEventHandlers(schematic) {
        schematic.addEventListener('click', function(event) {
          selectPart(event.target);
        });
      }

      function setupPanZoom(el) {
        panZoomSchematic = svgPanZoom(el);
      }

      importSVG('build.svg', function(imported) {
        var schematicElement = appendSchematic(imported);
        setupTooltips(schematicElement);
        registerEventHandlers(schematicElement);
        setupPanZoom(schematicElement);

        callback(schematicElement);
      });
    }

    var isShape = function (el) {
      var shapes =  ['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'];
      return helpers.contains(shapes, el.tagName);
    }

    var selectPart = function(part) {
      if (part == null || !isShape(part)) return;
      if (part === selectedPart) return;

      if (isPartSelected()) helpers.removeClass(selectedPart, 'selectedpart');
      helpers.addClass(part, 'selectedpart');

      selectedPart = part;

      var event = helpers.createApplicationEvent('bbutler.partselected');
      part.dispatchEvent(event);
    }

    var isPartSelected = function() {
      return selectedPart != null;
    }

    var selectPartById = function(id) {
      var part = build.querySelector(id);
      selectPart(part);
    }

    var reset = function() {
      panZoomSchematic.resetZoom();
      panZoomSchematic.center();
    }

    return {
      assemble: assemble,
      getSelectedPartNumber: function() { return selectedPart ? extractPartNumber(selectedPart.id) : "No part selected"; },
      title: function() { return build; },
      reset: reset,
      selectPartById: selectPartById
    }
  })(svgPanZoom, bbutler.Helpers);

  bbutler.PartList = (function(schematic, helpers) {

    var searchField = document.querySelector("#search");

    var getPartsFromSchematic = function(schematic) {

    }

    var init = function() {

      var parts = getPartsFromSchematic(schematic);

      searchField.addEventListener('keyup', function(event) {

      });

    }

    var clearFilter = function() { }

    return {
      init: init,
      filter: function(query) {},
      clearFilter: clearFilter
    }

  })(bbutler.Schematic, bbutler.Helpers);

  bbutler.Main = (function(schematic, partList, helpers) {

    var bindInvertButton = function() {
      var invertEl = document.querySelector("#invert");
      invertEl.addEventListener('click', function() {
        helpers.toggleClass(document.documentElement, "inverted")
      });
    }

    var init = function() {
      schematic.assemble(partList.init);
      bindInvertButton();
    }

    return {
      init: init
    }
  })(bbutler.Schematic, bbutler.PartList, bbutler.Helpers);

  document.addEventListener('DOMContentLoaded', bbutler.Main.init);

  return bbutler;

})(buildButler || {}, window, document);