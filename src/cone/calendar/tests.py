from cone.app import testing
from cone.app.model import BaseNode
from cone.app.model import Properties
from cone.calendar.browser import CalendarTile
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from node.utils import instance_property
from pyramid.httpexceptions import HTTPForbidden
import json
import sys
import unittest


class CalendarLayer(testing.Security):

    def make_app(self, **kw):
        super(CalendarLayer, self).make_app(**{
            'cone.plugins': 'cone.calendar'
        })


class CalendarNode(BaseNode):

    @instance_property
    def properties(self):
        return Properties()


class TestCalendarTile(TileTestCase):
    layer = CalendarLayer()

    def test_calendar_rendering(self):
        model = CalendarNode(name='calendar')
        request = self.layer.new_request()

        with self.assertRaises(HTTPForbidden):
            render_tile(model, request, 'calendar')

        with self.layer.authenticated('admin'):
            rendered = render_tile(model, request, 'calendar')
        self.checkOutput("""
        <div id="calendar"
             data-calendar_target='http://example.com/calendar'
             data-calendar_options='{"locale": "en"}'
             data-calendar_sources='[{"events": "calendar_events"}]'
             data-calendar_actions='[]'></div>
        """, rendered)

    def test_calendar_target(self):
        root = BaseNode(name='container')
        model = CalendarNode(name='cal', parent=root)
        calendar = CalendarTile()
        calendar.model = model
        calendar.request = self.layer.new_request()
        self.assertEqual(calendar.target, 'http://example.com/container/cal')

    def test_calendar_options(self):
        calendar = CalendarTile()
        calendar.model = CalendarNode(name='calendar')
        calendar.request = self.layer.new_request()

        self.assertEqual(calendar.option_mapping, {
            'calendar_locale': 'locale',
            'calendar_header': 'header',
            'calendar_footer': 'footer',
            'calendar_first_day': 'firstDay',
            'calendar_weekends': 'weekends',
            'calendar_week_numbers': 'weekNumbers',
            'calendar_week_numbers_within_days': 'weekNumbersWithinDays',
            'calendar_business_hours': 'businessHours'
        })
        self.assertEqual(calendar.default_options, {
            'calendar_locale': 'en'
        })
        self.assertTrue(isinstance(calendar.options, str))
        self.assertEqual(json.loads(calendar.options), {'locale': 'en'})

        properties = calendar.model.properties
        properties.calendar_locale = 'de'
        properties.calendar_header = {
            'left': 'title',
            'center': 'today',
            'right': 'prev,next'
        }
        properties.calendar_footer = {
            'left': 'title',
            'center': 'today',
            'right': 'prev,next'
        }
        properties.calendar_first_day = 2
        properties.calendar_weekends = False
        properties.calendar_week_numbers = True
        properties.calendar_week_numbers_within_days = True
        properties.calendar_business_hours = [{
            'dow': [1, 2, 3, 4, 5],
            'start': '08:00',
            'end': '18:00'
        }]
        self.assertEqual(json.loads(calendar.options), {
            'locale': 'de',
            'header': {
                'left': 'title',
                'center': 'today',
                'right': 'prev,next'
            },
            'footer': {
                'left': 'title',
                'center': 'today',
                'right': 'prev,next'
            },
            'firstDay': 2,
            'weekends': False,
            'weekNumbers': True,
            'weekNumbersWithinDays': True,
            'businessHours': [{
                'dow': [1, 2, 3, 4, 5],
                'start': '08:00',
                'end': '18:00'
            }]
        })

    def test_calendar_sources(self):
        calendar = CalendarTile()
        calendar.model = CalendarNode(name='calendar')
        calendar.request = self.layer.new_request()

        self.assertEqual(calendar.default_sources, [
            {'events': 'calendar_events'}
        ])
        self.assertTrue(isinstance(calendar.sources, str))
        self.assertEqual(json.loads(calendar.sources), [{
            'events': 'calendar_events'
        }])

        properties = calendar.model.properties
        properties.calendar_sources = [{
            'events': 'calendar_events_1'
        }, {
            'events': 'calendar_events_2'
        }]
        self.assertEqual(json.loads(calendar.sources), [{
            'events': 'calendar_events_1'
        }, {
            'events': 'calendar_events_2'
        }])

    def test_calendar_actions(self):
        calendar = CalendarTile()
        calendar.model = CalendarNode(name='calendar')
        calendar.request = self.layer.new_request()

        self.assertEqual(calendar.default_actions, [])
        self.assertTrue(isinstance(calendar.actions, str))
        self.assertEqual(json.loads(calendar.actions), [])

        calendar.default_actions = [{
            'title': 'Default Action',
        }]
        self.assertEqual(json.loads(calendar.actions), [{
            'title': 'Default Action',
        }])

        properties = calendar.model.properties
        properties.calendar_actions = [{
            'title': 'Context Action',
        }]
        self.assertEqual(json.loads(calendar.actions), [{
            'title': 'Context Action',
        }])


def run_tests():
    from cone.calendar import tests
    from zope.testrunner.runner import Runner

    suite = unittest.TestSuite()
    suite.addTest(unittest.findTestCases(tests))

    runner = Runner(found_suites=[suite])
    runner.run()
    sys.exit(int(runner.failed))


if __name__ == '__main__':
    run_tests()
