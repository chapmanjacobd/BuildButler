// bbutler.js
// Copyright Jacob Chapman 2013-2014
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation version 3 of the License.
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

var bbutler = bbutler || {};

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

  return pub;
})();

bbutler.PartSelection = (function(helpers) {

  var searchField = document.querySelector("#search");

  searchField.on('keyup', function(event) {

  });

  var init = function(el, parts) {

  }

  return {
    init: init,
    filter: function(query) {},
    clearFilter: clearFilter
  }

})(bbutler.Helpers);

bbutler.Schematic = (function(svgPanZoom, partSelection, helpers) {

  var buildButler = document.querySelector('#build');
  var selectedPart, panZoomSchematic;

  /**
   * Fetches an SVG file asynchronously from the server and imports a copy of it into the current document.
   *
   * @param {string} the filename of the file to fetch from the server
   * @returns {Node} The SVG file as a node that has not been inserted yet into the document tree
   */
  var importSVG = function(filename, callback) {
    helpers.getXml(filename, 'image/svg+xml', function(xml) {
      // if (error) return console.error(error);

      var imported = document.importNode(xml.documentElement, true);

      callback(imported);
    });
  }

  /**
   * Assembles schematic and inserts into the document tree.
   *
   */
  var assembleSchematic = function(el, callback) {

    function withSchematicDimensions(svg) {
      var rect = svg.createSVGRect();
      rect.width = parseFloat(svg.getAttribute('width'));
      rect.height = parseFloat(svg.getAttribute('height'));

      return rect;
    }

    /**
     * Creates an <image> element of the base schematic.
     *
     * @param {SVGRect} the dimensions of the SVG.
     * @param {String} name of the schematic image file
     * @returns {Element} an <image> element ready to insert into a document tree
     */
    function createBaseSchematic(viewportDimensions, filename) {

      var baseImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      baseImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', filename);
      baseImage.setAttribute('x', 0);
      baseImage.setAttribute('y', 0);
      baseImage.setAttribute('width', viewportDimensions.width);
      baseImage.setAttribute('height', viewportDimensions.height);

      return baseImage;
    }

    function appendSchematic(svg) {
      var baseSchematicElement = createBaseSchematic(withSchematicDimensions(svg), 'base.svg');
      svg.insertBefore(baseSchematicElement, svg.firstChild);

      return el.appendChild(svg);
    }

    importSVG('build.svg', function(svg) {
      var schematicElement = appendSchematic(svg);
      callback(schematicElement);
    });
  }

  var getPartsFromSchematic = function(schematicEl) {

  }

  var init = function() {
    assembleSchematic(buildButler, function(schematic) {
      panZoomSchematic = svgPanZoom(schematic);

      var parts = getPartsFromSchematic(schematic);
      partSelection.init(parts);
    });
  }

  var extractId = function(htmlId) {
    return htmlId.indexOf(0) === '_' ? htmlId.substring(1) : htmlId;
  }

  var selectPart = function(id) {
    selectedPart = extractId(id);
  }

  var isPartSelected = function() {
    return selectedPart !== null;
  }

  var reset = function() {
    panZoomSchematic.resetZoom();
    panZoomSchematic.center();
  }

  return {
    init: init,
    selectedPart: selectedPart,
    reset: reset,
    selectPart: function(id) { selectPart(id) }
  }
})(svgPanZoom, bbutler.PartSelection, bbutler.Helpers);

bbutler.Main = (function(schematic, helpers) {

  var bindInvertButton = function() {
    var invertEl = document.querySelector("#invert");
    invertEl.addEventListener('click', function() {
      helpers.toggleClass(document.documentElement, "inverted")
    });
  }

  var init = function() {
    schematic.init();
    bindInvertButton();
  }

  return {
    init: init
  }
})(bbutler.Schematic, bbutler.Helpers);

//preventdoubletapzoom
/*
(function($) {
  $.fn.nodoubletapzoom = function() {
      $(this).bind('touchstart', function preventZoom(e) {
        var t2 = e.timeStamp
          , t1 = $(this).data('lastTouch') || t2
          , dt = t2 - t1
          , fingers = e.originalEvent.touches.length;
        $(this).data('lastTouch', t2);
        if (!dt || dt > 500 || fingers > 1) return; // not double-tap

        e.preventDefault(); // double tap - prevent the zoom
        $(this).trigger('click').trigger('click');
      });
  };
})(jQuery);
*/

document.addEventListener('DOMContentLoaded', bbutler.Main.init);