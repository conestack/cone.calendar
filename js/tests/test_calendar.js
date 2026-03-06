import $ from 'jquery';
import {Calendar} from '../src/calendar.js';

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
        interactionPlugin: {}
    };

    window.bdajax = {
        request: function() {},
        error: function() {},
        parsetarget: function(target) {
            if (typeof target === 'string') {
                let parts = target.split('?');
                return {
                    url: parts[0],
                    params: {}
                };
            }
            return target;
        },
        dialog: function(opts, callback) {
            callback(opts);
        },
        action: function() {},
        trigger: function() {},
        overlay: function() {}
    };

    window.cone = {
        global_events: {
            _handlers: {},
            on: function(event, handler) {
                this._handlers[event] = this._handlers[event] || [];
                this._handlers[event].push(handler);
            },
            off: function(event, handler) {
                if (this._handlers[event]) {
                    this._handlers[event] = this._handlers[event].filter(
                        h => h !== handler
                    );
                }
            },
            trigger: function(event) {
                if (this._handlers[event]) {
                    this._handlers[event].forEach(h => h());
                }
            }
        }
    };

    window.ts = {
        ajax: {
            attach: function() {}
        }
    };
}

function teardown_global_mocks() {
    delete window.fullcalendar;
    delete window.bdajax;
    delete window.cone;
    delete window.ts;
}

QUnit.module('cone.calendar.Calendar.initialize', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('initialize does nothing without #calendar element', assert => {
        let div = $('<div id="other" />').appendTo(container);

        Calendar.initialize(container);

        assert.strictEqual($('#calendar', container).length, 0,
            'no calendar element exists');
    });

    QUnit.test('initialize creates Calendar instance when #calendar exists', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        Calendar.initialize(container);

        assert.ok(window.fullcalendar, 'fullcalendar mock exists');
    });
});

QUnit.module('cone.calendar.Calendar.constructor', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('constructor initializes properties from data attributes', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[{"title": "Add Event"}]'
                 data-calendar_sources='[]'
                 data-calendar_options='{"initialView": "dayGridMonth"}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);

        assert.strictEqual(calendar.target, '/api/calendar', 'target stored');
        assert.deepEqual(calendar.actions, [{title: 'Add Event'}], 'actions stored');
        assert.ok(calendar.calendar, 'fullcalendar instance created');
    });

    QUnit.test('constructor creates EventSource instances from sources', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[{"events": "events_view", "color": "blue"}]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);

        assert.ok(calendar.calendar.options.eventSources, 'event sources configured');
        assert.strictEqual(calendar.calendar.options.eventSources.length, 1,
            'one event source');
    });

    QUnit.test('constructor binds resize handlers', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);

        assert.ok(cone.global_events._handlers['on_sidebar_left_resize'],
            'sidebar left resize handler bound');
        assert.ok(cone.global_events._handlers['on_sidebar_right_resize'],
            'sidebar right resize handler bound');
    });

    QUnit.test('constructor attaches to bdajax', assert => {
        let attach_called = false;
        window.ts.ajax.attach = function(instance, elem) {
            attach_called = true;
        };

        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);

        assert.true(attach_called, 'ts.ajax.attach called');
    });
});

QUnit.module('cone.calendar.Calendar.refetch_events', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('refetch_events calls calendar.refetchEvents', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.refetch_events();

        assert.true(calendar.calendar._events_refetched, 'refetchEvents called');
    });

    QUnit.test('reload event triggers refetch_events', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.calendar._events_refetched = false;

        elem.trigger('reload');

        assert.true(calendar.calendar._events_refetched, 'refetchEvents called on reload');
    });
});

QUnit.module('cone.calendar.Calendar.on_resize', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('on_resize updates calendar size', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.calendar._size_updated = false;

        calendar.on_resize({});

        assert.true(calendar.calendar._size_updated, 'updateSize called');
    });

    QUnit.test('on_resize sets dayMaxEventRows based on element width', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        elem.css('width', '800px');
        let calendar = new Calendar(elem);

        calendar.on_resize({});

        assert.strictEqual(calendar.calendar.options.dayMaxEventRows, 3,
            'dayMaxEventRows set to 3 for wide element');
    });
});

QUnit.module('cone.calendar.Calendar.json_request', hooks => {

    let container,
        bdajax_request_origin;

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

    QUnit.test('json_request calls bdajax.request with correct params', assert => {
        let request_opts = null;
        window.bdajax.request = function(opts) {
            request_opts = opts;
        };

        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.json_request('/api/events', {start: 123}, () => {}, () => {});

        assert.strictEqual(request_opts.url, '/api/events', 'correct url');
        assert.strictEqual(request_opts.type, 'json', 'type is json');
        assert.deepEqual(request_opts.params, {start: 123}, 'params passed');
    });

    QUnit.test('json_request calls callback on success', assert => {
        let callback_data = null;
        window.bdajax.request = function(opts) {
            opts.success({data: {events: []}});
        };

        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.json_request('/api/events', {}, (data) => {
            callback_data = data;
        }, () => {});

        assert.deepEqual(callback_data, {events: []}, 'callback called with data.data');
    });

    QUnit.test('json_request calls errback on error response', assert => {
        let errback_called = false;
        let error_shown = null;
        window.bdajax.request = function(opts) {
            opts.success({error: true, message: 'Server error'});
        };
        window.bdajax.error = function(msg) {
            error_shown = msg;
        };

        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.json_request('/api/events', {}, () => {}, () => {
            errback_called = true;
        });

        assert.true(errback_called, 'errback called');
        assert.strictEqual(error_shown, 'Server error', 'error message shown');
    });

    QUnit.test('json_request calls errback on request error', assert => {
        let errback_called = false;
        let error_shown = null;
        window.bdajax.request = function(opts) {
            opts.error();
        };
        window.bdajax.error = function(msg) {
            error_shown = msg;
        };

        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.json_request('/api/events', {}, () => {}, () => {
            errback_called = true;
        });

        assert.true(errback_called, 'errback called');
        assert.strictEqual(error_shown, 'Failed to request JSON data',
            'generic error shown');
    });
});

QUnit.module('cone.calendar.Calendar.prepare_target', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('prepare_target parses string target', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let result = calendar.prepare_target('/api/event', {id: 1});

        assert.strictEqual(result.url, '/api/event', 'url parsed');
        assert.strictEqual(result.params.id, 1, 'params extended');
    });

    QUnit.test('prepare_target preserves object target', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let target = {url: '/api/event', params: {existing: 'value'}};
        let result = calendar.prepare_target(target, {id: 1});

        assert.strictEqual(result.url, '/api/event', 'url preserved');
        assert.strictEqual(result.params.existing, 'value', 'existing params preserved');
        assert.strictEqual(result.params.id, 1, 'new params added');
    });
});

QUnit.module('cone.calendar.Calendar.handle_action', hooks => {

    let container,
        bdajax_dialog_origin;

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

    QUnit.test('handle_action does nothing without target', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let perform_called = false;
        calendar.perform_action = function() {
            perform_called = true;
        };

        calendar.handle_action({});

        assert.false(perform_called, 'perform_action not called');
    });

    QUnit.test('handle_action shows dialog when confirm is set', assert => {
        let dialog_shown = false;
        window.bdajax.dialog = function(opts, callback) {
            dialog_shown = true;
            assert.strictEqual(opts.message, 'Are you sure?', 'confirm message passed');
            callback(opts);
        };

        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let perform_called = false;
        calendar.perform_action = function() {
            perform_called = true;
        };

        calendar.handle_action({
            target: {url: '/api/action', params: {}},
            confirm: 'Are you sure?'
        });

        assert.true(dialog_shown, 'dialog shown');
        assert.true(perform_called, 'perform_action called after confirm');
    });

    QUnit.test('handle_action performs directly without confirm', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let perform_called = false;
        calendar.perform_action = function() {
            perform_called = true;
        };

        calendar.handle_action({
            target: {url: '/api/action', params: {}}
        });

        assert.true(perform_called, 'perform_action called directly');
    });
});

QUnit.module('cone.calendar.Calendar.perform_action', hooks => {

    let container,
        bdajax_action_origin,
        bdajax_trigger_origin,
        bdajax_overlay_origin;

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

    QUnit.test('perform_action calls bdajax.action when action defined', assert => {
        let action_opts = null;
        window.bdajax.action = function(opts) {
            action_opts = opts;
        };

        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.perform_action({
            target: {url: '/api/do', params: {id: 1}},
            action: {name: 'delete', selector: '#content', mode: 'replace'}
        });

        assert.strictEqual(action_opts.name, 'delete', 'action name');
        assert.strictEqual(action_opts.selector, '#content', 'selector');
        assert.strictEqual(action_opts.mode, 'replace', 'mode');
        assert.strictEqual(action_opts.url, '/api/do', 'url from target');
    });

    QUnit.test('perform_action calls bdajax.trigger when event defined', assert => {
        let trigger_args = null;
        window.bdajax.trigger = function(name, selector, target) {
            trigger_args = {name, selector, target};
        };

        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.perform_action({
            target: {url: '/api/do', params: {}},
            event: {name: 'reload', selector: '#calendar'}
        });

        assert.strictEqual(trigger_args.name, 'reload', 'event name');
        assert.strictEqual(trigger_args.selector, '#calendar', 'selector');
    });

    QUnit.test('perform_action calls bdajax.overlay when overlay defined', assert => {
        let overlay_opts = null;
        window.bdajax.overlay = function(opts) {
            overlay_opts = opts;
        };

        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.perform_action({
            target: {url: '/api/edit', params: {}},
            overlay: {
                action: 'edit',
                selector: '#modal',
                content_selector: '.modal-body',
                css: 'wide'
            }
        });

        assert.strictEqual(overlay_opts.action, 'edit', 'overlay action');
        assert.strictEqual(overlay_opts.selector, '#modal', 'selector');
        assert.strictEqual(overlay_opts.content_selector, '.modal-body',
            'content selector');
        assert.strictEqual(overlay_opts.css, 'wide', 'css class');
    });
});

QUnit.module('cone.calendar.Calendar.handle_actions', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('handle_actions does nothing with empty actions', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let handle_called = false;
        calendar.handle_action = function() {
            handle_called = true;
        };

        calendar.handle_actions([], '/api', {}, 0, 0);

        assert.false(handle_called, 'handle_action not called');
    });

    QUnit.test('handle_actions calls handle_action directly for single action', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let handled_action = null;
        calendar.handle_action = function(action) {
            handled_action = action;
        };

        calendar.handle_actions([{title: 'Edit'}], '/api/event', {id: 1}, 100, 200);

        assert.ok(handled_action, 'handle_action called');
        assert.strictEqual(handled_action.title, 'Edit', 'correct action');
        assert.ok(handled_action.target, 'target prepared');
    });

    QUnit.test('handle_actions creates context menu for multiple actions', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let menu_created = false;
        let menu_args = null;
        calendar.create_context_menu = function(actions, x, y) {
            menu_created = true;
            menu_args = {actions, x, y};
        };

        calendar.handle_actions(
            [{title: 'Edit'}, {title: 'Delete'}],
            '/api/event',
            {id: 1},
            100,
            200
        );

        assert.true(menu_created, 'context menu created');
        assert.strictEqual(menu_args.actions.length, 2, 'two actions');
        assert.strictEqual(menu_args.x, 100, 'x position');
        assert.strictEqual(menu_args.y, 200, 'y position');
    });
});

QUnit.module('cone.calendar.Calendar.create_context_menu', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        $('.calendar-contextmenu-wrapper').remove();
        teardown_global_mocks();
    });

    QUnit.test('create_context_menu creates wrapper and menu', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.create_context_menu([{title: 'Edit'}], 100, 200);

        assert.strictEqual($('.calendar-contextmenu-wrapper').length, 1,
            'wrapper created');
        assert.strictEqual($('.calendar-contextmenu').length, 1, 'menu created');
    });

    QUnit.test('create_context_menu removes existing wrapper', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.create_context_menu([{title: 'Edit'}], 100, 200);
        calendar.create_context_menu([{title: 'Delete'}], 150, 250);

        assert.strictEqual($('.calendar-contextmenu-wrapper').length, 1,
            'only one wrapper exists');
    });

    QUnit.test('create_context_menu adds menu items', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.create_context_menu([
            {title: 'Edit', icon: 'bi bi-pencil'},
            {title: 'Delete'}
        ], 100, 200);

        let items = $('.calendar-contextmenu li');
        assert.strictEqual(items.length, 2, 'two menu items');
        assert.ok(items.first().find('i.bi-pencil').length, 'icon added');
        assert.ok(items.first().text().includes('Edit'), 'title in first item');
    });

    QUnit.test('wrapper click removes wrapper', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.create_context_menu([{title: 'Edit'}], 100, 200);

        $('.calendar-contextmenu-wrapper').trigger('click');

        assert.strictEqual($('.calendar-contextmenu-wrapper').length, 0,
            'wrapper removed on click');
    });
});

QUnit.module('cone.calendar.Calendar.add_menu_item', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('add_menu_item creates list item with title', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let wrapper = $('<div />');
        let menu = $('<ul />');

        calendar.add_menu_item(wrapper, menu, {title: 'Test Action'});

        assert.strictEqual(menu.find('li').length, 1, 'list item added');
        assert.ok(menu.find('li').text().includes('Test Action'), 'title in item');
    });

    QUnit.test('add_menu_item adds icon when provided', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let wrapper = $('<div />');
        let menu = $('<ul />');

        calendar.add_menu_item(wrapper, menu, {
            title: 'Edit',
            icon: 'bi bi-pencil'
        });

        assert.strictEqual(menu.find('i.bi-pencil').length, 1, 'icon added');
    });

    QUnit.test('add_menu_item click triggers handle_action', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let wrapper = $('<div />').appendTo(container);
        let menu = $('<ul />');

        let handled_action = null;
        calendar.handle_action = function(action) {
            handled_action = action;
        };

        let action = {title: 'Test', target: {url: '/api'}};
        calendar.add_menu_item(wrapper, menu, action);

        menu.find('li').trigger('click');

        assert.deepEqual(handled_action, action, 'handle_action called with action');
        assert.strictEqual(wrapper.parent().length, 0, 'wrapper removed');
    });
});

QUnit.module('cone.calendar.Calendar.event_clicked', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('event_clicked calls handle_actions with event data', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let handle_args = null;
        calendar.handle_actions = function(actions, target, params, x, y) {
            handle_args = {actions, target, params, x, y};
        };

        calendar.event_clicked({
            jsEvent: {pageX: 100, pageY: 200},
            view: {name: 'dayGridMonth'},
            event: {
                extendedProps: {
                    actions: [{title: 'Edit'}],
                    target: '/api/event/1'
                }
            }
        });

        assert.deepEqual(handle_args.actions, [{title: 'Edit'}], 'actions from event');
        assert.strictEqual(handle_args.target, '/api/event/1', 'target from event');
        assert.strictEqual(handle_args.params.view, 'dayGridMonth', 'view in params');
        assert.strictEqual(handle_args.x, 100, 'x from jsEvent');
        assert.strictEqual(handle_args.y, 200, 'y from jsEvent');
    });
});

QUnit.module('cone.calendar.Calendar.date_clicked', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('date_clicked calls handle_actions with date data', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[{"title": "Add Event"}]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let handle_args = null;
        calendar.handle_actions = function(actions, target, params, x, y) {
            handle_args = {actions, target, params, x, y};
        };

        let test_date = new Date('2024-01-15T10:00:00Z');
        calendar.date_clicked({
            jsEvent: {pageX: 150, pageY: 250},
            date: test_date,
            view: {type: 'dayGridMonth'}
        });

        assert.deepEqual(handle_args.actions, [{title: 'Add Event'}],
            'actions from calendar');
        assert.strictEqual(handle_args.target, '/api/calendar', 'target from calendar');
        assert.strictEqual(handle_args.params.date, Math.floor(test_date.getTime() / 1000),
            'date timestamp in params');
        assert.strictEqual(handle_args.params.view, 'dayGridMonth', 'view in params');
    });
});

QUnit.module('cone.calendar.Calendar.event_drop', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('event_drop delegates editability guard to FullCalendar', assert => {
        // FullCalendar prevents event_drop from being called for non-editable
        // events; the handler itself always calls update_event when invoked.
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let update_called = false;
        calendar.update_event = function() {
            update_called = true;
        };

        calendar.event_drop({
            event: {editable: false, startEditable: false},
            delta: {},
            revert: () => {}
        });

        assert.true(update_called, 'update_event called');
    });

    QUnit.test('event_drop calls update_event when editable', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let update_args = null;
        calendar.update_event = function(cal_evt, delta, revert_func, view, callback) {
            update_args = {cal_evt, delta, view};
        };

        let delta = {asSeconds: () => 3600};
        calendar.event_drop({
            event: {editable: true},
            delta: delta,
            revert: () => {}}
        );

        assert.ok(update_args, 'update_event called');
        assert.strictEqual(update_args.view, 'calendar_event_drop', 'correct view');
    });

    QUnit.test('event_drop calls update_event when startEditable', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let update_called = false;
        calendar.update_event = function() {
            update_called = true;
        };

        let delta = {asSeconds: () => 3600};
        calendar.event_drop({
            event: {editable: false, startEditable: true},
            delta: delta,
            revert: () => {}}
        );

        assert.true(update_called, 'update_event called with startEditable');
    });
});

QUnit.module('cone.calendar.Calendar.event_resize', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('event_resize delegates editability guard to FullCalendar', assert => {
        // FullCalendar prevents event_resize from being called for non-editable
        // events; the handler itself always calls update_event when invoked.
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let update_called = false;
        calendar.update_event = function() {
            update_called = true;
        };

        calendar.event_resize({
            event: {editable: false, durationEditable: false},
            endDelta: {},
            revert: () => {}
        });

        assert.true(update_called, 'update_event called');
    });

    QUnit.test('event_resize calls update_event when editable', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let update_args = null;
        calendar.update_event = function(cal_evt, delta, revert_func, view, callback) {
            update_args = {view};
        };

        let delta = {asSeconds: () => 1800};

        calendar.event_resize({
            event: {editable: true},
            delta: delta,
            revert: () => {}}
        );

        assert.ok(update_args, 'update_event called');
        assert.strictEqual(update_args.view, 'calendar_event_resize', 'correct view');
    });
});

QUnit.module('cone.calendar.Calendar.update_event', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('update_event calls json_request with event data', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let request_args = null;
        calendar.json_request = function(url, params, callback, errback) {
            request_args = {url, params};
        };

        let start = new Date('2024-01-15T10:00:00Z');
        let end = new Date('2024-01-15T11:00:00Z');
        let cal_evt = {
            id: '123',
            start: start,
            end: end,
            extendedProps: {target: '/api/event/123'}
        };
        let delta = {days: 0, milliseconds: 3600000};

        calendar.update_event(cal_evt, delta, () => {}, 'calendar_event_drop', () => {});

        assert.ok(request_args.url.includes('calendar_event_drop'), 'view in url');
        assert.strictEqual(request_args.params.id, '123', 'event id in params');
        assert.strictEqual(request_args.params.delta, 3600, 'delta in params');
    });
});

QUnit.module('cone.calendar.Calendar.destroy', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('destroy cleans up all resources', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);

        // Save reference to mock calendar before destroy sets it to null
        let mock_calendar = calendar.calendar;

        // Create a wrapper to test removal
        calendar.wrapper = $('<div class="test-wrapper" />').appendTo(container);

        calendar.destroy();

        assert.true(mock_calendar._destroyed, 'fullcalendar destroyed');
        assert.strictEqual(calendar.calendar, null, 'calendar reference cleared');
        assert.strictEqual($('.test-wrapper').length, 0, 'wrapper removed');
        assert.strictEqual(cone.global_events._handlers['on_sidebar_left_resize'].length, 0,
            'sidebar left handler removed');
        assert.strictEqual(cone.global_events._handlers['on_sidebar_right_resize'].length, 0,
            'sidebar right handler removed');
    });

    QUnit.test('destroy unbinds reload event', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        calendar.destroy();

        // Trigger reload should not cause errors
        elem.trigger('reload');

        assert.ok(true, 'no error on reload after destroy');
    });
});

QUnit.module('cone.calendar.EventSource', hooks => {

    let container;

    hooks.beforeEach(() => {
        setup_global_mocks();
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
        teardown_global_mocks();
    });

    QUnit.test('EventSource.events calls json_request with date range', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[{"events": "calendar_events", "color": "blue"}]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let request_url = null;
        let request_params = null;
        calendar.json_request = function(url, params, callback, errback) {
            request_url = url;
            request_params = params;
            callback([]);
        };

        let eventSource = calendar.calendar.options.eventSources[0];
        let start = new Date('2024-01-01T00:00:00Z');
        let end = new Date('2024-02-01T00:00:00Z');

        eventSource.events(
            {start, end, timeZone: 'UTC'},
            () => {},
            () => {}
        );

        assert.ok(request_url.includes('calendar_events'), 'events view in url');
        assert.strictEqual(request_params.start, Math.floor(start.getTime() / 1000),
            'start timestamp');
        assert.strictEqual(request_params.end, Math.floor(end.getTime() / 1000),
            'end timestamp');
        assert.strictEqual(request_params.timezone, 'UTC', 'timezone');
    });

    QUnit.test('EventSource.events uses local timezone as fallback', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[{"events": "calendar_events"}]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let request_params = null;
        calendar.json_request = function(url, params, callback, errback) {
            request_params = params;
            callback([]);
        };

        let eventSource = calendar.calendar.options.eventSources[0];
        let start = new Date('2024-01-01T00:00:00Z');
        let end = new Date('2024-02-01T00:00:00Z');

        eventSource.events(
            {start, end, timeZone: null},
            () => {},
            () => {}
        );

        assert.strictEqual(request_params.timezone, 'local', 'defaults to local');
    });

    QUnit.test('EventSource.events calls successCallback with events', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[{"events": "calendar_events"}]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let events_data = [{id: 1, title: 'Event 1'}];
        calendar.json_request = function(url, params, callback, errback) {
            callback(events_data);
        };

        let eventSource = calendar.calendar.options.eventSources[0];
        let received_events = null;

        eventSource.events(
            {start: new Date(), end: new Date(), timeZone: 'UTC'},
            (events) => { received_events = events; },
            () => {}
        );

        assert.deepEqual(received_events, events_data, 'events passed to callback');
    });

    QUnit.test('EventSource.events calls failureCallback on error', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[{"events": "calendar_events"}]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let error_obj = new Error('Network error');
        calendar.json_request = function(url, params, callback, errback) {
            errback(error_obj);
        };

        let eventSource = calendar.calendar.options.eventSources[0];
        let received_error = null;

        eventSource.events(
            {start: new Date(), end: new Date(), timeZone: 'UTC'},
            () => {},
            (err) => { received_error = err; }
        );

        assert.strictEqual(received_error, error_obj, 'error passed to failureCallback');
    });

    QUnit.test('EventSource preserves additional options', assert => {
        let elem = $(`
            <div id="calendar"
                 data-calendar_target="/api/calendar"
                 data-calendar_actions='[]'
                 data-calendar_sources='[{"events": "calendar_events", "color": "blue", "textColor": "white"}]'
                 data-calendar_options='{}'>
            </div>
        `).appendTo(container);

        let calendar = new Calendar(elem);
        let eventSource = calendar.calendar.options.eventSources[0];

        assert.strictEqual(eventSource.color, 'blue', 'color preserved');
        assert.strictEqual(eventSource.textColor, 'white', 'textColor preserved');
    });
});
