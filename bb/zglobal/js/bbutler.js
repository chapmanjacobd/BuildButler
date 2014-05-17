// bbutler.js
// Copyright Jacob Chapman 2013-2014
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation version 3 of the License.
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

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
var invertze = document.getElementById('invert');
invertze.onclick = function() {
var css = 'html {-webkit-filter: invert(100%);' +
    '-moz-filter: invert(100%);' + 
    '-o-filter: invert(100%);' + 
    '-ms-filter: invert(100%); }',

head = document.getElementsByTagName('head')[0],
style = document.createElement('style');

if (!window.counter) { window.counter = 1;} else  { window.counter ++;
if (window.counter % 2 == 0) { var css ='html {-webkit-filter: invert(0%); -moz-filter:    invert(0%); -o-filter: invert(0%); -ms-filter: invert(0%); }'}
};

style.type = 'text/css';
if (style.styleSheet){
style.styleSheet.cssText = css;
} else {
style.appendChild(document.createTextNode(css));
}

head.appendChild(style);
};