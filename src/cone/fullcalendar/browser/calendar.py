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


@view_config('calendar', permission='view')
def calendar(model, request):
    """Calendar as traversable view.
    """
    return render_main_template(model, request, 'calendar')
