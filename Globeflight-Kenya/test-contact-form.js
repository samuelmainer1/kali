// Test script for contact form integration
const testContactForm = async () => {
  const testData = {
    name: "Test User",
    email: "test@example.com",
    mobileNumber: "+254700000000",
    services: ["airFreight", "seaFreight"],
    inquiryType: "quote",
    message: "This is a test message from the contact form integration test."
  };

  try {
    console.log("Testing contact form API...");
    console.log("Test data:", testData);
    
    const response = await fetch('http://localhost:5000/api/contacts/public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Success response:", data);
    
    console.log("✅ Contact form integration test PASSED!");
    console.log("📧 Email should be sent to:");
    console.log("   - service@globeflight.co.ke");
    console.log("   - cs@globeflight.co.ke");
    console.log("📧 Auto-reply should be sent to:", testData.email);
    
  } catch (error) {
    console.error("❌ Contact form integration test FAILED:", error.message);
  }
};

// Run the test
testContactForm(); 