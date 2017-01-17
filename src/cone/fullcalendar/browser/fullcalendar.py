from cone.app.browser import render_main_template
from cone.app.browser.utils import make_url
from cone.tile import Tile
from cone.tile import tile
from pyramid.i18n import TranslationStringFactory
from pyramid.i18n import get_localizer
from pyramid.view import view_config

import datetime
import json


_ = TranslationStringFactory('cone.fullcalendar')


@tile('calendar', 'fullcalendar.pt', permission='view')
class FullCalendarTile(Tile):

    option_mapping = {
        'calendar_header': 'header',
        'calendar_footer': 'footer',
        'calendar_first_day': 'firstDay',
        'calendar_weekends': 'weekends',
        'calendar_week_numbers': 'weekNumbers',
        'calendar_week_numbers_within_days': 'weekNumbersWithinDays',
        'calendar_business_hours': 'businessHours',
    }

    @property
    def options(self):
        options = {}
        for prop_name, option_name in self.option_mapping.items():
            value = getattr(self.model.properties, prop_name)
            if value is not None:
                options[option_name] = value
        return json.dumps(options, sort_keys=True) if options else None

    @property
    def config(self):
        return json.dumps({
            'get_url': '@@fc_get_events',
            'get_datatype': 'json'
        }, sort_keys=True)


@view_config('calendar', permission='view')
def fullcalendar(model, request):
    """Calendar as traversable view.
    """
    return render_main_template(model, request, 'calendar')


@view_config(
    name='fc_get_events',
    accept='application/json',
    renderer='json',
    permission='view')
def fc_get_events(model, request):
    """Return events for fullcalendar.

    {
        'files': [{
            'pic.jpg': True
        }]
    }
    """

    start = request.params.get('start', None)
    end = request.params.get('end', None)
    timezone = request.params.get('timezone', None)

    start = datetime.datetime.utcfromtimestamp(int(start)) if start else None
    end = datetime.datetime.utcfromtimestamp(int(end)) if end else None

    print('start: ' + start.isoformat() if start else '')
    print('end: ' + end.isoformat() if end else '')
    print('timezone: ' + timezone or '')

    events = [
        {
            'title': 'blah',
            'start': datetime.datetime.utcnow().isoformat(),
            'end': (datetime.datetime.utcnow() + datetime.timedelta(1/24.)).isoformat()  # noqa
        },
        {
            'title': 'bluh',
            'start': (datetime.datetime.utcnow() + datetime.timedelta(1)).isoformat(),  # noqa
            'end': (datetime.datetime.utcnow() + datetime.timedelta(1) + datetime.timedelta(1/24.)).isoformat()  # noqa
        }
    ]

    print events
    return {'events': events}
