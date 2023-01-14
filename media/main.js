
window.addEventListener("message", (event) => {
  const message = event.data;
  document.getElementById("output").innerHTML = `<h3>${message.value}</h3>`;
});
