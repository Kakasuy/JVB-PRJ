// Simple test to verify form behavior
// Open browser console and run this after the form is loaded

// Function to test form submission
function testFormSubmission() {
  console.log('=== TESTING FORM SUBMISSION ===');
  
  const form = document.querySelector('form');
  if (!form) {
    console.error('Form not found');
    return;
  }
  
  console.log('Form found:', form);
  
  const formData = new FormData(form);
  const formEntries = Object.fromEntries(formData.entries());
  
  console.log('Current form data:');
  console.log('- location:', formEntries.location || 'NOT SET');
  console.log('- checkInDate:', formEntries.checkInDate || 'NOT SET');
  console.log('- checkOutDate:', formEntries.checkOutDate || 'NOT SET'); 
  console.log('- adults:', formEntries.adults || 'NOT SET');
  
  console.log('All form entries:', formEntries);
}

// Run the test
testFormSubmission();

// Also add event listener for form submission
const form = document.querySelector('form');
if (form) {
  form.addEventListener('submit', (e) => {
    console.log('=== FORM SUBMITTED ===');
    testFormSubmission();
  });
  console.log('Form submission listener added');
}