/**
 * @overview bbutler.js
 * @copyright Jacob Chapman, Chris Chapman 2013-2014
 * @version 1.0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software ("the Software") to execute the included software, to use,
 * and copy, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * 1. All copies of the Software and schematic files must remain unmodified.
 * 2. The above copyright notice and this permission notice shall be included in
 * all copies of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var buildButler = (function(window, document, svgPanZoom, shortcut, bbutler) {

  'use strict';

  /**
   * BuildButler.Helpers
   */
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
    };

    pub.addClass = function(el, className) {
      if (el.classList)
        el.classList.add(className);
      else
        el.className += ' ' + className;
    };

    pub.removeClass = function(el, className) {
      if (el.classList)
        el.classList.remove(className);
      else
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    };

    pub.hasClass = function(el, className) {
      return el.classList ? el.classList.contains(className) : new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    };

    pub.showElement = function(el) { pub.removeClass(el, 'hidden'); };
    pub.hideElement = function(el) { pub.addClass(el, 'hidden'); };
    pub.isHidden = function(el) { return pub.hasClass(el, 'hidden'); };
    pub.toggleHidden = function(el) { pub.toggleClass(el, 'hidden'); };

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
          console.log("Whoops");
        }
      };

      request.onerror = function() {
        console.log("There was a connection error of some sort");
      };

      request.send();
    };

    /**
     * Fetches an SVG file asynchronously from the server and imports a copy of it into the current document.
     *
     * @param {String} path The path of the file to fetch from the server
     * @param {Function} callback The callback that will be called (with the imported document node) after the SVG is received
     */
    pub.importSvgNode = function(path, callback) {
      getXml(path, 'image/svg+xml', function(xml) {
        var imported = document.importNode(xml.documentElement, true);
        callback(imported);
      });
    };

    /**
     * Create an application event. (IE9+)
     *
     * @param {string} type The type of event
     * @param {any} detail Custom information to pass along with the event
     */
    pub.createApplicationEvent = function(type, detail) {
      var event;
      if (window.CustomEvent)
        event = new CustomEvent(type, { bubbles: true, cancelable: true, detail: detail });
      else {
        event = document.createEvent('CustomEvent');
        event.initCustomEvent(type, true, true, detail);
      }
      return event;
    };

    /**
     * Determines whether the given string contains the search query.
     * Case insensitive.
     *
     * @param {String} string the string to search
     * @param {String} search the string to be searched for
     * @returns {Boolean} true if the given string contains the search string, false otherwise
     */
    pub.contains = function(string, search) {
      return (string.toLowerCase().indexOf(search.toLowerCase()) !== -1);
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
    };

    /**
     * Recursively merge the properties of multiple objects
     *
     * @param {Object} to the object to merge to
     * @param {...Object} var_args objects to include in the merge
     * @returns {Object} the 'to' object with the properties of both passed objects
     */
    pub.merge = function(to, var_args) {
      var to = to || {},
          objects = [].slice.call(arguments, 1);

      objects.forEach(function(from) {
        for (var property in from) {
          if (from.hasOwnProperty(property)) {
            to[property] = (typeof from[property] === 'object') ? this.merge(to[property], from[property]) : from[property];
          }
        }
      }, pub);

      return to;
    };

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
    };

    /**
     * Tells whether the given node represents an electronic component.
     * Based on the convention that any node with an id that starts with '_' is a component.
     *
     * @returns {Boolean} true if the given node is an electronic component, false otherwise
     */
    pub.isElectronicComponent = function(node) {
      return (node && node.id && node.id.charAt(0) === '_');
    };

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
      };

      if (!isScrolledIntoView(contained)) moveFunc(contained);
    };

    /**
     * Scroll the given element into view (into the center of its container).
     *
     * @param {Element} contianed the contained element to scroll to.
     */
    pub.scrollIntoView = function(contained) {

      var container = contained.offsetParent,
           midpoint = (container.clientHeight - contained.offsetHeight) / 2;

      var endPosition = contained.offsetTop - midpoint;

      /**
       * Scrolls the given element immediately (no animation) into the center
       * of its container.
       *
       * @param {Element} contianed the contained element to scroll to.
       */
      var scrollImmediatelyIntoView = function(contained) {
        pub.moveIntoView(contained, function() { container.scrollTop = endPosition; });
      };

      /**
       * Scroll an element smoothly into the center of its container.
       * Loosely based on {@link https://github.com/cferdinandi/smooth-scroll smooth-scroll by Chris Ferdinandi}.
       *
       * Assumes that window.requestAnimationFrame and window.performance.now exists.
       *
       * @param {Element} contained the contained element to scroll to.
       */
      var scrollSmoothlyIntoView = function(contained) {
        var startPosition = container.scrollTop;
        var distance = endPosition - startPosition;
        var timeLapsed, percentage, position;
        var animationRequestID, animationStartTime;

        var speed = 300; // How fast to complete the scroll in milliseconds

        var easeOutQuad = function(time) { return time * (2 - time); };

        var stopAnimateScroll = function(position, endPosition) {
          var currentPosition = container.scrollTop;
          return (position == endPosition || currentPosition == endPosition || (container.scrollHeight - currentPosition === container.clientHeight));
        };

        var loopAnimateScroll = function(currentTime) {
          timeLapsed = Math.abs(currentTime - animationStartTime);
          percentage = (timeLapsed / speed);
          percentage = (percentage > 1) ? 1 : percentage;
          position = startPosition + (distance * easeOutQuad(percentage));
          container.scrollTop = Math.floor(position);
          if (!stopAnimateScroll(position, endPosition)) {
            animationRequestID = window.requestAnimationFrame(loopAnimateScroll);
          }
        };

        var startAnimateScroll = function() {
          animationStartTime = window.performance.now();
          animationRequestID = window.requestAnimationFrame(loopAnimateScroll);
        };

        pub.moveIntoView(contained, startAnimateScroll);
      };

      (window.requestAnimationFrame && window.performance.now) ? scrollSmoothlyIntoView(contained) : scrollImmediatelyIntoView(contained);
    };

    return pub;

  })();


  /**
   * BuildButler.Schematic
   */
  bbutler.Schematic = (function(svgPanZoom, helpers) {

    var build = document.querySelector('#build');
    var schematic, panZoomSchematic;

    var selectedComponent;

    /**
     * Assembles schematic and inserts into the document tree.
     */
    var assemble = function(options) {

      var svgNS = 'http://www.w3.org/2000/svg',
        xlinkNS = 'http://www.w3.org/1999/xlink';

      var defaultOptions = {
        buildPath: 'build.svg',
        basePath: 'base.svg',
        svgPanZoomOptions: {
          zoomScaleSensitivity: 0.1,
          maxZoom: 4,
          minZoom: 0.4
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
      };

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
      };

      /**
       * Finds the root component of the given component instance.
       *
       * @param {Node} instance the component instance
       * @returns the root component of the given instance, or itself if it is the root
       */
      var findComponentByInstance = function(instance) {
        return helpers.closest(instance, helpers.isElectronicComponent);
      };

      var registerEventHandlers = function(schematic) {
        var handleSchematicSelectionEvents = function(e) {
          e.preventDefault();

          var component = findComponentByInstance(e.target);

          if (component) {
            var componentClicked = helpers.createApplicationEvent('buildbutler.componentclicked', { componentId: component.id });
            component.dispatchEvent(componentClicked);
          }
        };

        schematic.addEventListener('click', handleSchematicSelectionEvents, false);
        schematic.addEventListener('touchstart', handleSchematicSelectionEvents, false);

        document.addEventListener('buildbutler.componentclicked', function(e) {
          selectComponentById(e.detail.componentId);
        }, false);

        schematic.addEventListener('buildbutler.schematicloaded', function() {
          var loading = document.getElementById('loading');
          helpers.addClass(loading, 'disabled');
        }, false);
      };

      var doAssembly = function(importedSvgNode, options) {
        // Assumes that the base schematic and the build schematic are the same size.
        var baseSchematic = createBaseSchematic(getPrescribedSvgDimensions(importedSvgNode), options.basePath);
        baseSchematic.addEventListener('load', function(e) {
          var schematicLoaded = helpers.createApplicationEvent('buildbutler.schematicloaded', { schematic: importedSvgNode });
          baseSchematic.dispatchEvent(schematicLoaded);
        });
        importedSvgNode.insertBefore(baseSchematic, importedSvgNode.firstChild);

        schematic = build.appendChild(importedSvgNode);

        registerEventHandlers(schematic);

        panZoomSchematic = svgPanZoom(schematic, options.svgPanZoomOptions);

        var schematicAssembled = helpers.createApplicationEvent('buildbutler.schematicassembled', { schematic: schematic });
        schematic.dispatchEvent(schematicAssembled);
      };

      options = helpers.merge({}, defaultOptions, options);
      helpers.importSvgNode(options.buildPath, function(importedSvgNode) { doAssembly(importedSvgNode, options); });
    };

    var selectComponent = function(component) {
      if (component == null || component === selectedComponent) return;

      if (isComponentSelected()) helpers.removeClass(selectedComponent, 'selectedcomponent');
      helpers.addClass(component, 'selectedcomponent');

      selectedComponent = component;

      var componentSelected = helpers.createApplicationEvent('buildbutler.componentselected', { componentId: selectedComponent.id });
      selectedComponent.dispatchEvent(componentSelected);
    };

    var isComponentSelected = function() {
      return selectedComponent != null;
    };

    /**
     * Looks up a component by its id attribute and selects it to be the currently
     * selected component. If the passed in componentId is null or undefined, this
     * function does nothing.
     *
     * @param {String} componentId the id attribute of the component's HTML element
     */
    var selectComponentById = function(componentId) {
      if (componentId) {
        var component = schematic.getElementById(componentId);
        selectComponent(component);
      }
    };

    var reset = function() {
      panZoomSchematic.resetZoom();
      panZoomSchematic.center();
    };

    return {
      assemble: assemble,
      reset: reset,
      selectComponentById: selectComponentById,
      panBy: function(vector) { panZoomSchematic.panBy(vector); },
      panUp: function() { panZoomSchematic.panBy({x: 0, y: 50}); },
      panDown: function() { panZoomSchematic.panBy({x: 0, y: -50}); },
      panLeft: function() { panZoomSchematic.panBy({x: 50, y: 0}); },
      panRight: function() { panZoomSchematic.panBy({x: -50, y: 0}); },
      zoomIn: function() { panZoomSchematic.zoomIn(); },
      zoomOut: function() { panZoomSchematic.zoomOut(); },
      build: build
    };
  })(svgPanZoom, bbutler.Helpers);


  /**
   * BuildButler.ComponentPanel
   */
  bbutler.ComponentPanel = (function(helpers) {

    var filterField = document.getElementById('filter'),
        componentList = document.getElementById('componentlist'),
        componentListPanel = document.getElementById('componentlistpanel'),
        selectedComponentSpan = document.getElementById('selectedcomponent');

    var labelPanelDiv = document.getElementById('labelpanel'),
        controlsDiv = document.getElementById('controls'),
        toggleListSpan = document.getElementById('togglelist');

    var componentLinks, categories;

    document.addEventListener("click", function (e) {
      if (e.target !== filterField) {
        filter.blur();
      }
    });

    var isSmallScreen = window.matchMedia("(max-width: 767px)").matches;

    /**
     * Load the component list from the structure of the schematic after the schematic has been assembled.
     */
    var loadComponentList = function() {

      /**
       * Add a component to the component list.
       *
       * @param {DocumentFragment} componentListFragment The document fragment (representing the component list) to append the component to
       * @param {SVGElement} component The component to append
       */
      var appendToComponentList = function(componentListFragment, component) {

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
        };

        /**
         * Helper to create a hyperlink to a component in the schematic.
         *
         * @param {String} componentId The id of the linked component
         * @returns {HTMLAnchorElement} the new hyperlink element
         */
        var createHyperlinkToComponent = function(componentId) {
          var link = document.createElement('a');
          link.textContent = extractComponentName(componentId);
          link.className = 'component';
          link.href = '#' + componentId;

          link.addEventListener('click', function(e) {
            e.preventDefault();

            var componentClicked = helpers.createApplicationEvent('buildbutler.componentclicked', { componentId: componentId });
            e.currentTarget.dispatchEvent(componentClicked);
          }, false);

          return link;
        };

        /**
         * Helper to create a span element with the given quantity.
         *
         * @param {Number} quantity The quantity of components
         * @returns {HTMLSpanElement} the new span element
         */
        var createQuantitySpan = function(quantity) {
          var span = document.createElement('span');
          span.className = 'quantity';
          span.textContent = quantity;

          return span;
        };

        /**
         * Extract the quantity of components from an SVG shape.
         *
         * @param {SVGElement} component The shape from which to extract the quantity
         * @returns {Number} the quantity of components
         */
        var extractQuantity = function(component) {
          var isBeginningOfNewSubpath = function(segment) {
            return (segment instanceof SVGPathSegMovetoAbs || segment instanceof SVGPathSegMovetoRel);
          };

          if (component instanceof SVGPathElement)
            return [].filter.call(component.pathSegList, isBeginningOfNewSubpath).length;
          else if (component instanceof SVGGElement && component.hasChildNodes())
            return [].reduce.call(component.childNodes, function(previous, current) {
              return previous + extractQuantity(current);
            }, 0);
          else if (helpers.isSvgShape(component)) return 1;
          else return 0;
        };

        /**
         * Checks whether the given SVGElement represents a category.
         * @private
         * @param {SVGElement} el the element to test
         * @returns true if the given element is a category, otherwise false.
         */
        var isSvgGCategory = function(el) {
          return (el && el.id && el.id.charAt(0) !== '_' && el instanceof SVGGElement);
        };

        /**
         * Tells whether the given node is categorized or not.
         * @private
         * @param {Node} component the component to test
         * @returns true if the component is categorized, otherwise false
         */
        var isCategorized = function(component) {
          return (component && isSvgGCategory(component.parentNode));
        };

        /**
         * Returns the component list for the given category.
         *
         * @param {Element} category the category from which to get the component list.
         * @returns the component list of the given category
         */
        var getComponentListForCategory = function(category) {
          if (helpers.hasClass(category, 'category'))
            return category.querySelector('ol.components');
          else
            throw 'Must be a category to get the component list!';
        };

        /**
         * Creates and appends a new category fragment to the given categories node.
         * @private
         * @param {Node} categories the node on which to append component categories
         * @param {String} category The category name
         * @returns {HTMLOListElement} the newly created ordered list representing the category
         */
        var appendCategoryFragment = function(categories, category) {

          var categoryOListElement = createOrderedList('category', category);
          var categoryMainLIElement = document.createElement('li');
          categoryOListElement.appendChild(categoryMainLIElement);

          var categoryNameSpanElement = document.createElement('span');
          categoryNameSpanElement.className = 'name';
          categoryNameSpanElement.textContent = category;
          categoryMainLIElement.appendChild(categoryNameSpanElement);

          var componentOListElement = createOrderedList('components');
          categoryMainLIElement.appendChild(componentOListElement);

          return categories.appendChild(categoryOListElement);
        };

        /**
         * Initializes a new category, supercategory-aware.
         * Assumes that category names (and subcategory names) are unique in the document.
         *
         * @param {Node} categories the node from which to get component categories
         * @param {SVGGElement} svgGCategory The SVG element that represents the category
         * @returns {HTMLOListElement} the ordered list representing the now-initialized category
         */
        var initializeCategory = function(categories, svgGCategory) {
          var categoryId = svgGCategory.id;

          var category = categories.querySelector('ol.' + categoryId);

          if (category == null) {
            category = appendCategoryFragment(categories, categoryId);

            if (isCategorized(svgGCategory)) {
              var superCategory = initializeCategory(categories, svgGCategory.parentNode),
                  superCategoryComponentOListElement = getComponentListForCategory(superCategory);

              helpers.addClass(category, 'subcategory');

              var subcategoryLIElement = document.createElement('li');
              subcategoryLIElement.appendChild(category);
              superCategoryComponentOListElement.appendChild(subcategoryLIElement);
            }
          }
          return category;
        };

        /**
         * Finds the category of the given component and returns the list of
         * components of that category. If a component is not categorized, it
         * returns the global uncategorized list.
         *
         * @param {Node} categories the node from which to get component categories.
         * @param {SVGElement} component the component for which to get the category
         * @returns {HTMLOListElement} the category's list of components
         */
        var getComponentListForComponent = function(categories, component) {
          var isComponentCategorized = isCategorized(component),
              selector = isComponentCategorized ? '.' + component.parentNode.id : 'ol.uncategorized';

          return categories.querySelector(selector) || isComponentCategorized
                ? getComponentListForCategory(initializeCategory(categories, component.parentNode))
                : categories.insertBefore(createOrderedList('uncategorized'), categories.firstChild);
        };

        if (helpers.isElectronicComponent(component)) {
          var componentLink = createHyperlinkToComponent(component.id);

          var componentQuantity = extractQuantity(component);
          if (componentQuantity > 1) {
            var componentQuantitySpanElement = createQuantitySpan(componentQuantity);
            componentLink.appendChild(componentQuantitySpanElement);
          }

          var componentLinkLIElement = document.createElement('li');
          componentLinkLIElement.appendChild(componentLink);

          var componentComponentOListElement = getComponentListForComponent(componentListFragment, component);
          componentComponentOListElement.appendChild(componentLinkLIElement);
        }
      };

      var traverseNodeInReverse = function(node, action) {

        var traverse = function(node, action) {
          for(var child = node.lastChild; child; child = child.previousSibling) {
            traverse(child, action);
          }
          action(node);
        };
        traverse(node, action);
      };

      document.addEventListener('buildbutler.schematicassembled', function(e) {
        var componentListFragment = document.createDocumentFragment();

        traverseNodeInReverse(e.detail.schematic, function(node) { appendToComponentList(componentListFragment, node); });
        componentList.appendChild(componentListFragment);

        var componentListLoaded = helpers.createApplicationEvent('buildbutler.componentlistloaded');
        componentList.dispatchEvent(componentListLoaded);
      });
    };

    var translateComponentSelection = function(translation) {
      var currentSelection = getCurrentSelection();

      if (currentSelection) {
        var selectedComponentLink = currentSelection.querySelector('a.component'),
            selectedComponentLinkIndex = componentLinks.indexOf(selectedComponentLink);

        var translatedComponentLink = componentLinks[translation(selectedComponentLinkIndex)] || selectedComponentLink;

        var componentLinkClicked = new MouseEvent('click', { view: window, bubbles: true, cancelable: false });
        translatedComponentLink.dispatchEvent(componentLinkClicked);
      }
    };

    var selectPreviousComponentInComponentList = translateComponentSelection.bind(undefined, function(index) { return --index; });
    var selectNextComponentInComponentList = translateComponentSelection.bind(undefined, function(index) { return ++index; });

    var extractComponentName = function(htmlId) {
      var nonBreakingSpace = '\xa0';
      return htmlId.indexOf('_') === 0 ? htmlId.substring(1).replace(/_/g, nonBreakingSpace) : htmlId;
    };

    var getCategoryForComponent = function(componentLink) {
      return helpers.closest(componentLink, function(el) { return helpers.hasClass(el, 'category'); });
    };

    var getCategoryName = function(category) {
      return category.querySelector('span.name').textContent;
    };

    var isSubcategory = function(category) {
      return helpers.hasClass(category, 'subcategory');
    };

    var getCurrentSelection = function() {
      return componentList.querySelector('.selectedcomponent');
    }

    var bindComponentListToSchematic = function() {
      var updateSelectedComponentSpan = function(componentLink) {
        var textContent = [], nonBreakingSpace = '\xa0';
        textContent.push(componentLink.firstChild.textContent);

        var componentCategory = getCategoryForComponent(componentLink);
        if (isSubcategory(componentCategory)) textContent.push(getCategoryName(componentCategory));

        var quantitySpan = componentLink.querySelector('span.quantity');
        textContent.push('(' + (quantitySpan ? quantitySpan.textContent : '1') + '\xd7)');

        selectedComponentSpan.textContent = textContent.join(nonBreakingSpace);
      };

      var updateCurrentSelection = function(e) {
        var previousSelection = getCurrentSelection(),
            selectedLink = componentList.querySelector('a[href$="#' + e.detail.componentId + '"]'),
            selected = selectedLink.parentNode;

        if (previousSelection) helpers.removeClass(previousSelection, 'selectedcomponent');
        helpers.addClass(selected, 'selectedcomponent');

        updateSelectedComponentSpan(selectedLink);

        if (!helpers.isHidden(selected)) helpers.scrollIntoView(selected);
      };

      document.addEventListener('buildbutler.componentselected', updateCurrentSelection, false);
    };

    var toggleComponentList = function() {
      helpers.toggleClass(toggleListSpan, 'rotatopotato');
      helpers.toggleHidden(componentListPanel);
    };

    var showComponentList = function() {
      helpers.removeClass(toggleListSpan, 'rotatopotato');
      helpers.showElement(componentListPanel);

      clearFilter();
      filterField.focus();
    };

    var setupListToggle = function() {
      var hideComponentList = function() {
        helpers.addClass(toggleListSpan, 'rotatopotato');
        helpers.hideElement(componentListPanel);
      };

      var hideComponentListByDefaultOnSmallScreens = function() {
        if (isSmallScreen) hideComponentList();
      };

      var bigButtonComponentList = function() {
        if (labelPanelDiv === event.target) {
        if (isSmallScreen) toggleComponentList();
        }
      };

      labelPanelDiv.addEventListener('click', bigButtonComponentList, false);

      hideComponentListByDefaultOnSmallScreens();

      toggleListSpan.addEventListener('click', toggleComponentList, false);

      document.addEventListener('buildbutler.componentselected', function() {
        if (isSmallScreen) hideComponentList();
      }, false);
    };

    var setupComponentListFilter = function() {
      document.addEventListener('buildbutler.componentlistloaded', function() {
        componentLinks = [].slice.call(componentList.querySelectorAll('a.component'));
        categories = [].slice.call(componentList.querySelectorAll('.category'));

        var handleFilterInput = function(e) { filterComponentList(e.target.value); };

        filterField.addEventListener('input', handleFilterInput, false);
      }, false);
    };

    var filterComponentList = function(filter) {
      var singleNonBreakingSpace = '\xa0';
      var sanitize = function(text) { return (text ? text.trim().replace(/\s+/g, singleNonBreakingSpace) : ''); };

      var hideElement = helpers.hideElement,
          showElement = helpers.showElement;

      var showComponentLink = function(componentLink) { showElement(componentLink.parentNode); };
      var hideComponentLink = function(componentLink) { hideElement(componentLink.parentNode); };

      var isComponentLinkHidden = function(componentLink) { return helpers.isHidden(componentLink.parentNode); };

      var filterComponentLink = function(componentLink) {
        var componentName = componentLink.firstChild.textContent;
        (helpers.contains(componentName, this) ? showComponentLink : hideComponentLink).call(null, componentLink);
      };

      var filterCategory = function(category) {
        var componentLinks = [].slice.call(category.querySelectorAll('a.component'));
        (componentLinks.every(isComponentLinkHidden) ? hideElement : showElement).call(null, category);
      };

      filter = sanitize(filter);
      componentLinks.forEach(filter ? filterComponentLink : showComponentLink, filter);
      categories.forEach(filterCategory);
    };

    var clearFilter = function() {
      filterField.value = '';
      filterComponentList('');
    };

    loadComponentList();
    bindComponentListToSchematic();
    setupListToggle();
    setupComponentListFilter();

    return {
      filter: filterComponentList,
      clearFilter: clearFilter,
      toggleComponentList: toggleComponentList,
      showComponentList: showComponentList,
      selectPrevious: selectPreviousComponentInComponentList,
      selectNext: selectNextComponentInComponentList
    };

  })(bbutler.Helpers);


  /**
   * BuildButler.Main
   */
  bbutler.Main = (function(shortcut, schematic, panel, helpers) {

    var toggleEmergencyDiscoParty = function() {
      helpers.toggleClass(document.documentElement, 'inverted');
    };

    var bindInvertButton = function() {
      var invertButton = document.getElementById('invert');
      invertButton.addEventListener('click', toggleEmergencyDiscoParty, false);
    };

    var bindResetButton = function() {
      var resetButton = document.getElementById('reset');
      document.addEventListener('buildbutler.schematicassembled', function() {
        resetButton.addEventListener('click', schematic.reset, false);
      }, false);
    };

    var selectStartupComponentViaUrlHash = function() {
      document.addEventListener('buildbutler.componentlistloaded', function() {
        var componentId = (window.history && window.history.state) ? window.history.state.componentId : window.location.hash.substring(1);
        schematic.selectComponentById(componentId);
      }, false);
    };

    var listenForComponentSelectionAndUpdateHistory = function() {
      document.addEventListener('buildbutler.componentselected', function(e) {
        var componentId = e.detail.componentId,
            hash = '#' + componentId;

        if (hash === window.location.hash) return;

        if (window.history && window.history.pushState) {
          window.history.pushState({ componentId: componentId }, componentId, hash);
        } else {
          window.location.hash = hash;
        }
      }, false);
    };

    var listenForHashChangeAndUpdateSelectedComponentIfNeeded = function() {
      window.addEventListener('popstate', function(e) {
        var componentId = (e.state && e.state.componentId) ? e.state.componentId : window.location.hash.substring(1);
        schematic.selectComponentById(componentId);
      });
    };

    var setupKeyboardShortcuts = function() {
      document.addEventListener('buildbutler.componentlistloaded', function() {

        shortcut.add("W", schematic.panUp);
        shortcut.add("A", schematic.panLeft);
        shortcut.add("S", schematic.panDown);
        shortcut.add("D", schematic.panRight);

        shortcut.add("E", schematic.zoomIn);
        shortcut.add("=", schematic.zoomIn);
        shortcut.add("+", schematic.zoomIn);
        shortcut.add("Q", schematic.zoomOut);
        shortcut.add("-", schematic.zoomOut);
        shortcut.add("_", schematic.zoomOut);

        shortcut.add("R", schematic.reset, {'propagate': false});
        shortcut.add("H", panel.toggleComponentList, {'propagate': false});

        shortcut.add("T",    panel.selectPrevious);
        shortcut.add("K",    panel.selectPrevious);
        shortcut.add("Up",   panel.selectPrevious);
        shortcut.add("G",    panel.selectNext);
        shortcut.add("J",    panel.selectNext);
        shortcut.add("Down", panel.selectNext);

        //toggle collapse and expand all categories
        //shortcut.add("V", ,{'propagate': false});

        shortcut.add("F", panel.showComponentList, {'propagate': false, 'type':'keyup'});

        shortcut.add("I", toggleEmergencyDiscoParty);

        shortcut.add("O", function monotoneMode() {
          helpers.toggleClass(build, 'monotone');
        });

        shortcut.add("L", function showAll() {
          helpers.toggleClass(build, 'showall');
        });

      }, false);
    };

    var init = function(options) {
      schematic.assemble(options);
      bindInvertButton();
      bindResetButton();
      selectStartupComponentViaUrlHash();
      listenForComponentSelectionAndUpdateHistory();
      listenForHashChangeAndUpdateSelectedComponentIfNeeded();
      setupKeyboardShortcuts();
    };

    return {
      init: init
    };
  })(shortcut, bbutler.Schematic, bbutler.ComponentPanel, bbutler.Helpers);

  bbutler.init = bbutler.Main.init;

  return bbutler;

})(window, document, svgPanZoom, shortcut, buildButler || {});
