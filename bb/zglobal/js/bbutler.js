// bbutler.js
// Copyright Jacob Chapman 2013-2014
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation version 3 of the License.
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

var buildButler = (function(bbutler, window, document) {

  'use strict';


  // BuildButler.Helpers
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

    pub.hasClass = function(el, className) {
      if (el.classList)
        el.classList.contains(className);
      else
        new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
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

    pub.isSvgShape = function (node) {
      return (
           node instanceof SVGPathElement
        || node instanceof SVGRectElement
        || node instanceof SVGCircleElement
        || node instanceof SVGEllipseElement
        || node instanceof SVGLineElement
        || node instanceof SVGPolylineElement
        || node instanceof SVGPolygonElement
      );
    }

    return pub;
  })();


  // BuildButler.Schematic
  bbutler.Schematic = (function(svgPanZoom, helpers) {

    var build = document.querySelector('#build');
    var selectedPart, schematic, panZoomSchematic;

    var svgNS = 'http://www.w3.org/2000/svg',
      xlinkNS = 'http://www.w3.org/1999/xlink';

    /**
     * Assembles schematic and inserts into the document tree.
     */
    var assemble = function() {

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
        schematic.addEventListener('click', function(e) {
          var target = e.target;

          if (helpers.isSvgShape(target)) {
            var partClicked = helpers.createApplicationEvent('buildbutler.partclicked', { partId: target.id });
            target.dispatchEvent(partClicked);
          }
        }, false);

        document.addEventListener('buildbutler.partclicked', function(e) {
          selectPartById(e.detail.partId);
        }, false);
      }

      function setupPanZoom(el) {
        panZoomSchematic = svgPanZoom(el);
      }

      importSVG('build.svg', function(imported) {
        var schematicElement = appendSchematic(imported);
        setupTooltips(schematicElement);
        registerEventHandlers(schematicElement);
        setupPanZoom(schematicElement);

        schematic = schematicElement;

        var schematicAssembled = helpers.createApplicationEvent('buildbutler.schematicassembled');
        schematicElement.dispatchEvent(schematicAssembled);
      });
    }

    var selectPart = function(part) {
      if (part == null || part === selectedPart) return;

      if (isPartSelected()) helpers.removeClass(selectedPart, 'selectedpart');
      helpers.addClass(part, 'selectedpart');

      selectedPart = part;

      var partSelected = helpers.createApplicationEvent('buildbutler.partselected');
      part.dispatchEvent(partSelected);
    }

    var isPartSelected = function() {
      return selectedPart != null;
    }

    var selectPartById = function(id) {
      var part = schematic.getElementById(id);
      selectPart(part);
    }

    var reset = function() {
      panZoomSchematic.resetZoom();
      panZoomSchematic.center();
    }

    return {
      assemble: assemble,
      getSelectedPartId: function() { return selectedPart ? selectedPart.id : ""; },
      title: function() { return build; },
      reset: reset,
      selectPartById: selectPartById
    }
  })(svgPanZoom, bbutler.Helpers);


  // BuildButler.PartList
  bbutler.PartList = (function(helpers) {

    var searchField = document.querySelector("#search"),
        partList = document.querySelector(".partlist");

    var partListFragment = document.createDocumentFragment();

    var extractPartNumber = function(htmlId) {
      return htmlId.indexOf('_') === 0 ? htmlId.substring(1) : htmlId;
    }

    var traversePartsFromSchematic = function(schematic, action) {

      var traverseParts = function(node, action) {
        for(var child = node.lastChild; child; child = child.previousSibling) {
          traverseParts(child, action);
        }
        action(node);
      }

      traverseParts(schematic, action);
    }

    var appendToPartsList = function(node) {

      function createOrderedList(className) {
        var ol = document.createElement('ol');
        ol.setAttribute('class', className);

        return ol;
      }

      function createHyperlink(partId) {
        var link = document.createElement('a');
        link.textContent = extractPartNumber(partId);
        link.href = window.location.href + '#' + partId;

        return link;
      }

      function initializeCategoryPartList(parent, category) {
        var categoryList = createOrderedList('category ' + category);

        var categoryListItem = categoryList.appendChild(document.createElement('li'));

        var categorySpan = document.createElement('span');
        categorySpan.className = 'name';
        categorySpan.textContent = category;
        categoryListItem.appendChild(categorySpan);

        var categoryPartList = createOrderedList('parts');
        categoryListItem.appendChild(categoryPartList);

        parent.appendChild(categoryList);

        return categoryPartList;
      }

      if (node.id && helpers.isSvgShape(node)) {
        var listItem = document.createElement('li');
        var link = createHyperlink(node.id);
        listItem.appendChild(link);

        if (node.parentNode.id && node.parentNode instanceof SVGGElement) {
          var category = node.parentNode.id,
              selector = '.' + category + ' ol.parts',
              categoryPartList = partListFragment.querySelector(selector);

          if (categoryPartList == null) {
            categoryPartList = initializeCategoryPartList(partListFragment, category);
          }

          categoryPartList.appendChild(listItem);

        } else {
          var uncategorized = partListFragment.querySelector('ol.uncategorized');

          if (uncategorized == null) {
            var uncategorizedList = createOrderedList('uncategorized');
            partListFragment.appendChild(uncategorizedList);
            uncategorized = uncategorizedList;
          }

          uncategorizedList.appendChild(listItem);
        }
      }
    }

    var init = (function() {

      document.addEventListener('buildbutler.schematicassembled', function(e) {
        var schematic = e.target;
        traversePartsFromSchematic(schematic, appendToPartsList);
        partList.appendChild(partListFragment);

        var partListLoaded = helpers.createApplicationEvent('buildbutler.partlistloaded');
        partList.dispatchEvent(partListLoaded);
      });

      document.addEventListener('buildbutler.partselected', function(e) {
        var previousSelection = partList.querySelector('.selectedpart'),
            selected = partList.querySelector('a[href$="' + e.target.id + '"]').parentNode;

        if (previousSelection === selected) return;

        if (previousSelection) helpers.removeClass(previousSelection, 'selectedpart');
        helpers.addClass(selected, 'selectedpart');
      });

      partList.addEventListener('click', function(e) {
        var target = e.target;

        if (target instanceof HTMLAnchorElement) {
          var partId = target.hash.substring(1);

          e.preventDefault();

          var partClicked = helpers.createApplicationEvent('buildbutler.partclicked', { partId: partId });
          target.dispatchEvent(partClicked);
        }
      });

      searchField.addEventListener('keyup', function(event) {

      });

    })();

    var clearFilter = function() { }

    return {
      filter: function(query) {},
      clearFilter: clearFilter
    }

  })(bbutler.Helpers);


  // BuildButler.Main
  bbutler.Main = (function(schematic, partList, helpers) {

    var bindInvertButton = function() {
      var invertEl = document.querySelector("#invert");
      invertEl.addEventListener('click', function() {
        helpers.toggleClass(document.documentElement, "inverted")
      });
    }

    var selectStartupPartViaUrlHash = function() {
      var hash = window.location.hash;

      if (hash) {
        var partId = hash.substring(1);
        schematic.selectPartById(partId);
      }
    }

    var init = function() {
      schematic.assemble();
      bindInvertButton();

      document.addEventListener('buildbutler.partlistloaded', selectStartupPartViaUrlHash);
    }

    return {
      init: init
    }
  })(bbutler.Schematic, bbutler.PartList, bbutler.Helpers);

  document.addEventListener('DOMContentLoaded', bbutler.Main.init);

  return bbutler;

})(buildButler || {}, window, document);