// Get the modal
var modal = document.getElementById("myModal");

// When the user clicks the button, open the modal
function showModal(){
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
function hideModal(){
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.addEventListener("click", function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
})
