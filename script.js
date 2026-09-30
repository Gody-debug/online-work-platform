 // Dashboard and Job Search logic - does not touch Daraja endpoint
// Keep your existing Daraja fetch as is
document.getElementById('paymentForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const phone = document.getElementById('phone').value;
  const amount = document.getElementById('amount').value;
  // This endpoint must stay same as your server.js
  const res = await fetch('http://localhost:3000/api/stkpush', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({phone, amount})
  });
  const data = await res.json();
  document.getElementById('paymentStatus').innerText = data.message;
});