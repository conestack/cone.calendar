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
            elem.bind('reload', function() {
                elem.fullCalendar('refetchEvents');
            });
            elem.fullCalendar(options);
        },

        json_request: function(url, params, callback, errback) {
            bdajax.request({
                url: url,
                type: 'json',
                params: params,
                success: function(data) {
                    if (data.error) {
                        errback && errback();
                        bdajax.error(data.message);
                    } else {
                        callback(data.data);
                    }
                },
                error: function() {
                    errback && errback();
                    bdajax.error('Failed to request JSON data');
                }
            });
        },

        EventSource: function(opts) {
            $.extend(this, opts);
            this.events = function(start, end, timezone, callback) {
                var url = calendar.target + '/' + opts.events;
                var params = {
                    start: start.unix(),
                    end: end.unix()
                };
                calendar.json_request(url, params, callback, null);
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

        prepare_target: function(target, params) {
            // parse target if defined as string
            if (!target.url) {
                target = bdajax.parsetarget(target);
            }
            // extend query params by additional params
            $.extend(target.params, params);
            return target;
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
                    selector: overlay.selector,
                    content_selector: overlay.content_selector,
                    css: overlay.css
                });
            }
        },

        handle_actions: function(actions, target, params, x, y) {
            if (!actions || !actions.length) {
                return;
            }
            // get a deepcopy of given actions
            actions = JSON.parse(JSON.stringify(actions));
            // prepare action target
            for (var i in actions) {
                var action = actions[i];
                action.target = this.prepare_target(
                    action.target || target,
                    params
                );
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
                date: date.unix(),
                all_day: !date.hasTime(),
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

        update_event: function(cal_evt, delta, revert_func, view, callback) {
            var target = this.prepare_target(cal_evt.target, {
                id: cal_evt.id,
                start: cal_evt.start.unix(),
                end: cal_evt.end.unix(),
                delta: delta.asSeconds()
            })
            var url = target.url + '/' + view;
            calendar.json_request(url, target.params, callback, revert_func);
        },

        event_drop: function(cal_evt, delta, revert_func) {
            if (!cal_evt.editable && !cal_evt.startEditable) {
                return;
            }
            var view = 'calendar_event_drop'
            var cb = function(data) {
                console.log(data);
            }
            calendar.update_event(cal_evt, delta, revert_func, view, cb);
        },

        event_resize: function(cal_evt, delta, revert_func) {
            if (!cal_evt.editable && !cal_evt.durationEditable) {
                return;
            }
            var view = 'calendar_event_resize'
            var cb = function(data) {
                console.log(data);
            }
            calendar.update_event(cal_evt, delta, revert_func, view, cb);
        }
    };

})(jQuery, bdajax);
