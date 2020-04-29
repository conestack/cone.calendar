import cone.app
import logging
import os


logger = logging.getLogger('cone.calendar')


# protected CSS
css = cone.app.cfg.css
css.protected.append('calendar-static/fullcalendar/fullcalendar.min.css')
css.protected.append('calendar-static/fullcalendar/fullcalendar.print.css')
css.protected.append('calendar-static/calendar.css')


# protected JS
js = cone.app.cfg.js
js.protected.append('calendar-static/moment/moment.min.js')
js.protected.append('calendar-static/fullcalendar/fullcalendar.min.js')
js.protected.append('calendar-static/calendar.js')


# application startup initialization
def initialize_calendar(config, global_config, local_config):
    # add translation
    config.add_translation_dirs('cone.calendar:locale/')

    # static resources
    config.add_view(
        'cone.calendar.browser.static_resources',
        name='calendar-static'
    )

    # scan browser package
    config.scan('cone.calendar.browser')


cone.app.register_main_hook(initialize_calendar)
