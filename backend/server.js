 // === PASSWORD VALIDATOR ===
function isStrongPassword(pw){
  return pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);
}

// In-memory OTP store (for production use Redis). Key = email
const otpStore = {}; // { email: { code, expires, attempts } }

// REGISTER - with strong password
app.post('/api/register',(req,res)=>{
  const {name,email,phone,password} = req.body;
  if(!name || !email || !phone || !password) return res.status(400).json({message:"All fields required"});
  if(!isStrongPassword(password)) return res.status(400).json({message:"Password must be at least 8 characters with a letter and a number"});
  let users = getUsers();
  if(users.find(u=>u.email?.toLowerCase()===email.toLowerCase())){
    return res.status(400).json({message:"Email already registered, please login"});
  }
  const user = { name, email, phone, password, qualified:false, paid:false, createdAt:new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  res.json({message:"ok", user:{email, phone, qualified:false, paid:false}});
});

// LOGIN - BLOCK unpaid
app.post('/api/login',(req,res)=>{
  const {email,password} = req.body;
  const users = getUsers();
  const user = users.find(u=>u.email?.toLowerCase()===email?.toLowerCase() && u.password===password);
  if(!user) return res.status(401).json({message:"Invalid email or password"});
  if(!user.qualified){
    return res.status(403).json({message:"Please complete qualification", redirect:"qualification.html"});
  }
  if(!user.paid){
    return res.status(403).json({message:"Account not activated. Pay KES 150 to activate", redirect:"payment.html"});
  }
  res.json({message:"Login ok", user:{email:user.email, name:user.name, phone:user.phone, qualified:true, paid:true}});
});

// FORGOT PASSWORD - Send real OTP (6-digit)
app.post('/api/forgot-password',(req,res)=>{
  const {email} = req.body;
  if(!email) return res.status(400).json({message:"Enter your email"});
  const user = findByEmail(email);
  if(!user) return res.status(404).json({message:"Email not found"});
  
  const code = Math.floor(100000 + Math.random()*900000).toString(); // 6 digit
  otpStore[email.toLowerCase()] = { code, expires: Date.now() + 10*60*1000, attempts: 0 }; // 10 mins
  
  console.log(`[OTP] for ${email}: ${code}`); // you see it in Render logs - for real SMS integrate Africa's Talking here
  
  // TODO: Send via Email or SMS. For now we log it. To send real SMS uncomment:
  // axios.post('https://api.africastalking.com/...') 
  res.json({message:`OTP sent to ${user.phone.slice(0,5)}****. Check SMS. Code is ${code} (demo - remove in production)`, demoCode: code});
});

// VERIFY OTP
app.post('/api/verify-otp',(req,res)=>{
  const {email, otp} = req.body;
  const record = otpStore[email.toLowerCase()];
  if(!record) return res.status(400).json({message:"No OTP requested, please request again"});
  if(Date.now() > record.expires) return res.status(400).json({message:"OTP expired, request new one"});
  if(record.code !== otp) return res.status(400).json({message:"Invalid OTP"});
  res.json({message:"OTP verified"});
});

// RESET PASSWORD
app.post('/api/reset-password',(req,res)=>{
  const {email, otp, newPassword} = req.body;
  if(!isStrongPassword(newPassword)) return res.status(400).json({message:"New password must be 8+ chars with letter and number"});
  const record = otpStore[email.toLowerCase()];
  if(!record || record.code !== otp) return res.status(400).json({message:"Invalid or expired OTP"});
  if(Date.now() > record.expires) return res.status(400).json({message:"OTP expired"});
  
  let users = getUsers();
  const u = users.find(x=>x.email?.toLowerCase()===email.toLowerCase());
  if(!u) return res.status(404).json({message:"User not found"});
  u.password = newPassword;
  saveUsers(users);
  delete otpStore[email.toLowerCase()];
  res.json({message:"Password reset successful, you can now login"});
});