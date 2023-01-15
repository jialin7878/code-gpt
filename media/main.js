
function hideLoaderSpinner() {
  document.getElementById("loader").style.display = "none";
}
function showLoaderSpinner() {
  document.getElementById("loader").style.display = "block";
}

document.getElementById("output").innerHTML = `<div>
  <br/>
  <pre><p>Get started by trying a CodeGPT command.</p></pre>
</div>`;
hideLoaderSpinner();

function displayOutput(message) {
  hideLoaderSpinner();
  document.getElementById("output").innerHTML = `<div>    
    <br/>
    <p><b><em>Source code:</em></b></p>
    <pre><code>${message.code}</code></pre>
    <p><b><em>${message.title}</em></b></p>
    <pre><p>${message.output}</p></pre>
    </pre>
  </div>`;
}

function displayLoader() {
  document.getElementById("output").innerHTML = `<div>
    <br/>
    <pre><p>Hold on, I am thinking...</p></pre>
  </div>`;
  showLoaderSpinner();
}

window.addEventListener("message", (event) => {
  const message = event.data;
  switch (message.type) {
    case "OUTPUT":
      displayOutput(message);
      break;
    case "LOAD":
      displayLoader();
      break;
  }
});
