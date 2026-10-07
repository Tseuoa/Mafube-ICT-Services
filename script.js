const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#mainNav');
if(menu){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open)});}
document.querySelectorAll('#mainNav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
const form=document.querySelector('#contactForm'),status=document.querySelector('#formStatus');
if(form){form.addEventListener('submit',async e=>{e.preventDefault();status.textContent='Sending...';try{const r=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});if(!r.ok)throw new Error();status.textContent='Thank you. Your enquiry has been received.';form.reset()}catch(err){status.textContent='The online form is not connected yet. Please email info@mafubeservices.co.za.'}});}
