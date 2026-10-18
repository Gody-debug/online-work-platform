const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const USERS_FILE = path.join(__dirname,'users.json');
function getUsers(){ try{ if(!fs.existsSync(USERS_FILE)) return []; return JSON.parse(fs.readFileSync(USERS_FILE,'utf8')); }catch{return []} }
function saveUsers(u){ fs.writeFileSync(USERS_FILE, JSON.stringify(u,null,2)); }
function findByEmail(email){ return getUsers().find(x=>x.email?.toLowerCase()===email.toLowerCase()); }
function isStrongPassword(pw){ return pw.length>=8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw); }
const otpStore={};

app.post('/api/register',(req,res)=>{
  const {name,email,phone,password}=req.body;
  if(!name||!email||!phone||!password) return res.status(400).json({message:"All fields required"});
  if(!isStrongPassword(password)) return res.status(400).json({message:"Password must be 8+ chars with a letter and a number. Example: John2024"});
  let users=getUsers();
  if(users.find(u=>u.email?.toLowerCase()===email.toLowerCase())) return res.status(400).json({message:"Email already registered"});
  const user={name,email,phone,password,qualified:false,paid:false,createdAt:new Date().toISOString()};
  users.push(user); saveUsers(users);
  res.json({message:"ok"});
});

app.post('/api/qualify',(req,res)=>{
  const {email}=req.body;
  let users=getUsers();
  const u=users.find(x=>x.email?.toLowerCase()===email.toLowerCase());
  if(!u) return res.status(404).json({message:"User not found"});
  u.qualified=true; saveUsers(users);
  res.json({message:"qualified", redirect:"payment.html"});
});

app.post('/api/pay',(req,res)=>{
  const {email, mpesaCode}=req.body;
  let users=getUsers();
  const u=users.find(x=>x.email?.toLowerCase()===email.toLowerCase());
  if(!u) return res.status(404).json({message:"User not found"});
  if(!u.qualified) return res.status(403).json({message:"Complete qualification first", redirect:"qualification.html"});
  // Accept any mpesa code for now - in production verify with Daraja API
  u.paid=true; u.mpesaCode=mpesaCode||"DEMO"; u.paidAt=new Date().toISOString();
  saveUsers(users);
  res.json({message:"Payment confirmed", redirect:"login.html"});
});

// === THIS IS THE LOCK - NO PAY = NO LOGIN ===
app.post('/api/login',(req,res)=>{
  const {email,password}=req.body;
  const u=findByEmail(email);
  if(!u || u.password!==password) return res.status(401).json({message:"Invalid email or password"});
  if(!u.qualified) return res.status(403).json({message:"Complete qualification first", redirect:"qualification.html"});
  if(!u.paid) return res.status(403).json({message:"Account not activated. You must pay KES 150 to activate. Redirecting to payment...", redirect:"payment.html"});
  res.json({user:{email:u.email,name:u.name,phone:u.phone,paid:true,qualified:true}});
});

app.post('/api/forgot-password',(req,res)=>{
  const {email}=req.body;
  const u=findByEmail(email);
  if(!u) return res.status(404).json({message:"Email not found"});
  const code=Math.floor(100000+Math.random()*900000).toString();
  otpStore[email.toLowerCase()]={code,expires:Date.now()+10*60*1000};
  console.log(`[OTP ${email}] ${code}`);
  res.json({message:`OTP sent to ${u.phone.slice(0,5)}****. Your code is ${code} (demo)`, demoCode:code});
});
app.post('/api/verify-otp',(req,res)=>{
  const {email,otp}=req.body;
  const rec=otpStore[email.toLowerCase()];
  if(!rec) return res.status(400).json({message:"No OTP requested"});
  if(Date.now()>rec.expires) return res.status(400).json({message:"OTP expired"});
  if(rec.code!==otp) return res.status(400).json({message:"Invalid OTP"});
  res.json({message:"OTP verified"});
});
app.post('/api/reset-password',(req,res)=>{
  const {email,otp,newPassword}=req.body;
  if(!isStrongPassword(newPassword)) return res.status(400).json({message:"Password must be 8+ chars with letter and number"});
  const rec=otpStore[email.toLowerCase()];
  if(!rec || rec.code!==otp) return res.status(400).json({message:"Invalid OTP"});
  let users=getUsers(); const u=users.find(x=>x.email?.toLowerCase()===email.toLowerCase());
  u.password=newPassword; saveUsers(users); delete otpStore[email.toLowerCase()];
  res.json({message:"Password reset - login now"});
});

// Protect dashboard - check paid status
app.get('/api/check-auth',(req,res)=>{
  const email=req.query.email;
  const u=findByEmail(email);
  if(!u) return res.status(401).json({paid:false});
  if(!u.paid) return res.status(403).json({paid:false, redirect:"payment.html", message:"Pay KES 150 to activate"});
  res.json({paid:true, user:u});
});

app.get('/api/jobs',(req,res)=>{
  res.json([
    {id:1,title:"Audio Transcription",pay:1250},{id:2,title:"Data Entry",pay:850}
  ]);
});

app.listen(PORT,()=>console.log('Server running on '+PORT));
