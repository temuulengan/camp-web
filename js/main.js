const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

const animatedItems = document.querySelectorAll('[data-animate]');
if (animatedItems.length) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  animatedItems.forEach((item) => observer.observe(item));
}

const yearSpan = document.querySelector('[data-year]');
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// --- Auth check for admin and navbar profile behavior ---
(async function(){
  // default unknown until check completes
  window.isAdmin = undefined;
  // use localStorage flag for admin state
  function doCheck(){
    window.isAdmin = localStorage.getItem('isAdmin') === 'true';
    const p = document.getElementById('navProfile');
    if(p){ p.title = window.isAdmin ? 'Dashboard' : 'Admin'; }
  }

  // run check on load
  doCheck();

  // attach click behavior to profile icon
  document.addEventListener('click', async function onDocClick(e){
    const p = e.target.closest && e.target.closest('#navProfile');
    if(!p) return;
    e.preventDefault();
    // if known state, use it
    if(window.isAdmin === true) return window.location.href = '/admin/dashboard.html';
    return window.location.href = '/admin/login.html';
  });
})();
