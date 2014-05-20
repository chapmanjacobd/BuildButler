// mapSVG 5.6.3 - February 19 2014
// http://codecanyon.net/user/Yatek/portfolio?ref=Yatek
(function ($) {
  var instances = {},
    globalID = 0,
    userAgent = navigator.userAgent.toLowerCase();
  var scripts = document.getElementsByTagName("script");
  var myScript = scripts[scripts.length - 1].src.split("/");
  myScript.pop();
  var pluginJSURL = myScript.join("/") + "/";
  myScript.pop();
  var pluginRootURL = myScript.join("/") + "/";
  var touchDevice = userAgent.indexOf("ipad") > -1 || userAgent.indexOf("iphone") > -1 || userAgent.indexOf("ipod") > -1 || userAgent.indexOf("android") > -1;
  var _browser = {};
  _browser.ie = userAgent.indexOf("msie") > -1 ? {} : false;
  if (_browser.ie) _browser.ie.old = navigator.userAgent.match(/MSIE [6-8]/) !== null;
  _browser.firefox = userAgent.indexOf("firefox") > -1;
  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^\s+|\s+$/g, "")
    }
  }
  if (touchDevice) {
    var mouseCoords = function (e) {
      return e.touches[0] ? {
        x: e.touches[0].pageX,
        y: e.touches[0].pageY
      } : {
        x: e.changedTouches[0].pageX,
        y: e.changedTouches[0].pageY
      }
    }
  } else {
    var mouseCoords = function (e) {
      return e.pageX ? {
        x: e.pageX,
        y: e.pageY
      } : {
        x: e.clientX + $("html").scrollLeft(),
        y: e.clientY + $("html").scrollTop()
      };
      return {
        x: e.clientX + $(window).scrollLeft(),
        y: e.clientY + $(window).scrollTop()
      }
    }
  }
  var CBK = [128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483648, 4294967296, 8589934592, 17179869184, 34359738368, 68719476736, 137438953472];
  var CEK = [.7111111111111111, 1.4222222222222223, 2.8444444444444446, 5.688888888888889, 11.377777777777778, 22.755555555555556, 45.51111111111111, 91.02222222222223, 182.04444444444445, 364.0888888888889, 728.1777777777778, 1456.3555555555556, 2912.711111111111, 5825.422222222222, 11650.844444444445, 23301.68888888889, 46603.37777777778, 93206.75555555556, 186413.51111111112, 372827.02222222224, 745654.0444444445, 1491308.088888889, 2982616.177777778, 5965232.355555556, 11930464.711111112, 23860929.422222223, 47721858.844444446, 95443717.68888889, 190887435.37777779, 381774870.75555557, 763549741.5111111];
  var CFK = [40.74366543152521, 81.48733086305042, 162.97466172610083, 325.94932345220167, 651.8986469044033, 1303.7972938088067, 2607.5945876176133, 5215.189175235227, 10430.378350470453, 20860.756700940907, 41721.51340188181, 83443.02680376363, 166886.05360752725, 333772.1072150545, 667544.214430109, 1335088.428860218, 2670176.857720436, 5340353.715440872, 10680707.430881744, 21361414.86176349, 42722829.72352698, 85445659.44705395, 170891318.8941079, 341782637.7882158, 683565275.5764316, 1367130551.1528633, 2734261102.3057265, 5468522204.611453, 10937044409.222906, 21874088818.445812, 43748177636.891624];
  var defaults = {
    keepSourceStyles: false,
    loadingText: "Loading map...",
    colors: {
      background: "#eeeeee",
      selected: 5,
      hover: 2
    },
    regions: {},
    viewBox: [],
    cursor: "default",
    scale: 1,
    tooltipsMode: "hover",
    tooltips: {
      show: "hover",
      mode: "names"
    },
    onClick: null,
    mouseOver: null,
    mouseOut: null,
    disableAll: false,
    hideAll: false,
    marks: null,
    hover_mode: "brightness",
    selected_mode: "brightness",
    hover_brightness: 1,
    selected_brightness: 5,
    pan: false,
    panLimit: true,
    panBackground: false,
    zoom: false,
    popover: {
      width: "auto",
      height: "auto"
    },
    buttons: true,
    zoomLimit: [0, 5],
    zoomDelta: 1.2,
    zoomButtons: {
      show: true,
      location: "right"
    },
    multiSelect: false
  };
  var markOptions = {
    attrs: {
      cursor: "pointer",
      src: pluginRootURL + "markers/_pin_default.png"
    }
  };
  var mapSVG = function (elem, options) {
    var _data;
    this.methods = {
      destroy: function () {
        delete instances[_data.$map.attr("id")];
        _data.$map.empty();
        return _this
      },
      getData: function () {
        return _data
      },
      getScale: function () {
        var e = _data.svgDefault.width / _data.svgDefault.height;
        var t = _data.options.width / _data.options.height;
        var n, r;
        var i = _data.options.responsive ? [_data.$map.width(), _data.$map.height()] : [_data.options.width, _data.options.height];
        if (t < e) {
          n = _data.svgDefault.width / _data.svgDefault.viewBox[2];
          r = i[0] / _data.viewBox[2]
        } else {
          n = _data.svgDefault.height / _data.svgDefault.viewBox[3];
          r = i[1] / _data.viewBox[3]
        }
        return 1 - (n - r)
      },
      fluidResize: function (e, t) {
        if (!e || !t) {
          e = _data.$map.width();
          t = _data.$map.height()
        }
        _data.R.setSize(e, t);
        _data.scale = _this.getScale();
        _this.marksAdjustPosition()
      },
      getViewBox: function () {
        return _data.viewBox
      },
      setViewBox: function (e) {
        if (typeof e == "string") {
          var t = _data.R.getById(e).getBBox();
          _data.viewBox = [t.x - 5, t.y - 5, t.width + 10, t.height + 10];
          var n = true
        } else {
          var r = e && e.length == 4 ? e : _data.svgDefault.viewBox;
          var n = parseInt(r[2]) != _data.viewBox[2] || parseInt(r[3]) != _data.viewBox[3];
          _data.viewBox = [parseFloat(r[0]), parseFloat(r[1]), parseFloat(r[2]), parseFloat(r[3])]
        }
        _data.R.setViewBox(_data.viewBox[0], _data.viewBox[1], _data.viewBox[2], _data.viewBox[3], true);
        if (n) {
          _data.scale = _this.getScale();
          _this.marksAdjustPosition();
          if (_browser.ie && !_browser.ie.old || _browser.firefox) {
            _this.mapAdjustStrokes()
          }
        }
        return true
      },
      viewBoxSetBySize: function (e, t) {
        _data._viewBox = _this.viewBoxGetBySize(e, t);
        _data.viewBox = $.extend([], _data._viewBox);
        _data.scale = _this.getScale();
        _data.R.setViewBox(_data.viewBox[0], _data.viewBox[1], _data.viewBox[2], _data.viewBox[3], true);
        _this.marksAdjustPosition();
        return _data.viewBox
      },
      viewBoxGetBySize: function (e, t) {
        var n = e / t;
        var r = _data.svgDefault.viewBox[2] / _data.svgDefault.viewBox[3];
        var i = $.extend([], _data.svgDefault.viewBox);
        if (n != r) {
          i[2] = e * _data.svgDefault.viewBox[2] / _data.svgDefault.width;
          i[3] = t * _data.svgDefault.viewBox[3] / _data.svgDefault.height
        }
        return i
      },
      viewBoxReset: function () {
        _this.setViewBox()
      },
      mapAdjustStrokes: function () {
        _data.R.forEach(function (e) {
          if (e.default_attr && e.default_attr["stroke-width"]) e.attr({
            "stroke-width": e.default_attr["stroke-width"] / _data.scale
          })
        })
      },
      zoomIn: function () {
        _this.zoom(1)
      },
      zoomOut: function () {
        _this.zoom(-1)
      },
      touchZoomStart: function (e) {
        touchZoomStart = _data._scale;
        _data.scale = _data.scale * zoom_k;
        zoom = _data._scale;
        _data._scale = _data._scale * zoom_k;
        var t = _data.viewBox[2];
        var n = _data.viewBox[3];
        var r = [];
        r[2] = _data._viewBox[2] / _data._scale;
        r[3] = _data._viewBox[3] / _data._scale;
        r[0] = _data.viewBox[0] + (t - r[2]) / 2;
        r[1] = viewBox[1] + (n - r[3]) / 2;
        _this.setViewBox(r, true)
      },
      touchZoomMove: function () {},
      touchZoomEnd: function () {},
      zoom: function (e, t) {
        var n = _data.viewBox[2];
        var r = _data.viewBox[3];
        var i = [];
        if (!t) {
          var s = e > 0 ? 1 : -1;
          _data._zoomLevel = _data.zoomLevel;
          _data._zoomLevel += s;
          if (_data._zoomLevel > _data.options.zoomLimit[1] || _data._zoomLevel < _data.options.zoomLimit[0]) return false;
          _data.zoomLevel = _data._zoomLevel;
          var o = s * _data.options.zoomDelta;
          if (o < 1) o = -1 / o;
          _data._scale = _data._scale * o;
          i[2] = _data._viewBox[2] / _data._scale;
          i[3] = _data._viewBox[3] / _data._scale
        } else {
          _data._scale = t;
          i[2] = _data.touchZoomStartViewBox[2] / _data._scale;
          i[3] = _data.touchZoomStartViewBox[3] / _data._scale
        }
        i[0] = _data.viewBox[0] + (n - i[2]) / 2;
        i[1] = _data.viewBox[1] + (r - i[3]) / 2;
        _this.setViewBox(i, true)
      },
      markUpdate: function (e, t) {
        if (t.attrs["src"] == "") delete t.attrs["src"];
        if (t.attrs["href"] == "") delete t.attrs["href"];
        var n = new Image;
        n.onload = function () {
          t.data.width = this.width;
          t.data.height = this.height;
          t.attrs.width = parseFloat(t.data.width / _data.scale).toFixed(2);
          t.attrs.height = parseFloat(t.data.height / _data.scale).toFixed(2);
          if (_data.options.editMode && t.attrs.href) {
            e.data("href", t.attrs.href);
            delete t.attrs.href
          } else if (_data.options.editMode && !t.attrs.href) {
            e.removeData("href")
          }
          e.data(t.data);
          e.attr(t.attrs)
        };
        n.src = t.attrs.src
      },
      markDelete: function (e) {
        e.remove()
      },
      markAdd: function (e, t) {
        var n = $.extend(true, {}, markOptions, e);
        if (n.width && n.height) {
          return _this.markAddFinalStep(n, t)
        } else {
          var r = new Image;
          r.onload = function () {
            n.width = this.width;
            n.height = this.height;
            return _this.markAddFinalStep(n, t)
          };
          r.src = n.attrs.src
        }
      },
      markAddFinalStep: function (e, t) {
        var n = $.extend(true, {}, e.attrs);
        var r = parseFloat(e.width / _data.scale).toFixed(2);
        var i = parseFloat(e.height / _data.scale).toFixed(2);
        var s = e.xy ? e.xy : e.attrs.x ? [e.attrs.x, e.attrs.y] : e.c ? _this.ll2px(e) : false;
        if (!s) return false;
        if (t) {
          s[0] = s[0] / _data.scale - e.width / (2 * _data.scale) + (_data.viewBox[0] - _data._viewBox[0]);
          s[1] = (s[1] - e.height) / _data.scale + (_data.viewBox[1] - _data._viewBox[1]);
          s = _this.markGetDefaultCoords(s[0], s[1], e.width, e.height, this.getScale())
        }
        s[0] = parseFloat(s[0]).toFixed(4);
        s[1] = parseFloat(s[1]).toFixed(4);
        if (_data.options.editMode && n.href) {
          e.href = n.href;
          delete n.href
        }
        delete n.width;
        delete n.height;
        var o = _data.R.image(e.attrs.src, s[0], s[1], r, i).attr(n).data(e);
        o.mapsvg_type = "mark";
        if (e.id) o.node.id = e.id;
        if (!_data.options.editMode) {
          if (!touchDevice) {
            o.mousedown(function (e) {
              if (this.data("popover")) {
                _this.showPopover(e, this.data("popover"))
              }
              if (_data.options.onClick) return _data.options.onClick.call(this, e, _this)
            });
            if (_data.options.mouseOver) {
              o.mouseover(function (e) {
                return _data.options.mouseOver.call(this, e, _this)
              })
            }
            if (_data.options.mouseOut) {
              o.mouseout(function (e) {
                return _data.options.mouseOver.call(this, e, _this)
              })
            }
          } else {
            o.touchstart(function (e) {
              if (this.attrs.href) {
                window.location.href = this.attrs.href
              } else if (this.data("popover")) {
                _this.showPopover(e, this.data("popover"))
              }
              if (_data.options.onClick) return _data.options.onClick.call(this, e, _this)
            })
          }
        }
        _this.markEventHandlersSet(_data.options.editMode, o);
        _data.RMarks.push(o);
        if (t) _data.options.marksEditHandler.call(o);
        _this.markAdjustPosition(o);
        return o
      },
      marksAdjustPosition: function (e) {
        if (!e && (!_data.RMarks || _data.RMarks.length < 1)) return false;
        var t, n;
        for (var r = 0; r < _data.RMarks.items.length; r++) {
          var i = _data.RMarks.items[r].data("width");
          var s = _data.RMarks.items[r].data("height");
          t = i / 2 - i / (2 * _data.scale);
          n = s - s / _data.scale;
          if (_browser.ie) {
            i = parseInt(i);
            s = parseInt(s)
          }
          _data.RMarks.items[r].attr({
            width: i / _data.scale,
            height: s / _data.scale
          }).transform("t" + t + "," + n)
        }
      },
      markAdjustPosition: function (e) {
        var t = e.data("width");
        var n = e.data("height");
        var r = t / 2 - t / (2 * _data.scale);
        var i = n - n / _data.scale;
        e.attr({
          width: t / _data.scale,
          height: n / _data.scale
        }).transform("t" + r + "," + i)
      },
      markGetDefaultCoords: function (e, t, n, r, i) {
        e = parseFloat(e);
        t = parseFloat(t);
        n = parseFloat(n);
        r = parseFloat(r);
        e = parseFloat(e + n / (2 * i) - n / 2).toFixed(2);
        t = parseFloat(t + r / i - r).toFixed(2);
        return [e, t]
      },
      markMoveStart: function () {
        this.data("ox", parseFloat(this.attr("x")));
        this.data("oy", parseFloat(this.attr("y")))
      },
      markMove: function (e, t) {
        e = e / _data.scale;
        t = t / _data.scale;
        this.attr({
          x: this.data("ox") + e,
          y: this.data("oy") + t
        })
      },
      markMoveEnd: function () {
        if (this.data("ox") == this.attr("x") && this.data("oy") == this.attr("y")) {
          options.marksEditHandler.call(this)
        }
      },
      panStart: function (e) {
        if (e.target.id == "btnZoomIn" || e.target.id == "btnZoomOut") return false;
        if (_data.options.editMode && e.target.nodeName == "image") return false;
        e.preventDefault();
        var t = e.touches && e.touches[0] ? e.touches[0] : e;
        _data.pan = {};
        _data.pan.vxi = _data.viewBox[0];
        _data.pan.vyi = _data.viewBox[1];
        _data.pan.x = t.clientX;
        _data.pan.y = t.clientY;
        _data.pan.dx = 0;
        _data.pan.dy = 0;
        _data.pan.vx = 0;
        _data.pan.vy = 0;
        if (!touchDevice) $("body").on("mousemove", _this.panMove).on("mouseup", _this.panEnd)
      },
      panMove: function (e) {
        e.preventDefault();
        _data.isPanning = true;
        _data.RMap.attr({
          cursor: "move"
        });
        $("body").css({
          cursor: "move"
        });
        var t = e.touches && e.touches[0] ? e.touches[0] : e;
        _data.pan.dx = _data.pan.x - t.clientX;
        _data.pan.dy = _data.pan.y - t.clientY;
        var n = parseInt(_data.pan.vxi + _data.pan.dx / _data.scale);
        var r = parseInt(_data.pan.vyi + _data.pan.dy / _data.scale);
        if (_data.options.panLimit) {
          if (n < _data.svgDefault.viewBox[0]) n = _data.svgDefault.viewBox[0];
          else if (_data.viewBox[2] + n > _data.svgDefault.viewBox[2]) n = _data.svgDefault.viewBox[2] - _data.viewBox[2];
          if (r < _data.svgDefault.viewBox[1]) r = _data.svgDefault.viewBox[1];
          else if (_data.viewBox[3] + r > _data.svgDefault.viewBox[3]) r = _data.svgDefault.viewBox[3] - _data.viewBox[3]
        }
        _data.pan.vx = n;
        _data.pan.vy = r;
        _this.setViewBox([_data.pan.vx, _data.pan.vy, _data.viewBox[2], _data.viewBox[3]])
      },
      panEnd: function (e) {
        _data.isPanning = false;
        if (Math.abs(_data.pan.dx) < 5 && Math.abs(_data.pan.dy) < 5) {
          if (_data.options.editMode) _this.markAddClickHandler(e);
          if (_data.region_clicked) _this.regionClickHandler(e, _data.region_clicked)
        }
        $("body").css({
          cursor: "default"
        });
        _data.RMap.attr({
          cursor: _data.options.cursor
        });
        _data.viewBox[0] = _data.pan.vx || _data.viewBox[0];
        _data.viewBox[1] = _data.pan.vy || _data.viewBox[1];
        if (!touchDevice) $("body").off("mousemove", _this.panMove).off("mouseup", _this.panEnd)
      },
      panRegionClickHandler: function (e, t) {
        _data.region_clicked = t
      },
      touchStart: function (e) {
        e.preventDefault();
        if (_data.options.zoom && e.touches && e.touches.length == 2) {
          _data.touchZoomStartViewBox = _data.viewBox;
          _data.touchZoomStart = _data.scale;
          _data.touchZoomEnd = 1
        } else {
          _this.panStart(e);
          _data.isPanning = true
        }
      },
      touchMove: function (e) {
        e.preventDefault();
        if (_data.options.zoom && e.touches && e.touches.length >= 2) {
          _this.zoom(null, e.scale);
          _data.isPanning = false
        } else if (_data.isPanning) {
          _this.panMove(e)
        }
      },
      touchEnd: function (e) {
        e.preventDefault();
        if (_data.touchZoomStart) {
          _data.touchZoomStart = false;
          _data.touchZoomEnd = false
        } else if (_data.isPanning) {
          _this.panEnd(e)
        }
      },
      marksHide: function () {
        _data.RMarks.hide()
      },
      marksShow: function () {
        _data.RMarks.show()
      },
      marksGet: function () {
        var e = [];
        $.each(_data.RMarks, function (t, n) {
          if (n.attrs) {
            var r = $.extend({}, n.attrs);
            if (n.data("href")) r.href = n.data("href");
            e.push({
              attrs: r,
              tooltip: n.data("tooltip"),
              popover: n.data("popover"),
              width: n.data("width"),
              height: n.data("height"),
              href: n.data("href")
            })
          }
        });
        return e
      },
      getSelected: function () {
        return _data.selected_id
      },
      selectRegion: function (e) {
        var t = _data.R.getById(e);
        if (!t || t.disabled) return false;
        if (_data.options.multiSelect) {
          var n = $.inArray(e, _data.selected_id);
          if (n >= 0) {
            t.attr({
              fill: t.default_attr.fill
            });
            t.selected = false;
            _data.selected_id.splice(n, 1);
            return
          } else {
            _data.selected_id.push(e);
            t.selected = true
          }
        } else {
          if (_data.selected_id) {
            var r = _data.R.getById(_data.selected_id);
            r.attr(r.default_attr);
            r.selected = false;
            if (_browser.ie && !_browser.ie.old) _this.mapAdjustStrokes()
          }
          _data.selected_id = e;
          t.selected = true
        }
        t.attr(t.selected_attr)
      },
      unhighlightRegion: function (e) {
        var t = _data.R.getById(e);
        if (t.disabled || _data.options.multiSelect && $.inArray(e, _data.selected_id) >= 0 || _data.selected_id == e) return false;
        t.attr({
          fill: t.default_attr.fill
        })
      },
      highlightRegion: function (e) {
        var t = _data.R.getById(e);
        if (_data.isPanning || t.disabled || _data.options.multiSelect && $.inArray(e, _data.selected_id) >= 0 || _data.selected_id == e) return false;
        t.attr(t.hover_attr)
      },
      ll2px: function (e) {
        var t = e.c;
        var n = parseFloat(t[0]);
        var r = parseFloat(t[1]);
        var i = 2;
        var s = CBK[i];
        var o = 1;
        var u = Math.round(s + r * CEK[i]);
        var a = Math.sin(n * 3.14159 / 180);
        if (a < -.9999) a = -.9999;
        else if (a > .9999) a = .9999;
        var f = Math.round(s + .5 * Math.log((1 + a) / (1 - a)) * -CFK[i]);
        var l = [u - (33.8 + e.width / 2), f - (141.7 + e.height)];
        return l
      },
      isRegionDisabled: function (e, t) {
        if (_data.options.regions[e] && (_data.options.regions[e].disabled || t == "none")) {
          return true
        } else if ((_data.options.regions[e] == undefined || _this.parseBoolean(_data.options.regions[e].disabled)) && (_data.options.disableAll || t == "none" || e == "labels" || e == "Labels")) {
          return true
        } else {
          return false
        }
      },
      regionClickHandler: function (e, t) {
        if (!t) return false;
        _data.region_clicked = null;
        _this.selectRegion(t.name);
        _this.showPopover(e, t.popover);
        if (_data.options.onClick) return _data.options.onClick.call(t, e, _this);
        if (touchDevice && t.attrs.href) window.location.href = t.attrs.href
      },
      renderSVGPath: function (e, t, n) {
        var r = _data.R.path($(e).attr("d"));
        var i = _this.initRaphaelObject(r, e, t, n);
        _this.regionAdd(i)
      },
      renderSVGImage: function (e, t, n) {
        var r = $(e).attr("xlink:href"),
          i = $(e).attr("x") || 0,
          s = $(e).attr("y") || 0,
          o = $(e).attr("width") || 0,
          u = $(e).attr("height") || 0;
        if (!_this.fileExists(r)) return false;
        var a = _data.R.image(r, i, s, o, u);
        _this.initRaphaelObject(a, e, t, n);
        return a
      },
      renderSVGPolygon: function (e, t, n) {
        var r = e.attr("points").trim().replace(/ +(?= )/g, "").split(/\s+|,/);
        var i = r.shift(),
          s = r.shift();
        var o = "M" + i + "," + s + " L" + r.join(" ") + "z";
        var u = _this.initRaphaelObject(_data.R.path(o), e, t, n);
        _this.regionAdd(u);
        return u
      },
      renderSVGPolyline: function (e, t, n) {
        var r = e.attr("points").trim().replace(/ +(?= )/g, "").split(/\s+|,/);
        var i = r.shift(),
          s = r.shift();
        var o = "M" + i + "," + s + " L" + r.join(" ");
        var u = _this.initRaphaelObject(_data.R.path(o), e, t, n);
        return u
      },
      renderSVGCircle: function (e, t, n) {
        var i = $(e).attr("cx") || 0,
          s = $(e).attr("cy") || 0;
        r = $(e).attr("r") || 0;
        var o = _this.initRaphaelObject(_data.R.circle(i, s, r), e, t, n);
        _this.regionAdd(o);
        return o
      },
      renderSVGEllipse: function (e, t, n) {
        var r = $(e).attr("cx") || 0,
          i = $(e).attr("cy") || 0;
        rx = $(e).attr("rx") || 0;
        ry = $(e).attr("ry") || 0;
        var s = _this.initRaphaelObject(_data.R.ellipse(r, i, rx, ry), e, t, n);
        _this.regionAdd(s);
        return s
      },
      renderSVGRect: function (e, t, n) {
        var i = $(e).attr("x") || 0,
          s = $(e).attr("y") || 0,
          o = $(e).attr("width") || 0,
          u = $(e).attr("height") || 0;
        r = $(e).attr("rx") || $(e).attr("ry") || 0;
        var a = _this.initRaphaelObject(_data.R.rect(i, s, o, u, r), e, t, n);
        _this.regionAdd(a);
        return a
      },
      renderSVGText: function (e) {
        var t = $(e).find("tspan");
        var n = parseFloat($(e).attr("x")) || 0;
        var r = parseFloat($(e).attr("y")) || 0;
        t.each(function (t, i) {
          var s = _this.renderSVGTspan($(i), {
            x: n,
            y: r
          });
          s.attr(_this.styleSVG2Raphael(e));
          s.attr(_this.styleSVG2Raphael($(i)));
          s.transform(_this.transformSVG2Raphael(e));
          s.transform(_this.transformSVG2Raphael($(i)))
        });
        if (t.length == 0) {
          var i = _this.renderSVGTspan(e);
          i.attr(_this.styleSVG2Raphael(e));
          i.transform(_this.transformSVG2Raphael(e))
        }
        return i
      },
      renderSVGTspan: function (e, t) {
        t = t || {
          x: 0,
          y: 0
        };
        var n = parseFloat($(e).attr("x")) || t.x;
        var r = parseFloat($(e).attr("y")) || t.y;
        if ($(e).attr("dx")) n += t.x + $(e).attr("dx");
        if ($(e).attr("dy")) r += t.y + $(e).attr("dy");
        text = $(e).text();
        var i = _data.R.text(n, r, text).attr({
          "text-anchor": "start"
        }).toFront();
        i.mapsvg_type = "text";
        $(i.node).css({
          "-webkit-touch-callout": "none",
          "-webkit-user-select": "none",
          "pointer-events": "none"
        });
        return i
      },
      initRaphaelObject: function (e, t, n, r) {
        var i = r || {};
        var s = n || "";
        e.id = $(t).attr("id") || e.type + globalID++;
        e.node.id = e.id;
        e.name = e.id;
        var o = _this.styleSVG2Raphael(t, r);
        e.attr(o);
        var u = _this.transformSVG2Raphael(t) + s;
        e.transform(u);
        return e
      },
      styleSVG2Raphael: function (e, t) {
        var t = t || {};
        var n = {};
        var r = $(e).get(0).attributes;
        var i = ["fill", "fill-opacity", "opacity", "font", "font-name", "font-family", "font-size", "font-weight", "stroke", "stroke-lincap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke-width"];
        if ($(e).attr("style")) {
          var s = $(e).attr("style").split(";");
          $.each(s, function (e, t) {
            var r = t.split(":");
            r[0] = r[0].trim();
            if (r[1]) r[1] = r[1].trim();
            if (r[0] == "font-size") r[1] = parseInt(r[1].replace("px", ""));
            if (_this.isNumber(r[0])) r[1] = parseFloat(r[1]);
            n[r[0]] = r[1]
          })
        }
        if (r) $.each(r, function (e, t) {
          if ($.inArray(t.name, i) > -1) {
            if (t.name == "font-size") {
              t.value = parseInt(t.value.replace("px", ""))
            }
            n[t.name] = t.value
          }
        });
        if (n["font-size"]) n["font-size"] = parseInt(n["font-size"]);
        if (n["font-family"]) n["font-family"] = n["font-family"] + ", Arial";
        var o = $.extend({}, t, n);
        if (o["stroke"] == undefined && o["fill"] == undefined) {
          o["stroke"] = "none";
          o["fill"] = "none"
        } else if (o["stroke"] == undefined) {
          o["stroke"] = "none"
        } else if (o["fill"] == undefined) {
          o["fill"] = "none"
        }
        return o
      },
      transformSVG2Raphael: function (e) {
        var t = $(e).attr("transform");
        var n;
        if (t) {
          var r = t.split(")");
          var i = [];
          for (var s = 0; s < r.length; s++) {
            if (r[s] != "") {
              var o = r[s].split("(");
              if (o[0] != "matrix") {
                o[0] = o[0].slice(0, 1).toLowerCase();
                i.push(o[0] + o[1])
              } else {
                if (o[1].indexOf(",") != -1) n = o[1].split(",");
                else n = o[1].split(" ");
                var u = Raphael.matrix(parseFloat(n[0]), parseFloat(n[1]), parseFloat(n[2]), parseFloat(n[3]), parseFloat(n[4]), parseFloat(n[5])).toTransformString();
                i.push(u)
              }
            }
          }
          return i.join()
        }
        return ""
      },
      getElementStyles: function (e) {
        if (!_browser.ie) {
          return e.style
        } else {
          var t = {};
          t.getPropertyValue = function (e) {
            return t[e] || undefined
          };
          if ($(e).attr("style")) {
            var n = $(e).attr("style").split(";");
            $.each(n, function (e, n) {
              var r = n.split(":");
              t[r[0]] = r[1]
            })
          }
          return t
        }
      },
      fileExists: function (e) {
        if (e.substr(0, 4) == "data") return true;
        var t = new XMLHttpRequest;
        t.open("HEAD", e, false);
        t.send();
        return t.status != 404
      },
      regionAdd: function (_item) {
        var name = _item.name;
        _item.disabled = _this.isRegionDisabled(name, _item.attr("fill"));
        _item.default_attr = {};
        _item.default_attr["fill"] = _item.disabled && _data.options.colors.disabled ? _data.options.colors.disabled : _item.attr("fill") || "none";
        if (_item.default_attr["fill"] && _item.default_attr["fill"] != "none" && _data.options.colors.base && !_item.disabled) _item.default_attr["fill"] = _data.options.colors.base;
        if (_item.attr("stroke")) _item.default_attr["stroke"] = _item.attr("stroke");
        if (_item.attr("stroke-width")) _item.default_attr["stroke-width"] = parseFloat(_item.attr("stroke-width"));
        if (_item.default_attr["stroke"] && _item.default_attr["stroke"] != "none" && _data.options.colors.stroke) _item.default_attr["stroke"] = _data.options.colors.stroke;
        if (_item.default_attr["stroke-width"] && _data.options.strokeWidth) _item.default_attr["stroke-width"] = parseFloat(_data.options.strokeWidth);
        _item.selected_attr = {};
        _item.hover_attr = {};
        if (_item.disabled) {
          _item.default_attr.cursor = "default";
          $(_item.node).css({
            "pointer-events": "none"
          })
        } else {
          _item.default_attr.cursor = _data.options.cursor
        } if (_data.options.regions[name]) {
          if (_data.options.regions[name].attr) _item.default_attr = $.extend(true, {}, _item.default_attr, _data.options.regions[name].attr);
          if (_data.options.regions[name].tooltip) _item.tooltip = _data.options.regions[name].tooltip;
          if (_data.options.regions[name].popover) _item.popover = _data.options.regions[name].popover;
          if (_data.options.regions[name].data) {
            if (typeof _data.options.regions[name].data == "string") {
              if (_data.options.regions[name].data.substr(0, 1) == "[" || _data.options.regions[name].data.substr(0, 1) == "{") {
                try {
                  var tmp;
                  eval("tmp = " + _data.options.regions[name].data);
                  _item._data = tmp
                } catch (err) {
                  _item._data = _data.options.regions[name].data
                }
              } else {
                _item._data = _data.options.regions[name].data
              }
            } else {
              _item._data = _data.options.regions[name].data
            }
          }
        }
        if (_this.isNumber(_data.options.colors.selected)) _item.selected_attr["fill"] = _this.lighten(_item.default_attr.fill, parseFloat(_data.options.colors.selected));
        else _item.selected_attr["fill"] = _data.options.colors.selected; if (_this.isNumber(_data.options.colors.hover)) _item.hover_attr["fill"] = _this.lighten(_item.default_attr.fill, parseFloat(_data.options.colors.hover));
        else _item.hover_attr["fill"] = _data.options.colors.hover;
        var dash = _item.attr("stroke-dasharray");
        if (dash && dash != "none") _item.default_attr["stroke-dasharray"] = "--";
        _item.attr(_item.default_attr);
        if (!_browser.ie && !_browser.firefox) $(_item.node).css({
          "vector-effect": "non-scaling-stroke"
        });
        _data.RMap.push(_item);
        if (_data.options.regions[name] && _data.options.regions[name].selected) _this.selectRegion(name)
      },
      lighten2: function (e, t) {
        var n = e.charAt(0) == "#" ? e.substring(1, 7) : e;
        var r = Raphael.rgb2hsb(parseInt(n.substring(0, 2), 16), parseInt(n.substring(2, 4), 16), parseInt(n.substring(4, 6), 16));
        r.b += .1;
        return Raphael.hsb(r)
      },
      lighten: function (e, t) {
        if (!e) return false;
        t = parseInt(t) * .008;
        var n = Raphael.getRGB(e);
        var r = Raphael.rgb2hsb(n.r, n.g, n.b);
        var i = r.b + t;
        if (i >= 1) {
          i = 1;
          r.s = r.s - t * 1.5
        } else if (i <= 0) {
          i = 0
        }
        var s = Raphael.hsb2rgb(r.h, r.s, i);
        return s.hex
      },
      setPan: function (e) {
        if (e) {
          _data.options.pan = true;
          _data.$map.on("mousedown", _this.panStart)
        } else {
          if (_data.options.pan) _data.$map.off("mousedown", _this.panStart);
          _data.options.pan = false
        }
      },
      markAddClickHandler: function (e) {
        if ($(e.target).is("image")) return false;
        var t = mouseCoords(e);
        var n = t.x - _data.$map.offset().left;
        var r = t.y - _data.$map.offset().top;
        if (!$.isNumeric(n) || !$.isNumeric(r)) return false;
        _this.markAdd({
          xy: [n, r]
        }, true)
      },
      markEventHandlersSet: function (e, t) {
        e = _this.parseBoolean(e);
        if (e) {
          if (_data.options.editMode === false) t.unhover();
          t.drag(_this.markMove, _this.markMoveStart, _this.markMoveEnd)
        } else {
          if (_data.options.editMode) t.undrag();
          t.hover(function () {
            if (this.data("tooltip")) {
              _data.mapTip.html(this.data("tooltip"));
              _data.mapTip.show()
            }
          }, function () {
            if (this.data("tooltip")) _data.mapTip.hide()
          })
        }
      },
      setMarksEditMode: function (e, t) {
        e = _this.parseBoolean(e);
        _data.options.editMode = e
      },
      setZoom: function (e) {
        if (e) {
          _data.options.zoom = true;
          _data.$map.bind("mousewheel.mapsvg", function (e, t, n, r) {
            var i = t > 0 ? 1 : -1;
            _this.zoom(i);
            return false
          });
          if (_data.options.zoomButtons.show) {
            var t = $("<div></div>");
            var n = {
              "border-radius": "3px",
              display: "block",
              "margin-bottom": "7px"
            };
            var r = $('<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABhElEQVR4nJWTT4rqQBDGf92pSEJWmYfgQpABb+EB1NU8DyBe5M1q5iKStTCDd/AWggElC3EQJAQxbb/NJDH+mccraEh31fdVfR8pBRBF0Uuapn+AX8CZn0MDuyAI3sfj8aeaTqcvWZZ9XFdZazmdTgC4rotS6oYpCILfkmXZ6yNwt9tFKcVyucRxnBuSNE1fNfB0TWCModlsMhwOGQwGdDod8jy/J+dJP9JsjKl9W2vvlZ3lcuyiS57ntY7FvZDgum6Zk0vN7XYbay3GGMIwLItarRbGGEQErTVxHON5XkVQAEaj0b0x6fV6tXsURRwOBxzHQd9F/CPO58o2ARARdrsds9ms9CIMQ/r9PgCLxYL1eo3rulhr2e/3dQkAnueRJElp2vF4LLskScJmsynNK8A1AqjcVUohUqVEBBGpuV+E/j63CV093/sLizIBvoDny1fHcdhut8znc5RSrFar2kQX8aV933+7ZldK0Wg0iOO4BD9YpjcF8L2R/7XOvu+/TyaTz79+UqnWsVHWHAAAAABJRU5ErkJggg==" id="btnZoomIn"/>').on("click", function (e) {
              e.stopPropagation();
              _this.zoomIn()
            }).css(n);
            var i = $('<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA6klEQVR4nKWTPW6DQBBG3w4RaLXSFs4puAe9fQHEReLKPgYN4gLxQei5RNytFraANNEKKwk29uum+N78SKMA2rbdO+c+gHdgYh0Bvowx57IsL6ppmr33/vNO6E+MMQfx3h+fCQM4544C7J4VADvh/s5rTG/LKoTANK37RIQ0TWMdBSEE8jwnyzLmef437L2n7/soiQLnHEVRPDR313VRIA8lVogTWGup6/pmhSRJAFBKxcAwDFhrfwuSJCGEwDiOqx2VUlF8I1h23ILw2h1EgOsLgqtorU/LI23BGHNSAD8fuemdtdbnqqou39SbTK6RdYDsAAAAAElFTkSuQmCC" id="btnZoomOut"/>').on("click", function (e) {
              e.stopPropagation();
              _this.zoomOut()
            }).css(n);
            t.append(i).append(r).css({
              position: "absolute",
              bottom: "50px",
              width: "16px",
              cursor: "pointer"
            });
            if (_data.options.zoomButtons.location == "right") t.css({
              right: "25px"
            });
            else if (_data.options.zoomButtons.location == "left") t.css({
              left: "15px"
            });
            _data.zoomButtons = t;
            _data.$map.append(_data.zoomButtons)
          }
        } else {
          if (_data.options.zoom) _data.$map.unbind("mousewheel.mapsvg");
          if (_data.zoomButtons) _data.zoomButtons.hide();
          _data.options.zoom = false
        }
      },
      setSize: function (e, t, n) {
        _data.options.width = parseInt(e);
        _data.options.height = parseInt(t);
        _data.options.responsive = _this.parseBoolean(n);
        if (!_data.options.width && !_data.options.height) {
          _data.options.width = _data.svgDefault.width;
          _data.options.height = _data.svgDefault.height
        } else if (!_data.options.width && _data.options.height) {
          _data.options.width = parseInt(_data.options.height * _data.svgDefault.width / _data.svgDefault.height)
        } else if (_data.options.width && !_data.options.height) {
          _data.options.height = parseInt(_data.options.width * _data.svgDefault.height / _data.svgDefault.width)
        }
        if (_data.options.responsive) {
          var r = _data.options.width;
          var i = _data.options.height;
          _data.options.width = _data.svgDefault.width;
          _data.options.height = _data.svgDefault.height
        }
        _data.whRatio = _data.options.width / _data.options.height;
        _data.scale = _this.getScale();
        if (_data.options.responsive) {
          _data.$map.css({
            "max-width": r + "px",
            "max-height": i + "px",
            width: "auto",
            height: "auto",
            position: "relative"
          }).height(_data.$map.width() / _data.whRatio);
          $(window).bind("resize.mapsvg", function () {
            _data.$map.height(_data.$map.width() / _data.whRatio)
          })
        } else {
          _data.$map.css({
            width: _data.options.width + "px",
            height: _data.options.height + "px",
            "max-width": "none",
            "max-height": "none",
            position: "relative"
          });
          $(window).unbind("resize.mapsvg")
        } if (!_data.options.responsive && _data.R) _data.R.setSize(_data.options.width, _data.options.height);
        return [_data.options.width, _data.options.height]
      },
      setMarks: function (e) {
        if (e) {
          $.each(e, function (e, t) {
            _this.markAdd(t)
          })
        }
      },
      showTip: function () {},
      showPopover: function () {},
      hideTip: function () {
        _data.mapTip.hide();
        _data.mapTip.html("")
      },
      setTooltip: function (e) {
        _data.mapTip = $('<div class="map_tooltip"></div>');
        $("body").append(_data.mapTip);
        _data.mapTip.css({
          "font-weight": "normal",
          "font-size": "12px",
          color: "#000000",
          position: "absolute",
          "border-radius": "4px",
          "-moz-border-radius": "4px",
          "-webkit-border-radius": "4px",
          top: "0",
          left: "0",
          "z-index": "1000",
          display: "none",
          "background-color": "white",
          border: "1px solid #eee",
          padding: "4px 7px",
          "max-width": "600px"
        });
        if (_data.options.tooltips.show == "hover") {
          _data.$map.mousemove(function (e) {
            _data.mapTip.css("left", e.clientX + $(window).scrollLeft()).css("top", e.clientY + $(window).scrollTop() + 30)
          })
        }
        _this.showTip = _data.options.tooltipsMode == "custom" ? function (e) {
          var t = _data.R.getById(e);
          if (t.tooltip) {
            _data.mapTip.html(t.tooltip);
            _data.mapTip.show()
          }
        } : _data.options.tooltipsMode == "names" ? function (e) {
          var t = _data.R.getById(e);
          if (t.disabled) return false;
          _data.mapTip.html(e.replace(/_/g, " "));
          _data.mapTip.show()
        } : _data.options.tooltipsMode == "combined" ? function (e) {
          var t = _data.R.getById(e);
          if (t.tooltip) {
            _data.mapTip.html(t.tooltip);
            _data.mapTip.show()
          } else {
            if (t.disabled) return false;
            _data.mapTip.html(e.replace(/_/g, " "));
            _data.mapTip.show()
          }
        } : function (e) {
          null
        }
      },
      setPopover: function (e) {
        if (!e) return false;
        $("body").prepend('<div class="map_popover"><div class="map_popover_content"></div><div class="map_popover_close">x</div></div>');
        _data.mapPopover = $(".map_popover");
        var t = _data.mapPopover.find(".map_popover_close");
        _data.mapPopover.css({
          "font-weight": "normal",
          "font-size": "12px",
          color: "#000000",
          position: "absolute",
          "border-radius": "4px",
          "-moz-border-radius": "4px",
          "-webkit-border-radius": "4px",
          top: "0",
          left: "0",
          "z-index": "1000",
          width: _data.options.popover.width + (_data.options.popover.width == "auto" ? "" : "px"),
          height: _data.options.popover.height + (_data.options.popover.height == "auto" ? "" : "px"),
          display: "none",
          "background-color": "white",
          border: "1px solid #ccc",
          padding: "12px",
          "-webkit-box-shadow": "5px 5px 5px 0px rgba(0, 0, 0, 0.2)",
          "box-shadow": "5px 5px 5px 0px rgba(0, 0, 0, 0.2)"
        });
        t.css({
          position: "absolute",
          top: "0",
          right: "5px",
          cursor: "pointer",
          color: "#aaa",
          "z-index": "1200"
        });
        _this.showPopover = function (e, t, n) {
          if (!n || n.length != 2) {
            var r = mouseCoords(e);
            var n = [r.x, r.y]
          } else {
            var i = _this.getScale();
            n[0] = _data.$map.offset().left + n[0] * i;
            n[1] = _data.$map.offset().top + n[1] * i
          } if (t) {
            _data.mapPopover.find(".map_popover_content").html(t);
            var s = n[0] - _data.mapPopover.outerWidth(false) / 2;
            var o = n[1] - _data.mapPopover.outerHeight(false) - 7;
            if (s < 0) s = 0;
            if (o < 0) o = 0;
            _data.mapPopover.css("left", s).css("top", o);
            _data.mapPopover.show()
          } else {
            _this.hidePopover()
          }
        };
        _this.hidePopover = function () {
          _data.mapPopover.find(".map_popover_content").html("");
          _data.mapPopover.hide(0, function () {
            $("body").off("mousedown", _this.popoverOffHandler);
            if (_data.options.onPopoverClose) {
              _data.options.onPopoverClose.call(_this)
            }
          })
        };
        t.on("click", _this.hidePopover)
      },
      popoverOffHandler: function (e) {
        var t = $(e.target).attr("id");
        if ($(e.target).closest(".map_popover").length || _data.options.regions[t] && !_data.options.regions[t].disabled) return false;
        _this.hidePopover()
      },
      isNumber: function (e) {
        return !isNaN(parseFloat(e)) && isFinite(e)
      },
      parseBoolean: function (e) {
        switch (String(e).toLowerCase()) {
        case "true":
        case "1":
        case "yes":
        case "y":
          return true;
        case "false":
        case "0":
        case "no":
        case "n":
          return false;
        default:
          return undefined
        }
      },
      mouseOverHandler: function () {},
      mouseOutHandler: function () {},
      mouseDownHandler: function () {},
      init: function (e, t) {
        if (!e.source) {
          alert("mapSVG Error: Please provide a map URL");
          return false
        }
        if (e.beforeLoad) e.beforeLoad.call(_this);
        if (e.source.indexOf("http://") == 0 || e.source.indexOf("https://") == 0) e.source = "//" + e.source.split("://").pop();
        e.pan = _this.parseBoolean(e.pan);
        e.zoom = _this.parseBoolean(e.zoom);
        e.responsive = _this.parseBoolean(e.responsive);
        e.disableAll = _this.parseBoolean(e.disableAll);
        e.multiSelect = _this.parseBoolean(e.multiSelect);
        if (e.viewBox && typeof e.viewBox == "string") {
          e.viewBoxFind = e.viewBox;
          delete e.viewBox
        }
        _data = {};
        _data.options = $.extend(true, {}, defaults, e);
        _data.map = t;
        _data.$map = $(t);
        _data.whRatio = 0;
        _data.isPanning = false;
        _data.markOptions = {};
        _data.svgDefault = {};
        _data.mouseDownHandler;
        _data.refLength = 0;
        _data.scale = 1;
        _data._scale = 1;
        _data.selected_id = _data.options.multiSelect ? [] : 0;
        _data.mapData = {};
        _data.marks = [];
        _data._viewBox = [];
        _data.viewBox = [];
        _data.viewBoxZoom = [];
        _data.viewBoxFind = undefined;
        _data.zoomLevel = 0;
        _data.pan = {};
        _data.zoom;
        _data.touchZoomStart;
        _data.touchZoomStartViewBox;
        _data.touchZoomEnd;
        _data.$map.css({
          background: _data.options.colors.background,
          height: "100px",
          position: "relative"
        });
        var n = $("<div>" + _data.options.loadingText + "</div>").css({
          position: "absolute",
          top: "50%",
          left: "50%",
          "z-index": 1,
          padding: "7px 10px",
          "border-radius": "5px",
          "-webkit-border-radius": "5px",
          "-moz-border-radius": "5px",
          "-ms-border-radius": "5px",
          "-o-border-radius": "5px",
          border: "1px solid #ccc",
          background: "#f5f5f2",
          color: "#999"
        });
        _data.$map.append(n);
        n.css({
          "margin-left": function () {
            return -($(this).outerWidth(false) / 2) + "px"
          },
          "margin-top": function () {
            return -($(this).outerHeight(false) / 2) + "px"
          }
        });
        $.ajax({
          url: _data.options.source,
          success: function (e) {
            $data = $(e);
            var t = $data.find("svg");
            _data.svgDefault.width = parseFloat(t.attr("width").replace(/px/g, ""));
            _data.svgDefault.height = parseFloat(t.attr("height").replace(/px/g, ""));
            _data.svgDefault.viewBox = t.attr("viewBox") ? t.attr("viewBox").split(" ") : [0, 0, _data.svgDefault.width, _data.svgDefault.height];
            $.each(_data.svgDefault.viewBox, function (e, t) {
              _data.svgDefault.viewBox[e] = parseInt(t)
            });
            _data._viewBox = _data.options.viewBox.length == 4 ? _data.options.viewBox : _data.svgDefault.viewBox;
            $.each(_data._viewBox, function (e, t) {
              _data._viewBox[e] = parseInt(t)
            });
            _this.setSize(_data.options.width, _data.options.height, _data.options.responsive);
            if (_browser.ie && _browser.ie.old) {
              _data.R = Raphael(_data.$map.attr("id"), _data.options.width, _data.options.height);
              _data.scale = _this.getScale();
              if (_data.options.responsive) $(window).on("resize", _this.fluidResize)
            } else {
              _data.R = Raphael(_data.$map.attr("id"), "100%", "100%");
              if (_data.options.responsive) {
                $(window).on("resize", function (e) {
                  _data.scale = _this.getScale();
                  _this.marksAdjustPosition()
                })
              }
            } if (_data.options.panBackground) _data.background = _data.R.rect(_data.svgDefault.viewBox[0], _data.svgDefault.viewBox[1], _data.svgDefault.viewBox[2], _data.svgDefault.viewBox[3]).attr({
              fill: _data.options.colors.background
            });
            _data.RMap = _data.R.set();
            _data.RMarks = _data.R.set();
            var r = function (e, t, n) {
              var r = $(e).get(0).tagName;
              switch (r) {
              case "path":
                _this.renderSVGPath(e, t, n);
                break;
              case "polygon":
                _this.renderSVGPolygon(e, t, n);
                break;
              case "polyline":
                _this.renderSVGPolyline(e, t, n);
                break;
              case "circle":
                _this.renderSVGCircle(e, t, n);
                break;
              case "ellipse":
                _this.renderSVGEllipse(e, t, n);
                break;
              case "rect":
                _this.renderSVGRect(e, t, n);
                break;
              case "image":
                _this.renderSVGImage(e, t, n);
                break;
              case "text":
                _this.renderSVGText(e, t, n);
                break;
              default:
                null;
                break
              }
            };
            var i = function (e, t, n) {
              var s = $(e).children();
              if (s.length) {
                var o = [];
                t = t || "";
                t = _this.transformSVG2Raphael(e) + t;
                n = n || {};
                $(e).children().each(function (e, r) {
                  var s = _this.styleSVG2Raphael(r, n);
                  i($(r), t, s)
                })
              }
              r($(e), t, n)
            };
            i($data.find("svg"));
            var s = _data.options.viewBoxFind || _data._viewBox;
            _this.setViewBox(s);
            _this.setMarks(_data.options.marks);
            _this.setMarksEditMode(_data.options.editMode);
            _this.setPan(_data.options.pan);
            _this.setZoom(_data.options.zoom);
            _this.setTooltip(_data.options.tooltips.mode);
            _this.setPopover(_data.options.popover);
            if (_data.options.responsive && _browser.ie && _browser.ie.old) _this.fluidResize();
            if (_browser.ie && !_browser.ie.old || _browser.firefox) _this.mapAdjustStrokes();
            var o = "";
            if (!touchDevice) {
              o = "methods.highlightRegion(this.name);";
              if (_data.options.tooltips.show == "hover") o += "methods.showTip(this.name);";
              if (_data.options.mouseOver) o += "return options.mouseOver.call(this, e, methods);";
              _this.mouseOverHandler = new Function("e, methods, options", o);
              o = "";
              o += "methods.unhighlightRegion(this.name);";
              if (_data.options.tooltips.show == "hover") o += "methods.hideTip();";
              if (_data.options.mouseOut) o += "return options.mouseOut.call(this, e, methods);";
              _this.mouseOutHandler = new Function("e, methods, options", o)
            }
            o = "";
            o = "methods.regionClickHandler.call(mapObj, e, this);";
            _this.mouseDownHandler = new Function("e, methods", o);
            if (!touchDevice) {
              _data.RMap.mouseover(function (e) {
                _this.mouseOverHandler.call(this, e, _this, options)
              }).mouseout(function (e) {
                _this.mouseOutHandler.call(this, e, _this, options)
              })
            }
            if (!_data.options.pan) {
              if (!touchDevice) {
                _data.RMap.mousedown(function (e) {
                  _this.regionClickHandler.call(_this, e, this)
                })
              } else {
                _data.RMap.touchstart(function (e) {
                  e.preventDefault();
                  _this.regionClickHandler.call(_this, e, this)
                })
              }
            } else {
              if (!touchDevice) {
                _data.RMap.mousedown(function (e) {
                  e.preventDefault();
                  _this.panRegionClickHandler.call(_this, e, this)
                })
              } else {
                _data.RMap.touchstart(function (e) {
                  _this.panRegionClickHandler.call(_this, e, this)
                });
                _data.R.canvas.addEventListener("touchstart", function (e) {
                  _this.touchStart(e)
                }, false);
                _data.R.canvas.addEventListener("touchmove", function (e) {
                  _this.touchMove(e)
                }, false);
                _data.R.canvas.addEventListener("touchend", function (e) {
                  _this.touchEnd(e)
                }, false)
              }
            }
            n.hide();
            if (_data.options.afterLoad) _data.options.afterLoad.call(_this)
          }
        });
        return _this
      }
    };
    var _this = this.methods
  };
  $.fn.mapSvg = function (e) {
    var t = $(this).attr("id");
    if (typeof e == "object" && instances[t] === undefined) {
      instances[t] = new mapSVG(this, e);
      return instances[t].methods.init(e, this)
    } else if (instances[t]) {
      return instances[t].methods
    } else {
      return $(this)
    }
  }
})(jQuery)
