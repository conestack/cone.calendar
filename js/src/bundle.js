import $ from 'jquery';

import { Calendar } from './calendar.js';

export * from './calendar.js';

$(() => {
    bdajax.register(Calendar.initialize, true);
});
