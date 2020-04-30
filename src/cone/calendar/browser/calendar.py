from cone.app.browser import render_main_template
from cone.tile import Tile
from cone.tile import tile
from datetime import datetime
from pyramid.i18n import TranslationStringFactory
from pyramid.view import view_config
import json
import logging


logger = logging.getLogger('cone.calendar')
_ = TranslationStringFactory('cone.calendar')


@tile(name='calendar', path='calendar.pt', permission='view')
class CalendarTile(Tile):
    """Tile rendering the fullcalendar widget.

    Reference: https://fullcalendar.io/docs/v3

    Configuration of the calendar is done via ``model.properties`` object.

    Available config options:

    ``calendar_locale``:
        Corresponds to ``locale`` option passed to fullcalendar.

        See https://fullcalendar.io/docs/v3/locale

        Note: Locale files must be preloaded in order to provide the desored
        locales. The available locales are configured in the application ini
        file.

    ``calendar_header``:
        Corresponds to ``header`` option passed to fullcalendar.

        See https://fullcalendar.io/docs/v3/header

    ``calendar_footer``:
        Corresponds to ``footer`` option passed to fullcalendar.

        See https://fullcalendar.io/docs/v3/footer

    ``calendar_first_day``:
        Corresponds to ``firstDay`` option passed to fullcalendar.

        See https://fullcalendar.io/docs/v3/firstDay

    ``calendar_weekends``:
        Corresponds to ``weekends`` option passed to fullcalendar.

        See https://fullcalendar.io/docs/v3/weekends

    ``calendar_week_numbers``:
        Corresponds to ``weekNumbers`` option passed to fullcalendar.

        See https://fullcalendar.io/docs/v3/weekNumbers

    ``calendar_week_numbers_within_days``:
        Corresponds to ``weekNumbersWithinDays`` option passed to fullcalendar.

        See https://fullcalendar.io/docs/v3/weekNumbersWithinDays

    ``calendar_business_hours``:
        Corresponds to ``businessHours`` option passed to fullcalendar.

        See https://fullcalendar.io/docs/v3/businessHours

    ``calendar_event_sources``:
        A list of dictionaries containing event source configurations.

        See https://fullcalendar.io/docs/v3/event-source-object

        As ``events`` attribute, a JSON view name is expected. On the client
        side a callback handler gets created using this view name for fetching
        event data. The base class for implementing JSON event data is
        ``CalendarEvents``.

        If ``calendar_event_sources`` is not defined on model properties,
        ``CalendarTile.default_event_sources`` is used.
    """
    option_mapping = {
        'calendar_locale': 'locale',
        'calendar_header': 'header',
        'calendar_footer': 'footer',
        'calendar_first_day': 'firstDay',
        'calendar_weekends': 'weekends',
        'calendar_week_numbers': 'weekNumbers',
        'calendar_week_numbers_within_days': 'weekNumbersWithinDays',
        'calendar_business_hours': 'businessHours'
    }
    default_event_sources = [{
        'events': 'calendar_events',
        'color': 'red'
    }]

    @property
    def options(self):
        options = {}
        for prop_name, option_name in self.option_mapping.items():
            value = getattr(self.model.properties, prop_name)
            if value is not None:
                options[option_name] = value
        return json.dumps(options, sort_keys=True) if options else None

    @property
    def sources(self):
        sources = self.model.properties.calendar_event_sources
        if not sources:
            sources = self.default_event_sources
        return json.dumps(sources)


@view_config(name='calendar', permission='view')
def calendar(model, request):
    """Traversable view rendering the ``calendar`` tile to content area.
    """
    return render_main_template(model, request, 'calendar')


@view_config(
    name='calendar_events',
    accept='application/json',
    renderer='json',
    permission='view')
class CalendarEvents(object):
    """Abstract JSON event data view for fullcalendar.

    Concrete even data providers must derive from this object and implement
    ``events`` function.
    """

    def __init__(self, model, request):
        self.model = model
        self.request = request

    def parse_date(self, val):
        """Parse datetime from value received from fullcalendar.
        """
        return datetime.utcfromtimestamp(int(val))

    def format_date(self, dt):
        """Format datetime suitable for fullcalendar.
        """
        return dt.isoformat()

    @property
    def range_start(self):
        """Event range start as datetime.
        """
        start = self.request.params.get('start')
        return self.parse_date(start)

    @property
    def range_end(self):
        """Event range end as datetime.
        """
        end = self.request.params.get('end')
        return self.parse_date(end)

    @property
    def timezone(self):
        """Event range timezone.
        """
        return self.request.params.get('timezone')

    def events(self, start, end, timezone):
        """Return events for requested range and timezone.

        Return format:

        [{
            'id': uuid.UUID,
            'title': 'Event Title',
            'start': datetime.datetime,
            'end': datetime.datetime,
            'actions': [{
                'title': 'Edit',
                'icon': 'glyphicons glyphicons-pencil',
                'target': 'https://example.com/path/to/event',
                'overlay': {
                    'action': 'overlayedit',
                    'css': 'overlay-form'
                }
            }, {
                'title': 'Delete',
                'icon': 'glyphicons glyphicons-remove-circle',
                'target': 'https://example.com/path/to/event',
                'confirm': 'Do you really want to delete this event?',
                'action': {
                    'name': 'delete',
                    'selector': 'NONE',
                    'mode': 'NONE'
                }
            }]
        }]

        For a full list of fullcalendar event attributes see
        https://fullcalendar.io/docs/v3/event-object

        The ``actions`` attribute is cone specific and defines a list of actions
        available for the specific event.

        If one action is specified, it gets executed directly when event gets
        clicked.

        If multiple actions are specified, a dropdown menu containing the actions
        as menu items gets rendered.

        Action options:

        ``title``
            The action title as string.

        ``icon``
            Icon CSS class.

        ``target``
            Target on which the action gets executed.

        ``action``
            bdajax action definitions as dict containing:

            {
                'name': 'action_name',
                'selector': '.some_selector',
                'mode': 'replace'
            }

        ``event``
            bdajax event definitions as dict containing:

            {
                'name': 'eventname',
                'selector': '.some_selector'
            }

        ``overlay``
            bdajax overlay definitions as dict containing:

            {
                'action': 'action_name',
                'css': 'overlay CSS class'
            }

        ``confirm``
            Confirmation message as string.
        """
        raise NotImplementedError(
            'Abstract CalendarEvents does not implement ``events``'
        )

    def __call__(self):
        try:
            events = self.events(self.range_start, self.range_end, self.timezone)
            for event in events:
                event['id'] = str(event['id'])
                event['start'] = self.format_date(event['start'])
                event['end'] = self.format_date(event['end'])
            return events
        except Exception as e:
            logger.exception(e)
            return []
