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

    pub.isSvgShape = function(node) {
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
      return (node && node.id && node.id.charAt(0) === '_');
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
      var isScrolledIntoView = function(contained) {
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
    var selectedComponent, schematic, panZoomSchematic;

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
      var getPrescribedSvgDimensions = function(svg) {
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
      var createBaseSchematic = function(rect, filename) {
        var baseImage = document.createElementNS(svgNS, 'image');
        baseImage.setAttributeNS(xlinkNS, 'href', filename);
        baseImage.setAttribute('x', 0);
        baseImage.setAttribute('y', 0);
        baseImage.setAttribute('width', rect.width);
        baseImage.setAttribute('height', rect.height);

        return baseImage;
      }

      var registerEventHandlers = function(schematic) {
        schematic.addEventListener('click', function(e) {
          var component = helpers.findComponentByInstance(e.target);

          if (component) {
            var componentClicked = helpers.createApplicationEvent('buildbutler.componentclicked', { componentId: component.id });
            component.dispatchEvent(componentClicked);
          }
        }, false);

        document.addEventListener('buildbutler.componentclicked', function(e) {
          selectComponentById(e.detail.componentId);
        }, false);

        schematic.addEventListener('buildbutler.schematicloaded', function() {
          helpers.addClass(loading, 'hidden');
    		}, false);
      }

      var setupPanZoom = function(el, options) {
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

    var selectComponent = function(component) {
      if (component == null || component === selectedComponent) return;

      if (isComponentSelected()) helpers.removeClass(selectedComponent, 'selectedcomponent');
      helpers.addClass(component, 'selectedcomponent');

      selectedComponent = component;

      var componentSelected = helpers.createApplicationEvent('buildbutler.componentselected', { componentId: selectedComponent.id });
      selectedComponent.dispatchEvent(componentSelected);
    }

    var isComponentSelected = function() {
      return selectedComponent != null;
    }

    var selectComponentById = function(id) {
      var component = schematic.getElementById(id);
      selectComponent(component);
    }

    var reset = function() {
      panZoomSchematic.resetZoom();
      panZoomSchematic.center();
    }

    return {
      assemble: assemble,
      getSelectedComponentId: function() { return selectedComponent ? selectedComponent.id : ""; },
      title: function() { return build; },
      reset: reset,
      selectComponentById: selectComponentById
    }
  })(svgPanZoom, bbutler.Helpers);


  // BuildButler.ComponentPanel
  bbutler.ComponentPanel = (function(helpers) {

    var searchField = document.getElementById('filter'),
        componentList = document.getElementById('componentlist'),
        selectedComponentSpan = document.getElementById('selectedcomponent');

    var extractComponentNumber = function(htmlId) {
      var nonBreakingSpace = '\xA0';
      return htmlId.indexOf('_') === 0 ? htmlId.substring(1).replace(/_/g, nonBreakingSpace) : htmlId;
    }

    /**
     * Extract the quantity of components from an SVG shape.
     *
     * @param {SVGElement} component The shape from which to extract the quantity
     * @returns {Number} the quantity of components
     */
    var extractQuantity = function(component) {
      var isBeginningOfNewSubpath = function(segment) {
        return (segment instanceof SVGPathSegMovetoAbs || segment instanceof SVGPathSegMovetoRel);
      }

      if (component instanceof SVGPathElement)
        return [].filter.call(component.pathSegList, isBeginningOfNewSubpath).length;
      else if (component instanceof SVGGElement && component.hasChildNodes())
        return [].reduce.call(component.childNodes, function(previous, current) {
          return previous + extractQuantity(current);
        }, 0);
      else if (helpers.isSvgShape(component)) return 1;
      else return 0;
    }

    /**
     * Load the component list from the structure of the schematic after the schematic has been assembled.
     */
    var loadComponentList = function() {

      /**
       * Add a component to the component list.
       *
       * @param {Element} componentList The element (representing the component list) to append the component to
       * @param {Element} component The component to append
       */
      var appendToComponentList = function(componentList, component) {

        /**
         * Helper to create an ordered list with optional classes.
         *
         * @param {...String} var_args Classes to be set as the class attribute on the new list element
         * @returns {HTMLOListElement} The new ordered list element
         */
        var createOrderedList = function(var_args) {
          var classes = [].slice.call(arguments);

          var ol = document.createElement('ol');
          ol.setAttribute('class', classes.join(' '));

          return ol;
        }

        /**
         * Helper to create a hyperlink to a component in the schematic.
         *
         * @param {String} componentId The id of the linked component
         * @returns {HTMLAnchorElement} the new hyperlink element
         */
        var createHyperlinkToComponent = function(componentId) {
          var link = document.createElement('a');
          link.textContent = extractComponentNumber(componentId);
          link.className = 'component';
          link.href = '#' + componentId;

          link.addEventListener('click', function(e) {
            var componentClicked = helpers.createApplicationEvent('buildbutler.componentclicked', { componentId: componentId });
            e.currentTarget.dispatchEvent(componentClicked);

            e.preventDefault();
          }, false);

          return link;
        }

        /**
         * Helper to create a span element with the given quantity.
         *
         * @param {Number} quantity The quantity of components
         * @returns {HTMLSpanElement} the new span element
         */
        var createQuantitySpan = function(quantity) {
          var span = document.createElement('span');
          span.className = 'quantity';
          span.textContent = '(' + quantity + ')';

          return span;
        }

        var isCategory = function(node) {
          return (node && node.id && node.id.charAt(0) !== '_' && node instanceof SVGGElement);
        }

        /**
         * Tells whether the given node is categorized or not.
         * @private
         * @param {Node} component the component to test
         * @returns true if the component is component of a category, otherwise false
         */
        var isCategorized = function(component) {
          return component && isCategory(component.parentNode);
        }

        /**
         * Creates a new category ordered list.
         * @private
         * @param {String} category The category name
         * @returns {HTMLOListElement} the newly created ordered list representing the category
         */
        var createCategoryList = function(category) {
          var categoryList = createOrderedList('category', category);

          var categoryListItem = categoryList.appendChild(document.createElement('li'));

          var categoryNameSpan = document.createElement('span');
          categoryNameSpan.className = 'name';
          categoryNameSpan.textContent = category;
          categoryListItem.appendChild(categoryNameSpan);

          var categoryComponentList = createOrderedList('components');
          categoryListItem.appendChild(categoryComponentList);

          return categoryList;
        }

        /**
         * Initializes a new category, supercategory-aware.
         *
         * @param {SVGGElement} category The SVG element that represents the category
         * @returns {HTMLOListElement} the category
         */
        var initializeCategory = function(category) {
          var categoryId = category.id;
          var categoryList = componentList.querySelector('ol.' + categoryId) || createCategoryList(categoryId);

          if (isCategorized(category)) {
            var superCategory = initializeCategory(category.parentNode);
            var subcategoryListItem = document.createElement('li');
            subcategoryListItem.appendChild(categoryList);
            superCategory.appendChild(subcategoryListItem);
            return superCategory;
          }
          return categoryList;
        }

        /**
         * Finds (or creates if nonexistent) the category of the given component
         * and returns the list of components of that category.
         *
         * @param {SVGElement} component the component for which to get the category
         * @returns {HTMLOListElement} the category's list of components
         */
        var getComponentListForComponentCategory = function(component) {

          var isComponentCategorized = isCategorized(component),
              selector = isComponentCategorized ? '.' + component.parentNode.id + ' ol.components' : 'ol.uncategorized';

          var createAndAppendNewCategory = function(componentList, component) {
              var category = initializeCategory(component.parentNode);
              componentList.appendChild(category);
              return componentList.querySelector(selector);
          }

          return componentList.querySelector(selector) || isComponentCategorized
                ? createAndAppendNewCategory(componentList, component)
                : componentList.appendChild(createOrderedList('uncategorized'));
        }

        if (helpers.isElectronicComponent(component)) {
          var linkToComponent = createHyperlinkToComponent(component.id);

          var quantity = extractQuantity(component);
          if (quantity > 1) {
            var quantitySpan = createQuantitySpan(quantity);
            linkToComponent.appendChild(quantitySpan);
          }

          var listItem = document.createElement('li');
          listItem.appendChild(linkToComponent);

          var componentListForCategory = getComponentListForComponentCategory(component);
          componentListForCategory.appendChild(listItem);
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
        var componentListFragment = document.createDocumentFragment();

        traverseNodeInReverse(e.detail.schematic, function(node) { appendToComponentList(componentListFragment, node); });
        componentList.appendChild(componentListFragment);

        var componentListLoaded = helpers.createApplicationEvent('buildbutler.componentlistloaded');
        componentList.dispatchEvent(componentListLoaded);
      });
    }

    var updateSelectedComponentSpan = function(component) {
      var link = component.querySelector('a.component'),
          quantity = link.querySelector('span.quantity') || '(Single)';

      selectedComponentSpan.innerHTML = link.innerHTML;
    }

    var bindHideListToggle = function() {
      var hidelist = document.getElementById('hidelist'),
          componentlist = document.getElementById('componentlist');

      hidelist.addEventListener('click', function() {
        helpers.toggleClass(hidelist, 'rotatopotato');
        helpers.toggleClass(componentlist, 'hidden');
      });
    }

  	var widthMatch = matchMedia("all and (max-width 767px)");
  	var widthHandler = function(matchList) {
  		if (matchList.matches) {
  			helpers.toggleClass(hidelist, 'rotatopotato');
  			helpers.toggleClass(componentlist, 'hidden');
  		} else {
  			// Do nothing
  		}
  	};

  	widthHandler(widthMatch);

    var clearFilter = function() { }

    var init = (function() {

      loadComponentList();

      document.addEventListener('buildbutler.componentselected', function(e) {
        var previousSelection = componentList.querySelector('.selectedcomponent'),
            selected = componentList.querySelector('a[href$="#' + e.detail.componentId + '"]').parentNode;

        if (previousSelection) helpers.removeClass(previousSelection, 'selectedcomponent');
        helpers.addClass(selected, 'selectedcomponent');

        updateSelectedComponentSpan(selected);
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
      document.addEventListener('buildbutler.schematicassembled', function() {
        resetButton.addEventListener('click', schematic.reset, false);
      }, false);
    }

    var selectStartupComponentViaUrlHash = function() {
      document.addEventListener('buildbutler.componentlistloaded', function() {
        var hash = window.location.hash;

        if (hash) {
          var componentId = hash.substring(1);
          schematic.selectComponentById(componentId);
        }
      }, false);
    }

    var init = function(options) {
      schematic.assemble(options);
      bindInvertButton();
      bindResetButton();
      selectStartupComponentViaUrlHash();
    }

    return {
      init: init
    }
  })(bbutler.Schematic, bbutler.Helpers);

  bbutler.init = bbutler.Main.init;

  return bbutler;

})(window, document, buildButler || {});