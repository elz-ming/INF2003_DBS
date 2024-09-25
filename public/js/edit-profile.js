document.getElementById('edit-profile').addEventListener('submit', async (e) => {
  e.preventDefault();  // Prevent the default form submission

  // Collect form data
  const name = document.getElementById('edit-name').value;
  const email = document.getElementById('edit-email').value;
  const password = document.getElementById('edit-password').value;

  // Log the form data for debugging
  console.log("Form Data: ", { name, email, password });

  // Send the form data to the server via a POST request
  try {
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',  // Specify the content type
      },
      body: JSON.stringify({ name, email, password })  // Send the form data as JSON
    });

    // Log the response from the server
    console.log("Response received from server: ", response);

    const result = await response.json();  // Parse the JSON response

    if (response.ok) {
      alert('Profile updated successfully!');  // Notify user of success
    } else {
      console.log("Error from API: ", result);
      alert(`Error: ${result.error || 'Failed to update profile'}`);  // Show error message
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('An error occurred while updating your profile.');  // Handle any errors
  }
});
