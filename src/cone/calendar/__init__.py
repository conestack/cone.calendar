from cone.app import main_hook
from cone.calendar.browser import configure_resources
import logging


logger = logging.getLogger('cone.calendar')


@main_hook
def initialize_calendar(config, global_config, settings):
    # application startup initialization

    # add translation
    config.add_translation_dirs('cone.calendar:locale/')

    # static resources
    configure_resources(settings)

    # scan browser package
    config.scan('cone.calendar.browser')
