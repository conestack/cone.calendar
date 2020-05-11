from zope.interface import Attribute
from zope.interface import Interface


class IEvent(Interface):
    start = Attribute('Date as datetime.datetime instance')
    end = Attribute('Date as datetime.datetime instance')


class ICron(Interface):
    effective = Attribute('Date as datetime.datetime instance')
    expires = Attribute('Date as datetime.datetime instance')
    rule = Attribute('Crontab rule as string')
    duration = Attribute('Duration in minutes')
