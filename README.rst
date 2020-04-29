cone.calendar
=============

This package provides a calendar integration in to cone.app.
It utilizes jQuery Fullcalendar
(https://github.com/fullcalendar/fullcalendar).

Currently, tag 3.1.0 is included. See
(https://github.com/fullcalendar/fullcalendar/releases).


Usage
-----

The calendar widget integration is done via
``cone.calendar.browser.CalendarTile`` which is registered by name ``calendar``.

The basic configuration is done via model properties. For details about the
available configuration options see ``cone.calendar.browser.calendar.CalendarTile``.

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

For a full list of calendar options read ``cone.calendar.browser.CalendarTile``
documentation.

Concrete even data provider must derive from
``cone.calendar.browser.CalendarEvents`` and implement ``events`` function.

The default event data provider is expected as JSON view registered by name
``calendar_events`` for a concrete context.

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

        def events(self, start, end, timezone):
            events = [{
                'id': uuid.uuid4(),
                'title': 'Title',
                'start': datetime(2020, 4, 29, 17, 40),
                'end': datetime(2020, 4, 29, 18, 0),
            }]
            return events

For a full list of event options read ``cone.calendar.browser.CalendarEvents``
documentation.

There may be more than one event data provider for one calendar. Custom providers
are defined on model properties.

.. code-block:: python

    class MyCalendar(BaseNode):

        @property
        def properties(self):
            props = Properties()
            props.calendar_event_sources = [{
                'events': 'event_data_1',
                'color': 'green'
            }, {
                'events': 'event_data_2',
                'color': 'red'
            }]

For a full list of event source options read ``cone.calendar.browser.CalendarTile``
documentation.


TestCoverage
------------

Summary of the test coverage report::

  XXX


Contributors
============

- Robert Niederreiter
- Johannes Raggam


Changes
=======

0.1 (unreleased)
----------------

- Make it work
  [rnix, thet]
