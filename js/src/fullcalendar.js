// biome-ignore-all assist/source/organizeImports: plugins inject their CSS on import, theme last
import { Calendar } from '@fullcalendar/core';
import localesAll from '@fullcalendar/core/locales-all';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';

export {
    bootstrap5Plugin,
    Calendar,
    dayGridPlugin,
    interactionPlugin,
    listPlugin,
    localesAll,
    timeGridPlugin,
};
