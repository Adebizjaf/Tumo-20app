// Simple test script to diagnose translation issues

async function testTranslation() {
  try {
    console.log('Testing translation endpoint...');
    
    const response = await fetch('http://localhost:8080/api/translation/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'hello',
        source: 'en',
        target: 'es'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const data = await response.text();
    console.log('Response data:', data);
    
    if (response.ok) {
      try {
        const json = JSON.parse(data);
        console.log('Parsed JSON:', json);
      } catch (e) {
        console.log('Failed to parse as JSON');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testTranslation();