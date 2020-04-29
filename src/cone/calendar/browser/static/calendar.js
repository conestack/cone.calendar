/*globals jQuery, bdajax*/
(function($, bdajax) {

    $(document).ready(function() {
        bdajax.register(calendar.binder.bind(calendar), true);
    });

    var calendar = {

        elem: undefined,

        binder: function(context) {
            this.elem = $('#calendar', context);
            var options = this.elem.data('calendar_options');
            options = $.extend({}, options || {}, {
                events: this.events
            });

            this.elem.fullCalendar(options);
        },

        events: function(start, end, timezone, callback) {
            // ``this`` is bound to the FC object.
            var config = calendar.elem.data('calendar_config');
            if (!config || !config.get_url) {
                return;
            }

            bdajax.request({
                url: config.get_url,
                type: config.get_datatype || 'json',
                params: {
                    start: start.unix(),
                    end: end.unix(),
                    timezone: timezone
                },
                success: function(data) {
                    var events = [];

                    for (var idx in data.events) {
                        var event = data.events[idx];
                        events.push({
                            title: event.title,
                            start: event.start,
                            end: event.end
                        });
                    }

                    callback(events);
                },
                error: function() {
                    bdajax.error('Request failed');
                }
            });

        },

    };

})(jQuery, bdajax);
