import $ from 'jquery';

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

        // XXX: Have a feeling this can be better, included functionality
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

export class Calendar {
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
                // move popover to left if space not sufficient
                arg.el.addEventListener('click', () => {
                    // wait a tick for the popover to render
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
                // supply event title for tooltip
                info.el.title = info.event.title;
                // expose fc event object for capture-phase click handlers
                info.el._fc_event = info.event;
                // mark events that carry an info overlay target
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
        // delay adding listener to avoid immediately catching the open click.
        // A right click outside closes the menu as well - one on another date
        // opens the menu of that date instead.
        this._outside_click_timer = setTimeout(() => {
            document.addEventListener('click', this.on_outside_click);
            document.addEventListener('contextmenu', this.on_outside_click);
        });
    }

    close_context_menu() {
        if (!this.menu) {
            return;
        }
        clearTimeout(this._outside_click_timer);
        document.removeEventListener('click', this.on_outside_click);
        document.removeEventListener('contextmenu', this.on_outside_click);
        this.menu.remove();
        this.menu = null;
    }

    // Part of the viewport in which the menu is visible, in viewport
    // coordinates. The menu sits beside the calendar, so every ancestor
    // clipping its overflow - the scrolling content area of the page for one -
    // clips the menu too.
    visible_area() {
        const win = $(window);
        const area = { left: 0, top: 0, right: win.width(), bottom: win.height() };
        let el = this.elem[0].parentElement;
        // body and html clip at the viewport, which is the initial area
        for (; el && el !== document.body; el = el.parentElement) {
            const style = getComputedStyle(el);
            if (style.overflowX === 'visible' && style.overflowY === 'visible') {
                continue;
            }
            const rect = el.getBoundingClientRect();
            const left = rect.left + el.clientLeft;
            const top = rect.top + el.clientTop;
            area.left = Math.max(area.left, left);
            area.top = Math.max(area.top, top);
            area.right = Math.min(area.right, left + el.clientWidth);
            area.bottom = Math.min(area.bottom, top + el.clientHeight);
        }
        return area;
    }

    // Start of the menu on one axis: after ``pos`` if it fits into the area
    // between ``start`` and ``end``, else before ``pos`` if it fits there, else
    // as far inside the area as its size allows.
    fit_into_area(pos, size, start, end) {
        if (pos + size <= end) {
            return pos;
        }
        if (pos - size >= start) {
            return pos - size;
        }
        return Math.max(start, end - size);
    }

    // ``x`` and ``y`` are document coordinates.
    create_context_menu(actions, x, y) {
        this.close_context_menu();
        const menu = $('<ul>')
            .addClass(
                'calendar-contextmenu dropdown-menu list-group ' +
                    'list-group-flush p-0 rounded shadow',
            )
            .css({
                // measure menu dimensions off viewport
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                visibility: 'hidden',
                display: 'block',
            });
        // Beside the calendar instead of in ``body``: the menu scrolls along
        // with the calendar and stays at the date it was opened for. A menu in
        // ``body`` stayed in place while the content area scrolled beneath it.
        this.elem.after(menu);
        menu.on('contextmenu', (e) => {
            e.preventDefault();
        });

        for (const action of actions) {
            this.add_menu_item(menu, action);
        }

        const win = $(window);
        const scroll_left = win.scrollLeft();
        const scroll_top = win.scrollTop();
        const area = this.visible_area();
        const left = this.fit_into_area(x - scroll_left, menu.outerWidth(), area.left, area.right);
        const top = this.fit_into_area(y - scroll_top, menu.outerHeight(), area.top, area.bottom);
        // the containing block of the menu depends on the markup around the
        // calendar, ``offset`` translates document coordinates into it
        menu.offset({ left: left + scroll_left, top: top + scroll_top });
        menu.css('visibility', 'visible');

        this.menu = menu;
        this.close_on_outside_click();
    }

    add_menu_item(menu, action) {
        const menu_item = $('<li>').addClass('list-group-item');
        if (action.icon) {
            $('<i>').addClass(action.icon).addClass('me-2').appendTo(menu_item);
        }
        $('<span>').text(action.title).appendTo(menu_item);
        if (action.cssclass) {
            menu_item.addClass(action.cssclass);
        }
        if (action.tooltip) {
            menu_item.attr('title', action.tooltip);
        }
        menu.append(menu_item);
        if (action.disabled) {
            menu_item.addClass('disabled').attr('aria-disabled', 'true');
            return;
        }
        menu_item.addClass('list-group-item-action');
        menu_item.on('click', (e) => {
            e.stopPropagation();
            this.close_context_menu();
            this.handle_action(action);
        });
    }

    prepare_target(target, params) {
        // parse target if defined as string
        if (!target.url) {
            target = bdajax.parsetarget(target);
        }
        // extend query params by additional params
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

    // Deep copy of ``actions``, each with its target prepared for ``params``.
    prepare_actions(actions, target, params) {
        actions = JSON.parse(JSON.stringify(actions));
        for (const action of actions) {
            action.target = this.prepare_target(action.target || target, params);
        }
        return actions;
    }

    handle_actions(actions, target, params, x, y) {
        if (!actions?.length) {
            return;
        }
        actions = this.prepare_actions(actions, target, params);
        // only one action defined, gets executed direclty
        if (actions.length === 1) {
            const action = actions[0];
            this.handle_action(action);
            return;
        }
        // more than one action found, display context menu
        this.create_context_menu(actions, x, y);
    }

    event_clicked(info) {
        const e = info.jsEvent;
        // Close fc-popover if event was clicked inside it so it doesn't
        // obscure a treibstoff overlay (modal) opened by the action.
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
            start: Math.floor(cal_evt.start.getTime() / 1000), // cal_evt.start.unix(),
            end: Math.floor(cal_evt.end.getTime() / 1000), // cal_evt.end.unix(),
            delta: Math.round((delta.days * 86400000 + delta.milliseconds) / 1000), // moment.js dropped in v5
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
