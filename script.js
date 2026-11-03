const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#mainNav');
const setMenuOpen=open=>{if(!menu||!nav)return;nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu')};
if(menu&&nav){menu.addEventListener('click',()=>setMenuOpen(menu.getAttribute('aria-expanded')!=='true'));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){setMenuOpen(false);menu.focus()}});}
if(nav){nav.querySelectorAll('a:not(.nav-dropdown-toggle)').forEach(a=>a.addEventListener('click',()=>setMenuOpen(false)));window.addEventListener('resize',()=>{if(window.innerWidth>1150)setMenuOpen(false)});}
const contactApiUrl='https://mafube-ict-services-kwln.onrender.com/api/contact';
const contactEmail='silas.tseuoa@mafubeservices.co.za';

async function sendEnquiry(form,status,payload){
  const submitButton=form.querySelector('button[type="submit"]');
  const originalButtonText=submitButton.textContent;
  submitButton.disabled=true;
  submitButton.textContent='Sending...';
  status.textContent='Sending your enquiry...';

  try{
    const response=await fetch(contactApiUrl,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||'Unable to send your enquiry.');
    status.textContent='Thank you. Your enquiry has been sent to Mafube ICT Services.';
    form.reset();
  }catch{
    status.textContent=`We couldn't send your enquiry. Please email ${contactEmail} directly.`;
  }finally{
    submitButton.disabled=false;
    submitButton.textContent=originalButtonText;
  }
}

const form=document.querySelector('#contactForm'),status=document.querySelector('#formStatus');
if(form&&status){form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  const data=new FormData(form);
  sendEnquiry(form,status,{
    formType:'contact',
    name:data.get('name'),
    company:data.get('company'),
    email:data.get('email'),
    message:data.get('message')
  });
});}

const hubForm=document.querySelector('#hubEnquiryForm');
const hubStatus=document.querySelector('#hubFormStatus');
if(hubForm&&hubStatus){hubForm.addEventListener('submit',event=>{
  event.preventDefault();
  if(!hubForm.reportValidity())return;
  const data=new FormData(hubForm);
  sendEnquiry(hubForm,hubStatus,{
    formType:'business_hub',
    name:data.get('name'),
    company:data.get('business'),
    email:data.get('email'),
    phone:data.get('phone'),
    service:data.get('service'),
    requirements:data.get('requirements'),
    consent:data.get('consent')==='on'
  });
});}

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
