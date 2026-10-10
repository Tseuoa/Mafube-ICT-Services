const express=require('express'), mysql=require('mysql2/promise'), path=require('path');
const app=express(); if(process.env.TRUST_PROXY==='true')app.set('trust proxy',1); app.use(express.json({limit:'20kb'})); app.use(express.static(__dirname));
const pool=mysql.createPool({host:process.env.DB_HOST||'localhost',user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||'mafube_ict'});
const contactAttempts=new Map(),contactWindowMs=15*60*1000,contactMaxAttempts=5;
let cachedGraphToken,cachedGraphTokenExpiresAt=0;
app.get('/api/health',(req,res)=>res.json({ok:true}));
async function getGraphAccessToken(tenantId,clientId,clientSecret){
 if(cachedGraphToken&&Date.now()<cachedGraphTokenExpiresAt-60000)return cachedGraphToken;
 const response=await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,{
  method:'POST',
  headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,scope:'https://graph.microsoft.com/.default',grant_type:'client_credentials'}),
  signal:AbortSignal.timeout(15000)
 });
 let result;
 try{result=await response.json()}catch(parseError){throw new Error('Microsoft identity returned an invalid response.')}
 if(!response.ok||typeof result.access_token!=='string'){
  console.error('Microsoft identity token request failed:',response.status,result.error||'invalid_token_response');
  throw new Error('Microsoft email authentication failed.');
 }
 cachedGraphToken=result.access_token;
 cachedGraphTokenExpiresAt=Date.now()+Number(result.expires_in||3600)*1000;
 return cachedGraphToken;
}
app.post('/api/contact',async(req,res)=>{
 const {name,company,email,message}=req.body||{};
 if(typeof name!=='string'||typeof email!=='string'||typeof message!=='string'||!name.trim()||!email.trim()||!message.trim())return res.status(400).json({error:'Name, email and message are required.'});
 const cleanName=name.trim().replace(/[\r\n\x00-\x1f\x7f]/g,' '),cleanCompany=typeof company==='string'?company.trim().replace(/[\r\n\x00-\x1f\x7f]/g,' '):'',cleanEmail=email.trim(),cleanMessage=message.trim();
 if(cleanName.length>150||cleanCompany.length>200||cleanEmail.length>254||cleanMessage.length>5000||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))return res.status(400).json({error:'Please check your details and try again.'});
 const {MS_TENANT_ID,MS_CLIENT_ID,MS_CLIENT_SECRET}=process.env,sender=process.env.MS_SENDER||'silas.tseuoa@mafubeservices.co.za';
 if(!MS_TENANT_ID||!MS_CLIENT_ID||!MS_CLIENT_SECRET)return res.status(503).json({error:'Microsoft email is not configured. Please email Silas directly.'});
 const now=Date.now(),ip=req.ip||req.socket.remoteAddress||'unknown',attempt=contactAttempts.get(ip);
 if(attempt&&now-attempt.startedAt<contactWindowMs&&attempt.count>=contactMaxAttempts)return res.status(429).json({error:'Too many enquiries. Please try again later.'});
 if(!attempt||now-attempt.startedAt>=contactWindowMs)contactAttempts.set(ip,{startedAt:now,count:1});else attempt.count++;
 if(contactAttempts.size>1000){
  for(const [key,value] of contactAttempts)if(now-value.startedAt>=contactWindowMs)contactAttempts.delete(key);
  while(contactAttempts.size>1000)contactAttempts.delete(contactAttempts.keys().next().value);
 }
 try{
  const accessToken=await getGraphAccessToken(MS_TENANT_ID,MS_CLIENT_ID,MS_CLIENT_SECRET);
  const response=await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,{
   method:'POST',
   headers:{Authorization:'Bearer '.concat(accessToken),'Content-Type':'application/json'},
   body:JSON.stringify({
    message:{
     subject:`Website enquiry from ${cleanName}`,
     body:{contentType:'Text',content:`Name: ${cleanName}\nCompany: ${cleanCompany||'Not provided'}\nEmail: ${cleanEmail}\n\nEnquiry:\n${cleanMessage}`},
     toRecipients:[{emailAddress:{address:'silas.tseuoa@mafubeservices.co.za'}}],
     replyTo:[{emailAddress:{address:cleanEmail}}]
    },
    saveToSentItems:true
   }),
   signal:AbortSignal.timeout(20000)
  });
  if(response.status!==202){
   console.error('Microsoft Graph sendMail failed:',response.status,response.headers.get('request-id')||'no-request-id');
   return res.status(502).json({error:'Microsoft could not accept your enquiry. Please try again later or email Silas directly.'});
  }
  res.json({ok:true});
 }catch(error){
  console.error('Microsoft contact email failed:',error.name||'Error',error.message);
  res.status(502).json({error:'We could not send your enquiry right now. Please try again later or email Silas directly.'});
 }
});
app.post('/api/leads',async(req,res)=>{const {name,company,email,message}=req.body||{}; if(!name||!email||!message)return res.status(400).json({error:'Name, email and message are required'}); try{await pool.execute('INSERT INTO leads(name,company,email,message) VALUES (?,?,?,?)',[name,company||null,email,message]);res.json({ok:true});}catch(e){console.error(e);res.status(500).json({error:'Database error'});}});
app.get('/api/services',async(req,res)=>{try{const [rows]=await pool.query('SELECT * FROM services WHERE active=1 ORDER BY id');res.json(rows)}catch(e){res.status(500).json({error:'Database error'})}});
app.listen(process.env.PORT||3000,()=>console.log('Mafube website running'));
