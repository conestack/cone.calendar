from .calendar import CalendarEvents  # noqa
from .calendar import CalendarTile  # noqa
import os
import webresource as wr


resources_dir = os.path.join(os.path.dirname(__file__), 'static')

##############################################################################
# Bootstrap 5
##############################################################################

# fullcalendar
fullcalendar_resources = wr.ResourceGroup(
    name='cone.calendar-fullcalendar',
    directory=os.path.join(resources_dir, 'fullcalendar'),
    path='fullcalendar'
)
fullcalendar_resources.add(wr.ScriptResource(
    name='fullcalendar-js',
    resource='fullcalendar.js',
    compressed='fullcalendar.min.js'
))

# cone calendar
cone_calendar_resources = wr.ResourceGroup(
    name='cone.calendar-calendar',
    directory=os.path.join(resources_dir, 'calendar'),
    path='calendar'
)
cone_calendar_resources.add(wr.ScriptResource(
    name='cone-calendar-js',
    depends=['fullcalendar-js', 'jquery-js'],
    resource='cone.calendar.js',
    compressed='cone.calendar.min.js'
))
cone_calendar_resources.add(wr.StyleResource(
    name='cone-calendar-css',
    resource='cone.calendar.css'
))

# XXX: print CSS needs to be delivered dynamically in dedicated print view
# fullcalendar_resources.add(wr.StyleResource(
#     name='fullcalendar-print-css',
#     resource='fullcalendar.print.css',
#     compressed='fullcalendar.print.min.css'
# ))


def configure_resources(config, settings):
    # Bootstrap5

    config.register_resource(fullcalendar_resources)
    config.set_resource_include('fullcalendar-js', 'authenticated')
    config.set_resource_include('fullcalendar-css', 'authenticated')

    config.register_resource(cone_calendar_resources)
    config.set_resource_include('cone-calendar-js', 'authenticated')
    config.set_resource_include('cone-calendar-css', 'authenticated')

    # locales = settings.get('cone.calendar.locales')
    # if not locales:
    #     return
    # locales_directory = os.path.join(resources_dir, 'fullcalendar', 'bootstrap5',
    #                                  'core', 'locales')
    # for locale in [loc.strip() for loc in locales.split(',') if loc]:
    #     locale_name = 'fullcalendar-{}-js'.format(locale)
    #     fullcalendar_resources.add(wr.ScriptResource(
    #         name=locale_name,
    #         depends='fullcalendar-bootstrap5-js',
    #         directory=locales_directory,
    #         path='fullcalendar/bootstrap5/core/locales',
    #         resource='{}.global.js'.format(locale),
    #         compressed='{}.global.min.js'.format(locale)
    #     ))
        # config.set_resource_include(locale_name, 'authenticated')
