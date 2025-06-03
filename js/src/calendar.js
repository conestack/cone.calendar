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
        let calendar = this._calendar;
        let url = calendar.target + '/' + this._events_view;

        // XXX: Have a feeling this can be better, included functionality
        let params = {
            start: Math.floor(info.start.getTime() / 1000),
            end: Math.floor(info.end.getTime() / 1000),
            timezone: info.timeZone || 'local'
        };

        calendar.json_request(url, params, (events) => {
            successCallback(events);
        }, (error) => {
            console.error('Error fetching events:', error);
            failureCallback(error);
        });
    }
}

export class Calendar {

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
            dateClick: this.date_clicked.bind(this),
            eventDrop: this.event_drop.bind(this),
            eventResize: this.event_resize.bind(this),
            plugins: [
                fullcalendar.bootstrap5Plugin,
                fullcalendar.dayGridPlugin,
                fullcalendar.timeGridPlugin,
                fullcalendar.listPlugin,
                fullcalendar.interactionPlugin
            ],
            themeSystem: 'bootstrap5',
            height: 'auto'
        });
        const calendar = this.calendar = new fullcalendar.Calendar(
            this.elem.get(0),
            options
        );

        this.refetch_events = this.refetch_events.bind(this);
        this.elem.on('reload', this.refetch_events);
        calendar.render();
        this.on_resize = this.on_resize.bind(this);
        $(window).on('resize', this.on_resize);
        this.on_resize();

        window.ts.ajax.attach(this, elem);
    }

    refetch_events() {
        calendar.refetchEvents();
    }

    on_resize(evt) {
        // XXX: on_sidebar_resize within cone.app
        const width = $(window).width();
        if (width <= 700 && (this._window_width > 700 || !evt)) {
            this.calendar.setOption('height', 'auto');
        } else if (width > 700 && (this._window_width <= 700 || !evt)) {
            this.calendar.setOption('height', undefined);
        }
        this._window_width = width;
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
        if (this.menu) {
            this.menu.remove();
        }
        let body = $('body', document);
        let wrapper = $('<div />')
            .attr('class', 'calendar-contextmenu-wrapper')
            .css('height', body.height() + 'px');
        body.append(wrapper);
        wrapper.on('click contextmenu', function(e) {
            e.preventDefault();
            wrapper.remove();
        });
        let menu = $('<ul>')
            .addClass(
                'calendar-contextmenu dropdown-menu list-group ' +
                'list-group-flush p-0 rounded shadow'
            )
            .css('position', 'absolute')
            .css('left', x + 'px')
            .css('top', y + 'px')
            .css('display', 'block');
        this.menu = menu;
        wrapper.append(menu);
        for (let i in actions) {
            this.add_menu_item(wrapper, menu, actions[i]);
        }
    }

    add_menu_item(wrapper, menu, action) {
        const menu_item = $('<li>').addClass('list-group-item list-group-item-action');
        if (action.icon) {
            $(`<i class="${action.icon} me-2"></i>`).appendTo(menu_item);
        }
        $(`<span>${action.title}</span>`).appendTo(menu_item);
        menu.append(menu_item);
        menu_item.on('click', function(e) {
            e.stopPropagation();
            wrapper.remove();
            this.handle_action(action);
        }.bind(this));
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
        // get a deepcopy of given actions
        actions = JSON.parse(JSON.stringify(actions));
        // prepare action target
        for (let i in actions) {
            let action = actions[i];
            action.target = this.prepare_target(
                action.target || target,
                params
            );
        }
        // only one action defined, gets executed direclty
        if (actions.length == 1) {
            let action = actions[0];
            this.handle_action(action);
            return;
        }
        // more than one action found, display context menu
        this.create_context_menu(actions, x, y);
    }

    event_clicked(info) {
        const e = info.jsEvent;
        let params = {
            view: info.view.name
        };
        this.handle_actions(
            info.event.actions,
            info.event.target,
            params,
            e.pageX,
            e.pageY
        );
    }

    date_clicked(info) {
        const e = info.jsEvent;
        const date = info.date;
        // XXX: docs say date is JS DateTime, but it's not?
        let params = {
            date: Math.floor(date.getTime() / 1000),
            all_day: date.allDay,
            view: info.view.name
        };
        this.handle_actions(
            this.actions,
            this.target,
            params,
            e.pageX,
            e.pageY
        );
    }

    update_event(cal_evt, delta, revert_func, view, callback) {
        let target = this.prepare_target(cal_evt.target, {
            id: cal_evt.id,
            start: Math.floor(cal_evt.start.getTime() / 1000), // cal_evt.start.unix(),
            end: Math.floor(cal_evt.end.getTime() / 1000), // cal_evt.end.unix(),
            delta: delta.asSeconds()
        })
        let url = target.url + '/' + view;
        this.json_request(url, target.params, callback, revert_func);
    }

    event_drop(cal_evt, delta, revert_func) {
        if (!cal_evt.editable && !cal_evt.startEditable) {
            return;
        }
        let view = 'calendar_event_drop'
        let cb = function(data) {
            console.log(data);
        }
        this.update_event(cal_evt, delta, revert_func, view, cb);
    }

    event_resize(cal_evt, delta, revert_func) {
        if (!cal_evt.editable && !cal_evt.durationEditable) {
            return;
        }
        let view = 'calendar_event_resize'
        let cb = function(data) {
            console.log(data);
        }
        this.update_event(cal_evt, delta, revert_func, view, cb);
    }

    destroy() {
        this.elem.off('reload', this.refetch_events);
        this.calendar.destroy();
        this.calendar = null;
        $(window).off('resize', this.on_resize);
    }
}
