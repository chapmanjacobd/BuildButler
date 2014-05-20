// bbutler.js
// Copyright Jacob Chapman 2013-2014
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation version 3 of the License.
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

var bbutler = bbutler || {};

bbutler.extractId = function() {}

//go go gadget search results
$('#search').focus(function() {
$('div.searchlist').show().bind('focusoutside clickoutside',function(e) {
	$(this).unbind('focusoutside clickoutside').fadeOut('medium');
	});
});
$("#close").click(function(){
	$('div.searchlist').hide();
});

//fix searchbox focus
$(document).on('click', function(e) {
	if (e.target !== $('#search')[0])
	$('#search').blur();
});

//preventdoubletapzoom
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

//invertigo
(function($) {
  $("#invert").click(function() {
    $("html").toggleClass("inverted");
  });
})(jQuery);
