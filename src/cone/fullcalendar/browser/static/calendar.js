(function($) {

    $(document).ready(function() {
        $.extend(bdajax.binders, {
            calendar_binder: calendar.binder
        });
        calendar.binder();
    });

    calendar = {

        binder: function(context) {
            var calendar_elem = $('#calendar', context);
            var options = {};
            var header = calendar_elem.data('calendar_header');
            if (header) {
                options.header = header;
            }
            calendar_elem.fullCalendar(options);
        
        }
    };

})(jQuery);
