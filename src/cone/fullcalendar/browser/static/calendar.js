(function($) {

    $(document).ready(function() {
        $.extend(bdajax.binders, {
            calendar_binder: calendar.binder
        });
        calendar.binder();
    });

    calendar = {

        binder: function(context) {
        }
    };

})(jQuery);
