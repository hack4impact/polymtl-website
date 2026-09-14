(function () {
  const menus = document.querySelectorAll('.apply-menu');
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');

  function closeAll(except) {
    menus.forEach(function (menu) {
      if (menu !== except) menu.removeAttribute('open');
    });
  }

  function setNav(open) {
    if (!header || !toggle) return;
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      setNav(!header.classList.contains('is-open'));
    });
  }

  document.addEventListener('click', function (event) {
    const menu = event.target.closest('.apply-menu');
    if (event.target.closest('.nav a')) {
      closeAll();
      setNav(false);
      return;
    }
    if (!menu) closeAll();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeAll();
      setNav(false);
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 680) setNav(false);
  });
})();
