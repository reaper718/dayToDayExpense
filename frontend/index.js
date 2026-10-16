const API_URL = "http://localhost:3000"
// const API_URL = "";

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

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
    const token = sessionStorage.getItem("token");

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
    const note = event.target.note.value;
    const category = event.target.category.value;

    const expenseDetails = { expense, description, note, category };

    const editId = sessionStorage.getItem("editId");

    if (editId) {
        axios.put(`${API_URL}/expense/editExpense/${editId}`, expenseDetails)
            .then((res) => {
                const li = document.getElementById(editId);
                const expenseInfo = li.querySelector("div");

                expenseInfo.innerHTML = `
                    <strong>${res.data.expense}</strong>
                    <span class="ms-3">${res.data.description}</span>
                    <span class="ms-3">${res.data.note}</span>
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
        <span class="ms-3">${data.note}</span>
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


let reportTransactions = [];

async function initializeExpenseReports() {
    const reportSection = document.getElementById('expenseReportsSection');

    if (!reportSection) return;

    try {
        const response = await axios.get(
            `${API_URL}/premium/report`,
            {
                params: {
                    period: document.getElementById('reportPeriod').value,
                    date: document.getElementById('reportDate').value,
                    type: document.getElementById('reportType').value
                }
            }
        );

        // Only reveal reports after the backend confirms premium access.
        reportSection.classList.remove('d-none');

        renderExpenseReport(response.data);

    } catch (error) {
        reportSection.classList.add('d-none');

        if (error.response?.status !== 403) {
            console.error(
                'Unable to initialize reports:',
                error.response?.data || error.message
            );
        }
    }
}

function renderExpenseReport(report) {
    document.getElementById('reportIncome').textContent =
        `₹${Number(report.totalIncome).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    document.getElementById('reportExpenses').textContent =
        `₹${Number(report.totalExpenses).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    document.getElementById('reportSavings').textContent =
        `₹${Number(report.savings).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    reportTransactions = report.transactions;

    const tbody = document.getElementById('reportTransactionsBody');
    tbody.replaceChildren();

    if (reportTransactions.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 5;
        cell.className = 'text-center text-muted py-4';
        cell.textContent = 'No transactions found for this period.';

        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    reportTransactions.forEach(transaction => {
        const row = document.createElement('tr');

        [
            transaction.date,
            transaction.description,
            transaction.category,
            transaction.type,
            `₹${transaction.amount.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`
        ].forEach((value, index) => {
            const cell = document.createElement('td');
            cell.textContent = value;

            if (index === 4) {
                cell.className = 'text-end';
            }

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}

// Reload the report when filters change.
['reportPeriod', 'reportDate', 'reportType'].forEach(id => {
    document.getElementById(id)?.addEventListener(
        'change',
        initializeExpenseReports
    );
});

// Download the currently displayed report.
document.getElementById('downloadExpensesBtn')?.addEventListener(
    'click',
    () => {
        const section = document.getElementById('expenseReportsSection');

        if (!section || section.classList.contains('d-none')) return;

        const rows = [
            ['Date', 'Description', 'Category', 'Type', 'Amount'],
            ...reportTransactions.map(t => [
                t.date,
                t.description,
                t.category,
                t.type,
                t.amount
            ])
        ];

        const csv = rows.map(row =>
            row.map(value =>
                `"${String(value ?? '').replace(/"/g, '""')}"`
            ).join(',')
        ).join('\r\n');

        const blob = new Blob(['\uFEFF' + csv], {
            type: 'text/csv;charset=utf-8;'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'expense-report.csv';
        link.click();

        URL.revokeObjectURL(url);
    }
);

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();

    document.getElementById('reportDate').value =
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    initializeExpenseReports();
});