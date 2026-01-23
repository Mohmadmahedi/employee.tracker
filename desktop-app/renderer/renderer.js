const loginForm = document.getElementById('login-form');
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const authError = document.getElementById('auth-error');

const statusText = document.getElementById('status-text');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const logoutBtn = document.getElementById('logoutBtn');
const lastSyncText = document.getElementById('last-sync');

let currentUser = null;

// Handle Login
loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:5000/api/auth/employee/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      currentUser = data.data.employee;
      const token = data.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data.data.employee));

      showDashboard();
    } else {
      authError.innerText = data.message || 'Login failed';
    }
  } catch (err) {
    authError.innerText = 'Server connection failed';
  }
};

function showDashboard() {
  loginContainer.style.display = 'none';
  dashboardContainer.style.display = 'block';
  document.getElementById('employee-name').innerText = `Welcome, ${currentUser.full_name}`;
  document.getElementById('employee-id').innerText = `ID: ${currentUser.id.substring(0, 8)}`;
}

// Session Controls
startBtn.onclick = () => {
  const token = localStorage.getItem('token');
  window.trackerAPI.startTracking({ token, employeeId: currentUser.id });

  startBtn.disabled = true;
  stopBtn.disabled = false;
};

stopBtn.onclick = () => {
  window.trackerAPI.stopTracking();

  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusText.innerText = 'OFFLINE';
};

logoutBtn.onclick = () => {
  window.trackerAPI.stopTracking();
  localStorage.clear();
  window.location.reload();
};

// Listen for status updates from main process
window.trackerAPI.onStatusUpdate((status) => {
  statusText.innerText = status;
  statusText.style.color = status === 'WORKING' ? '#059669' : (status === 'BREAK' ? '#d97706' : '#64748b');
  lastSyncText.innerText = `Last sync: ${new Date().toLocaleTimeString()}`;
});

window.trackerAPI.onTrackingStarted((result) => {
  if (result.success) {
    statusText.innerText = 'WORKING';
    statusText.style.color = '#059669';
  } else {
    alert('Failed to start tracking: ' + result.error);
  }
});

// Check if already logged in
window.onload = () => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      let user = JSON.parse(savedUser);
      // Handle old format where data might have been nested differently
      if (user.employee) {
        user = user.employee;
        localStorage.setItem('user', JSON.stringify(user));
      }

      if (user.id && user.full_name) {
        currentUser = user;
        showDashboard();
        window.trackerAPI.requestStatus();
      } else {
        localStorage.clear();
      }
    } catch (e) {
      localStorage.clear();
    }
  }
};
