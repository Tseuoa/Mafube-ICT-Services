const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#mainNav');
const setMenuOpen=open=>{if(!menu||!nav)return;nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu')};
if(menu&&nav){menu.addEventListener('click',()=>setMenuOpen(menu.getAttribute('aria-expanded')!=='true'));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){setMenuOpen(false);menu.focus()}});}
if(nav){nav.querySelectorAll('a:not(.nav-dropdown-toggle)').forEach(a=>a.addEventListener('click',()=>setMenuOpen(false)));window.addEventListener('resize',()=>{if(window.innerWidth>1150)setMenuOpen(false)});}
const form=document.querySelector('#contactForm'),status=document.querySelector('#formStatus');
if(form&&status){form.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form);const body=[`Name: ${data.get('name')}`,`Company: ${data.get('company')||'Not provided'}`,`Email: ${data.get('email')}`,'','Enquiry:',data.get('message')].join('\r\n');const subject=encodeURIComponent('Website enquiry');status.textContent='Opening your email app with the enquiry. Review it and press Send. If it does not open, email silas.tseuoa@mafubeservices.co.za.';window.location.href=`mailto:silas.tseuoa@mafubeservices.co.za?subject=${subject}&body=${encodeURIComponent(body)}`;});}

/*
 * About dropdown:
 * Desktop: opens on hover or keyboard focus.
 * Mobile: toggles when the About link is tapped.
 */
(() => {
  const dropdown = document.getElementById("aboutDropdown");
  const toggle = document.getElementById("aboutDropdownToggle");

  if (!dropdown || !toggle) return;

  toggle.addEventListener("click", (event) => {
    if (window.matchMedia("(max-width: 1150px)").matches) {
      event.preventDefault();

      const isOpen = dropdown.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    }
  });

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) {
      dropdown.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      dropdown.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });
})();
