function commaFormat(x, precision) {
	x = parseFloat(x).toFixed(precision);
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function percentFormat(x, precision) {
	x = (x * 100).toFixed(precision);
	return x.toString() + "%";
}

(function($) {
    $.fn.floatVal = function(){
		return parseFloat(this.val()) || 0;
    };
})(jQuery);

(function($) {
    $.fn.floatAttr = function(attribute){
		return parseFloat(this.attr(attribute)) || 0;
    };
})(jQuery);