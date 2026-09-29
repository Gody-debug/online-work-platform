  const http = require("http");
const fs = require("fs");

const jobs = [
    {
        id: 1,
        title: "Data Entry Job",
        description: "Simple typing work from home.",
        pay: 1000
    },
    {
        id: 2,
        title: "Online Writing",
        description: "Article writing for clients.",
        pay: 1200
    },
    {
        id: 3,
        title: "Survey Job",
        description: "Complete daily surveys.",
        pay: 1500
    },
    {
        id: 4,
        title: "Marketing Job",
        description: "Promote products online.",
        pay: 2000
    },
    {
        id: 5,
        title: "Design Job",
        description: "Simple graphic design tasks.",
        pay: 2500
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

    // M-PESA VALIDATION CALLBACK
    if (
        req.url === "/api/payments/validation" &&
        req.method === "POST"
    ) {

        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {

            console.log("M-Pesa validation request:");
            console.log(body);

            res.end(JSON.stringify({
                ResultCode: 0,
                ResultDesc: "Accepted"
            }));
        });

        return;
    }

    // M-PESA CONFIRMATION CALLBACK
    if (
        req.url === "/api/payments/confirmation" &&
        req.method === "POST"
    ) {

        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {

            console.log("M-Pesa payment confirmation:");
            console.log(body);

            fs.appendFile(
                "backend/mpesa-confirmations.json",
                body + "\n",
                "utf8",
                error => {

                    if (error) {
                        console.error(
                            "Could not save M-Pesa confirmation:",
                            error
                        );
                    }
                }
            );

            res.end(JSON.stringify({
                ResultCode: 0,
                ResultDesc: "Confirmation received successfully"
            }));
        });

        return;
    }

    // DEFAULT RESPONSE
    res.end(JSON.stringify({
        message: "Online Works Kenya API is working!"
    }));
});

// Render provides the PORT through an environment variable.
// 3000 is used when running locally.
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(
        `API server running on port ${PORT}`
    );
});