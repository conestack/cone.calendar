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

        create_context_menu: function(actions, x, y) {
            var body = $('body', document);
            var wrapper = $('<div />')
                .attr('class', 'calendar-contextmenu-wrapper')
                .css('height', body.height() + 'px');
            body.append(wrapper);
            wrapper.on('click contextmenu', function(e) {
                e.preventDefault();
                wrapper.remove();
            });
            var menu = $('<ul />')
                .attr('class', 'calendar-contextmenu dropdown-menu')
                .css('left', x + 'px')
                .css('top', y + 'px')
                .css('display', 'block');
            wrapper.append(menu);
            for (var i in actions) {
                this.add_menu_item(wrapper, menu, actions[i]);
            }
        },

        add_menu_item: function(wrapper, menu, action) {
            var menu_item = $('<li><span />' + action.title + '</li>');
            if (action.icon) {
                $('span', menu_item).attr('class', action.icon);
            }
            menu.append(menu_item);
            menu_item.on('click', function(e) {
                e.stopPropagation();
                wrapper.remove();
                this.handle_action(action);
            }.bind(this));
        },

        handle_action: function(action) {
            if (!action.target) {
                return;
            }
            if (action.confirm) {
                bdajax.dialog({
                    message: action.confirm
                }, function(options) {
                    this.perform_action(action);
                }.bind(this));
            } else {
                this.perform_action(action);
            }
        },

        perform_action: function(action) {
            var target = bdajax.parsetarget(action.target);
            if (action.action) {
                var action = action.action;
                bdajax.action({
                    name: action.name,
                    selector: action.selector,
                    mode: action.mode,
                    url: target.url,
                    params: target.params
                });
            }
            if (action.event) {
                var event = action.event;
                bdajax.trigger(
                    event.name,
                    event.selector,
                    target
                );
            }
            if (action.overlay) {
                var overlay = action.overlay;
                bdajax.overlay({
                    action: overlay.action,
                    target: target,
                    css: overlay.css
                });
            }
        },

        event_clicked: function(cal_evt, js_evt, view) {
            if (!cal_evt.actions) {
                return;
            }
            if (cal_evt.actions.length == 1) {
                var action = cal_evt.actions[0];
                calendar.handle_action(action);
                return;
            }
            calendar.create_context_menu(
                cal_evt.actions,
                js_evt.pageX,
                js_evt.pageY
            );
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
