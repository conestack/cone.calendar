/*globals jQuery, bdajax*/
(function($, bdajax) {

    $(document).ready(function() {
        $.extend(bdajax.binders, {
            calendar_binder: calendar.binder
        });
        calendar.binder();
    });

    var calendar = {

        binder: function(context) {
            var elem = $('#calendar', context);
            var options = elem.data('calendar_options');
            elem.fullCalendar(options);
        }

    };

})(jQuery, bdajax);
