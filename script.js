// Your Firebase config (paste from Step 3)
const firebaseConfig = {
  apiKey: "AIzaSyDBbTKOodVAIS-BEskbu0BDO6zytar-P1g",
  authDomain: "chandler-nursing-schedul-e4252.firebaseapp.com",
  projectId: "chandler-nursing-schedul-e4252",
  storageBucket: "chandler-nursing-schedul-e4252.firebasestorage.app",
  messagingSenderId: "436695645809",
  appId: "1:436695645809:web:ec234d03a926c62ae125d0",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Add a new event
function addEvent() {
  const text = document.getElementById("eventInput").value.trim();
  const time = document.getElementById("eventTime").value;

  if (!text || !time) {
    alert("Please fill both fields.");
    return;
  }

  db.collection("events").add({
    text: text,
    time: time,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    document.getElementById("eventInput").value = "";
    document.getElementById("eventTime").value = "";
  }).catch(err => console.error(err));
}

// Real‑time listener – updates the list automatically
db.collection("events")
  .orderBy("time")
  .onSnapshot(snapshot => {
    const ul = document.getElementById("scheduleList");
    ul.innerHTML = "";               // clear old list
    snapshot.forEach(doc => {
      const d = doc.data();
      const li = document.createElement("li");
      // format datetime nicely (e.g. 2025‑10‑28 14:30 → 2025‑10‑28 2:30 PM)
      const niceTime = new Date(d.time).toLocaleString();
      li.textContent = `${niceTime}: ${d.text}`;
      ul.appendChild(li);
    });
  });