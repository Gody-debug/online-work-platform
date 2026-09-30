 require("dotenv").config();

 const http = require("http");
const fs = require("fs");
const axios = require("axios");
let latestPaymentStatus = {
    status: "pending",
    message: "Waiting for payment..."
};
 const jobs = [
    {
        id: 1,
        title: "Audio Transcription",
        description: "Listen to provided audio recordings and accurately convert the spoken content into a written document. Follow the required formatting and submit the completed transcription.",
        pay: 1000
    },
    {
        id: 2,
        title: "Data Entry",
        description: "Enter information from provided documents, records or files into the required spreadsheet or digital form. Accuracy and attention to detail are required.",
        pay: 800
    },
    {
        id: 3,
        title: "Online Research",
        description: "Research specific information according to the provided instructions and organize the findings clearly in the required document or spreadsheet.",
        pay: 1200
    },
    {
        id: 4,
        title: "Document Formatting",
        description: "Format provided documents according to the client's instructions, including headings, spacing, tables, page layout and other required formatting.",
        pay: 900
    },
    {
        id: 5,
        title: "Content Writing",
        description: "Create clear and original written content based on the client's instructions, topic and required format.",
        pay: 1500
    },
    {
        id: 6,
        title: "Proofreading",
        description: "Review provided documents for spelling, grammar, punctuation and formatting errors and make the required corrections.",
        pay: 1000
    },
    {
        id: 7,
        title: "Data Collection",
        description: "Collect specific information according to the provided requirements and organize the completed information in the requested format.",
        pay: 1100
    },
    {
        id: 8,
        title: "Virtual Assistant Tasks",
        description: "Complete assigned administrative and online tasks according to specific client instructions and submit the finished work within the required timeframe.",
        pay: 1300
    }
];   

const server = http.createServer((req, res) => {

    res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });

    if (req.method === "OPTIONS") {
        res.end();
        return;
    }

    // GET JOBS
    if (req.url === "/api/jobs" && req.method === "GET") {
        res.end(JSON.stringify(jobs));
        return;
    }

    // REGISTER USER
    if (req.url === "/api/register" && req.method === "POST") {

        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {

            const user = JSON.parse(body);

            console.log("New registration:");
            console.log(user);

            fs.readFile(
                "backend/registrations.json",
                "utf8",
                (error, data) => {

                    let registrations = [];

                    if (!error && data) {
                        registrations = JSON.parse(data);
                    }

                    registrations.push(user);

                    fs.writeFile(
                        "backend/registrations.json",
                        JSON.stringify(registrations, null, 2),
                        "utf8",
                        writeError => {

                            if (writeError) {

                                console.error(
                                    "Could not save registration:",
                                    writeError
                                );

                                res.end(JSON.stringify({
                                    message:
                                        "Registration received, but could not be saved."
                                }));

                                return;
                            }

                            res.end(JSON.stringify({
                                message:
                                    "Registration received successfully!"
                            }));
                        }
                    );
                }
            );
        });

        return;
    } 
    // M-PESA PAYMENT CONFIRMATION
if (req.url === "/api/payments/confirmation" && req.method === "POST") {

    let body = "";

    req.on("data", chunk => {
        body += chunk;
    });

    req.on("end", () => {

        try {

            const callbackData = JSON.parse(body);

            console.log("M-Pesa confirmation received:");
            console.log(JSON.stringify(callbackData, null, 2));

            const stkCallback =
                callbackData.Body &&
                callbackData.Body.stkCallback;

            if (stkCallback) {

                const resultCode = stkCallback.ResultCode;
                const resultDesc = stkCallback.ResultDesc;

                console.log("Payment Result Code:", resultCode);
                console.log("Payment Result:", resultDesc);
latestPaymentStatus = {
    status: resultCode === 0 ? "paid" : "failed",
    message: resultDesc
};
                fs.writeFile(
                    "backend/mpesa-confirmations.json",
                    JSON.stringify(callbackData, null, 2),
                    "utf8",
                    error => {

                        if (error) {
                            console.error(
                                "Could not save M-Pesa confirmation:",
                                error
                            );
                        } else {
                            console.log(
                                "M-Pesa confirmation saved successfully."
                            );
                        }
                    }
                );

            }

            res.end(JSON.stringify({
                ResultCode: 0,
                ResultDesc: "Confirmation received successfully"
            }));

        } catch (error) {

            console.error(
                "Could not process M-Pesa confirmation:",
                error
            );

            res.end(JSON.stringify({
                ResultCode: 1,
                ResultDesc: "Invalid confirmation data"
            }));
        }
    });

    return;
}
 // CHECK M-PESA PAYMENT STATUS
if (req.url === "/api/payments/status" && req.method === "GET") {
    res.end(JSON.stringify({
        success: latestPaymentStatus.status === "paid",
        status: latestPaymentStatus.status,
        message: latestPaymentStatus.message
    }));
    return;
}
    // M-PESA STK PUSH
 // M-PESA STK PUSH
if (req.url === "/api/payments/stkpush" && req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
        body += chunk;
    });

    req.on("end", async () => {

        try {

            const data = JSON.parse(body);

            const phone = data.phone;
            const amount = data.amount || 1;

            if (!phone) {
                res.end(JSON.stringify({
                    success: false,
                    message: "Phone number is required."
                }));
                return;
            }

            // Get Daraja access token
            const auth = Buffer.from(
                process.env.MPESA_CONSUMER_KEY +
                ":" +
                process.env.MPESA_CONSUMER_SECRET
            ).toString("base64");

            const tokenResponse = await axios.get(
                "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
                {
                    headers: {
                        Authorization: "Basic " + auth
                    }
                }
            );

            const accessToken = tokenResponse.data.access_token;

            // Sandbox test values
            const shortcode = "174379";
            const passkey = process.env.MPESA_PASSKEY;

            if (!passkey) {
                res.end(JSON.stringify({
                    success: false,
                    message: "MPESA_PASSKEY is missing from .env"
                }));
                return;
            }

            // Generate timestamp
            const now = new Date();

            const timestamp =
                now.getFullYear().toString() +
                String(now.getMonth() + 1).padStart(2, "0") +
                String(now.getDate()).padStart(2, "0") +
                String(now.getHours()).padStart(2, "0") +
                String(now.getMinutes()).padStart(2, "0") +
                String(now.getSeconds()).padStart(2, "0");

            // Generate password
            const password = Buffer.from(
                shortcode + passkey + timestamp
            ).toString("base64");

            const stkResponse = await axios.post(
                "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
                {
                    BusinessShortCode: shortcode,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: "CustomerPayBillOnline",
                    Amount: amount,
                    PartyA: phone,
                    PartyB: shortcode,
                    PhoneNumber: phone,
                    CallBackURL:
                        "https://roundup-revolt-camper.ngrok-free.dev/api/payments/confirmation",
                    AccountReference: "OnlineWorks",
                    TransactionDesc: "Online Works registration"
                },
                {
                    headers: {
                        Authorization: "Bearer " + accessToken,
                        "Content-Type": "application/json"
                    }
                }
            );
latestPaymentStatus = {
    status: "pending",
    message: "Waiting for payment confirmation..."
};
            console.log("STK Push response:", stkResponse.data);

            res.end(JSON.stringify({
                success: true,
                message: "STK Push request sent.",
                response: stkResponse.data
            }));

        } catch (error) {

            console.error(
                "STK Push error:",
                error.response?.data || error.message
            );

            res.end(JSON.stringify({
                success: false,
                message: "STK Push failed.",
                error: error.response?.data || error.message
            }));
        }

    });

    return;
}
});

server.listen(3000, () => {
    console.log("API server running on port 3000");
});