const express = require('express');
const app = express();
app.use(express.json());
const MY_POCHI = 254791957646;
app.post('/callback', (req,res)=>{
  console.log(JSON.stringify(req.body,null,2));
  const cb = req.body.Body.stkCallback;
  if(cb.ResultCode===0){console.log('SUCCESS PAID to '+MY_POCHI)}else{console.log('Failed: '+cb.ResultDesc)}
  res.json({ResultCode:0, ResultDesc:'OK'});
});
app.post('/confirmation', (req,res)=>{
  console.log('Money received to '+MY_POCHI, req.body);
  res.json({ResultCode:0, ResultDesc:'Accepted'});
});
app.listen(3000, ()=> console.log('Server for '+MY_POCHI+' running on port 3000'));
