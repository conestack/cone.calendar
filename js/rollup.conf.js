import cleanup from 'rollup-plugin-cleanup';
import terser from '@rollup/plugin-terser';
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
            },
            // globals: {
            //     '@fullcalendar/core': 'FullCalendarCore',
            //     '@fullcalendar/daygrid': 'FullCalendarDayGrid',
            //     '@fullcalendar/timegrid': 'FullCalendarTimeGrid',
            //     '@fullcalendar/list': 'FullCalendarList',
            //     '@fullcalendar/interaction': 'FullCalendarInteraction',
            // },
            // external: [
            //     '@fullcalendar/core',
            //     '@fullcalendar/daygrid',
            //     '@fullcalendar/timegrid',
            //     '@fullcalendar/list',
            //     '@fullcalendar/interaction',
            // ],
            interop: 'default',
            sourcemap: false
        }]
    }
    conf.push(bundle_fullcalendar);

    return conf;
};
