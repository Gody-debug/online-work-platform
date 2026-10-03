async function payToPochi(){
  const phone = prompt("Enter M-Pesa number to pay from:", "254791957646");
  if(!phone) return;
  alert("STK sent to "+phone+" - Pay to Till 254791957646");
  // Calls your live server
  fetch("https://roundup-revolt-camper.ngrok-free.dev/callback", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({Phone: phone, Amount: 1, Receiver: 254791957646})
  });
}
