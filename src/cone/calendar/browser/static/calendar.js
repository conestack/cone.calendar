/* globals jQuery, bdajax */
(function($, bdajax) {

    $(document).ready(function() {
        bdajax.register(calendar.binder.bind(calendar), true);
    });

    var calendar = {
        elem: null,

        binder: function(context) {
            this.elem = $('#calendar', context);
            var options = this.elem.data('calendar_options');
            var sources = this.elem.data('calendar_sources');
            var event_sources = [];
            for (var i in sources) {
                event_sources.push(new calendar.EventSource(sources[i]));
            }
            $.extend(options, {
                eventSources: event_sources
            });
            this.elem.fullCalendar(options);
        },

        EventSource: function(options) {
            $.extend(this, options);
            this.events = function(start, end, timezone, callback) {
                bdajax.request({
                    url: options.events,
                    type: 'json',
                    params: {
                        start: start.unix(),
                        end: end.unix(),
                        timezone: timezone
                    },
                    success: function(data) {
                        callback(data);
                    },
                    error: function() {
                        bdajax.error('Failed to request events');
                    }
                });
            };
        },
    };

})(jQuery, bdajax);
