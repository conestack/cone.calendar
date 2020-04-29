from cone.app import testing
from cone.app.model import BaseNode
from cone.app.model import Properties
from cone.tile import render_tile
from cone.tile.tests import TileTestCase


class CalendarLayer(testing.Security):

    def make_app(self, **kw):
        super(CalendarLayer, self).make_app(**{
            'cone.plugins': 'cone.calendar'
        })


class CalendarNode(BaseNode):

    @property
    def properties(self):
        if not hasattr(self, 'props'):
            self.props = Properties()
        return self.props


class TestCalendar(TileTestCase):
    layer = CalendarLayer()

    def test_calendar_tile_rendering(self):
        with self.layer.authenticated('admin'):
            request = self.layer.new_request()
            model = BaseNode()
            rendered = render_tile(model, request, 'calendar')
        self.check_output("""
        ...<div id="calendar"\n
        data-calendar_config=\'{"get_datatype": "json",
        "get_url": "@@fc_get_events"}\'></div>...
        """, rendered)

    def test_calendar_options(self):
        model = CalendarNode()
        props = model.properties

        props.calendar_header = {
            'left': 'title',
            'center': '',
            'right': 'today prev,next'
        }
        props.calendar_footer = {
            'left': 'title',
            'center': '',
            'right': 'today prev,next'
        }
        props.calendar_first_day = 2
        props.calendar_weekends = False
        props.calendar_week_numbers = True
        props.calendar_week_numbers_within_days = True
        props.calendar_business_hours = [{
            'dow': [1, 2, 3],
            'start': '08:00',
            'end': '18:00'
        }, {
            'dow': [4, 5],
            'start': '10:00',
            'end': '16:00'
        }]

        with self.layer.authenticated('admin'):
            request = self.layer.new_request()
            rendered = render_tile(model, request, 'calendar')

        self.check_output("""
        ...<div id="calendar"\n
        data-calendar_options=\'{"businessHours":
        [{"dow": [1, 2, 3], "end": "18:00", "start": "08:00"},
        {"dow": [4, 5], "end": "16:00", "start": "10:00"}],
        "firstDay": 2,
        "footer": {"center": "", "left": "title", "right": "today prev,next"},
        "header": {"center": "", "left": "title", "right": "today prev,next"},
        "weekNumbers": true,
        "weekNumbersWithinDays": true,
        "weekends": false}\'...
        data-calendar_config=\'{"get_datatype": "json",
        "get_url": "@@fc_get_events"}\'></div>...'
        """, rendered)

        props.calendar_header = None
        props.calendar_footer = None
        props.calendar_first_day = None
        props.calendar_weekends = None
        props.calendar_week_numbers = None
        props.calendar_week_numbers_within_days = None
        props.calendar_business_hours = None

        with self.layer.authenticated('admin'):
            request = self.layer.new_request()
            rendered = render_tile(model, request, 'calendar')

        self.check_output("""
        """, rendered)
