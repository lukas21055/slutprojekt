const knapp = document.querySelector(".reg")

knapp.addEventListener("click", (e)=>{
    e.preventDefault()
    location.assign("/login")
})