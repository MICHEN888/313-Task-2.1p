const API_BASE = 'http://localhost:3000/api';
const REGISTER_ENDPOINT = `${API_BASE}/register`;

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
                    resolve(JSON.parse(xhr.responseText));
                } catch (e) {
                    resolve(xhr.responseText);
                }
            } else {
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    reject({
                        status: xhr.status,
                        message: errorResponse.message || 'Request failed'
                    });
                } catch (e) {
                    reject({
                        status: xhr.status,
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
    });
}

const registerForm = document.getElementById('registerForm');
const nameInput = document.getElementById('name');
const accountInput = document.getElementById('account');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const registerButton = document.getElementById('registerButton');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('emailError');

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

const errorElements = {
    name: document.getElementById('nameError'),
    email: emailError,
    account: document.getElementById('accountError'),
    password: document.getElementById('passwordError'),
    confirmPassword: document.getElementById('confirmPasswordError')
};

function setupPasswordToggle(input, toggle) {
    toggle.addEventListener('click', function () {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);

        const icon = this.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }
    });
}

if (togglePassword) setupPasswordToggle(passwordInput, togglePassword);
if (toggleConfirmPassword) setupPasswordToggle(confirmPasswordInput, toggleConfirmPassword);

function validateForm() {
    let isValid = true;

    Object.values(errorElements).forEach(el => el.textContent = '');
    nameInput.classList.remove('error');
    accountInput.classList.remove('error');
    passwordInput.classList.remove('error');
    confirmPasswordInput.classList.remove('error');
    emailInput.classList.remove('error');

    if (!nameInput.value.trim()) {
        errorElements.name.textContent = 'Full name is required';
        nameInput.classList.add('error');
        isValid = false;
    }

    const email = emailInput.value.trim();
    if (!email) {
        errorElements.email.textContent = 'Email is required';
        emailInput.classList.add('error');
        isValid = false;
    } else if (!validateEmail(email)) {
        errorElements.email.textContent = 'Please enter a valid email address';
        emailInput.classList.add('error');
        isValid = false;
    }

    const account = accountInput.value.trim();
    if (!account) {
        errorElements.account.textContent = 'Account is required';
        accountInput.classList.add('error');
        isValid = false;
    } else if (account.length < 4) {
        errorElements.account.textContent = 'Account must be at least 4 characters';
        accountInput.classList.add('error');
        isValid = false;
    }

    const password = passwordInput.value;
    if (!password) {
        errorElements.password.textContent = 'Password is required';
        passwordInput.classList.add('error');
        isValid = false;
    } else if (password.length < 6) {
        errorElements.password.textContent = 'Password must be at least 6 characters';
        passwordInput.classList.add('error');
        isValid = false;
    }

    const confirmPassword = confirmPasswordInput.value;
    if (!confirmPassword) {
        errorElements.confirmPassword.textContent = 'Please confirm your password';
        confirmPasswordInput.classList.add('error');
        isValid = false;
    } else if (password !== confirmPassword) {
        errorElements.confirmPassword.textContent = 'Passwords do not match';
        confirmPasswordInput.classList.add('error');
        isValid = false;
    }

    return isValid;
}

registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateForm()) return;

    registerButton.disabled = true;
    registerButton.textContent = 'Creating Account...';

    try {
        const userData = {
            id: accountInput.value.trim(),
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            account: accountInput.value.trim(),
            password: passwordInput.value * 1
        };

        const response = await Ajax({
            method: 'POST',
            url: REGISTER_ENDPOINT,
            data: userData
        });

        console.log('Registration successful:', response);
        alert('Registration successful! Please check your email to verify your account.');

        window.location.href = './login.html';

    } catch (error) {
        console.error('Registration error:', error);

        if (error.status === 400) {
            if (error.message.includes('email')) {
                errorElements.email.textContent = error.message;
                emailInput.classList.add('error');
            } else {
                errorElements.account.textContent = error.message;
                accountInput.classList.add('error');
            }
        } else {
            errorElements.account.textContent = 'An error occurred. Please try again later.';
        }

        registerButton.disabled = false;
        registerButton.textContent = 'Create Account';
    }
});