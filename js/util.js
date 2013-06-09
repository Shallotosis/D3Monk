function commaFormat(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
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