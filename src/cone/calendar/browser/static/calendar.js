/* globals jQuery, bdajax */
(function($, bdajax) {

    $(document).ready(function() {
        bdajax.register(calendar.binder.bind(calendar), true);
    });

    var calendar = {
        elem: null,
        target: null,
        actions: null,

        binder: function(context) {
            var elem = $('#calendar', context);
            if (!elem.length) {
                return;
            }
            this.elem = elem;
            this.target = elem.data('calendar_target');
            this.actions = elem.data('calendar_actions');
            var sources = elem.data('calendar_sources');
            var event_sources = [];
            for (var i in sources) {
                event_sources.push(new calendar.EventSource(sources[i]));
            }
            var options = elem.data('calendar_options');
            $.extend(options, {
                eventSources: event_sources,
                eventClick: calendar.event_clicked,
                dayClick: calendar.day_clicked,
                eventDrop: calendar.event_drop,
                eventResize: calendar.event_resize
            });
            elem.fullCalendar(options);
        },

        EventSource: function(opts) {
            $.extend(this, opts);
            this.events = function(start, end, timezone, callback) {
                bdajax.request({
                    url: calendar.target + '/' + opts.events,
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
            var target = action.target;
            if (action.action) {
                bdajax.action({
                    name: action.action.name,
                    selector: action.action.selector,
                    mode: action.action.mode,
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

        handle_actions: function(actions, target, params, x, y) {
            if (!actions) {
                return;
            }
            // get a deepcopy of given actions
            actions = JSON.parse(JSON.stringify(actions));
            // adopt action data
            for (var i in actions) {
                var action = actions[i];
                // set default target if no target defined on action
                if (!action.target) {
                    action.target = target;
                }
                // parse target if defined as string
                if (!action.target.url) {
                    action.target = bdajax.parsetarget(action.target);
                }
                // extend query params by additional params
                $.extend(action.target.params, params);
            }
            // only one action defined, gets executed direclty
            if (actions.length == 1) {
                var action = actions[0];
                this.handle_action(action);
                return;
            }
            // more than one action found, display context menu
            this.create_context_menu(actions, x, y);
        },

        event_clicked: function(cal_evt, js_evt, view) {
            var params = {
                view: view.name
            };
            calendar.handle_actions(
                cal_evt.actions,
                cal_evt.target,
                params,
                js_evt.pageX,
                js_evt.pageY
            );
        },

        day_clicked: function(date, js_evt, view) {
            var params = {
                data: date.unix(),
                view: view.name
            };
            calendar.handle_actions(
                calendar.actions,
                calendar.target,
                params,
                js_evt.pageX,
                js_evt.pageY
            );
        },

        event_drop: function(cal_evt, delta, revert_func) {
            console.log(cal_evt.target);
            console.log(cal_evt.id);
            console.log(delta.asSeconds());
        },

        event_resize: function(cal_evt, delta, revert_func) {
            console.log(cal_evt.target);
            console.log(cal_evt.id);
            console.log(delta.asSeconds());
        }
    };

})(jQuery, bdajax);
