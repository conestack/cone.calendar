import cleanup from 'rollup-plugin-cleanup';
import {terser} from 'rollup-plugin-terser';

let out_path = 'src/cone/calendar/browser/static';

export default args => {
    let conf = {
        input: 'js/src/bundle.js',
        plugins: [
            cleanup()
        ],
        output: [{
            file: `${out_path}/calendar.js`,
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
        conf.output.push({
            file: `${out_path}/calendar.min.js`,
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
    return conf;
};
