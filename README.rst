.. image:: https://img.shields.io/pypi/v/cone.calendar.svg
    :target: https://pypi.python.org/pypi/cone.calendar
    :alt: Latest PyPI version

.. image:: https://img.shields.io/pypi/dm/cone.calendar.svg
    :target: https://pypi.python.org/pypi/cone.calendar
    :alt: Number of PyPI downloads

.. image:: https://travis-ci.org/bluedynamics/cone.calendar.svg?branch=master
    :target: https://travis-ci.org/bluedynamics/cone.calendar

.. image:: https://coveralls.io/repos/github/bluedynamics/cone.calendar/badge.svg?branch=master
    :target: https://coveralls.io/github/bluedynamics/cone.calendar?branch=master


This package provides a calendar integration in to cone.app.
It utilizes jQuery Fullcalendar
(https://github.com/fullcalendar/fullcalendar).

Currently, tag 3.1.0 is included. See
(https://github.com/fullcalendar/fullcalendar/releases).


Calendar Widget
---------------

The calendar widget integration is done via
``cone.calendar.browser.CalendarTile`` which is registered by name ``calendar``.

The overall calendar configuration is done via model properties.

.. code-block:: python

    from cone.app.model import BaseNode
    from cone.app.model import Properties

    class MyCalendar(BaseNode):

        @property
        def properties(self):
            props = Properties()
            props.default_content_tile = 'calendar'
            props.calendar_header = {
                'left': 'month,agendaWeek,agendaDay',
                'center': 'title',
                'right': 'today prev,next'
            }
            return props

For a full list of available calendar options read
``cone.calendar.browser.CalendarTile`` documentation.


Calendar Events
---------------

In order to display events in the calendar, one or more event data sources
must be provided.

Concrete event data implementation must derive from
``cone.calendar.browser.CalendarEvents`` and provide ``events`` function.

The default event data source is expected as JSON view registered by name
``calendar_events`` for a dedictaed model context.

.. code-block:: python

    from cone.calendar.browser import CalendarEvents
    from datetime import datetime
    from pyramid.view import view_config
    import uuid

    @view_config(
        name='calendar_events',
        context=MyCalendar,
        accept='application/json',
        renderer='json',
        permission='view')
    class MyEvents(CalendarEvents):

        def events(self, start, end):
            events = [{
                'id': uuid.uuid4(),
                'title': 'Title',
                'start': datetime(2020, 4, 29, 17, 40),
                'end': datetime(2020, 4, 29, 18, 0),
            }]
            return events

For a full list of available event options read
``cone.calendar.browser.CalendarEvents`` documentation.

Multiple event data sources are defined via model properties.

.. code-block:: python

    class MyCalendar(BaseNode):

        @property
        def properties(self):
            props = Properties()
            props.calendar_sources = [{
                'events': 'event_data_1',
                'color': 'green'
            }, {
                'events': 'event_data_2',
                'color': 'red'
            }]
            return props

For a full list of available event source options read
``cone.calendar.browser.CalendarTile`` documentation.


Locales
-------

The calendar locale can be set via ``calendar_locale`` on model properties.

.. code-block:: python

    class MyCalendar(BaseNode):

        @property
        def properties(self):
            props = Properties()
            props.calendar_locale = 'de'
            return props

Default calendar locale is ``en``. The desired locales must be delivered to
the browser in order to work correctly. Locales to deliver are defined in the
application ini config as comma separated list of locale names.

.. code-block:: ini

    cone.calendar.locales = de,fr

For a complete list of available locales see ``browser/static/fullcalendar/locales``
folder of this package.


Contributors
============

- Robert Niederreiter
- Johannes Raggam
