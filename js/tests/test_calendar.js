import $ from 'jquery';
import { Calendar } from '../src/calendar.js';

// Mock FullCalendar
class MockFullCalendar {
    constructor(elem, options) {
        this.elem = elem;
        this.options = options;
        this._rendered = false;
        this._destroyed = false;
        this._size_updated = false;
        this._events_refetched = false;
    }

    render() {
        this._rendered = true;
    }

    destroy() {
        this._destroyed = true;
    }

    updateSize() {
        this._size_updated = true;
    }

    refetchEvents() {
        this._events_refetched = true;
    }

    setOption(name, value) {
        this.options[name] = value;
    }
}

// Setup global mocks
function setup_global_mocks() {
    window.fullcalendar = {
        Calendar: MockFullCalendar,
        bootstrap5Plugin: {},
        dayGridPlugin: {},
        timeGridPlugin: {},
        listPlugin: {},
        interactionPlugin: {},
    };

    window.bdajax = {
        request: () => {},
        error: () => {},
        parsetarget: (target) => {
            if (typeof target === 'string') {
                const parts = target.split('?');
                return {
                    url: parts[0],
                    params: {},
                };
            }
            return target;
        },
        dialog: (opts, callback) => {
            callback(opts);
        },
        action: () => {},
        trigger: () => {},
        overlay: () => {},
    };

    window.cone = {
        global_events: {
            _handlers: {},
            on: function (event, handler) {
                this._handlers[event] = this._handlers[event] || [];
                this._handlers[event].push(handler);
            },
            off: function (event, handler) {
                if (this._handlers[event]) {
                    this._handlers[event] = this._handlers[event].filter((h) => h !== handler);
                }
            },
            trigger: function (event) {
                if (this._handlers[event]) {
                    this._handlers[event].forEach((h) => {
                        h();
                    });
                }
            },
        },
    };

    window.ts = {
        ajax: {
            attach: () => {},
        },
    };
}

function teardown_global_mocks() {
    delete window.fullcalendar;
    delete window.bdajax;
    delete window.cone;
    delete window.ts;
}

const orig_width = $.fn.width;

// Fake the viewport width, jQuery width of other elements stays untouched
function patch_window_width(width) {
    $.fn.width = function (...args) {
        if (this[0] === window) {
            return width;
        }
        return orig_width.apply(this, args);
    };
}

const orig_height = $.fn.height;

// Fake the viewport height, jQuery height of other elements stays untouched
function patch_window_height(height) {
    $.fn.height = function (...args) {
        if (this[0] === window) {
            return height;
        }
        return orig_height.apply(this, args);
    };
}

function next_tick() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

// Collect the click listeners registered on document from now on
async function track_document_click_listeners() {
    // let delayed listener registrations of previous tests pass
    await next_tick();
    const listeners = new Set();
    document.addEventListener = (type, listener, options) => {
        if (type === 'click') {
            listeners.add(listener);
        }
        EventTarget.prototype.addEventListener.call(document, type, listener, options);
    };
    document.removeEventListener = (type, listener, options) => {
        if (type === 'click') {
            listeners.delete(listener);
        }
        EventTarget.prototype.removeEventListener.call(document, type, listener, options);
    };
    return listeners;
}

function untrack_document_click_listeners() {
    delete document.addEventListener;
    delete document.removeEventListener;
}

QUnit.module('cone.calendar.Calendar.initialize', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('initialize does nothing without #calendar element', (assert) => {
        $('<div id="other" />').appendTo(container);

        Calendar.initialize(container);

        assert.strictEqual($('#calendar', container).length, 0, 'no calendar element exists');
    });

    QUnit.test('initialize creates Calendar instance when #calendar exists', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        Calendar.initialize(container);

        assert.ok(window.fullcalendar, 'fullcalendar mock exists');
        assert.ok(elem.data('cone.calendar') instanceof Calendar, 'Calendar instance created');
    });
});

QUnit.module('cone.calendar.Calendar.constructor', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('constructor initializes properties from data attributes', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[{"title": "Add Event"}]'
                 data-calendar_sources='[]'
                 data-calendar_options='{"initialView": "dayGridMonth"}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);

        assert.strictEqual(calendar.target, '/api/calendar', 'target stored');
        assert.deepEqual(calendar.actions, [{ title: 'Add Event' }], 'actions stored');
        assert.ok(calendar.calendar, 'fullcalendar instance created');
    });

    QUnit.test('constructor creates EventSource instances from sources', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[{"events": "events_view", "color": "blue"}]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);

        assert.ok(calendar.calendar.options.eventSources, 'event sources configured');
        assert.strictEqual(calendar.calendar.options.eventSources.length, 1, 'one event source');
    });

    QUnit.test('constructor binds resize handlers', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);

        assert.deepEqual(
            cone.global_events._handlers.on_sidebar_left_resize,
            [calendar.on_resize],
            'sidebar left resize handler bound',
        );
        assert.deepEqual(
            cone.global_events._handlers.on_sidebar_right_resize,
            [calendar.on_resize],
            'sidebar right resize handler bound',
        );
    });

    QUnit.test('constructor attaches to bdajax', (assert) => {
        let attach_args = null;
        window.ts.ajax.attach = (instance, elem) => {
            attach_args = { instance, elem };
        };

        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);

        assert.strictEqual(attach_args.instance, calendar, 'ts.ajax.attach called with instance');
        assert.strictEqual(attach_args.elem, elem, 'ts.ajax.attach called with elem');
    });
});

QUnit.module('cone.calendar.Calendar.moreLinkDidMount', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('more link click moves overflowing popover to the left', async (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        elem.css('width', '400px');
        const calendar = new Calendar(elem);
        const popover = $('<div class="fc-popover" />')
            .css({ position: 'absolute', left: '300px', width: '200px' })
            .appendTo(container);
        const link = document.createElement('a');

        calendar.calendar.options.moreLinkDidMount({ el: link });
        link.click();
        // popover position is checked in a timeout after the click
        await next_tick();

        assert.strictEqual(popover[0].style.transform, 'translateX(-100%)', 'popover moved');
    });

    QUnit.test('more link click keeps fitting popover in place', async (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        elem.css('width', '400px');
        const calendar = new Calendar(elem);
        const popover = $('<div class="fc-popover" />')
            .css({ position: 'absolute', left: '100px', width: '200px' })
            .appendTo(container);
        const link = document.createElement('a');

        calendar.calendar.options.moreLinkDidMount({ el: link });
        link.click();
        await next_tick();

        assert.strictEqual(popover[0].style.transform, '', 'popover not moved');
    });
});

QUnit.module('cone.calendar.Calendar.eventDidMount', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('eventDidMount sets title and marks events with target', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        const calendar = new Calendar(elem);
        const el = document.createElement('a');
        const event = { title: 'Meeting', extendedProps: { target: '/api/event/1' } };

        calendar.calendar.options.eventDidMount({ el, event });

        assert.strictEqual(el.title, 'Meeting', 'title set for tooltip');
        assert.strictEqual(el._fc_event, event, 'fc event exposed on element');
        assert.true(el.classList.contains('fc-event-clickable'), 'marked clickable');
    });

    QUnit.test('eventDidMount does not mark events without target', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        const calendar = new Calendar(elem);
        const el = document.createElement('a');
        const event = { title: 'Meeting', extendedProps: {} };

        calendar.calendar.options.eventDidMount({ el, event });

        assert.strictEqual(el.title, 'Meeting', 'title set for tooltip');
        assert.false(el.classList.contains('fc-event-clickable'), 'not marked clickable');
    });
});

QUnit.module('cone.calendar.Calendar.refetch_events', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('refetch_events calls calendar.refetchEvents', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.refetch_events();

        assert.true(calendar.calendar._events_refetched, 'refetchEvents called');
    });

    QUnit.test('reload event triggers refetch_events', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.calendar._events_refetched = false;

        elem.trigger('reload');

        assert.true(calendar.calendar._events_refetched, 'refetchEvents called on reload');
    });
});

QUnit.module('cone.calendar.Calendar.on_resize', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        $.fn.width = orig_width;
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('on_resize updates calendar size', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.calendar._size_updated = false;

        calendar.on_resize({});

        assert.true(calendar.calendar._size_updated, 'updateSize called');
    });

    QUnit.test('on_resize sets dayMaxEventRows based on element width', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        elem.css('width', '800px');
        const calendar = new Calendar(elem);

        calendar.on_resize({});

        assert.strictEqual(
            calendar.calendar.options.dayMaxEventRows,
            3,
            'dayMaxEventRows set to 3 for wide element',
        );
    });

    QUnit.test('on_resize sets dayMaxEventRows to 0 for narrow element', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        elem.css('width', '500px');
        const calendar = new Calendar(elem);

        calendar.on_resize({});

        assert.strictEqual(
            calendar.calendar.options.dayMaxEventRows,
            0,
            'dayMaxEventRows set to 0 for narrow element',
        );
    });

    QUnit.test('on_resize sets auto height when window gets narrow', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        patch_window_width(800);
        const calendar = new Calendar(elem);
        patch_window_width(600);

        calendar.on_resize({});

        assert.strictEqual(calendar.calendar.options.height, 'auto', 'height set to auto');
        assert.strictEqual(calendar._window_width, 600, 'window width remembered');
    });

    QUnit.test('on_resize sets auto height on narrow window without event', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        patch_window_width(600);
        const calendar = new Calendar(elem);
        calendar.calendar.options.height = 'unchanged';

        calendar.on_resize();

        assert.strictEqual(calendar.calendar.options.height, 'auto', 'height set to auto');
    });

    QUnit.test('on_resize keeps height while window stays narrow', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        patch_window_width(600);
        const calendar = new Calendar(elem);
        calendar.calendar.options.height = 'unchanged';

        calendar.on_resize({});

        assert.strictEqual(calendar.calendar.options.height, 'unchanged', 'height untouched');
    });

    QUnit.test('on_resize unsets height when window gets wide', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        patch_window_width(600);
        const calendar = new Calendar(elem);
        patch_window_width(800);

        calendar.on_resize({});

        assert.strictEqual(calendar.calendar.options.height, undefined, 'height unset');
    });

    QUnit.test('on_resize keeps height while window stays wide', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        patch_window_width(800);
        const calendar = new Calendar(elem);
        calendar.calendar.options.height = 'unchanged';

        calendar.on_resize({});

        assert.strictEqual(calendar.calendar.options.height, 'unchanged', 'height untouched');
    });
});

QUnit.module('cone.calendar.Calendar.json_request', (hooks) => {
    let container, bdajax_request_origin;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
        bdajax_request_origin = window.bdajax.request;
    });

    hooks.afterEach(() => {
        container.remove();
        window.bdajax.request = bdajax_request_origin;
        teardown_global_mocks();
    });

    QUnit.test('json_request calls bdajax.request with correct params', (assert) => {
        let request_opts = null;
        window.bdajax.request = (opts) => {
            request_opts = opts;
        };

        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.json_request(
            '/api/events',
            { start: 123 },
            () => {},
            () => {},
        );

        assert.strictEqual(request_opts.url, '/api/events', 'correct url');
        assert.strictEqual(request_opts.type, 'json', 'type is json');
        assert.deepEqual(request_opts.params, { start: 123 }, 'params passed');
    });

    QUnit.test('json_request calls callback on success', (assert) => {
        let callback_data = null;
        window.bdajax.request = (opts) => {
            opts.success({ data: { events: [] } });
        };

        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.json_request(
            '/api/events',
            {},
            (data) => {
                callback_data = data;
            },
            () => {},
        );

        assert.deepEqual(callback_data, { events: [] }, 'callback called with data.data');
    });

    QUnit.test('json_request calls errback on error response', (assert) => {
        let errback_called = false;
        let error_shown = null;
        window.bdajax.request = (opts) => {
            opts.success({ error: true, message: 'Server error' });
        };
        window.bdajax.error = (msg) => {
            error_shown = msg;
        };

        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.json_request(
            '/api/events',
            {},
            () => {},
            () => {
                errback_called = true;
            },
        );

        assert.true(errback_called, 'errback called');
        assert.strictEqual(error_shown, 'Server error', 'error message shown');
    });

    QUnit.test('json_request calls errback on request error', (assert) => {
        let errback_called = false;
        let error_shown = null;
        window.bdajax.request = (opts) => {
            opts.error();
        };
        window.bdajax.error = (msg) => {
            error_shown = msg;
        };

        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.json_request(
            '/api/events',
            {},
            () => {},
            () => {
                errback_called = true;
            },
        );

        assert.true(errback_called, 'errback called');
        assert.strictEqual(error_shown, 'Failed to request JSON data', 'generic error shown');
    });
});

QUnit.module('cone.calendar.Calendar.prepare_target', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('prepare_target parses string target', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        const result = calendar.prepare_target('/api/event', { id: 1 });

        assert.strictEqual(result.url, '/api/event', 'url parsed');
        assert.strictEqual(result.params.id, 1, 'params extended');
    });

    QUnit.test('prepare_target preserves object target', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        const target = { url: '/api/event', params: { existing: 'value' } };
        const result = calendar.prepare_target(target, { id: 1 });

        assert.strictEqual(result.url, '/api/event', 'url preserved');
        assert.strictEqual(result.params.existing, 'value', 'existing params preserved');
        assert.strictEqual(result.params.id, 1, 'new params added');
    });
});

QUnit.module('cone.calendar.Calendar.handle_action', (hooks) => {
    let container, bdajax_dialog_origin;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
        bdajax_dialog_origin = window.bdajax.dialog;
    });

    hooks.afterEach(() => {
        container.remove();
        window.bdajax.dialog = bdajax_dialog_origin;
        teardown_global_mocks();
    });

    QUnit.test('handle_action does nothing without target', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let perform_called = false;
        calendar.perform_action = () => {
            perform_called = true;
        };

        calendar.handle_action({});

        assert.false(perform_called, 'perform_action not called');
    });

    QUnit.test('handle_action shows dialog when confirm is set', (assert) => {
        let dialog_shown = false;
        window.bdajax.dialog = (opts, callback) => {
            dialog_shown = true;
            assert.strictEqual(opts.message, 'Are you sure?', 'confirm message passed');
            callback(opts);
        };

        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let perform_called = false;
        calendar.perform_action = () => {
            perform_called = true;
        };

        calendar.handle_action({
            target: { url: '/api/action', params: {} },
            confirm: 'Are you sure?',
        });

        assert.true(dialog_shown, 'dialog shown');
        assert.true(perform_called, 'perform_action called after confirm');
    });

    QUnit.test('handle_action performs directly without confirm', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let perform_called = false;
        calendar.perform_action = () => {
            perform_called = true;
        };

        calendar.handle_action({
            target: { url: '/api/action', params: {} },
        });

        assert.true(perform_called, 'perform_action called directly');
    });
});

QUnit.module('cone.calendar.Calendar.perform_action', (hooks) => {
    let container, bdajax_action_origin, bdajax_trigger_origin, bdajax_overlay_origin;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
        bdajax_action_origin = window.bdajax.action;
        bdajax_trigger_origin = window.bdajax.trigger;
        bdajax_overlay_origin = window.bdajax.overlay;
    });

    hooks.afterEach(() => {
        container.remove();
        window.bdajax.action = bdajax_action_origin;
        window.bdajax.trigger = bdajax_trigger_origin;
        window.bdajax.overlay = bdajax_overlay_origin;
        teardown_global_mocks();
    });

    QUnit.test('perform_action calls bdajax.action when action defined', (assert) => {
        let action_opts = null;
        window.bdajax.action = (opts) => {
            action_opts = opts;
        };

        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.perform_action({
            target: { url: '/api/do', params: { id: 1 } },
            action: { name: 'delete', selector: '#content', mode: 'replace' },
        });

        assert.strictEqual(action_opts.name, 'delete', 'action name');
        assert.strictEqual(action_opts.selector, '#content', 'selector');
        assert.strictEqual(action_opts.mode, 'replace', 'mode');
        assert.strictEqual(action_opts.url, '/api/do', 'url from target');
    });

    QUnit.test('perform_action calls bdajax.trigger when event defined', (assert) => {
        let trigger_args = null;
        window.bdajax.trigger = (name, selector, target) => {
            trigger_args = { name, selector, target };
        };

        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.perform_action({
            target: { url: '/api/do', params: {} },
            event: { name: 'reload', selector: '#calendar' },
        });

        assert.strictEqual(trigger_args.name, 'reload', 'event name');
        assert.strictEqual(trigger_args.selector, '#calendar', 'selector');
    });

    QUnit.test('perform_action calls bdajax.overlay when overlay defined', (assert) => {
        let overlay_opts = null;
        window.bdajax.overlay = (opts) => {
            overlay_opts = opts;
        };

        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.perform_action({
            target: { url: '/api/edit', params: {} },
            overlay: {
                action: 'edit',
                selector: '#modal',
                content_selector: '.modal-body',
                css: 'wide',
            },
        });

        assert.strictEqual(overlay_opts.action, 'edit', 'overlay action');
        assert.strictEqual(overlay_opts.selector, '#modal', 'selector');
        assert.strictEqual(overlay_opts.content_selector, '.modal-body', 'content selector');
        assert.strictEqual(overlay_opts.css, 'wide', 'css class');
    });
});

QUnit.module('cone.calendar.Calendar.handle_actions', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('handle_actions does nothing with empty actions', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let handle_called = false;
        calendar.handle_action = () => {
            handle_called = true;
        };

        calendar.handle_actions([], '/api', {}, 0, 0);

        assert.false(handle_called, 'handle_action not called');
    });

    QUnit.test('handle_actions calls handle_action directly for single action', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let handled_action = null;
        calendar.handle_action = (action) => {
            handled_action = action;
        };

        calendar.handle_actions([{ title: 'Edit' }], '/api/event', { id: 1 }, 100, 200);

        assert.ok(handled_action, 'handle_action called');
        assert.strictEqual(handled_action.title, 'Edit', 'correct action');
        assert.ok(handled_action.target, 'target prepared');
    });

    QUnit.test('handle_actions creates context menu for multiple actions', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let menu_created = false;
        let menu_args = null;
        calendar.create_context_menu = (actions, x, y) => {
            menu_created = true;
            menu_args = { actions, x, y };
        };

        calendar.handle_actions(
            [{ title: 'Edit' }, { title: 'Delete' }],
            '/api/event',
            { id: 1 },
            100,
            200,
        );

        assert.true(menu_created, 'context menu created');
        assert.strictEqual(menu_args.actions.length, 2, 'two actions');
        assert.strictEqual(menu_args.x, 100, 'x position');
        assert.strictEqual(menu_args.y, 200, 'y position');
    });
});

QUnit.module('cone.calendar.Calendar.create_context_menu', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        $.fn.width = orig_width;
        $.fn.height = orig_height;
        window.scrollTo(0, 0);
        untrack_document_click_listeners();
        container.remove();
        $('.calendar-contextmenu-wrapper').remove();
        teardown_global_mocks();
    });

    QUnit.test('create_context_menu creates wrapper and menu', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.create_context_menu([{ title: 'Edit' }], 100, 200);

        assert.strictEqual($('.calendar-contextmenu-wrapper').length, 1, 'wrapper created');
        assert.strictEqual($('.calendar-contextmenu').length, 1, 'menu created');
    });

    QUnit.test('create_context_menu removes existing wrapper', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.create_context_menu([{ title: 'Edit' }], 100, 200);
        calendar.create_context_menu([{ title: 'Delete' }], 150, 250);

        assert.strictEqual($('.calendar-contextmenu-wrapper').length, 1, 'only one wrapper exists');
    });

    QUnit.test('create_context_menu adds menu items', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.create_context_menu(
            [{ title: 'Edit', icon: 'bi bi-pencil' }, { title: 'Delete' }],
            100,
            200,
        );

        const items = $('.calendar-contextmenu li');
        assert.strictEqual(items.length, 2, 'two menu items');
        assert.ok(items.first().find('i.bi-pencil').length, 'icon added');
        assert.ok(items.first().text().includes('Edit'), 'title in first item');
    });

    QUnit.test('wrapper click removes wrapper', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.create_context_menu([{ title: 'Edit' }], 100, 200);

        $('.calendar-contextmenu-wrapper').trigger('click');

        assert.strictEqual(
            $('.calendar-contextmenu-wrapper').length,
            0,
            'wrapper removed on click',
        );
    });

    QUnit.test('create_context_menu opens menu left of x if it overflows', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        $('<style>.calendar-contextmenu { width: 100px; padding: 0; border: 0; }</style>').appendTo(
            container,
        );
        patch_window_width(300);
        const calendar = new Calendar(elem);

        calendar.create_context_menu([{ title: 'Edit' }], 250, 200);

        assert.strictEqual(calendar.menu.css('left'), '150px', 'menu left of x');
        assert.strictEqual(calendar.menu.css('top'), '200px', 'menu top at y');
    });

    QUnit.test('create_context_menu keeps menu inside left viewport border', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        $('<style>.calendar-contextmenu { width: 100px; padding: 0; border: 0; }</style>').appendTo(
            container,
        );
        patch_window_width(150);
        const calendar = new Calendar(elem);

        calendar.create_context_menu([{ title: 'Edit' }], 60, 200);

        assert.strictEqual(calendar.menu.css('left'), '0px', 'menu at left viewport border');
    });

    QUnit.test('create_context_menu opens menu above y if it overflows', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        $(
            '<style>.calendar-contextmenu { height: 100px; padding: 0; border: 0; }</style>',
        ).appendTo(container);
        patch_window_height(300);
        const calendar = new Calendar(elem);

        calendar.create_context_menu([{ title: 'Edit' }], 100, 250);

        assert.strictEqual(calendar.menu.css('top'), '150px', 'menu above y');
        assert.strictEqual(calendar.menu.css('left'), '100px', 'menu left at x');
    });

    QUnit.test('create_context_menu keeps menu inside top viewport border', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        $(
            '<style>.calendar-contextmenu { height: 100px; padding: 0; border: 0; }</style>',
        ).appendTo(container);
        patch_window_height(150);
        const calendar = new Calendar(elem);

        calendar.create_context_menu([{ title: 'Edit' }], 100, 60);

        assert.strictEqual(calendar.menu.css('top'), '0px', 'menu at top viewport border');
    });

    QUnit.test('create_context_menu considers horizontal page scroll', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        $('<style>.calendar-contextmenu { width: 100px; padding: 0; border: 0; }</style>').appendTo(
            container,
        );
        $('<div style="width: 5000px; height: 10px" />').appendTo(container);
        window.scrollTo(1000, 0);
        patch_window_width(300);
        const calendar = new Calendar(elem);

        calendar.create_context_menu([{ title: 'Edit' }], 1050, 200);
        assert.strictEqual(calendar.menu.css('left'), '1050px', 'menu fits right of x');

        calendar.create_context_menu([{ title: 'Edit' }], 1250, 200);
        assert.strictEqual(calendar.menu.css('left'), '1150px', 'menu left of x');

        patch_window_width(150);
        calendar.create_context_menu([{ title: 'Edit' }], 1060, 200);
        assert.strictEqual(calendar.menu.css('left'), '1000px', 'menu at left viewport border');
    });

    QUnit.test('create_context_menu considers vertical page scroll', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        $(
            '<style>.calendar-contextmenu { height: 100px; padding: 0; border: 0; }</style>',
        ).appendTo(container);
        $('<div style="height: 5000px" />').appendTo(container);
        window.scrollTo(0, 1000);
        patch_window_height(300);
        const calendar = new Calendar(elem);

        calendar.create_context_menu([{ title: 'Edit' }], 100, 1050);
        assert.strictEqual(calendar.menu.css('top'), '1050px', 'menu fits below y');

        calendar.create_context_menu([{ title: 'Edit' }], 100, 1250);
        assert.strictEqual(calendar.menu.css('top'), '1150px', 'menu above y');
    });

    QUnit.test('create_context_menu does not extend the page', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        $('<div style="height: 3000px" />').appendTo(container);
        const calendar = new Calendar(elem);
        const page_height = document.documentElement.scrollHeight;

        calendar.create_context_menu([{ title: 'Edit' }, { title: 'Delete' }], 100, 200);

        assert.strictEqual(document.documentElement.scrollHeight, page_height, 'page height kept');
    });

    QUnit.test('click outside closes context menu', async (assert) => {
        const listeners = await track_document_click_listeners();
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        const calendar = new Calendar(elem);
        calendar.create_context_menu([{ title: 'Edit' }, { title: 'Delete' }], 100, 200);
        // outside click listener gets registered in a timeout
        await next_tick();

        assert.strictEqual(listeners.size, 1, 'outside click listener registered');

        document.body.click();

        assert.strictEqual($('.calendar-contextmenu').length, 0, 'menu removed');
        assert.strictEqual($('.calendar-contextmenu-wrapper').length, 0, 'wrapper removed');
        assert.strictEqual(listeners.size, 0, 'outside click listener removed');
    });

    QUnit.test('click on calendar event keeps context menu', async (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        const calendar = new Calendar(elem);
        const fc_event = $('<div class="fc-event" />').appendTo(container);
        calendar.create_context_menu([{ title: 'Edit' }, { title: 'Delete' }], 100, 200);
        await next_tick();

        fc_event[0].click();

        assert.strictEqual($('.calendar-contextmenu').length, 1, 'menu kept');
    });

    QUnit.test('click on context menu padding keeps it', async (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        const calendar = new Calendar(elem);
        calendar.create_context_menu([{ title: 'Edit' }, { title: 'Delete' }], 100, 200);
        await next_tick();

        calendar.menu[0].click();

        assert.strictEqual($('.calendar-contextmenu').length, 1, 'menu kept');

        document.body.click();

        assert.strictEqual($('.calendar-contextmenu').length, 0, 'menu removed');
    });

    QUnit.test('item click unregisters outside click listener', async (assert) => {
        const listeners = await track_document_click_listeners();
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        const calendar = new Calendar(elem);
        calendar.handle_action = () => {};
        calendar.create_context_menu([{ title: 'Edit' }, { title: 'Delete' }], 100, 200);
        await next_tick();

        $('li', calendar.menu)[0].click();

        assert.strictEqual($('.calendar-contextmenu').length, 0, 'menu removed');
        assert.strictEqual(listeners.size, 0, 'outside click listener removed');
    });

    QUnit.test('wrapper click unregisters outside click listener', async (assert) => {
        const listeners = await track_document_click_listeners();
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        const calendar = new Calendar(elem);
        calendar.create_context_menu([{ title: 'Edit' }, { title: 'Delete' }], 100, 200);
        await next_tick();

        calendar.wrapper[0].click();

        assert.strictEqual($('.calendar-contextmenu').length, 0, 'menu removed');
        assert.strictEqual(listeners.size, 0, 'outside click listener removed');
    });

    QUnit.test('reopening context menu replaces outside click listener', async (assert) => {
        const listeners = await track_document_click_listeners();
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        const calendar = new Calendar(elem);
        calendar.create_context_menu([{ title: 'Edit' }, { title: 'Delete' }], 100, 200);
        await next_tick();
        calendar.create_context_menu([{ title: 'Edit' }, { title: 'Delete' }], 150, 250);
        await next_tick();

        assert.strictEqual(listeners.size, 1, 'one outside click listener');

        calendar.destroy();
    });

    QUnit.test('destroy unregisters outside click listener', async (assert) => {
        const listeners = await track_document_click_listeners();
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        const calendar = new Calendar(elem);
        calendar.create_context_menu([{ title: 'Edit' }, { title: 'Delete' }], 100, 200);
        await next_tick();

        calendar.destroy();

        assert.strictEqual($('.calendar-contextmenu').length, 0, 'menu removed');
        assert.strictEqual(listeners.size, 0, 'outside click listener removed');
    });

    QUnit.test('closing context menu at once skips outside click listener', async (assert) => {
        const listeners = await track_document_click_listeners();
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        const calendar = new Calendar(elem);
        calendar.create_context_menu([{ title: 'Edit' }, { title: 'Delete' }], 100, 200);

        calendar.destroy();
        await next_tick();

        assert.strictEqual(listeners.size, 0, 'outside click listener not registered');
    });
});

QUnit.module('cone.calendar.Calendar.add_menu_item', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('add_menu_item creates list item with title', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        const wrapper = $('<div />');
        const menu = $('<ul />');

        calendar.add_menu_item(wrapper, menu, { title: 'Test Action' });

        assert.strictEqual(menu.find('li').length, 1, 'list item added');
        assert.ok(menu.find('li').text().includes('Test Action'), 'title in item');
    });

    QUnit.test('add_menu_item adds icon when provided', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        const wrapper = $('<div />');
        const menu = $('<ul />');

        calendar.add_menu_item(wrapper, menu, {
            title: 'Edit',
            icon: 'bi bi-pencil',
        });

        assert.strictEqual(menu.find('i.bi-pencil').length, 1, 'icon added');
    });

    QUnit.test('add_menu_item renders title as text', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        const wrapper = $('<div />');
        const menu = $('<ul />');

        calendar.add_menu_item(wrapper, menu, { title: '<img class="injected">' });

        assert.strictEqual(menu.find('.injected').length, 0, 'no markup injected');
        assert.strictEqual(menu.find('span').text(), '<img class="injected">', 'title as text');
    });

    QUnit.test('add_menu_item sets icon as class', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        const wrapper = $('<div />');
        const menu = $('<ul />');

        calendar.add_menu_item(wrapper, menu, {
            title: 'Edit',
            icon: '"><img class="injected"><i class="',
        });

        assert.strictEqual(menu.find('.injected').length, 0, 'no markup injected');
        assert.strictEqual(menu.find('i').length, 1, 'one icon');
        assert.true(menu.find('i').hasClass('me-2'), 'icon spacing class kept');
    });

    QUnit.test('add_menu_item click triggers handle_action', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        const wrapper = $('<div />').appendTo(container);
        calendar.wrapper = wrapper;
        const menu = $('<ul />');

        let handled_action = null;
        calendar.handle_action = (action) => {
            handled_action = action;
        };

        const action = { title: 'Test', target: { url: '/api' } };
        calendar.add_menu_item(wrapper, menu, action);

        menu.find('li').trigger('click');

        assert.deepEqual(handled_action, action, 'handle_action called with action');
        assert.strictEqual(wrapper.parent().length, 0, 'wrapper removed');
    });
});

QUnit.module('cone.calendar.Calendar.event_clicked', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        untrack_document_click_listeners();
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('event_clicked calls handle_actions with event data', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let handle_args = null;
        calendar.handle_actions = (actions, target, params, x, y) => {
            handle_args = { actions, target, params, x, y };
        };

        calendar.event_clicked({
            jsEvent: { pageX: 100, pageY: 200 },
            view: { name: 'dayGridMonth' },
            event: {
                extendedProps: {
                    actions: [{ title: 'Edit' }],
                    target: '/api/event/1',
                },
            },
        });

        assert.deepEqual(handle_args.actions, [{ title: 'Edit' }], 'actions from event');
        assert.strictEqual(handle_args.target, '/api/event/1', 'target from event');
        assert.strictEqual(handle_args.params.view, 'dayGridMonth', 'view in params');
        assert.strictEqual(handle_args.x, 100, 'x from jsEvent');
        assert.strictEqual(handle_args.y, 200, 'y from jsEvent');
    });

    QUnit.test('event_clicked closes open popover', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        const calendar = new Calendar(elem);
        calendar.handle_actions = () => {};
        let close_clicks = 0;
        $('<span class="fc-popover-close" />')
            .on('click', () => {
                close_clicks++;
            })
            .appendTo(container);

        calendar.event_clicked({
            jsEvent: { pageX: 100, pageY: 200 },
            view: { name: 'dayGridMonth' },
            event: { extendedProps: {} },
        });

        assert.strictEqual(close_clicks, 1, 'popover close button clicked');
    });

    QUnit.test('event click in popover replaces open context menu', async (assert) => {
        const listeners = await track_document_click_listeners();
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        const calendar = new Calendar(elem);
        $('<span class="fc-popover-close" />').appendTo(container);
        const actions = [{ title: 'Edit' }, { title: 'Delete' }];
        calendar.create_context_menu(actions, 100, 200);
        await next_tick();

        calendar.event_clicked({
            jsEvent: { pageX: 150, pageY: 250 },
            view: { name: 'dayGridMonth' },
            event: { extendedProps: { actions: actions, target: '/api/event/1' } },
        });
        await next_tick();

        assert.strictEqual($('.calendar-contextmenu').length, 1, 'one menu open');
        assert.strictEqual(listeners.size, 1, 'one outside click listener');

        calendar.destroy();
    });
});

QUnit.module('cone.calendar.Calendar.date_clicked', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('date_clicked calls handle_actions with date data', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[{"title": "Add Event"}]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let handle_args = null;
        calendar.handle_actions = (actions, target, params, x, y) => {
            handle_args = { actions, target, params, x, y };
        };

        const test_date = new Date('2024-01-15T10:00:00Z');
        calendar.date_clicked({
            jsEvent: { pageX: 150, pageY: 250 },
            date: test_date,
            view: { type: 'dayGridMonth' },
        });

        assert.deepEqual(handle_args.actions, [{ title: 'Add Event' }], 'actions from calendar');
        assert.strictEqual(handle_args.target, '/api/calendar', 'target from calendar');
        assert.strictEqual(
            handle_args.params.date,
            Math.floor(test_date.getTime() / 1000),
            'date timestamp in params',
        );
        assert.strictEqual(handle_args.params.view, 'dayGridMonth', 'view in params');
    });
});

QUnit.module('cone.calendar.Calendar.event_drop', (hooks) => {
    let container;
    const orig_console_log = console.log;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        console.log = orig_console_log;
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('event_drop callback logs response data', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        const calendar = new Calendar(elem);
        let update_callback = null;
        calendar.update_event = (_cal_evt, _delta, _revert_func, _view, callback) => {
            update_callback = callback;
        };
        const logged = [];
        console.log = (data) => {
            logged.push(data);
        };

        calendar.event_drop({ event: {}, delta: {}, revert: () => {} });
        update_callback({ success: true });

        assert.deepEqual(logged, [{ success: true }], 'response data logged');
    });

    QUnit.test('event_drop delegates editability guard to FullCalendar', (assert) => {
        // FullCalendar prevents event_drop from being called for non-editable
        // events; the handler itself always calls update_event when invoked.
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let update_called = false;
        calendar.update_event = () => {
            update_called = true;
        };

        calendar.event_drop({
            event: { editable: false, startEditable: false },
            delta: {},
            revert: () => {},
        });

        assert.true(update_called, 'update_event called');
    });

    QUnit.test('event_drop calls update_event when editable', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let update_args = null;
        calendar.update_event = (cal_evt, delta, _revert_func, view) => {
            update_args = { cal_evt, delta, view };
        };

        const delta = { asSeconds: () => 3600 };
        calendar.event_drop({
            event: { editable: true },
            delta: delta,
            revert: () => {},
        });

        assert.ok(update_args, 'update_event called');
        assert.strictEqual(update_args.view, 'calendar_event_drop', 'correct view');
    });

    QUnit.test('event_drop calls update_event when startEditable', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let update_called = false;
        calendar.update_event = () => {
            update_called = true;
        };

        const delta = { asSeconds: () => 3600 };
        calendar.event_drop({
            event: { editable: false, startEditable: true },
            delta: delta,
            revert: () => {},
        });

        assert.true(update_called, 'update_event called with startEditable');
    });
});

QUnit.module('cone.calendar.Calendar.event_resize', (hooks) => {
    let container;
    const orig_console_log = console.log;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        console.log = orig_console_log;
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('event_resize callback logs response data', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);
        const calendar = new Calendar(elem);
        let update_callback = null;
        calendar.update_event = (_cal_evt, _delta, _revert_func, _view, callback) => {
            update_callback = callback;
        };
        const logged = [];
        console.log = (data) => {
            logged.push(data);
        };

        calendar.event_resize({ event: {}, endDelta: {}, revert: () => {} });
        update_callback({ success: true });

        assert.deepEqual(logged, [{ success: true }], 'response data logged');
    });

    QUnit.test('event_resize delegates editability guard to FullCalendar', (assert) => {
        // FullCalendar prevents event_resize from being called for non-editable
        // events; the handler itself always calls update_event when invoked.
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let update_called = false;
        calendar.update_event = () => {
            update_called = true;
        };

        calendar.event_resize({
            event: { editable: false, durationEditable: false },
            endDelta: {},
            revert: () => {},
        });

        assert.true(update_called, 'update_event called');
    });

    QUnit.test('event_resize calls update_event when editable', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let update_args = null;
        calendar.update_event = (_cal_evt, _delta, _revert_func, view) => {
            update_args = { view };
        };

        const delta = { asSeconds: () => 1800 };

        calendar.event_resize({
            event: { editable: true },
            delta: delta,
            revert: () => {},
        });

        assert.ok(update_args, 'update_event called');
        assert.strictEqual(update_args.view, 'calendar_event_resize', 'correct view');
    });
});

QUnit.module('cone.calendar.Calendar.update_event', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('update_event calls json_request with event data', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let request_args = null;
        calendar.json_request = (url, params) => {
            request_args = { url, params };
        };

        const start = new Date('2024-01-15T10:00:00Z');
        const end = new Date('2024-01-15T11:00:00Z');
        const cal_evt = {
            id: '123',
            start: start,
            end: end,
            extendedProps: { target: '/api/event/123' },
        };
        const delta = { days: 0, milliseconds: 3600000 };

        calendar.update_event(
            cal_evt,
            delta,
            () => {},
            'calendar_event_drop',
            () => {},
        );

        assert.ok(request_args.url.includes('calendar_event_drop'), 'view in url');
        assert.strictEqual(request_args.params.id, '123', 'event id in params');
        assert.strictEqual(request_args.params.delta, 3600, 'delta in params');
    });
});

QUnit.module('cone.calendar.Calendar.destroy', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('destroy cleans up all resources', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);

        // Save reference to mock calendar before destroy sets it to null
        const mock_calendar = calendar.calendar;

        // Create a wrapper to test removal
        calendar.wrapper = $('<div class="test-wrapper" />').appendTo(container);

        calendar.destroy();

        assert.true(mock_calendar._destroyed, 'fullcalendar destroyed');
        assert.strictEqual(calendar.calendar, null, 'calendar reference cleared');
        assert.strictEqual($('.test-wrapper').length, 0, 'wrapper removed');
        assert.strictEqual(
            cone.global_events._handlers.on_sidebar_left_resize.length,
            0,
            'sidebar left handler removed',
        );
        assert.strictEqual(
            cone.global_events._handlers.on_sidebar_right_resize.length,
            0,
            'sidebar right handler removed',
        );
    });

    QUnit.test('destroy unbinds reload event', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        calendar.destroy();

        // Trigger reload should not cause errors
        elem.trigger('reload');

        assert.ok(true, 'no error on reload after destroy');
    });
});

QUnit.module('cone.calendar.EventSource', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('EventSource.events calls json_request with date range', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[{"events": "calendar_events", "color": "blue"}]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let request_url = null;
        let request_params = null;
        calendar.json_request = (url, params, callback) => {
            request_url = url;
            request_params = params;
            callback([]);
        };

        const eventSource = calendar.calendar.options.eventSources[0];
        const start = new Date('2024-01-01T00:00:00Z');
        const end = new Date('2024-02-01T00:00:00Z');

        eventSource.events(
            { start, end, timeZone: 'UTC' },
            () => {},
            () => {},
        );

        assert.ok(request_url.includes('calendar_events'), 'events view in url');
        assert.strictEqual(
            request_params.start,
            Math.floor(start.getTime() / 1000),
            'start timestamp',
        );
        assert.strictEqual(request_params.end, Math.floor(end.getTime() / 1000), 'end timestamp');
        assert.strictEqual(request_params.timezone, 'UTC', 'timezone');
    });

    QUnit.test('EventSource.events uses local timezone as fallback', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[{"events": "calendar_events"}]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        let request_params = null;
        calendar.json_request = (_url, params, callback) => {
            request_params = params;
            callback([]);
        };

        const eventSource = calendar.calendar.options.eventSources[0];
        const start = new Date('2024-01-01T00:00:00Z');
        const end = new Date('2024-02-01T00:00:00Z');

        eventSource.events(
            { start, end, timeZone: null },
            () => {},
            () => {},
        );

        assert.strictEqual(request_params.timezone, 'local', 'defaults to local');
    });

    QUnit.test('EventSource.events calls successCallback with events', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[{"events": "calendar_events"}]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        const events_data = [{ id: 1, title: 'Event 1' }];
        calendar.json_request = (_url, _params, callback) => {
            callback(events_data);
        };

        const eventSource = calendar.calendar.options.eventSources[0];
        let received_events = null;

        eventSource.events(
            { start: new Date(), end: new Date(), timeZone: 'UTC' },
            (events) => {
                received_events = events;
            },
            () => {},
        );

        assert.deepEqual(received_events, events_data, 'events passed to callback');
    });

    QUnit.test('EventSource.events calls failureCallback on error', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[{"events": "calendar_events"}]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        const error_obj = new Error('Network error');
        calendar.json_request = (_url, _params, _callback, errback) => {
            errback(error_obj);
        };

        const eventSource = calendar.calendar.options.eventSources[0];
        let received_error = null;

        eventSource.events(
            { start: new Date(), end: new Date(), timeZone: 'UTC' },
            () => {},
            (err) => {
                received_error = err;
            },
        );

        assert.strictEqual(received_error, error_obj, 'error passed to failureCallback');
    });

    QUnit.test('EventSource preserves additional options', (assert) => {
        const elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[{"events": "calendar_events", "color": "blue", "textColor": "white"}]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        const calendar = new Calendar(elem);
        const eventSource = calendar.calendar.options.eventSources[0];

        assert.strictEqual(eventSource.color, 'blue', 'color preserved');
        assert.strictEqual(eventSource.textColor, 'white', 'textColor preserved');
    });
});
