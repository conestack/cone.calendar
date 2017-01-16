import cone.app
import logging
import os


logger = logging.getLogger('cone.fullcalendar')


# protected CSS
css = cone.app.cfg.css
css.protected.append('calendar-static/fullcalendar.min.css')
css.protected.append('calendar-static/fullcalendar.print.css')
css.protected.append('calendar-static/calendar.css')


# protected JS
js = cone.app.cfg.js
js.protected.append('calendar-static/fullcalendar.min.js')
js.protected.append('calendar-static/calendar.js')


# application startup initialization
def initialize_fullcalendar(config, global_config, local_config):
    # add translation
    config.add_translation_dirs('cone.fullcalendar:locale/')

    # static resources
    config.add_view(
        'cone.fullcalendar.browser.static_resources',
        name='calendar-static'
    )

    # scan browser package
    config.scan('cone.fullcalendar.browser')


cone.app.register_main_hook(initialize_fullcalendar)
