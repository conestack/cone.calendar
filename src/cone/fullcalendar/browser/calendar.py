from cone.app.browser import render_main_template
from cone.app.browser.utils import make_url
from cone.tile import Tile
from cone.tile import tile
from pyramid.i18n import TranslationStringFactory
from pyramid.i18n import get_localizer
from pyramid.view import view_config


_ = TranslationStringFactory('cone.fullcalendar')


@tile('calendar', 'calendar.pt', permission='view')
class FullCalendarTile(Tile):
    """
    """
