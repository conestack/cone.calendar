/*globals jQuery, bdajax*/
(function($, bdajax) {

    $(document).ready(function() {
        $.extend(bdajax.binders, {
            calendar_binder: calendar.binder
        });
        calendar.binder();
    });

    var calendar = {

        option_mapping: {
            calendar_header: 'header',
            calendar_footer: 'footer',
            calendar_first_day: 'firstDay'
        },

        binder: function(context) {
            var elem = $('#calendar', context);
            var options = {};
            var server_options = elem.data('calendar_options');
            var name, value;
            for (name in server_options) {
                value = server_options[name];
                if (typeof(value) !== 'undefined') {
                    options[this.option_mapping[name]] = value;
                }
            }
            elem.fullCalendar(options);
        }

    };

})(jQuery, bdajax);
