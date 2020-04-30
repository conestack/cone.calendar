from cone.app import cfg
from cone.app import main_hook
from cone.calendar.browser import static_resources
import logging


logger = logging.getLogger('cone.calendar')


@main_hook
def initialize_calendar(config, global_config, settings):
    # application startup initialization

    # protected CSS
    cfg.css.protected.append('calendar-static/fullcalendar/fullcalendar.min.css')
    # XXX: print CSS needs to be delivered dynamically in dedicated print view
    # cfg.css.protected.append('calendar-static/fullcalendar/fullcalendar.print.css')
    cfg.css.protected.append('calendar-static/calendar.css')

    # protected JS
    cfg.js.protected.append('calendar-static/moment/moment.min.js')
    cfg.js.protected.append('calendar-static/fullcalendar/fullcalendar.min.js')

    locales = settings.get('cone.calendar.locales')
    if locales:
        for locale in [loc.strip() for loc in locales.split(',') if loc]:
            locale_js = 'calendar-static/fullcalendar/locale/{}.js'.format(locale)
            cfg.js.protected.append(locale_js)

    cfg.js.protected.append('calendar-static/calendar.js')

    # add translation
    config.add_translation_dirs('cone.calendar:locale/')

    # static resources
    config.add_view(static_resources, name='calendar-static')

    # scan browser package
    config.scan('cone.calendar.browser')
