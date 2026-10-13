const API_URL = "http://localhost:3000"

function setAuthToken() {
    const token = sessionStorage.getItem("token");

    if (token) {
        axios.defaults.headers.common["Authorization"] =
            `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common["Authorization"];
    }
}

function handleFormSubmit(event) {
    event.preventDefault();

    const signUp = {
        name: event.target.name.value,
        email: event.target.email.value,
        password: event.target.password.value
    }

    axios.post(`${API_URL}/users/signup`,signUp)
        .then((res) => {
            console.log("signup created");
            event.target.reset();
            window.location.href = "login.html";
            
        })
        .catch(err => console.log(err));
}


function handleLogin(event) {
    event.preventDefault();

    const loginDetails = {
        email: event.target.email.value,
        password: event.target.password.value
    };

    axios.post(`${API_URL}/users/login`, loginDetails)
        .then((res) => {
            sessionStorage.setItem("token", res.data.token);
            sessionStorage.setItem(
                "isPremium",
                String(res.data.isPremium)
            );

            setAuthToken();

            alert("User logged in successfully");
            window.location.href = "expenses.html";
        })
        .catch(err => {
            console.log(err.response?.data || err.message);
        });
}



document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
    // Set the JWT token before making API requests
    setAuthToken();

    const token = sessionStorage.getItem("token");

    // Redirect if token is missing
    // if (!token) {
    //     window.location.href = "login.html";
    //     return;
    // }

    axios.get(`${API_URL}/expense/getExpense`)
        .then((res) => {
            for (let i = 0; i < res.data.length; i++) {
                display(res.data[i]);
            }
        })
        .catch((err) => {
            console.log(
                "Fetch error:",
                err.response?.data || err.message
            );

            if (err.response?.status === 401) {
                sessionStorage.removeItem("token");
                window.location.href = "login.html";
            }
        });
}


function addExpense(event) {
    event.preventDefault();


    const expense = event.target.expense.value;
    const description = event.target.description.value;
    const category = event.target.category.value;

    const expenseDetails = { expense, description, category };

    const editId = sessionStorage.getItem("editId");

    if (editId) {
        axios.put(`${API_URL}/expense/editExpense/${editId}`, expenseDetails)
            .then((res) => {
                const li = document.getElementById(editId);
                const expenseInfo = li.querySelector("div");

                expenseInfo.innerHTML = `
                    <strong>${res.data.expense}</strong>
                    <span class="ms-3">${res.data.description}</span>
                    <span class="badge bg-secondary ms-3">${res.data.category}</span>
                `;

                sessionStorage.removeItem("editId");
                document.querySelector("button[type=submit]").textContent = "Add expense";
                event.target.reset();
            })
            .catch((err) => {
                console.log("Update error:", err.response?.data || err.message);
            });
    } else {
              axios.post(`${API_URL}/expense/addExpense`, expenseDetails)
                    .then((res) => {
                        display(res.data);
                        // Clear form
                        event.target.reset();
                    })
                    .catch((err) => {
                        console.log("Add error:", err);
                    });
    }
}

// use this function to display user on screen
function display(data) {

    const ul = document.querySelector("#expenseList");
    const li = document.createElement("li");

    li.className =
        "list-group-item d-flex justify-content-between align-items-center";

    li.id = data.id;

    const expenseInfo = document.createElement("div");

    expenseInfo.innerHTML = `
        <strong>₹${data.expense}</strong>
        <span class="ms-3">${data.description}</span>
        <span class="badge bg-secondary ms-3">${data.category}</span>
    `;

    li.appendChild(expenseInfo);

    const buttons = document.createElement("div");
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "btn btn-danger btn-sm me-2";

    deleteButton.addEventListener(
        "click",
        () => deleteData(data.id, li)
    );

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn btn-warning btn-sm";

    editBtn.addEventListener(
        "click",
        () => editData(data)
    );


    buttons.appendChild(deleteButton);
    buttons.appendChild(editBtn);
    li.appendChild(buttons);
    ul.appendChild(li);
}


// use this function to add user details into local storage
function addData(expenseList, expenseDetails) {
    expenseDetails.id = Date.now();
    expenseList.push(expenseDetails);
    display(expenseDetails);
}


// use this function to delete the user details from local store and DOM (screen)
function deleteData(id, li) {
    axios.delete(`${API_URL}/expense/deleteExpense/${id}`)
        .then((res) => {
            li.remove();
        })
        .catch((err) => {
            console.log("Delete error:", err);
        })
}

// use this function to update user details from local storage
function editData(data) {
    const expenseInput = document.querySelector("#expense");
    const descriptionInput = document.querySelector("#description");
    const categoryInput = document.querySelector("#category");

    expenseInput.value = data.expense;
    descriptionInput.value = data.description;
    categoryInput.value = data.category;

    sessionStorage.setItem("editId", data.id);

    const submitBtn = document.querySelector("button[type=submit]");
    submitBtn.textContent = "Update";
}

function update(expenseList, editId, expenseDetails) {
    for (let i = 0; i < expenseList.length; i++) {
        if (expenseList[i].id == editId) {
            expenseList[i].expense = expenseDetails.expense;
            expenseList[i].description = expenseDetails.description;
            expenseList[i].category = expenseDetails.category;
        }
    }

    const li = document.getElementById(editId);

    li.firstChild.textContent = expenseDetails.expense + " " + expenseDetails.description + " " + expenseDetails.category;

    sessionStorage.removeItem("editId");

    const submitBtn = document.querySelector("button[type=submit]");
    submitBtn.textContent = "submit";

}

async function buyPremium() {
  try {
    setAuthToken();

    if (!sessionStorage.getItem("token")) {
      window.location.href = "login.html";
      return;
    }

    const response = await axios.post(
      `${API_URL}/payment/create-order`,
      {}
    );

    const cashfree = Cashfree({ mode: "sandbox" });

    await cashfree.checkout({
      paymentSessionId: response.data.paymentSessionId,
      redirectTarget: "_self",
    });
  } catch (error) {
    console.error(
      "Unable to start payment:",
      error.response?.data || error.message
    );

    alert(
      error.response?.data?.message ||
      "Unable to start payment. Please try again."
    );
  }
}

function showPremiumStatus() {
    const isPremium = sessionStorage.getItem("isPremium") === "true";

    const premiumSection = document.getElementById("premiumSection");
    const buyPremiumButton = document.querySelector(
        'button[onclick="buyPremium()"]'
    );

    if (isPremium) {
        premiumSection.classList.remove("d-none");

        if (buyPremiumButton) {
            buyPremiumButton.classList.add("d-none");
        }
    } else {
        premiumSection.classList.add("d-none");

        if (buyPremiumButton) {
            buyPremiumButton.classList.remove("d-none");
        }
    }
}

document.addEventListener("DOMContentLoaded", showPremiumStatus);

function showLeaderboard() {
    axios.get(`${API_URL}/premium/showLeaderboard`)
        .then((res) => {
            const leaderboardSection =
                document.getElementById("leaderboardSection");

            const leaderboardBody =
                document.getElementById("leaderboardBody");

            // Clear previous leaderboard data
            leaderboardBody.innerHTML = "";

            // Display leaderboard
            res.data.forEach((item, index) => {
                const row = document.createElement("tr");

                const rankCell = document.createElement("td");
                rankCell.textContent = index + 1;

                const nameCell = document.createElement("td");
                nameCell.textContent = item.name;

                const expenseCell = document.createElement("td");
                expenseCell.textContent =
                    Number(item.totalExpense).toLocaleString("en-IN");

                row.appendChild(rankCell);
                row.appendChild(nameCell);
                row.appendChild(expenseCell);

                leaderboardBody.appendChild(row);
            });

            // Show leaderboard section
            leaderboardSection.classList.remove("d-none");

            // Optional: scroll down to the leaderboard
            leaderboardSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        })
        .catch((err) => {
            console.error(err);
            alert("Unable to load leaderboard.");
        });
}