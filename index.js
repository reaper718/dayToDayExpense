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