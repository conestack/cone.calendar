import $ from 'jquery';
import * as fullcalendar from '../src/fullcalendar.js';

QUnit.module('cone.calendar.bundle', (hooks) => {
    hooks.afterEach(() => {
        delete window.bdajax;
    });

    QUnit.test('bundle exports Calendar and registers it on DOM ready', async (assert) => {
        const registered = [];
        window.bdajax = {
            register: (func, instant) => {
                registered.push({ func, instant });
            },
        };

        const bundle = await import('../src/bundle.js');
        // ready callbacks run in registration order, this one after the bundle's
        await new Promise((resolve) => $(resolve));

        assert.deepEqual(Object.keys(bundle), ['Calendar'], 'exported names');
        assert.strictEqual(registered.length, 1, 'one registration');
        assert.strictEqual(registered[0].func, bundle.Calendar.initialize, 'initialize registered');
        assert.true(registered[0].instant, 'registered for instant execution');
    });
});

QUnit.module('cone.calendar.fullcalendar', () => {
    QUnit.test('fullcalendar bundle exports Calendar, locales and plugins', (assert) => {
        assert.deepEqual(
            Object.keys(fullcalendar).sort(),
            [
                'Calendar',
                'bootstrap5Plugin',
                'dayGridPlugin',
                'interactionPlugin',
                'listPlugin',
                'localesAll',
                'timeGridPlugin',
            ],
            'exported names',
        );
        assert.strictEqual(typeof fullcalendar.Calendar, 'function', 'Calendar class');
        assert.true(Array.isArray(fullcalendar.localesAll), 'locales list');
        assert.strictEqual(fullcalendar.bootstrap5Plugin.name, '@fullcalendar/bootstrap5');
        assert.strictEqual(fullcalendar.dayGridPlugin.name, '@fullcalendar/daygrid');
        assert.strictEqual(fullcalendar.timeGridPlugin.name, '@fullcalendar/timegrid');
        assert.strictEqual(fullcalendar.listPlugin.name, '@fullcalendar/list');
        assert.strictEqual(fullcalendar.interactionPlugin.name, '@fullcalendar/interaction');
    });
});
