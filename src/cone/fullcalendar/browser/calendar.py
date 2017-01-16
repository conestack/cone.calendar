from cone.app.browser import render_main_template
from cone.app.browser.utils import make_url
from cone.tile import Tile
from cone.tile import tile
from pyramid.i18n import TranslationStringFactory
from pyramid.i18n import get_localizer
from pyramid.view import view_config
import json


_ = TranslationStringFactory('cone.fullcalendar')


@tile('calendar', 'calendar.pt', permission='view')
class FullCalendarTile(Tile):
    options_names = [
        'calendar_header',
        'calendar_footer',
        'calendar_first_day'
    ]

    @property
    def options(self):
        options = {}
        for name in self.options_names:
            value = getattr(self.model.properties, name)
            if value is not None:
                options[name] = value
        return json.dumps(options) if options else None


@view_config('calendar', permission='view')
def calendar(model, request):
    """Calendar as traversable view.
    """
    return render_main_template(model, request, 'calendar')
