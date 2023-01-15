window.addEventListener("message", (event) => {
  const message = event.data;
  document.getElementById("output").innerHTML = `<div>    
    <br/>
    <p><b><em>Source code:</em></b></p>
    <pre><code>${message.code}</code></pre>
    <p><b><em>${message.title}</em></b></p>
    <pre><p>${message.output}</p></pre>
    </pre>
  </div>`;
});
