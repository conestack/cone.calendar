from cone.app import main_hook
from cone.calendar.browser import configure_resources
import logging


logger = logging.getLogger('cone.calendar')


@main_hook
def initialize_calendar(config, global_config, settings):
    # application startup initialization

    # static resources
    configure_resources(config, settings)

    # add translation
    config.add_translation_dirs('cone.calendar:locale/')

    # scan browser package
    config.scan('cone.calendar.browser')
