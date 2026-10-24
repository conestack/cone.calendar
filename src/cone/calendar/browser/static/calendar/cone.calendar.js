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
        events(info, successCallback, failureCallback) {
            const calendar = this._calendar;
            const url = `${calendar.target}/${this._events_view}`;
            const params = {
                start: Math.floor(info.start.getTime() / 1000),
                end: Math.floor(info.end.getTime() / 1000),
                timezone: info.timeZone || 'local',
            };
            calendar.json_request(
                url,
                params,
                (events) => {
                    successCallback(events);
                },
                (error) => {
                    console.error('Error fetching events:', error);
                    failureCallback(error);
                },
            );
        }
    }
    class Calendar {
        static initialize(context) {
            const elem = $('#calendar', context);
            if (!elem.length) {
                return;
            }
            new Calendar(elem);
        }
        constructor(elem) {
            this.elem = elem;
            this.target = elem.data('calendar_target');
            this.actions = elem.data('calendar_actions');
            const sources = elem.data('calendar_sources'),
                event_sources = [];
            for (const i in sources) {
                event_sources.push(new EventSource(this, sources[i]));
            }
            const options = elem.data('calendar_options');
            $.extend(options, {
                locales: fullcalendar.localesAll,
                eventSources: event_sources,
                eventClick: this.event_clicked.bind(this),
                dateClick: this.date_clicked.bind(this),
                eventDrop: this.event_drop.bind(this),
                eventResize: this.event_resize.bind(this),
                moreLinkDidMount(arg) {
                    arg.el.addEventListener('click', () => {
                        setTimeout(() => {
                            const popover = $('.fc-popover');
                            if (popover) {
                                const w = elem.outerWidth(),
                                    pw = popover.outerWidth(),
                                    pl = parseInt(popover.css('left'), 10);
                                if (pl + pw > w) {
                                    popover.css('transform', 'translateX(-100%)');
                                }
                            }
                        }, 0);
                    });
                },
                eventDidMount(info) {
                    info.el.title = info.event.title;
                    info.el._fc_event = info.event;
                    if (info.event.extendedProps.target) {
                        info.el.classList.add('fc-event-clickable');
                    }
                },
                timeZone: 'UTC',
                plugins: [
                    fullcalendar.bootstrap5Plugin,
                    fullcalendar.dayGridPlugin,
                    fullcalendar.timeGridPlugin,
                    fullcalendar.listPlugin,
                    fullcalendar.interactionPlugin,
                ],
                themeSystem: 'bootstrap5',
                height: 'auto',
            });
            this.on_outside_click = this.on_outside_click.bind(this);
            const calendar = new fullcalendar.Calendar(this.elem.get(0), options);
            this.calendar = calendar;
            this.refetch_events = this.refetch_events.bind(this);
            this.elem.on('reload', this.refetch_events);
            calendar.render();
            this.on_resize = this.on_resize.bind(this);
            $(window).on('resize', this.on_resize);
            cone.global_events.on('on_sidebar_left_resize', this.on_resize);
            cone.global_events.on('on_sidebar_right_resize', this.on_resize);
            this.on_resize();
            this.elem.data('cone.calendar', this);
            window.ts.ajax.attach(this, elem);
        }
        refetch_events() {
            this.calendar.refetchEvents();
        }
        on_resize(evt) {
            const width = $(window).width();
            if (width <= 700 && (this._window_width > 700 || !evt)) {
                this.calendar.setOption('height', 'auto');
            } else if (width > 700 && (this._window_width <= 700 || !evt)) {
                this.calendar.setOption('height', undefined);
            }
            this.calendar.updateSize();
            if (this.elem.outerWidth() <= 700) {
                this.calendar.setOption('dayMaxEventRows', 0);
            } else {
                this.calendar.setOption('dayMaxEventRows', 3);
            }
            this._window_width = width;
        }
        json_request(url, params, callback, errback) {
            bdajax.request({
                url: url,
                type: 'json',
                params: params,
                success: (data) => {
                    if (data.error) {
                        if (errback) {
                            errback();
                        }
                        bdajax.error(data.message);
                    } else {
                        callback(data.data);
                    }
                },
                error: () => {
                    if (errback) {
                        errback();
                    }
                    bdajax.error('Failed to request JSON data');
                },
            });
        }
        on_outside_click(event) {
            const path = event.composedPath();
            const inside_event = path.some((el) => el.classList?.contains('fc-event'));
            if (!path.includes(this.menu[0]) && !inside_event) {
                this.close_context_menu();
            }
        }
        close_on_outside_click() {
            this._outside_click_timer = setTimeout(() => {
                document.addEventListener('click', this.on_outside_click);
            });
        }
        close_context_menu() {
            if (!this.wrapper) {
                return;
            }
            clearTimeout(this._outside_click_timer);
            document.removeEventListener('click', this.on_outside_click);
            this.wrapper.remove();
        }
        create_context_menu(actions, x, y) {
            const body = $('body', document);
            this.close_context_menu();
            const wrapper = $('<div />')
                .attr('class', 'calendar-contextmenu-wrapper')
                .css('height', `${body.height()}px`);
            this.wrapper = wrapper;
            body.append(wrapper);
            wrapper.on('click contextmenu', (e) => {
                e.preventDefault();
                if (e.target === wrapper[0]) {
                    this.close_context_menu();
                }
            });
            const menu = $('<ul>')
                .addClass(
                    'calendar-contextmenu dropdown-menu list-group ' +
                        'list-group-flush p-0 rounded shadow',
                )
                .css({
                    position: 'absolute',
                    left: '-9999px',
                    top: '-9999px',
                    visibility: 'hidden',
                    display: 'block',
                });
            body.append(menu);
            for (const i in actions) {
                this.add_menu_item(wrapper, menu, actions[i]);
            }
            const menu_width = menu.outerWidth();
            const viewport_width = $(window).width();
            let final_left;
            if (x + menu_width > viewport_width) {
                final_left = x - menu_width;
                if (final_left < 0) {
                    final_left = 0;
                }
            } else {
                final_left = x;
            }
            menu.css({
                left: `${final_left}px`,
                top: `${y}px`,
                visibility: 'visible',
            });
            this.menu = menu;
            wrapper.append(menu);
            this.close_on_outside_click();
        }
        add_menu_item(_wrapper, menu, action) {
            const menu_item = $('<li>').addClass('list-group-item list-group-item-action');
            if (action.icon) {
                $('<i>').addClass(action.icon).addClass('me-2').appendTo(menu_item);
            }
            $('<span>').text(action.title).appendTo(menu_item);
            menu.append(menu_item);
            menu_item.on(
                'click',
                function (e) {
                    e.stopPropagation();
                    this.close_context_menu();
                    this.handle_action(action);
                }.bind(this),
            );
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
                bdajax.dialog(
                    {
                        message: action.confirm,
                    },
                    function (_options) {
                        this.perform_action(action);
                    }.bind(this),
                );
            } else {
                this.perform_action(action);
            }
        }
        perform_action(action) {
            const target = action.target;
            if (action.action) {
                bdajax.action({
                    name: action.action.name,
                    selector: action.action.selector,
                    mode: action.action.mode,
                    url: target.url,
                    params: target.params,
                });
            }
            if (action.event) {
                const event = action.event;
                bdajax.trigger(event.name, event.selector, target);
            }
            if (action.overlay) {
                const overlay = action.overlay;
                bdajax.overlay({
                    action: overlay.action,
                    target: target,
                    selector: overlay.selector,
                    content_selector: overlay.content_selector,
                    css: overlay.css,
                    title: overlay.title,
                });
            }
        }
        handle_actions(actions, target, params, x, y) {
            if (!actions?.length) {
                return;
            }
            actions = JSON.parse(JSON.stringify(actions));
            for (const i in actions) {
                const action = actions[i];
                action.target = this.prepare_target(action.target || target, params);
            }
            if (actions.length === 1) {
                const action = actions[0];
                this.handle_action(action);
                return;
            }
            this.create_context_menu(actions, x, y);
        }
        event_clicked(info) {
            const e = info.jsEvent;
            const popover_close = document.querySelector('.fc-popover-close');
            if (popover_close) {
                popover_close.click();
            }
            const params = {
                view: info.view.name,
            };
            this.handle_actions(
                info.event.extendedProps.actions,
                info.event.extendedProps.target,
                params,
                e.pageX,
                e.pageY,
            );
        }
        date_clicked(info) {
            const e = info.jsEvent;
            const date = info.date;
            const timestamp = Math.floor(date.getTime() / 1000);
            const params = {
                date: timestamp,
                all_day: date.allDay,
                view: info.view.type,
            };
            this.handle_actions(this.actions, this.target, params, e.pageX, e.pageY);
        }
        update_event(cal_evt, delta, revert_func, view, callback) {
            const target = this.prepare_target(cal_evt.extendedProps.target, {
                id: cal_evt.id,
                start: Math.floor(cal_evt.start.getTime() / 1000),
                end: Math.floor(cal_evt.end.getTime() / 1000),
                delta: Math.round((delta.days * 86400000 + delta.milliseconds) / 1000),
            });
            const url = `${target.url}/${view}`;
            this.json_request(url, target.params, callback, revert_func);
        }
        event_drop(info) {
            const view = 'calendar_event_drop';
            const cb = (data) => {
                console.log(data);
            };
            this.update_event(info.event, info.delta, info.revert, view, cb);
        }
        event_resize(info) {
            const view = 'calendar_event_resize';
            const cb = (data) => {
                console.log(data);
            };
            this.update_event(info.event, info.endDelta, info.revert, view, cb);
        }
        destroy() {
            this.elem.off('reload', this.refetch_events);
            this.calendar.destroy();
            this.calendar = null;
            this.close_context_menu();
            $(window).off('resize', this.on_resize);
            cone.global_events.off('on_sidebar_left_resize', this.on_resize);
            cone.global_events.off('on_sidebar_right_resize', this.on_resize);
            this.elem.data('cone.calendar', null);
        }
    }

    $(() => {
        bdajax.register(Calendar.initialize, true);
    });

    exports.Calendar = Calendar;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({}, jQuery);
