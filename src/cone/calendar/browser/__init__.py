from .calendar import CalendarEvents  # noqa
from .calendar import CalendarTile  # noqa
from cone.app.browser.resources import resources
from cone.app.browser.resources import set_resource_include
from pyramid.static import static_view
import os
import webresource as wr


resources_dir = os.path.join(os.path.dirname(__file__), 'static')


moment_resources = wr.ResourceGroup(
    name='cone.calendar-moment',
    directory=os.path.join(resources_dir, 'moment'),
    path='moment',
    group=resources
)
moment_resources.add(wr.ScriptResource(
    name='moment-js',
    resource='moment.min.js'
))

fullcalendar_resources = wr.ResourceGroup(
    name='cone.calendar-fullcalendar',
    directory=os.path.join(resources_dir, 'fullcalendar'),
    path='fullcalendar',
    group=resources
)
fullcalendar_resources.add(wr.ScriptResource(
    name='fullcalendar-js',
    depends=['moment-js', 'jquery-js'],
    resource='fullcalendar.js',
    compressed='fullcalendar.min.js'
))
fullcalendar_resources.add(wr.StyleResource(
    name='fullcalendar-css',
    resource='fullcalendar.css',
    compressed='fullcalendar.min.css'
))
# XXX: print CSS needs to be delivered dynamically in dedicated print view
# fullcalendar_resources.add(wr.StyleResource(
#     name='fullcalendar-print-css',
#     resource='fullcalendar.print.css',
#     compressed='fullcalendar.print.min.css'
# ))

cone_calendar_resources = wr.ResourceGroup(
    name='cone.calendar-calendar',
    directory=resources_dir,
    path='calendar',
    group=resources
)
cone_calendar_resources.add(wr.ScriptResource(
    name='cone-calendar-js',
    depends='fullcalendar-js',
    resource='calendar.js',
    compressed='calendar.min.js'
))
cone_calendar_resources.add(wr.StyleResource(
    name='cone-calendar-css',
    depends='fullcalendar-css',
    resource='calendar.css'
))


def configure_resources(settings):
    set_resource_include(settings, 'moment-js', 'authenticated')

    set_resource_include(settings, 'fullcalendar-js', 'authenticated')
    set_resource_include(settings, 'fullcalendar-css', 'authenticated')

    set_resource_include(settings, 'cone-calendar-js', 'authenticated')
    set_resource_include(settings, 'cone-calendar-css', 'authenticated')

    locales = settings.get('cone.calendar.locales')
    if not locales:
        return
    locales_directory = os.path.join(resources_dir, 'fullcalendar', 'locale')
    for locale in [loc.strip() for loc in locales.split(',') if loc]:
        locale_name = 'fullcalendar-{}-js'.format(locale)
        fullcalendar_resources.add(wr.ScriptResource(
            name=locale_name,
            depends='fullcalendar-js',
            directory=locales_directory,
            path='fullcalendar/locale',
            resource='{}.js'.format(locale)
        ))
        set_resource_include(settings, locale_name, 'authenticated')
