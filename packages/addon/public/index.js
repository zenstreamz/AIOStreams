document.getElementById('configForm').addEventListener('submit', function(event) {
  event.preventDefault();
  const apiKey = document.getElementById('apiKey').value;
  alert(`API Key submitted: ${apiKey}`);
  // You can add more logic here to handle the form submission
});