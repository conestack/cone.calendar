from .calendar import CalendarEvents  # noqa
from .calendar import CalendarTile  # noqa
import os
import webresource as wr


resources_dir = os.path.join(os.path.dirname(__file__), 'static')

##############################################################################
# Default
##############################################################################

# moment js
moment_resources = wr.ResourceGroup(
    name='cone.calendar-moment',
    directory=os.path.join(resources_dir, 'fullcalendar', 'default'),
    path='fullcalendar/default'
)
moment_resources.add(wr.ScriptResource(
    name='moment-js',
    directory=os.path.join(resources_dir, 'fullcalendar', 'default', 'moment'),
    path='fullcalendar/default/moment',
    resource='moment.min.js'
))

# fullcalendar
fullcalendar_resources = wr.ResourceGroup(
    name='cone.calendar-fullcalendar',
    directory=os.path.join(resources_dir, 'fullcalendar'),
    path='fullcalendar'
)
fullcalendar_resources.add(wr.ScriptResource(
    name='fullcalendar-js',
    depends=['moment-js', 'jquery-js'],
    directory=os.path.join(resources_dir, 'fullcalendar', 'default'),
    path='fullcalendar/default',
    resource='fullcalendar.js',
    compressed='fullcalendar.min.js'
))
fullcalendar_resources.add(wr.StyleResource(
    name='fullcalendar-css',
    directory=os.path.join(resources_dir, 'fullcalendar', 'default'),
    path='fullcalendar/default',
    resource='fullcalendar.css',
    compressed='fullcalendar.min.css'
))
# XXX: print CSS needs to be delivered dynamically in dedicated print view
# fullcalendar_resources.add(wr.StyleResource(
#     name='fullcalendar-print-css',
#     resource='fullcalendar.print.css',
#     compressed='fullcalendar.print.min.css'
# ))

# cone calendar
cone_calendar_resources = wr.ResourceGroup(
    name='cone.calendar-calendar',
    directory=os.path.join(resources_dir, 'calendar'),
    path='calendar'
)
cone_calendar_resources.add(wr.ScriptResource(
    name='cone-calendar-js',
    depends='fullcalendar-js',
    directory=os.path.join(resources_dir, 'calendar', 'default'),
    path='calendar/default',
    resource='cone.calendar.js',
    compressed='cone.calendar.min.js'
))
cone_calendar_resources.add(wr.StyleResource(
    name='cone-calendar-css',
    depends='fullcalendar-css',
    directory=os.path.join(resources_dir, 'calendar', 'default'),
    path='calendar/default',
    resource='cone.calendar.css'
))


##############################################################################
# Bootstrap 5
##############################################################################

# fullcalendar
bootstrap5_fullcalendar_resources = wr.ResourceGroup(
    name='cone.calendar-fullcalendar-bootstrap5',
    directory=os.path.join(resources_dir, 'fullcalendar'),
    path='fullcalendar'
)
bootstrap5_fullcalendar_resources.add(wr.ScriptResource(
    name='fullcalendar-bootstrap5-js',
    directory=os.path.join(resources_dir, 'fullcalendar', 'bootstrap5'),
    # depends='moment-js',
    path='fullcalendar/bootstrap5',
    resource='fullcalendar.js',
    # compressed='fullcalendar.min.js'
))

# cone calendar
bootstrap5_cone_calendar_resources = wr.ResourceGroup(
    name='cone.calendar-calendar-bootstrap5',
    directory=os.path.join(resources_dir, 'calendar'),
    path='calendar'
)
bootstrap5_cone_calendar_resources.add(wr.ScriptResource(
    name='cone-calendar-bootstrap5-js',
    directory=os.path.join(resources_dir, 'calendar', 'bootstrap5'),
    path='calendar/bootstrap5',
    depends=['fullcalendar-bootstrap5-js', 'jquery-js'],
    resource='cone.calendar.js',
    compressed='cone.calendar.min.js'
))


def configure_resources(config, settings):
    # Default

    # config.register_resource(moment_resources)
    # config.set_resource_include('moment-js', 'authenticated')

    # config.register_resource(fullcalendar_resources)
    # config.set_resource_include('fullcalendar-js', 'authenticated')
    # config.set_resource_include('fullcalendar-css', 'authenticated')

    # config.register_resource(cone_calendar_resources)
    # config.set_resource_include('cone-calendar-js', 'authenticated')
    # config.set_resource_include('cone-calendar-css', 'authenticated')

    # locales = settings.get('cone.calendar.locales')
    # if not locales:
    #     return
    # locales_directory = os.path.join(resources_dir, 'fullcalendar', 'default', 'locale')
    # for locale in [loc.strip() for loc in locales.split(',') if loc]:
    #     locale_name = 'fullcalendar-{}-js'.format(locale)
    #     fullcalendar_resources.add(wr.ScriptResource(
    #         name=locale_name,
    #         depends='fullcalendar-js',
    #         directory=locales_directory,
    #         path='fullcalendar/default/locale',
    #         resource='{}.js'.format(locale)
    #     ))
    #     config.set_resource_include(locale_name, 'authenticated')

    # Bootstrap5

    config.register_resource(bootstrap5_fullcalendar_resources)
    # config.set_resource_include('fullcalendar-js', 'authenticated')
    # config.set_resource_include('fullcalendar-css', 'authenticated')

    config.register_resource(bootstrap5_cone_calendar_resources)
    # config.set_resource_include('cone-calendar-js', 'authenticated')
    # config.set_resource_include('cone-calendar-css', 'authenticated')

    # locales = settings.get('cone.calendar.locales')
    # if not locales:
    #     return
    # locales_directory = os.path.join(resources_dir, 'fullcalendar', 'bootstrap5',
    #                                  'core', 'locales')
    # for locale in [loc.strip() for loc in locales.split(',') if loc]:
    #     locale_name = 'fullcalendar-{}-js'.format(locale)
    #     bootstrap5_fullcalendar_resources.add(wr.ScriptResource(
    #         name=locale_name,
    #         depends='fullcalendar-bootstrap5-js',
    #         directory=locales_directory,
    #         path='fullcalendar/bootstrap5/core/locales',
    #         resource='{}.global.js'.format(locale),
    #         compressed='{}.global.min.js'.format(locale)
    #     ))
        # config.set_resource_include(locale_name, 'authenticated')
