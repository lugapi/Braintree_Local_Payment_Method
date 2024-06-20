document.getElementById('webhookForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const form = event.target;
    const data = new URLSearchParams(new FormData(form));

    try {
        const response = await fetch('/webhooks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: data
        });

        const result = await response.json();
        document.getElementById('responseContent').innerHTML = prettyPrintObject(result);
    } catch (error) {
        document.getElementById('responseContent').textContent = 'Error: ' + error.message;
    }
});