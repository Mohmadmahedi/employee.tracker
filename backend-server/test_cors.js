async function testCors() {
    try {
        console.log('Sending request with Origin: http://localhost:5173');
        const res = await fetch('http://localhost:5000/api/alerts/delete-batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5173'
            },
            body: JSON.stringify({ ids: [] })
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}
testCors();
