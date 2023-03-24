// const forms = document.querySelectorAll("form")

// for (i=1; i<forms.length;i++){
//     const src = forms[i]
//     console.log(src);
//     forms[i].addEventListener("click",()=>{
//         src.submit()
//     })
// }

function toggleNav() {
  var sidebar = document.getElementById("mySidebar");
  var openbtn = document.querySelector(".openbtn");

  if (sidebar.style.left === "-250px") {
    sidebar.style.left = "0";
    openbtn.innerHTML = "×";
  } else {
    sidebar.style.left = "-250px";
    openbtn.innerHTML = "☰";
  }
}