import $ from 'jquery';

import {Calendar} from './calendar.js';

export * from './calendar.js';

$(function() {
    bdajax.register(Calendar.initialize, true);
});
