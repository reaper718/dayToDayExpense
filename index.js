const API_URL = "http://localhost:3000"

function handleFormSubmit(event) {
    event.preventDefault();

    const signUp = {
        name: event.target.name.value,
        email: event.target.email.value,
        password: event.target.password.value
    }

    axios.post(`${API_URL}/users/signup`,signUp)
        .then((res) => {
            console.log("signuo created");
            event.target.reset();
            
        })
        .catch(err => console.log(err));
}

function handleLogin(event) {
    event.preventDefault();

    const loginDetails = {
        email: event.target.email.value,
        password: event.target.password.value
    }

    console.log(loginDetails)

    axios.post(`${API_URL}/users/login`,loginDetails)
        .then((res) => {
            alert("user logged in")
        })
        .catch(err => console.log(err));
}