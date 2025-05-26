// Function to get CSRF token - CSRF validation is disabled
async function getCsrfToken() {
    // Return a dummy token since CSRF is disabled
    const dummyToken = 'csrf-disabled-token';
    localStorage.setItem('csrfToken', dummyToken);
    return dummyToken;
}

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');
    const errorAlert = document.getElementById('errorAlert');
    const successAlert = document.getElementById('successAlert');
    const submitBtn = document.getElementById('submitBtn');
    const loadingSpinner = submitBtn.querySelector('.loading');
    const normalText = submitBtn.querySelector('.normal-text');

    // Hide alerts initially
    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';

    // Get initial CSRF token
    await getCsrfToken();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Reset alerts
        errorAlert.style.display = 'none';
        successAlert.style.display = 'none';

        // Show loading state
        submitBtn.disabled = true;
        loadingSpinner.style.display = 'inline-block';
        normalText.style.display = 'none';

        try {
            // Get CSRF token first
            const csrfToken = await getCsrfToken();
            if (!csrfToken) {
                throw new Error('Could not get CSRF token');
            }

            // Make login request
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Login failed');
            }

            const data = await response.json();

            // Show success message
            successAlert.textContent = 'Login successful! Redirecting...';
            successAlert.style.display = 'block';

            // Clear any stored data
            localStorage.clear();

            // Store the new CSRF token for the dashboard
            if (data.csrfToken) {
                localStorage.setItem('csrfToken', data.csrfToken);
            }

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/admin';
            }, 1000);
        } catch (error) {
            console.error('Login error:', error);
            errorAlert.textContent = error.message || 'Login failed';
            errorAlert.style.display = 'block';
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            loadingSpinner.style.display = 'none';
            normalText.style.display = 'inline-block';
        }
    });
}); 