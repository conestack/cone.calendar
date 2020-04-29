/* globals jQuery, bdajax */
(function($, bdajax) {

    $(document).ready(function() {
        bdajax.register(calendar.binder.bind(calendar), true);
    });

    var calendar = {
        elem: null,

        binder: function(context) {
            this.elem = $('#calendar', context);
            var target = this.elem.data('calendar_target');
            var options = this.elem.data('calendar_options');
            var sources = this.elem.data('calendar_sources');
            var event_sources = [];
            for (var i in sources) {
                var opts = sources[i];
                opts.target = target;
                event_sources.push(new calendar.EventSource(opts));
            }
            $.extend(options, {
                eventSources: event_sources,
                eventClick: calendar.event_clicked,
                dayClick: calendar.day_clicked,
                eventDrop: calendar.event_drop,
                eventResize: calendar.event_resize
            });
            this.elem.fullCalendar(options);
        },

        EventSource: function(opts) {
            $.extend(this, opts);
            this.events = function(start, end, timezone, callback) {
                bdajax.request({
                    url: opts.target + '/' + opts.events,
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

        event_clicked: function(cal_evt, js_evt, view) {
            console.log(cal_evt);
            console.log(js_evt);
            console.log(view);
        },

        day_clicked: function(date, js_evt, view) {
            console.log(date);
            console.log(js_evt);
            console.log(view);
        },

        event_drop: function(cal_evt, delta, revert_func) {
            console.log(cal_evt);
            console.log(delta);
        },

        event_resize: function(cal_evt, delta, revert_func) {
            console.log(cal_evt);
            console.log(delta);
        }
    };

})(jQuery, bdajax);
