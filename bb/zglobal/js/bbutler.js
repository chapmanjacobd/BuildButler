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

  return pub;
})();

bbutler.Schematic = (function(d3, helpers) {

  /**
   * Fetches an SVG file asynchronously from the server and imports a copy of it into the current document.
   *
   * @param {string} the filename of the file to fetch from the server
   * @returns {Node} The SVG file as a node that has not been inserted yet into the document tree
   */
  var importSVG = function(filename) {
    d3.xml(filename, "image/svg+xml", function(error, xml) {
      if (error) return console.error(error);

      return document.importNode(xml.documentElement, true);
    });
  }

  /**
   * @param {Node} an SVG document to traverse
   * @returns
   */
  var extractProductStructureFromBuildSVG = function(node) {

  }

  var assemble = function() {

      var svgEl = parentSelection.node().appendChild(importedNode);
      var svg = d3.select(svgEl);

      var features = d3.select("g#Capacitors")

      var zoom = d3.behavior.zoom()
        .translate([0, 0])
        .scale(1)
        .scaleExtent([-2, 9])
        .on("zoom", zoomed);

      svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .call(zoom);

      function zoomed() {
        features.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      }
  }

  var extractId = function(htmlId) {
    return htmlId.indexOf(0) === '_' ? htmlId.substring(1) : htmlId;
  }

  return {
    assemble: assemble
  }
})(d3);

bbutler.Main = (function(schematic, helpers) {

  var bindInvertButton = function() {
    var invertEl = document.querySelector("#invert");
    invertEl.addEventListener('click', function() {
      helpers.toggleClass(document.documentElement, "inverted")
    });
  }

  var init = function() {
    schematic.assemble();
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