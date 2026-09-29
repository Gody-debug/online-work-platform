 const registrationForm = document.getElementById("registrationForm");

if (registrationForm) {
    registrationForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        alert("Registration successful!");
    });
}


const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        alert("Login successful!");
    });
}


const jobsContainer = document.getElementById("api-jobs");

if (jobsContainer) {
    fetch("http://localhost:3000/api/jobs")
        .then(response => response.json())
        .then(jobs => {
            jobsContainer.innerHTML = "";

            jobs.forEach(job => {
                jobsContainer.innerHTML += `
                    <div class="job">
                        <h3>${job.title}</h3>
                        <p>${job.description}</p>
                        <div class="price">KSH ${job.pay}</div>
                        <a href="register.html?job=${job.id}">
                            <button class="btn">Apply</button>
                        </a>
                    </div>
                `;
            });
        })
        .catch(error => {
            console.error("Error loading jobs:", error);
        });
}