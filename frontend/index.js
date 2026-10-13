const API_URL = "http://localhost:3000"

let allExpenses = [];
let currentPage = 1;

const PAGE_SIZE_KEY = "expensesPerPage";

let expensesPerPage = Number(
    localStorage.getItem(PAGE_SIZE_KEY)
) || 10;

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


// const forgotPasswordLink = document.getElementById("forgotPasswordLink");
// const forgotPasswordForm = document.getElementById("forgotPasswordForm");
// const backToLogin = document.getElementById("backToLogin");
// const forgotMessage = document.getElementById("forgotMessage");

// forgotPasswordLink.addEventListener("click", (event) => {
//     event.preventDefault();

//     forgotPasswordForm.classList.remove("d-none");
//     forgotMessage.textContent = "";
//     document.getElementById("forgotEmail").value = "";
// });

// backToLogin.addEventListener("click", () => {
//     forgotPasswordForm.classList.add("d-none");
//     forgotMessage.textContent = "";
// });

// forgotPasswordForm.addEventListener("submit", async (event) => {
//     event.preventDefault();

//     const email = document.getElementById("forgotEmail").value.trim();

//     try {
//         const response = await axios.post(
//             `${API_URL}/password/forgotpassword`,
//             { email }
//         );

//         forgotMessage.textContent =
//             response.data.message || "Request submitted successfully.";

//         forgotMessage.className = "small text-center mt-2 text-success";
//     } catch (error) {
//         console.error(error);

//         forgotMessage.textContent =
//             error.response?.data?.message ||
//             "Unable to process your request. Please try again.";

//         forgotMessage.className = "small text-center mt-2 text-danger";
//     }
// });


document.addEventListener("DOMContentLoaded", initialize);


function initialize() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const pageSizeSelect = document.getElementById("pageSize");

    if (pageSizeSelect) {
        // Restore the user's saved preference
        pageSizeSelect.value = String(expensesPerPage);

        // Save preference whenever the user changes it
        pageSizeSelect.addEventListener("change", function () {
            expensesPerPage = Number(this.value);
            localStorage.setItem(PAGE_SIZE_KEY, expensesPerPage);

            // Reset to the first page with the new page size
            currentPage = 1;
            renderExpenses();
        });
    }

    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderExpenses();
        }
    });

    document.getElementById("nextPage").addEventListener("click", () => {
        const totalPages = Math.max(
            1,
            Math.ceil(allExpenses.length / expensesPerPage)
        );

        if (currentPage < totalPages) {
            currentPage++;
            renderExpenses();
        }
    });

    axios.get(`${API_URL}/expense/getExpense`)
        .then((res) => {
            allExpenses = res.data;
            currentPage = 1;
            renderExpenses();
        })
        .catch((err) => {
            console.error(
                "Fetch error:",
                err.response?.data || err.message
            );

            if (err.response?.status === 401) {
                sessionStorage.removeItem("token");
                window.location.href = "login.html";
            }
        });
}



function renderExpenses() {
    const expenseList = document.getElementById("expenseList");
    const pageInfo = document.getElementById("pageInfo");
    const prevPage = document.getElementById("prevPage");
    const nextPage = document.getElementById("nextPage");

    const totalPages = Math.max(
        1,
        Math.ceil(allExpenses.length / expensesPerPage)
    );

    // If deletion reduces the number of pages, move to the last valid page.
    currentPage = Math.min(currentPage, totalPages);

    const startIndex = (currentPage - 1) * expensesPerPage;
    const currentExpenses = allExpenses.slice(
        startIndex,
        startIndex + expensesPerPage
    );

    expenseList.innerHTML = "";

    if (allExpenses.length === 0) {
        expenseList.innerHTML = `
            <li class="list-group-item text-muted">
                No expenses found.
            </li>
        `;
    } else {
        currentExpenses.forEach((expense) => {
            display(expense);
        });
    }

    pageInfo.textContent =
        `Page ${currentPage} of ${totalPages} | Total expenses: ${allExpenses.length}`;

    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
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
                        allExpenses.unshift(res.data);
                        currentPage = 1;
                        renderExpenses();
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
        .then(() => {
            // Remove the deleted expense from the array
            allExpenses = allExpenses.filter(
                expense => String(expense.id) !== String(id)
            );

            // Re-render pagination and remaining expenses
            renderExpenses();
        })
        .catch((err) => {
            console.log(
                "Delete error:",
                err.response?.data || err.message
            );
        });
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

// Debouncing for AI response
const descriptionInput = document.getElementById("description");
const aiResponse = document.getElementById("ai-response");

let debounceTimer;
let controller;

descriptionInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);

    if (controller) {
        controller.abort();
    }

    const description = descriptionInput.value.trim();

    if (!description) {
        aiResponse.textContent = "";
        aiResponse.style.display = "none";
        return;
    }

    aiResponse.textContent = "Generating suggestion...";
    aiResponse.style.display = "block";

    debounceTimer = setTimeout(async () => {
        controller = new AbortController();

        try {
            const response = await axios.post(
                `${API_URL}/ai`,
                { description },
                { signal: controller.signal }
            );

            aiResponse.textContent =response.data.category;

        } catch (error) {
            if (error.code !== "ERR_CANCELED") {
                console.error("AI request failed:", error);
                aiResponse.textContent =
                    "Unable to generate suggestion.";
            }
        }
    }, 700);
});