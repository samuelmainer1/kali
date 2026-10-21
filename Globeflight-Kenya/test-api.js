

const testEmail = async () => {
  const response = await fetch('https://globeflight.co.ke/email-api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      mobileNumber: '+254700000000',
      inquiryType: 'support',
      message: 'Test message from deployment',
      services: ['airFreight']
    })
  });
  
  const result = await response.json();
  console.log(result);
};

testEmail();