var cone_calendar = (function (exports, $) {
    'use strict';

    class EventSource {
        constructor(calendar, opts) {
            this._calendar = calendar;
            this._events_view = opts.events;
            delete opts.events;
            Object.assign(this, opts);
            this.events = this.events.bind(this);
        }
        events(start, end, timezone, callback) {
            let calendar = this._calendar,
                url = calendar.target + '/' + this._events_view;
            let params = {
                start: start.unix(),
                end: end.unix()
            };
            calendar.json_request(url, params, callback, null);
        }
    }
    class Calendar {
        static initialize(context) {
            let elem = $('#calendar', context);
            if (!elem.length) {
                return;
            }
            new Calendar(elem);
        }
        constructor(elem) {
            this.elem = elem;
            this.target = elem.data('calendar_target');
            this.actions = elem.data('calendar_actions');
            let sources = elem.data('calendar_sources'),
                event_sources = [];
            for (let i in sources) {
                event_sources.push(new EventSource(this, sources[i]));
            }
            let options = elem.data('calendar_options');
            $.extend(options, {
                eventSources: event_sources,
                eventClick: this.event_clicked.bind(this),
                dayClick: this.day_clicked.bind(this),
                eventDrop: this.event_drop.bind(this),
                eventResize: this.event_resize.bind(this)
            });
            elem.bind('reload', function() {
                elem.fullCalendar('refetchEvents');
            });
            elem.fullCalendar(options);
        }
        json_request(url, params, callback, errback) {
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
        }
        create_context_menu(actions, x, y) {
            let body = $('body', document);
            let wrapper = $('<div />')
                .attr('class', 'calendar-contextmenu-wrapper')
                .css('height', body.height() + 'px');
            body.append(wrapper);
            wrapper.on('click contextmenu', function(e) {
                e.preventDefault();
                wrapper.remove();
            });
            let menu = $('<ul />')
                .attr('class', 'calendar-contextmenu dropdown-menu')
                .css('left', x + 'px')
                .css('top', y + 'px')
                .css('display', 'block');
            wrapper.append(menu);
            for (let i in actions) {
                this.add_menu_item(wrapper, menu, actions[i]);
            }
        }
        add_menu_item(wrapper, menu, action) {
            let menu_item = $('<li><span />' + action.title + '</li>');
            if (action.icon) {
                $('span', menu_item).attr('class', action.icon);
            }
            menu.append(menu_item);
            menu_item.on('click', function(e) {
                e.stopPropagation();
                wrapper.remove();
                this.handle_action(action);
            }.bind(this));
        }
        prepare_target(target, params) {
            if (!target.url) {
                target = bdajax.parsetarget(target);
            }
            $.extend(target.params, params);
            return target;
        }
        handle_action(action) {
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
        }
        perform_action(action) {
            let target = action.target;
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
                let event = action.event;
                bdajax.trigger(
                    event.name,
                    event.selector,
                    target
                );
            }
            if (action.overlay) {
                let overlay = action.overlay;
                bdajax.overlay({
                    action: overlay.action,
                    target: target,
                    selector: overlay.selector,
                    content_selector: overlay.content_selector,
                    css: overlay.css
                });
            }
        }
        handle_actions(actions, target, params, x, y) {
            if (!actions || !actions.length) {
                return;
            }
            actions = JSON.parse(JSON.stringify(actions));
            for (let i in actions) {
                let action = actions[i];
                action.target = this.prepare_target(
                    action.target || target,
                    params
                );
            }
            if (actions.length == 1) {
                let action = actions[0];
                this.handle_action(action);
                return;
            }
            this.create_context_menu(actions, x, y);
        }
        event_clicked(cal_evt, js_evt, view) {
            let params = {
                view: view.name
            };
            this.handle_actions(
                cal_evt.actions,
                cal_evt.target,
                params,
                js_evt.pageX,
                js_evt.pageY
            );
        }
        day_clicked(date, js_evt, view) {
            let params = {
                date: date.unix(),
                all_day: !date.hasTime(),
                view: view.name
            };
            this.handle_actions(
                this.actions,
                this.target,
                params,
                js_evt.pageX,
                js_evt.pageY
            );
        }
        update_event(cal_evt, delta, revert_func, view, callback) {
            let target = this.prepare_target(cal_evt.target, {
                id: cal_evt.id,
                start: cal_evt.start.unix(),
                end: cal_evt.end.unix(),
                delta: delta.asSeconds()
            });
            let url = target.url + '/' + view;
            this.json_request(url, target.params, callback, revert_func);
        }
        event_drop(cal_evt, delta, revert_func) {
            if (!cal_evt.editable && !cal_evt.startEditable) {
                return;
            }
            let view = 'calendar_event_drop';
            let cb = function(data) {
                console.log(data);
            };
            this.update_event(cal_evt, delta, revert_func, view, cb);
        }
        event_resize(cal_evt, delta, revert_func) {
            if (!cal_evt.editable && !cal_evt.durationEditable) {
                return;
            }
            let view = 'calendar_event_resize';
            let cb = function(data) {
                console.log(data);
            };
            this.update_event(cal_evt, delta, revert_func, view, cb);
        }
    }

    $(function() {
        bdajax.register(Calendar.initialize, true);
    });

    exports.Calendar = Calendar;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({}, jQuery);
