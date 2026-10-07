const express=require('express'), mysql=require('mysql2/promise'), path=require('path');
const app=express(); app.use(express.json()); app.use(express.static(__dirname));
const pool=mysql.createPool({host:process.env.DB_HOST||'localhost',user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||'mafube_ict'});
app.post('/api/leads',async(req,res)=>{const {name,company,email,message}=req.body||{}; if(!name||!email||!message)return res.status(400).json({error:'Name, email and message are required'}); try{await pool.execute('INSERT INTO leads(name,company,email,message) VALUES (?,?,?,?)',[name,company||null,email,message]);res.json({ok:true});}catch(e){console.error(e);res.status(500).json({error:'Database error'});}});
app.get('/api/services',async(req,res)=>{try{const [rows]=await pool.query('SELECT * FROM services WHERE active=1 ORDER BY id');res.json(rows)}catch(e){res.status(500).json({error:'Database error'})}});
app.listen(process.env.PORT||3000,()=>console.log('Mafube website running'));
