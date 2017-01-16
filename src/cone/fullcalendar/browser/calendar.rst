Calendar browser tests
======================

Prepare environment::

    >>> from cone.app.model import BaseNode
    >>> from cone.app.model import Properties
    >>> from cone.tile import render_tile

Test ``calendar`` tile rendering::

    >>> layer.login('admin')
    >>> request = layer.new_request()
    >>> model = BaseNode()
    >>> render_tile(model, request, 'calendar')
    u'\n\n  <div id="calendar"></div>\n\n\n'

Test basic calendar settings::

    >>> class CalendarNode(BaseNode):
    ...     @property
    ...     def properties(self):
    ...         if not hasattr(self, 'props'):
    ...             self.props = Properties()
    ...         return self.props

    >>> model = CalendarNode()
    >>> props = model.properties

Test ``calendar_header`` property::

    >>> props.calendar_header = {
    ...     'left': 'title',
    ...     'center': '',
    ...     'right': 'today prev,next'
    ... }
    >>> render_tile(model, request, 'calendar')
    u'...<div id="calendar"\n
    data-calendar_options=\'{"calendar_header": {"right": "today prev,next",
    "center": "", "left": "title"}}\'></div>...'

    >>> props.calendar_header = None

test ``calendar_footer`` property::

    >>> props.calendar_footer = {
    ...     'left': 'title',
    ...     'center': '',
    ...     'right': 'today prev,next'
    ... }
    >>> render_tile(model, request, 'calendar')
    u'...<div id="calendar"\n
    data-calendar_options=\'{"calendar_footer": {"right": "today prev,next",
    "center": "", "left": "title"}}\'></div>...'

    >>> props.calendar_footer = None

test ``calendar_first_day`` property::

    >>> props.calendar_first_day = 2
    >>> render_tile(model, request, 'calendar')
    u'...<div id="calendar"\n
    data-calendar_options=\'{"calendar_first_day": 2}\'></div>...'

    >>> props.calendar_first_day = None

Cleanup::

    >>> layer.logout()
