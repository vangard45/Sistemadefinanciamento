function fazerlogin() {
    //pegara os valores dos inputs
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    //fazer login com farebase
    firebase.auth().signInWithEmailAndPassword(email, password)

    .then((usuario) => {
        //login bem sucedido
        console.log("Login bem sucedido:", usuario);
        alert("Login bem sucedido!");
        // Redirecionar para a página principal ou outra página após o login
        window.location.href = "home.html";
    })
    .catch((error) => {
        //erro no login
        console.error("Erro no login:", error);
        alert("Erro no login: " + error.message);
    });
}