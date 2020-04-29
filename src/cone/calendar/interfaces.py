from zope.interface import Attribute
from zope.interface import Interface


class IScheduled(Interface):
    start = Attribute('Date as datetime.datetime instance')
    end = Attribute('Date as datetime.datetime instance')


class IRecurring(Interface):
    effective = Attribute('Date as datetime.datetime instance')
    expires = Attribute('Date as datetime.datetime instance')
    cron_rule = Attribute('Crontab rule as string')
    duration = Attribute('Duration in minutes')
