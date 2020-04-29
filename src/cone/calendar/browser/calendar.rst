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
    u'...<div id="calendar"\n       
    data-calendar_config=\'{"get_datatype": "json", 
    "get_url": "@@fc_get_events"}\'></div>...'

Test basic calendar settings::

    >>> class CalendarNode(BaseNode):
    ...     @property
    ...     def properties(self):
    ...         if not hasattr(self, 'props'):
    ...             self.props = Properties()
    ...         return self.props

    >>> model = CalendarNode()
    >>> props = model.properties

Test calendar options property::

    >>> props.calendar_header = {
    ...     'left': 'title',
    ...     'center': '',
    ...     'right': 'today prev,next'
    ... }
    >>> props.calendar_footer = {
    ...     'left': 'title',
    ...     'center': '',
    ...     'right': 'today prev,next'
    ... }
    >>> props.calendar_first_day = 2
    >>> props.calendar_weekends = False
    >>> props.calendar_week_numbers = True
    >>> props.calendar_week_numbers_within_days = True
    >>> props.calendar_business_hours = [{
    ...     'dow': [1, 2, 3],
    ...     'start': '08:00',
    ...     'end': '18:00'
    ... }, {
    ...     'dow': [4, 5],
    ...     'start': '10:00',
    ...     'end': '16:00'
    ... }]

    >>> render_tile(model, request, 'calendar')
    u'...<div id="calendar"\n       
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

    >>> props.calendar_business_hours = None
    >>> props.calendar_first_day = None
    >>> props.calendar_footer = None
    >>> props.calendar_header = None
    >>> props.calendar_week_numbers = None
    >>> props.calendar_week_numbers_within_days = None
    >>> props.calendar_weekends = None

Cleanup::

    >>> layer.logout()
