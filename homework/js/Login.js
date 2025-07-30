function Ajax(options) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const method = options.method || 'GET';
        let url = options.url;

        if (method === 'GET' && options.data) {
            const params = new URLSearchParams(options.data);
            url += '?' + params.toString();
        }

        xhr.open(method, url, true);

        xhr.setRequestHeader('Content-Type', 'application/json');

        const token = localStorage.getItem('authToken');
        if (token) {
            console.log(token);
            xhr.setRequestHeader('Authorization', token);
        }

        if (options.headers) {
            for (const [key, value] of Object.entries(options.headers)) {
                xhr.setRequestHeader(key, value);
            }
        }

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (e) {
                    resolve(xhr.responseText);
                }
            } else {
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    reject({
                        status: xhr.status,
                        data: xhr.data,
                        message: errorResponse.message || 'Request failed'
                    });
                } catch (e) {
                    reject({
                        status: xhr.status,
                        data: xhr.data,
                        message: xhr.statusText
                    });
                }
            }
        };

        xhr.onerror = function () {
            reject({
                status: 0,
                message: 'Network error'
            });
        };

        if (method === 'POST' || method === 'PUT') {
            xhr.send(JSON.stringify(options.data));
        } else {
            xhr.send();
        }
    })
}

const API_BASE = 'http://localhost:3000/api';
const LOGIN_ENDPOINT = `${API_BASE}/login`;

const loginForm = document.getElementById('loginForm');
const accountInput = document.getElementById('account');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const accountError = document.getElementById('accountError');
const passwordError = document.getElementById('passwordError');
const loginButton = document.getElementById('loginButton');

// Toggle password visibility
togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
});

// Form validation
function validateForm() {
    let isValid = true;

    // Reset error messages
    accountError.textContent = '';
    passwordError.textContent = '';
    accountInput.classList.remove('error');
    passwordInput.classList.remove('error');

    // Validate account
    if (!accountInput.value.trim()) {
        accountError.textContent = 'Account is required';
        accountInput.classList.add('error');
        isValid = false;
    }

    // Validate password
    if (!passwordInput.value) {
        passwordError.textContent = 'Password is required';
        passwordInput.classList.add('error');
        isValid = false;
    } else if (passwordInput.value.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters';
        passwordInput.classList.add('error');
        isValid = false;
    }

    return isValid;
}

// Handle form submission
loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateForm()) return;

    // Disable button and show loading state
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';

    try {
        const response = await Ajax({
            method: 'POST',
            url: LOGIN_ENDPOINT,
            data: {
                account: accountInput.value.trim(),
                password: passwordInput.value * 1
            }
        });

        // Handle successful login
        console.log('Login successful:', response);
        localStorage.setItem('authToken', response.data.token);

        // Show success message (in a real app, you would redirect)
        alert('Login successful! Redirecting to your dashboard...');

        // Redirect to index page
        window.location.href = '../html/Forum.html';

    } catch (error) {
        console.error('Login error:', error);

        // Show error message
        if (error.status === 401) {
            accountError.textContent = 'The username or password is incorrect';
            accountInput.classList.add('error');
            passwordInput.classList.add('error');
        } else {
            accountError.textContent = 'An error occurred. Please try again later.';
        }

        // Re-enable button
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
});