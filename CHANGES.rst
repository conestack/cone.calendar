Changes
=======

2.0.2 (unreleased)
------------------

- Nothing changed yet.


2.0.1 (2026-10-31)
------------------

- Fix the calendar context menu being cut off at the bottom and staying in
  place while the calendar scrolled beneath it. The menu is rendered beside
  the calendar instead of in ``body`` and scrolls along with it, so it stays
  at the date it was opened for. It opens below and right of the click
  position if it fits into the visible part of the page - the viewport cut by
  the scrolling ancestors of the calendar, the content area of cone.app - else
  above or left of it, else as far inside as its size allows. The wrapper and
  its overlay are gone: the overlay caught the wheel events. A click or right
  click outside closes the menu.
  [rnix]

- Add ``disabled``, ``tooltip`` and ``cssclass`` to calendar actions, and
  ``Calendar.prepare_actions``, which prepares the targets of actions for a
  menu opened by the caller. ``Calendar.add_menu_item`` takes the menu and the
  action only.
  [rnix]

- Fix the calendar context menu closing on a click on its padding. Closing the
  menu by an item click, a click outside of it, opening another menu or
  destroying the calendar unregisters the outside click listener now.
  [rnix]

- Fix HTML injection via ``icon`` and ``title`` of calendar context menu
  actions. The icon is set as CSS class, the title as text.
  [rnix]

- Fix the outside click handler of the calendar context menu treating clicks
  inside the menu as outside clicks. The menu was compared as jQuery object
  with the DOM nodes of the event path.
  [rnix]

- Extend the JS tests to 100 % coverage, all modules including bundles are
  loaded by the tests now.
  [rnix]

- Lint and format the JS code with biome. ``make check`` runs ``biome check``,
  ``make format`` runs ``biome check --write`` (see ``include.mk``). Behavior
  unchanged.
  [rnix]

- JS tooling: Commit ``pnpm-lock.yaml``. Upgrade ``@web/test-runner`` to 1.0
  and run the JS tests headless in Chromium via Playwright, installed in the JS
  CI workflow. Pin patched versions of vulnerable transitive dependencies via
  ``pnpm.overrides``.
  [rnix]

- Replace the deprecated ``datetime.utcfromtimestamp``.
  [rnix]

- Sort the imports with ruff (one per line, ``from`` imports first, no
  sections) and format the code with ``ruff format`` (90 characters per line,
  single quotes).
  [rnix]

- Add import sorting (``I`` rules) and the formatter settings to the ruff
  configuration in ``pyproject.toml``.
  [rnix]


2.0.0 (2026-10-24)
------------------

- Add optional ``CalendarTile.calendar_title``, rendered as card header above
  the calendar. For a calendar shown on several kinds of nodes, where what it
  shows depends on the node. ``None`` by default, the markup is unchanged then.
  [rnix]

- Modernise the code ruff flags as outdated: ``class X(object)``. Remove
  unused import. Behaviour unchanged. ``super(Class, self)`` is kept, see
  ``cone.app``.
  [rnix]

- Add ``qa.ruff`` domain to Makefile and pin the ruff rule selection in
  ``pyproject.toml``, ``make check`` runs ``ruff check``.
  [rnix]

- Bootstrap 5 Styles.


1.1.1 (2026-04-28)
------------------

- Fix span tag receiving icon class in calendar contextmenu.
  [lenadax]


1.1.0 (2026-02-03)
------------------

- Refactor package layout to use ``pyproject.toml`` and implicit namespace packages.
  [rnix]

- Setup Makefile.
  [lenadax]

- Run tests with pytest.
  [lenadax]


1.0a1 (2023-05-15)
------------------

- Use ``webresource`` for resource registration.
  [rnix]


0.4 (2025-10-25)
----------------

- Pin upper versions of dependencies.
  [rnix]


0.3 (2022-10-06)
----------------

- Modernize JavaScript.
  [rnix]


0.2 (2020-07-09)
----------------

- Add ``show_contextmenu`` to ``CalendarTile``. Defaults to ``False``.
  [rnix]

- Also check for action length when handling actions dropdown in JS.
  [rnix]


0.1 (2020-05-30)
----------------

- Initial.
  [rnix, thet]
