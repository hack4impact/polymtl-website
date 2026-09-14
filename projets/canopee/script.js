(function () {
  const tabs = document.querySelectorAll('.feature-tabs [role="tab"]');

  function select(index) {
    tabs.forEach(function (tab, i) {
      const on = i === index;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !on;
    });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      select(i);
    });
    tab.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      const next = (i + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      select(next);
      tabs[next].focus();
    });
  });
})();
