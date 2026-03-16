// test_chat.js
async function testChat() {
  const response = await fetch('http://localhost:8080/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'show me laptops under 50000' })
  });
  
  const data = await response.json();
  console.log('Response:', data);
}

testChat();