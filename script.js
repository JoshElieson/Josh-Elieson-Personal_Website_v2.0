document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const btnTheme = document.querySelector('.btn-theme');
  const btnHamburger = document.querySelector('.nav__hamburger');
  const headerLogo =
    document.querySelector('.header-logo') || document.querySelector('.header > a[href="#top"]');
  const themeVeil = document.getElementById('theme-veil');

  const CONFETTI_COLORS = ['#2e8b57', '#3fa46a', '#6ee7b7', '#6d28d9', '#a78bfa', '#c4b5fd'];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const shootConfetti = (originX, originY) => {
    const pieceCount = prefersReducedMotion ? 14 : 24;
    const duration = prefersReducedMotion ? 750 : 1200;

    for (let i = 0; i < pieceCount; i += 1) {
      const isCircle = Math.random() > 0.4;
      const size = 6 + Math.random() * 6;
      const angle = (Math.PI * 2 * i) / pieceCount + (Math.random() - 0.5) * 0.85;
      const spread = 48 + Math.random() * 52;
      const dx = Math.cos(angle) * spread;
      const dy = Math.sin(angle) * spread;
      const driftY = 12 + Math.random() * 10;
      const rot = Math.random() * 720 - 360;

      const piece = document.createElement('span');
      piece.className = 'confetti-piece' + (isCircle ? ' confetti-piece--circle' : '');
      piece.style.cssText = [
        `left:${originX}px`,
        `top:${originY}px`,
        `width:${size}px`,
        `height:${isCircle ? size : size * 0.55}px`,
        `background-color:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}`,
      ].join(';');

      document.body.appendChild(piece);

      const burst = piece.animate(
        [
          {
            transform: 'translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(0.25)',
            opacity: 0,
          },
          {
            transform: `translate(-50%, -50%) translate(${dx * 0.4}px, ${dy * 0.4}px) rotate(${rot * 0.12}deg) scale(1.12)`,
            opacity: 1,
            offset: 0.14,
          },
          {
            transform: `translate(-50%, -50%) translate(${dx}px, ${dy + driftY}px) rotate(${rot}deg) scale(0.45)`,
            opacity: 0,
          },
        ],
        {
          duration,
          easing: 'cubic-bezier(0.25, 0.8, 0.35, 1)',
          fill: 'forwards',
          delay: Math.random() * 60,
        }
      );

      burst.onfinish = () => piece.remove();
    }
  };

  const popClickable = (host, motionTarget = host) => {
    if (!motionTarget) return;

    if (prefersReducedMotion) {
      motionTarget.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
        { duration: 280, easing: 'ease-out' }
      );
      return;
    }

    host.classList.remove('is-pop');
    void host.offsetWidth;
    host.classList.add('is-pop');
    window.setTimeout(() => host.classList.remove('is-pop'), 520);
  };

  const onConfettiClick = (event, { host, motionTarget, pop = true } = {}) => {
    shootConfetti(event.clientX, event.clientY);
    if (pop) popClickable(host, motionTarget);
  };

  if (headerLogo) {
    headerLogo.addEventListener('click', (event) => {
      onConfettiClick(event, {
        host: headerLogo,
        motionTarget: headerLogo.querySelector('h3') || headerLogo,
      });
    });
  }

  const aboutName = document.querySelector('.about__name');
  if (aboutName) {
    aboutName.addEventListener('click', (event) => {
      onConfettiClick(event, { pop: false });
    });
  }

  const THEME_VEIL_MS = 420;
  const themeBg = {
    dark: '#090b0f',
    light: '#f6f4ef',
  };

  const setTheme = (theme, { persist = true } = {}) => {
    if (!themeVeil || body.classList.contains('is-theme-switching')) return;

    body.classList.add('is-theme-switching');
    themeVeil.style.backgroundColor = themeBg[theme];

    /* Cover immediately so card/button backgrounds never tween in view */
    themeVeil.classList.add('is-active', 'is-instant');
    body.classList.add('theme-snap');
    body.classList.remove('light', 'dark');
    body.classList.add(theme);
    if (persist) localStorage.setItem('portfolio-theme', theme);

    requestAnimationFrame(() => {
      themeVeil.classList.remove('is-instant');

      requestAnimationFrame(() => {
        themeVeil.classList.remove('is-active');

        window.setTimeout(() => {
          body.classList.remove('theme-snap', 'is-theme-switching');
        }, THEME_VEIL_MS);
      });
    });
  };

  const isLight = () => body.classList.contains('light');

  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      setTheme(isLight() ? 'dark' : 'light');
    });
  }

  const displayList = () => {
    const navUl = document.querySelector('.nav__list');

    if (btnHamburger && btnHamburger.classList.contains('nav__hamburger')) {
      btnHamburger.classList.toggle('active');
      navUl.classList.toggle('display-nav-list');
    }
  };

  if (btnHamburger) {
    btnHamburger.addEventListener('click', displayList);
  }

  const initCursorProximity = () => {
    if (prefersReducedMotion || !window.matchMedia('(pointer: fine)').matches) return;

    const PROXIMITY = 96;
    const targets = [
      ...document.querySelectorAll(
        'main h1, main h2, main h3, main h4, main p, main .about__name, main .project__stack-item, main .link--icon-text:not(.link--muted), main a.link:not(.link--icon), .header-logo h3, .nav__list .link--nav, footer .footer__link'
      ),
    ];

    targets.forEach((el) => el.setAttribute('data-cursor-proximity', ''));

    let mouseX = -9999;
    let mouseY = -9999;
    let ticking = false;

    const distanceToRect = (x, y, rect) => {
      const dx = Math.max(rect.left - x, 0, x - rect.right);
      const dy = Math.max(rect.top - y, 0, y - rect.bottom);
      return Math.hypot(dx, dy);
    };

    const clearProximity = () => {
      targets.forEach((el) => {
        el.classList.remove('is-cursor-near');
        el.style.removeProperty('--proximity');
      });
    };

    const update = () => {
      ticking = false;

      targets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const dist = distanceToRect(mouseX, mouseY, rect);
        const linear = dist >= PROXIMITY ? 0 : 1 - dist / PROXIMITY;
        const intensity = linear * linear;

        if (intensity > 0.02) {
          el.classList.add('is-cursor-near');
          el.style.setProperty('--proximity', intensity.toFixed(3));
        } else {
          el.classList.remove('is-cursor-near');
          el.style.removeProperty('--proximity');
        }
      });
    };

    window.addEventListener(
      'mousemove',
      (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );

    document.addEventListener('mouseleave', clearProximity);
  };

  const initProjectHeaderLinks = () => {
    document.querySelectorAll('.project').forEach((project) => {
      const header = project.querySelector('.project__header');
      const iconLinks = project.querySelectorAll('.project__links a.link--icon');
      if (!header || !iconLinks.length) return;

      let siteUrl = null;
      let githubUrl = null;

      iconLinks.forEach((anchor) => {
        if (anchor.querySelector('.github-icon')) {
          githubUrl = anchor.href;
        } else {
          siteUrl = anchor.href;
        }
      });

      const url = siteUrl || githubUrl;
      if (!url) return;

      const title = header.querySelector('h3');
      const headerLink = document.createElement('a');
      headerLink.href = url;
      headerLink.className = 'project__header-link';
      headerLink.target = '_blank';
      headerLink.rel = 'noopener noreferrer';
      if (title) {
        headerLink.setAttribute('aria-label', title.textContent.trim());
      }

      const description = project.querySelector('.project__description');
      header.replaceWith(headerLink);
      headerLink.appendChild(header);
      if (description) {
        headerLink.appendChild(description);
      }
    });
  };

  const initProjectNotesPopups = () => {
    const noteGroups = [...document.querySelectorAll('.project__notes')];
    if (!noteGroups.length) return;

    let openGroup = null;

    const closeGroup = (group) => {
      if (!group) return;
      const trigger = group.querySelector('.project__notes-trigger');
      const popup = group.querySelector('.project__notes-popup');
      if (!trigger || !popup) return;
      group.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      popup.hidden = true;
      if (openGroup === group) openGroup = null;
    };

    const openGroupPopup = (group) => {
      const trigger = group.querySelector('.project__notes-trigger');
      const popup = group.querySelector('.project__notes-popup');
      if (!trigger || !popup) return;
      if (openGroup && openGroup !== group) closeGroup(openGroup);
      group.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      popup.hidden = false;
      openGroup = group;
    };

    noteGroups.forEach((group) => {
      const trigger = group.querySelector('.project__notes-trigger');
      const popup = group.querySelector('.project__notes-popup');
      if (!trigger || !popup) return;

      popup.hidden = true;

      trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        if (group.classList.contains('is-open')) {
          closeGroup(group);
          return;
        }
        openGroupPopup(group);
      });

      popup.addEventListener('click', (event) => event.stopPropagation());
    });

    document.addEventListener('click', () => closeGroup(openGroup));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeGroup(openGroup);
    });
  };

  initProjectHeaderLinks();
  initProjectNotesPopups();
  initCursorProximity();
});
