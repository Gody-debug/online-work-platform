 require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

let latestPaymentStatus = { status: "pending", message: "Waiting..." };

const jobs = [
 {id:1,title:"Audio Transcription",description:"Listen to audio and transcribe",pay:1000},
 {id:2,title:"Data Entry",pay:800,description:"Enter data"},
 {id:3,title:"Online Research",pay:1200,description:"Research"},
 {id:4,title:"Document Formatting",pay:900,description:"Formatting"},
 {id:5,title:"Content Writing",pay:1500,description:"Writing"},
 {id:6,title:"Proofreading",pay:1000,description:"Proofreading"},
 {id:7,title:"Data Collection",pay:1100,description:"Collection"},
 {id:8,title:"Virtual Assistant Tasks",pay:1300,description:"VA Tasks"},
];

app.get('/api/jobs', (req,res)=> res.json(jobs));
app.get('/', (req,res)=> res.send('API running'));

app.post('/api/register', (req,res)=>{
  const user = req.body;
  let regs = [];
  try{ regs = JSON.parse(fs.readFileSync('backend/registrations.json','utf8')); }catch{}
  regs.push(user);
  fs.writeFileSync('backend/registrations.json', JSON.stringify(regs,null,2));
  res.json({message:"Registration received!"});
});

app.post('/api/payments/confirmation', (req,res)=>{
  console.log("M-Pesa Confirmation:", JSON.stringify(req.body,null,2));
  const stk = req.body.Body?.stkCallback;
  if(stk){
    latestPaymentStatus = { status: stk.ResultCode===0?"paid":"failed", message: stk.ResultDesc };
  }
  res.json({ResultCode:0,ResultDesc:"Received"});
});

app.get('/api/payments/status', (req,res)=>{
  res.json({ success: latestPaymentStatus.status==="paid", ...latestPaymentStatus });
});

async function getToken(){
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const r = await axios.get('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',{headers:{Authorization:`Basic ${auth}`}});
  return r.data.access_token;
}

app.post('/api/stkpush', async (req,res)=>{
  try{
    const {phone, amount} = req.body;
    const formatted = phone.replace(/^0/,'254');
    const token = await getToken();
    const timestamp = new Date().toISOString().replace(/[-:T.]/g,'').slice(0,14);
    const shortcode = process.env.MPESA_TILL || process.env.MPESA_SHORTCODE || "4170291";
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(shortcode+passkey+timestamp).toString('base64');
    
    const resp = await axios.post('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',{
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: amount||150,
      PartyA: formatted,
      PartyB: shortcode,
      PhoneNumber: formatted,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: "OnlineWork",
      TransactionDesc: "Registration"
    },{headers:{Authorization:`Bearer ${token}`}});

    latestPaymentStatus = {status:"pending",message:"Waiting confirmation"};
    res.json(resp.data);
  }catch(e){
    console.error(e.response?.data||e.message);
    res.status(500).json({error:e.response?.data||e.message});
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT,'0.0.0.0',()=> console.log(`API server running on port ${PORT} Till ${process.env.MPESA_TILL}`));