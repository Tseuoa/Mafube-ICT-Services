const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#mainNav');

function closeMenu() {
  if (!menu || !nav) return;
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Open menu');
  menu.textContent = '☰';
}

if (menu && nav) {
  menu.addEventListener('click', () => {
    const open = !nav.classList.contains('open');
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.textContent = open ? '✕' : '☰';
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => {
    if (nav.classList.contains('open') && !nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 820) closeMenu(); });
}

const form = document.querySelector('#contactForm');
const status = document.querySelector('#formStatus');
if (form && status) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.textContent = 'Sending...';
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      if (!response.ok) throw new Error('Request failed');
      status.textContent = 'Thank you. Your enquiry has been received.';
      form.reset();
    } catch (error) {
      status.textContent = 'The online form is not connected yet. Please email info@mafubeservices.co.za.';
    }
  });
}
