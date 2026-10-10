const express=require('express'), mysql=require('mysql2/promise'), nodemailer=require('nodemailer'), path=require('path');
const app=express(); if(process.env.TRUST_PROXY==='true')app.set('trust proxy',1); app.use(express.json({limit:'20kb'})); app.use(express.static(__dirname));
const pool=mysql.createPool({host:process.env.DB_HOST||'localhost',user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||'mafube_ict'});
const contactAttempts=new Map(),contactWindowMs=15*60*1000,contactMaxAttempts=5;
app.get('/api/health',(req,res)=>res.json({ok:true}));
app.post('/api/contact',async(req,res)=>{
 const {name,company,email,message}=req.body||{};
 if(typeof name!=='string'||typeof email!=='string'||typeof message!=='string'||!name.trim()||!email.trim()||!message.trim())return res.status(400).json({error:'Name, email and message are required.'});
 const cleanName=name.trim().replace(/[\r\n\x00-\x1f\x7f]/g,' '),cleanCompany=typeof company==='string'?company.trim().replace(/[\r\n\x00-\x1f\x7f]/g,' '):'',cleanEmail=email.trim(),cleanMessage=message.trim();
 if(cleanName.length>150||cleanCompany.length>200||cleanEmail.length>254||cleanMessage.length>5000||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))return res.status(400).json({error:'Please check your details and try again.'});
 const {SMTP_HOST,SMTP_USER,SMTP_PASSWORD,SMTP_FROM}=process.env,port=Number(process.env.SMTP_PORT||587);
 if(!SMTP_HOST||!SMTP_USER||!SMTP_PASSWORD||!Number.isInteger(port)||port<1||port>65535)return res.status(503).json({error:'Email delivery is not configured. Please use the contact email address instead.'});
 const now=Date.now(),ip=req.ip||req.socket.remoteAddress||'unknown',attempt=contactAttempts.get(ip);
 if(attempt&&now-attempt.startedAt<contactWindowMs&&attempt.count>=contactMaxAttempts)return res.status(429).json({error:'Too many enquiries. Please try again later.'});
 if(!attempt||now-attempt.startedAt>=contactWindowMs)contactAttempts.set(ip,{startedAt:now,count:1});else attempt.count++;
 if(contactAttempts.size>1000){
  for(const [key,value] of contactAttempts)if(now-value.startedAt>=contactWindowMs)contactAttempts.delete(key);
  while(contactAttempts.size>1000)contactAttempts.delete(contactAttempts.keys().next().value);
 }
 try{
  const transporter=nodemailer.createTransport({host:SMTP_HOST,port,secure:process.env.SMTP_SECURE==='true'||port===465,auth:{user:SMTP_USER,pass:SMTP_PASSWORD}});
  await transporter.sendMail({
   from:SMTP_FROM||SMTP_USER,
   to:'silas.tseuoa@mafubeservices.co.za',
   replyTo:cleanEmail,
   subject:`Website enquiry from ${cleanName}`,
   text:`Name: ${cleanName}\nCompany: ${cleanCompany||'Not provided'}\nEmail: ${cleanEmail}\n\nEnquiry:\n${cleanMessage}`
  });
  res.json({ok:true});
 }catch(error){
  console.error('Contact email delivery failed:',error);
  res.status(502).json({error:'We could not send your enquiry right now. Please try again later or email Silas directly.'});
 }
});
app.post('/api/leads',async(req,res)=>{const {name,company,email,message}=req.body||{}; if(!name||!email||!message)return res.status(400).json({error:'Name, email and message are required'}); try{await pool.execute('INSERT INTO leads(name,company,email,message) VALUES (?,?,?,?)',[name,company||null,email,message]);res.json({ok:true});}catch(e){console.error(e);res.status(500).json({error:'Database error'});}});
app.get('/api/services',async(req,res)=>{try{const [rows]=await pool.query('SELECT * FROM services WHERE active=1 ORDER BY id');res.json(rows)}catch(e){res.status(500).json({error:'Database error'})}});
app.listen(process.env.PORT||3000,()=>console.log('Mafube website running'));
