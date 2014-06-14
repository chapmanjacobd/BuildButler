/**
 * @overview bbutler.js
 * @copyright Jacob Chapman, Chris Chapman 2013-2014
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software to execute the included software, without modification,
 * to use, and copy, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var buildButler = (function(window, document, bbutler) {

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

    var getXml = function(url, mimeType, success) {
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
     * Fetches an SVG file asynchronously from the server and imports a copy of it into the current document.
     *
     * @param {String} filename The filename of the file to fetch from the server
     * @param {Function} callback The callback that will be called (with the imported document node) after the SVG is received
     */
    pub.importSvgNode = function(filename, callback) {
      getXml(filename, 'image/svg+xml', function(xml) {
        var imported = document.importNode(xml.documentElement, true);
        callback(imported);
      });
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
      return (array.indexOf(search) >= 0);
    };

    /**
     * Returns the closes ancestral element that fulfills the given predicate.
     *
     * @param {Node} node the node to test
     * @param {Function} predicate the predicate with which to test the node
     * @returns {Node} the first node in the DOM that fulfills the given predicate
     */
    pub.closest = function(node, predicate) {
      while(node) {
        if (predicate(node)) return node;
        else node = node.parentNode;
      }
      return false;
    }

    /**
     * Recursively merge the properties of two objects.
     *
     * @param {Object} to the object to merge to
     * @param {Object} from the object to base the merge on
     * @returns {Object} the 'to' object with the properties of both passed objects
     */
    pub.merge = function(to, from) {
      var to = to || {};
      for (var property in from) {
        if (from.hasOwnProperty(property)) {
          to[property] = (typeof from[property] === 'object') ? this.merge(to[property], from[property]) : from[property];
        }
      }
      return to;
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

    /**
     * Tells whether the given node represents an electronic component.
     * Based on the convention that any node with an id that starts with '_' is a component.
     *
     * @returns {Boolean} true if the given node is an electronic component, false otherwise
     */
    pub.isElectronicComponent = function(node) {
      return (node.id && node.id.charAt(0) === '_');
    }

    /**
     * Finds the root component of the given component instance.
     *
     * @param {Node} instance the component instance
     * @returns the root component of the given instance, or itself if it is the root
     */
    pub.findComponentByInstance = function(instance) {
      return this.closest(instance, this.isElectronicComponent);
    }

    /**
     * Move something into view.
     *
     * @param {Element} contained the contained element
     * @param {Function} moveFunc the function that actually does the moving. Is passed the contained element.
     */
    pub.moveIntoView = function(contained, moveFunc) {
      function isScrolledIntoView(contained) {
        var container = contained.offsetParent,
            containedBounds = contained.getBoundingClientRect(),
            containerBounds = container.getBoundingClientRect();

        return ((containedBounds.bottom <= containerBounds.bottom) && (containedBounds.top >= containerBounds.top));
      }

      if (!isScrolledIntoView(contained)) moveFunc(contained);
    }

    pub.scrollIntoView = function(contained) {
      this.moveIntoView(contained, function(contained) { contained.scrollIntoView(); });
    }

    /**
     * Scroll an element smoothly into view in it's container.
     * Loosely based on {@link https://github.com/cferdinandi/smooth-scroll smooth-scroll by Chris Ferdinandi}.
     *
     * @param {Element} contained the contained element to scroll to.
     */
    pub.scrollSmoothlyIntoView = function(contained) {
      var container = contained.offsetParent,
           midpoint = (container.clientHeight - contained.offsetHeight) / 2;

      var startPosition = container.scrollTop;
      var endPosition = contained.offsetTop - midpoint;
      var animationIntervalID, animationInterval = 16;
      var distance = endPosition - startPosition;
      var timeLapsed = 0;
      var percentage, position;

      var speed = 100; // How fast to complete the scroll in milliseconds

      var easeOutQuad = function(time) { return time * (2 - time); }

      var stopAnimateScroll = function(position, endPosition, animationInterval) {
        var currentPosition = container.scrollTop;
        if (position == endPosition || currentPosition == endPosition || (container.scrollHeight - currentPosition === container.clientHeight)) {
          window.clearInterval(animationIntervalID);
        }
      }

      var loopAnimateScroll = function() {
        timeLapsed += animationInterval;
        percentage = (timeLapsed / speed);
        percentage = (percentage > 1) ? 1 : percentage;
        position = startPosition + (distance * easeOutQuad(percentage));
        container.scrollTop = Math.floor(position);
        stopAnimateScroll(position, endPosition, animationInterval);
      }

      var startAnimateScroll = function() {
        animationIntervalID = window.setInterval(loopAnimateScroll, animationInterval);
      }

      this.moveIntoView(contained, startAnimateScroll);
    }

    return pub;

  })();


  // BuildButler.Schematic
  bbutler.Schematic = (function(svgPanZoom, helpers) {

    var build = document.querySelector('#build');
    var selectedPart, schematic, panZoomSchematic;

    /**
     * Assembles schematic and inserts into the document tree.
     */
    var assemble = function(options) {

      var svgNS = 'http://www.w3.org/2000/svg',
        xlinkNS = 'http://www.w3.org/1999/xlink';

      var defaultOptions = {
        buildFilename: 'build.svg',
        baseFilename: 'base.svg',
        svgPanZoomOptions: {
          zoomScaleSensitivity: 0.1,
          maxZoom: 4,
    		  minZoom: .4
        }
      };

      /**
       * Extracts height and width attributes from an SVGSVGElement.
       *
       * @param {SVGSVGElement} svg The SVG from which to get height and width attributes
       * @returns {SVGRect} The prescribed dimensions of the SVG
       */
      function getPrescribedSvgDimensions(svg) {
        var rect = svg.createSVGRect();
        rect.width = parseFloat(svg.getAttribute('width'));
        rect.height = parseFloat(svg.getAttribute('height'));

        return rect;
      }

      /**
       * Creates an SVG image element to display the base schematic.
       *
       * @param {SVGRect} rect the dimensions of the SVG.
       * @param {String} filename the name of the schematic image file
       * @returns {SVGImageElement} an image element ready to insert into a document tree
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

      function registerEventHandlers(schematic) {
        schematic.addEventListener('click', function(e) {
          var component = helpers.findComponentByInstance(e.target);

          if (component) {
            var partClicked = helpers.createApplicationEvent('buildbutler.partclicked', { partId: component.id });
            component.dispatchEvent(partClicked);
          }
        }, false);

        document.addEventListener('buildbutler.partclicked', function(e) {
          selectPartById(e.detail.partId);
        }, false);

        schematic.addEventListener('buildbutler.schematicloaded', function() {
          helpers.addClass(loading, 'hidden');
    		}, false);
      }

      function setupPanZoom(el, options) {
        panZoomSchematic = svgPanZoom(el, options);
      }

      var doAssembly = function(importedSvgNode, options) {
        // Assumes that the base schematic and the build schematic are the same size.
        var baseSchematic = createBaseSchematic(getPrescribedSvgDimensions(importedSvgNode), options.baseFilename);
        baseSchematic.addEventListener('load', function(e) {
          var schematicLoaded = helpers.createApplicationEvent('buildbutler.schematicloaded', { schematic: importedSvgNode });
          baseSchematic.dispatchEvent(schematicLoaded);
        });
        importedSvgNode.insertBefore(baseSchematic, importedSvgNode.firstChild);

        schematic = build.appendChild(importedSvgNode);

        registerEventHandlers(schematic);
        setupPanZoom(schematic, options.svgPanZoomOptions);

        var schematicAssembled = helpers.createApplicationEvent('buildbutler.schematicassembled', { schematic: schematic });
        schematic.dispatchEvent(schematicAssembled);
      }

      options = helpers.merge(options, defaultOptions);
      helpers.importSvgNode(options.buildFilename, function(importedSvgNode) { doAssembly(importedSvgNode, options); });
    }

    var selectPart = function(part) {
      if (part == null || part === selectedPart) return;

      if (isPartSelected()) helpers.removeClass(selectedPart, 'selectedpart');
      helpers.addClass(part, 'selectedpart');

      selectedPart = part;

      var partSelected = helpers.createApplicationEvent('buildbutler.partselected', { partId: selectedPart.id });
      selectedPart.dispatchEvent(partSelected);
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


  // BuildButler.PartPanel
  bbutler.PartPanel = (function(helpers) {

    var searchField = document.getElementById('filter'),
        partList = document.getElementById('partlist'),
        selectedPartSpan = document.getElementById('selectedpart');

    var extractPartNumber = function(htmlId) {
      var nonBreakingSpace = '\xA0';
      return htmlId.indexOf('_') === 0 ? htmlId.substring(1).replace(/_/g, nonBreakingSpace) : htmlId;
    }

    /**
     * Load the part list from the structure of the schematic after the schematic has been assembled.
     */
    var loadPartList = function() {

      /**
       * Add a part to the part list.
       *
       * @param {Element} partList The element (representing the part list) to append the part to
       * @param {Element} part The part to append
       */
      var appendToPartList = function(partList, part) {

        /**
         * Helper to create an ordered list with optional classes.
         *
         * @param {...String} var_args Classes to be set as the class attribute on the new list element
         * @returns {HTMLOListElement} The new ordered list element
         */
        function createOrderedList(var_args) {
          var classes = [].slice.call(arguments);

          var ol = document.createElement('ol');
          ol.setAttribute('class', classes.join(' '));

          return ol;
        }

        /**
         * Helper to create a hyperlink to a part in the schematic.
         *
         * @param {String} partId The id of the linked part
         * @returns {HTMLAnchorElement} the new hyperlink element
         */
        function createHyperlinkToPart(partId) {
          var link = document.createElement('a');
          link.textContent = extractPartNumber(partId);
          link.className = 'part';
          link.href = '#' + partId;

          link.addEventListener('click', function(e) {
            var partClicked = helpers.createApplicationEvent('buildbutler.partclicked', { partId: partId });
            e.currentTarget.dispatchEvent(partClicked);

            e.preventDefault();
          }, false);

          return link;
        }

        /**
         * Helper to create a span element with the given quantity.
         *
         * @param {Number} quantity The quantity of parts
         * @returns {HTMLSpanElement} the new span element
         */
        function createQuantitySpan(quantity) {
          var span = document.createElement('span');
          span.className = 'quantity';
          span.textContent = '(' + quantity + ')';

          return span;
        }

        /**
         * Extract the quantity of parts from an SVG shape.
         *
         * @param {SVGElement} part The shape from which to extract the quantity
         * @returns {Number} the quantity of parts
         */
        function extractQuantity(part) {
          function isBeginningOfNewSubpath(segment) {
            return (segment instanceof SVGPathSegMovetoAbs || segment instanceof SVGPathSegMovetoRel);
          }

          if (part instanceof SVGPathElement)
            return [].filter.call(part.pathSegList, isBeginningOfNewSubpath).length;
          else if (part instanceof SVGGElement && part.hasChildNodes())
            return [].reduce.call(part.childNodes, function(previous, current) {
              return previous + extractQuantity(current);
            }, 0);
          else if (helpers.isSvgShape(part)) return 1;
          else return 0;
        }

        /**
         * Initialize a new category tree.
         *
         * @param {Node} parent The parent node upon which to append this category
         * @param {String} category The category name
         */
        function initializeCategory(parent, category) {
          var categoryList = createOrderedList('category', category);

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

        if (helpers.isElectronicComponent(part)) {
          var listItem = document.createElement('li');
          var quantitySpan = createQuantitySpan(extractQuantity(part));
          var linkToPart = createHyperlinkToPart(part.id);
          linkToPart.appendChild(quantitySpan);
          listItem.appendChild(linkToPart);

          if (part.parentNode.id && part.parentNode instanceof SVGGElement) {
            var category = part.parentNode.id,
                selector = '.' + category + ' ol.parts',
                categoryPartList = partList.querySelector(selector);

            if (categoryPartList == null) {
              categoryPartList = initializeCategory(partList, category);
            }

            categoryPartList.appendChild(listItem);

          } else {
            var uncategorized = partList.querySelector('ol.uncategorized');

            if (uncategorized == null) {
              uncategorized = partList.appendChild(createOrderedList('uncategorized'));
            }

            uncategorized.appendChild(listItem);
          }
        }
      }

      var traverseNodeInReverse = function(node, action) {

        var traverse = function(node, action) {
          for(var child = node.lastChild; child; child = child.previousSibling) {
            traverse(child, action);
          }
          action(node);
        }
        traverse(node, action);
      }

      document.addEventListener('buildbutler.schematicassembled', function(e) {
        var partListFragment = document.createDocumentFragment();

        traverseNodeInReverse(e.detail.schematic, function(node) { appendToPartList(partListFragment, node); });
        partList.appendChild(partListFragment);

        var partListLoaded = helpers.createApplicationEvent('buildbutler.partlistloaded');
        partList.dispatchEvent(partListLoaded);
      });
    }

    var updateSelectedPartSpan = function(component) {
      var link = component.querySelector('a.part'),
          quantity = link.querySelector('span.quantity');

      selectedPartSpan.innerHTML = link.innerHTML;
    }

    var bindHideListToggle = function() {
      var hidelist = document.getElementById('hidelist'),
          partlist = document.getElementById('partlist');

      hidelist.addEventListener('click', function() {
        helpers.toggleClass(hidelist, 'rotatopotato');
        helpers.toggleClass(partlist, 'hidden');
      });
    }

  	var widthMatch = matchMedia("all and (max-width 767px)");
  	var widthHandler = function(matchList) {
  		if (matchList.matches) {
  			helpers.toggleClass(hidelist, 'rotatopotato');
  			helpers.toggleClass(partlist, 'hidden');
  		} else {
  			// Do nothing
  		}
  	};

  	widthHandler(widthMatch);

    var clearFilter = function() { }

    var init = (function() {

      loadPartList();

      document.addEventListener('buildbutler.partselected', function(e) {
        var previousSelection = partList.querySelector('.selectedpart'),
            selected = partList.querySelector('a[href$="#' + e.detail.partId + '"]').parentNode;

        if (previousSelection) helpers.removeClass(previousSelection, 'selectedpart');
        helpers.addClass(selected, 'selectedpart');

        updateSelectedPartSpan(selected);
        helpers.scrollSmoothlyIntoView(selected);
      });

      bindHideListToggle();

      searchField.addEventListener('keyup', function(event) {

      });

    })();

    return {
      filter: function(query) {},
      clearFilter: clearFilter
    }

  })(bbutler.Helpers);


  // BuildButler.Main
  bbutler.Main = (function(schematic, helpers) {

    var bindInvertButton = function() {
      var invertButton = document.getElementById('invert');
      invertButton.addEventListener('click', function() {
        helpers.toggleClass(document.documentElement, 'inverted')
      }, false);
    }

    var bindResetButton = function() {
      var resetButton = document.getElementById('reset');
      resetButton.addEventListener('click', schematic.reset, false);
    }

    var selectStartupPartViaUrlHash = function() {
      var hash = window.location.hash;

      if (hash) {
        var partId = hash.substring(1);
        schematic.selectPartById(partId);
      }
    }

    var init = function(options) {
      schematic.assemble(options);
      bindInvertButton();

      document.addEventListener('buildbutler.schematicassembled', bindResetButton);
      document.addEventListener('buildbutler.partlistloaded', selectStartupPartViaUrlHash);
    }

    return {
      init: init
    }
  })(bbutler.Schematic, bbutler.Helpers);

  bbutler.init = bbutler.Main.init;

  return bbutler;

})(window, document, buildButler || {});