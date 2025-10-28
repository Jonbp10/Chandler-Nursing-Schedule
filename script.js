/* ==== Firebase Config – REPLACE WITH YOUR OWN ==== */
const firebaseConfig = {
  apiKey: "AIzaSyDBbTKOodVAIS-BEskbu0BDO6zytar-P1g",
  authDomain: "chandler-nursing-schedul-e4252.firebaseapp.com",
  projectId: "chandler-nursing-schedul-e4252",
  storageBucket: "chandler-nursing-schedul-e4252.firebasestorage.app",
  messagingSenderId: "436695645809",
  appId: "1:436695645809:web:ec234d03a926c62ae125d0",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* ==== Helper: Show Message ==== */
function showMsg(id, text, isError = true) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.style.color = isError ? '#e74c3c' : '#27ae60';
}

/* ==== LOGIN (index.html) ==== */
function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const pwd   = document.getElementById('loginPassword').value;
  if (!email || !pwd) return showMsg('loginMsg', 'Fill all fields');

  auth.signInWithEmailAndPassword(email, pwd)
    .then(() => { window.location.href = 'dashboard.html'; })
    .catch(err => showMsg('loginMsg', err.message));
}

/* ==== SIGN-UP (signup.html) ==== */
function signup() {
  const first = document.getElementById('firstName').value.trim();
  const last  = document.getElementById('lastName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const phone = document.getElementById('signupPhone').value.trim();
  const pwd   = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('confirmPassword').value;

  // ---- Validation ----
  if (!first || !last || !email || !phone || !pwd || !confirm) {
    return showMsg('signupMsg', 'All fields are required');
  }
  if (pwd !== confirm) return showMsg('signupMsg', 'Passwords do not match');
  if (pwd.length < 8) return showMsg('signupMsg', 'Password must be 8+ characters');

  // ---- Create Auth User ----
  auth.createUserWithEmailAndPassword(email, pwd)
    .then(cred => {
      const uid = cred.user.uid;
      // ---- Save Profile (first, last, phone, email) ----
      return db.collection('users').doc(uid).set({
        firstName: first,
        lastName:  last,
        fullName:  first + ' ' + last,
        email:     email,
        phone:     phone,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      showMsg('signupMsg', 'Account created! Redirecting...', false);
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
    })
    .catch(err => showMsg('signupMsg', err.message));
}

/* ==== LOGOUT ==== */
function logout() {
  auth.signOut().then(() => { window.location.href = 'index.html'; });
}

/* ==== DASHBOARD: Auth Guard ==== */
if (window.location.pathname.includes('dashboard.html')) {
  auth.onAuthStateChanged(user => {
    if (!user) { window.location.href = 'index.html'; return; }

    // Show user name
    db.collection('users').doc(user.uid).get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();
          document.getElementById('userDisplay').textContent = `Welcome, ${data.fullName}`;
        }
      });

    loadEmployees();
    initCalendar();
  });
}

/* ==== EMPLOYEE LIST ==== */
function loadEmployees() {
  db.collection('users').orderBy('lastName').get()
    .then(snap => {
      const tbody = document.querySelector('#empTable tbody');
      tbody.innerHTML = '';
      snap.forEach(doc => {
        const d = doc.data();
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${d.fullName}</td><td>${d.phone}</td><td>${d.email}</td>`;
        tbody.appendChild(tr);
      });
    });
}

/* ==== CALENDAR (FullCalendar) ==== */
let calendar;
function initCalendar() {
  const calEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calEl, {
    initialView: 'dayGridMonth',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' },
    events: (info, successCB, failureCB) => {
      db.collection('shifts').get()
        .then(snap => {
          const evts = [];
          snap.forEach(doc => {
            const d = doc.data();
            evts.push({
              title: `${d.title} – ${d.assignedName || 'Unassigned'}`,
              start: d.start,
              end: d.end || null
            });
          });
          successCB(evts);
        })
        .catch(failureCB);
    }
  });
  calendar.render();
}

/* ==== SECTION SWITCH ==== */
function showCalendar() {
  document.getElementById('employeesSection').style.display = 'none';
  document.getElementById('calendarSection').style.display = 'block';
}
function showEmployees() {
  document.getElementById('calendarSection').style.display = 'none';
  document.getElementById('employeesSection').style.display = 'block';
}

// ==== ADD SHIFT FORM ====
let employees = [];

function showAddShift() {
  document.getElementById('calendarSection').style.display = 'none';
  document.getElementById('employeesSection').style.display = 'none';
  document.getElementById('addShiftSection').style.display = 'block';

  loadEmployeesForShift();  // Populate dropdown
  document.getElementById('shiftDate').valueAsDate = new Date();  // Today
}

function loadEmployeesForShift() {
  db.collection('users').orderBy('lastName').get()
    .then(snap => {
      employees = [];
      const select = document.getElementById('employeeSelect');
      select.innerHTML = '<option value="">Select Employee</option>';

      snap.forEach(doc => {
        const d = doc.data();
        const full = `${d.firstName} ${d.lastName.charAt(0)}.`;
        employees.push({ id: doc.id, name: full });
        const opt = document.createElement('option');
        opt.value = doc.id;
        opt.textContent = full;
        select.appendChild(opt);
      });
    });
}

function saveShift() {
  const unit = document.getElementById('unitSelect').value;
  const empId = document.getElementById('employeeSelect').value;
  const shift = document.getElementById('shiftSelect').value;
  const date = document.getElementById('shiftDate').value;

  if (!unit || !empId || !shift || !date) {
    return showMsg('shiftMsg', 'Please fill all fields');
  }

  const emp = employees.find(e => e.id === empId);
  if (!emp) return showMsg('shiftMsg', 'Invalid employee');

  const [startH, endH] = shift.split('-');
  const startTime = `${date}T${startH}:00`;
  const endTime = `${date}T${endH}:00`;

  showMsg('shiftMsg', 'Saving shift...', false);

  db.collection('shifts').add({
    unit: unit,
    assignedTo: empId,
    assignedName: emp.name,
    title: `${unit} - ${emp.name}`,
    start: startTime,
    end: endTime,
    shiftType: shift
  })
  .then(() => {
    showMsg('shiftMsg', 'Shift added!', false);
    
    // REFRESH CALENDAR
    if (calendar) {
      calendar.refetchEvents();
    }

    setTimeout(() => {
      showCalendar();  // Go back to calendar
    }, 1000);
  })
  .catch(err => {
    console.error("Save shift error:", err);
    showMsg('shiftMsg', 'Error: ' + err.message);
  });
}

// Update calendar events to show unit + name + shift
function initCalendar() {
  const calEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calEl, {
    initialView: 'dayGridMonth',
    headerToolbar: { 
      left: 'prev,next today', 
      center: 'title', 
      right: 'dayGridMonth,timeGridWeek' 
    },
    events: (info, successCB, failureCB) => {
      db.collection('shifts').get()
        .then(snap => {
          const evts = [];
          snap.forEach(doc => {
            const d = doc.data();
            evts.push({
              title: `${d.unit} – ${d.assignedName} [${d.shiftType}]`,
              start: d.start,
              end: d.end
            });
          });
          successCB(evts);
        })
        .catch(failureCB);
    }
  });
  calendar.render();
}