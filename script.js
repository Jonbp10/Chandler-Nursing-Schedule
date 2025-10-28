// Your Firebase config (paste from console)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Auth State Listener: Show dashboard if logged in
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadEmployees();  // Load employee list
    initCalendar();   // Init calendar
  } else {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    showLogin();  // Default to login
  }
});

// Toggle Forms
function showSignup() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('signupForm').style.display = 'block';
}
function showLogin() {
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
}

// Sign Up: Create user + profile
function signup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const phone = document.getElementById('signupPhone').value.trim();
  const password = document.getElementById('signupPassword').value;

  if (!name || !email || !phone || !password) {
    alert('Please fill all fields.');
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      // Add profile to Firestore
      db.collection('users').doc(user.uid).set({
        name: name,
        email: email,
        phone: phone,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        alert('Account created! Welcome to Chandler Nursing.');
      });
    })
    .catch(error => {
      alert('Error: ' + error.message);
    });
}

// Login
function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    alert('Please fill email and password.');
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .catch(error => {
      alert('Login failed: ' + error.message);
    });
}

// Logout
function logout() {
  auth.signOut();
}

// Show Sections
function showCalendar() {
  document.getElementById('employeesSection').style.display = 'none';
  document.getElementById('calendarSection').style.display = 'block';
}
function showEmployees() {
  document.getElementById('calendarSection').style.display = 'none';
  document.getElementById('employeesSection').style.display = 'block';
}

// Load Employee List (from Firestore)
function loadEmployees() {
  db.collection('users').get().then(snapshot => {
    const tbody = document.querySelector('#employeesTable tbody');
    tbody.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${data.name}</td><td>${data.phone}</td><td>${data.email}</td>`;
      tbody.appendChild(tr);
    });
  }).catch(error => console.error('Error loading employees:', error));
}

// Initialize Calendar (FullCalendar)
let calendar;
function initCalendar() {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',  // Monthly view
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'  // Navigation
    },
    events: function(fetchInfo, successCallback, failureCallback) {
      // Fetch shifts from Firestore
      db.collection('shifts').get().then(snapshot => {
        const events = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          events.push({
            title: data.title + ' (Assigned to: ' + data.assignedTo + ')',
            start: data.start,
            end: data.end,
            backgroundColor: '#27ae60'
          });
        });
        successCallback(events);
      }).catch(failureCallback);
    },
    eventDisplay: 'block'
  });
  calendar.render();
}