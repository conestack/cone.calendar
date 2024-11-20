import cleanup from 'rollup-plugin-cleanup';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import resolve from '@rollup/plugin-node-resolve';

const out_dir = 'src/cone/calendar/browser/static/calendar';
const out_dir_fullcalendar = 'src/cone/calendar/browser/static/fullcalendar';

export default args => {
    let conf = [];

    ////////////////////////////////////////////////////////////////////////////
    // DEFAULT
    ////////////////////////////////////////////////////////////////////////////

    let bundle_default = {
        input: 'js/src/default/bundle.js',
        plugins: [
            cleanup()
        ],
        output: [{
            file: `${out_dir}/default/cone.calendar.js`,
            name: 'cone_calendar',
            format: 'iife',
            globals: {
                jquery: 'jQuery'
            },
            interop: 'default',
            sourcemap: false
        }],
        external: [
            'jquery'
        ]
    };
    if (args.configDebug !== true) {
        bundle_default.output.push({
            file: `${out_dir}/default/cone.calendar.min.js`,
            name: 'cone_calendar',
            format: 'iife',
            plugins: [
                terser()
            ],
            globals: {
                jquery: 'jQuery'
            },
            interop: 'default',
            sourcemap: false
        });
    }
    conf.push(bundle_default);

    let scss_default = {
        input: ['scss/default/styles.scss'],
        output: [{
            file: `${out_dir}/default/cone.calendar.css`,
            format: 'es',
            plugins: [terser()],
        }],
        plugins: [
            postcss({
                extract: true,
                minimize: true,
                use: [
                    ['sass', { outputStyle: 'compressed' }],
                ],
            }),
        ],
    };
    conf.push(scss_default);

    ////////////////////////////////////////////////////////////////////////////
    // BOOTSTRAP5
    ////////////////////////////////////////////////////////////////////////////

    let bundle_bs5 = {
        input: 'js/src/bootstrap5/bundle.js',
        plugins: [
            cleanup()
        ],
        output: [{
            name: 'cone_calendar',
            file: `${out_dir}/bootstrap5/cone.calendar.js`,
            format: 'iife',
            globals: {
                jquery: 'jQuery'
            },
            interop: 'default'
        }],
        external: [
            'jquery'
        ]
    };
    if (args.configDebug !== true) {
        bundle_bs5.output.push({
            name: 'cone_calendar',
            file: `${out_dir}/bootstrap5/cone.calendar.min.js`,
            format: 'iife',
            plugins: [
                terser()
            ],
            globals: {
                jquery: 'jQuery'
            },
            interop: 'default'
        });
    }
    conf.push(bundle_bs5);

    let scss_bs5 = {
        input: ['scss/bootstrap5/styles.scss'],
        output: [{
            file: `${out_dir}/bootstrap5/cone.calendar.css`,
            format: 'es',
            plugins: [terser()],
        }],
        plugins: [
            postcss({
                extract: true,
                minimize: true,
                use: [
                    ['sass', { outputStyle: 'compressed' }],
                ],
            }),
        ],
    };
    conf.push(scss_bs5);

    let bundle_fullcalendar = {
        input: 'js/src/bootstrap5/fullcalendar_bundle.js',
        plugins: [
            resolve(),
            cleanup()
        ],
        output: [{
            file: `${out_dir_fullcalendar}/bootstrap5/fullcalendar.js`,
            name: 'fullcalendar',
            format: 'iife',
            plugins: [
                // terser()
            ],
            globals: {
                '@fullcalendar/core': 'FullCalendar',
                '@fullcalendar/daygrid': 'FullCalendarDayGrid',
                '@fullcalendar/timegrid': 'FullCalendarTimeGrid',
                '@fullcalendar/list': 'FullCalendarList',
                '@fullcalendar/interaction': 'FullCalendarInteraction',
                '@fullcalendar/bootstrap5': 'FullCalendarBootstrap5',
            },
            interop: 'default',
            sourcemap: false
        }]
    }
    conf.push(bundle_fullcalendar);

    return conf;
};
