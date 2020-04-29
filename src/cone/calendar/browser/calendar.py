from cone.app.browser import render_main_template
from cone.app.browser.utils import make_url
from cone.tile import Tile
from cone.tile import tile
from pyramid.i18n import TranslationStringFactory
from pyramid.i18n import get_localizer
from pyramid.view import view_config

import datetime
import json


_ = TranslationStringFactory('cone.calendar')


@tile('calendar', 'calendar.pt', permission='view')
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
def calendar(model, request):
    """Calendar as traversable view.
    """
    return render_main_template(model, request, 'calendar')


@view_config(
    name='fc_get_events',
    accept='application/json',
    renderer='json',
    permission='view')
class FullCalendarGetEvents(object):

    def __init__(self, model, request):
        self.model = model
        self.request = request

    def _get_date(self, name):
        date = self.request.params.get(name, None)
        date = datetime.datetime.utcfromtimestamp(int(date)) if date else None

    @property
    def range_start(self):
        return self._get_date('start')

    @property
    def range_end(self):
        return self._get_date('end')

    @property
    def timezone(self):
        return self.request.params.get('timezone', None)

    def __call__(self):

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

        return {'events': events}
