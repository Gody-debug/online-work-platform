 require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// SERVE YOUR FRONTEND FILES (index.html, etc) from root folder
app.use(express.static(path.join(__dirname, '..')));

let latestPaymentStatus = { status: "pending", message: "Waiting..." };
const jobs = [
 {id:1,title:"Audio Transcription",description:"Transcribe",pay:1000},
 {id:2,title:"Data Entry",pay:800,description:"Enter data"},
 {id:3,title:"Online Research",pay:1200,description:"Research"},
 {id:4,title:"Document Formatting",pay:900,description:"Format"},
 {id:5,title:"Content Writing",pay:1500,description:"Write"},
 {id:6,title:"Proofreading",pay:1000,description:"Proofread"},
 {id:7,title:"Data Collection",pay:1100,description:"Collect"},
 {id:8,title:"Virtual Assistant Tasks",pay:1300,description:"VA"},
];

app.get('/api/jobs',(req,res)=>res.json(jobs));

app.post('/api/register',(req,res)=>{
  let regs=[]; 
  const regFile = path.join(__dirname, 'registrations.json');
  try{regs=JSON.parse(fs.readFileSync(regFile,'utf8'))}catch{}
  regs.push(req.body);
  fs.writeFileSync(regFile,JSON.stringify(regs,null,2));
  res.json({message:"ok"});
});

app.post('/api/payments/confirmation',(req,res)=>{
  console.log(JSON.stringify(req.body,null,2));
  const stk=req.body.Body?.stkCallback;
  if(stk) latestPaymentStatus={status:stk.ResultCode===0?"paid":"failed",message:stk.ResultDesc};
  res.json({ResultCode:0,ResultDesc:"Received"});
});

app.get('/api/payments/status',(req,res)=>res.json({success:latestPaymentStatus.status==="paid",...latestPaymentStatus}));

async function getToken(){
  const auth=Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const r=await axios.get('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',{headers:{Authorization:`Basic ${auth}`}});
  return r.data.access_token;
}

app.post('/api/stkpush',async(req,res)=>{
  try{
    const {phone,amount}=req.body;
    const formatted=phone.replace(/^0/,'254');
    const token=await getToken();
    const timestamp=new Date().toISOString().replace(/[-:T.]/g,'').slice(0,14);
    const shortcode=process.env.MPESA_TILL||process.env.MPESA_SHORTCODE;
    const password=Buffer.from(shortcode+process.env.MPESA_PASSKEY+timestamp).toString('base64');
    const resp=await axios.post('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',{
      BusinessShortCode:shortcode,Password:password,Timestamp:timestamp,TransactionType:"CustomerBuyGoodsOnline",
      Amount:amount||150,PartyA:formatted,PartyB:shortcode,PhoneNumber:formatted,
      CallBackURL:process.env.MPESA_CALLBACK_URL,AccountReference:"OnlineWork",TransactionDesc:"Reg"
    },{headers:{Authorization:`Bearer ${token}`}});
    latestPaymentStatus={status:"pending",message:"Waiting"};
    res.json(resp.data);
  }catch(e){res.status(500).json({error:e.response?.data||e.message})}
});

// For any other route, send index.html
app.get('*',(req,res)=>{
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const PORT=process.env.PORT||10000;
app.listen(PORT,'0.0.0.0',()=>console.log(`Running on ${PORT}`));