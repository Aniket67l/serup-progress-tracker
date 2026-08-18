import {
  auth,
  db,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  doc,
  setDoc,
  onSnapshot
} from "./firebase.js";

const TZ = "Asia/Kolkata";
const target = new Date(PROGRESS_DATA.testDate);

function parts() {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false
    })
      .formatToParts(new Date())
      .map(x => [x.type, x.value])
  );
}

function dayKey() {
  let p = parts();
  let d = new Date(
    `${p.year}-${p.month}-${p.day}T00:00:00+05:30`
  );

  if (+p.hour < 4) {
    d.setDate(d.getDate() - 1);
  }

  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function label(k) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(
    new Date(`${k}T12:00:00+05:30`)
  );
}

const key = dayKey();

const base = PROGRESS_DATA.history[key] || {
  lectures: [false, false, false],
  questions: false,
  revision: false,
  coaching: false
};

let d =
  JSON.parse(
    localStorage.getItem("serup-" + key) || "null"
  ) || structuredClone(base);

let stopCloudListener = null;


/* =========================
   FIRESTORE LIVE LISTENER
   ========================= */

function loadCloudProgress() {

  if (stopCloudListener) {
    stopCloudListener();
    stopCloudListener = null;
  }

  const progressRef = doc(db, "progress", key);

  stopCloudListener = onSnapshot(
    progressRef,

    snap => {

      if (snap.exists()) {

        d = {
          lectures: [false, false, false],
          questions: false,
          revision: false,
          coaching: false,
          ...snap.data()
        };

        localStorage.setItem(
          "serup-" + key,
          JSON.stringify(d)
        );

        render();
        bars();

        console.log(
          "☁️ LIVE progress received:",
          key
        );

      } else {

        console.log(
          "☁️ No cloud progress for today yet."
        );
      }
    },

    error => {
      console.error(
        "Firestore live sync failed:",
        error
      );
    }
  );
}


/* =========================
   SAVE PROGRESS
   ========================= */

async function save() {

  localStorage.setItem(
    "serup-" + key,
    JSON.stringify(d)
  );

  if (auth.currentUser) {

    try {

      await setDoc(
        doc(db, "progress", key),
        d,
        { merge: true }
      );

      console.log(
        "☁️ Progress synced:",
        key
      );

    } catch (error) {

      console.error(
        "Firestore save failed:",
        error
      );

      authStatus.textContent =
        "Cloud save failed";
    }
  }

  render();
}


/* =========================
   RENDER TODAY
   ========================= */

function render() {

  date.textContent = label(key);
  today.textContent = label(key);

  let start = new Date(
    "2026-08-18T04:00:00+05:30"
  );

  let cur = new Date(
    `${key}T04:00:00+05:30`
  );

  day.textContent =
    "DAY " +
    Math.max(
      1,
      Math.floor((cur - start) / 864e5) + 1
    );

  lectures.innerHTML = "";

  d.lectures.forEach((v, i) => {

    let l = document.createElement("label");

    l.innerHTML =
      `<input type="checkbox" ${v ? "checked" : ""}> Lecture ${i + 1}`;

    l.firstChild.onchange = e => {

      d.lectures[i] =
        e.target.checked;

      save();
    };

    lectures.append(l);
  });

  ls.textContent =
    d.lectures.filter(Boolean).length + "/3";

  q.checked = d.questions;
  r.checked = d.revision;
  c.checked = d.coaching;
}


/* =========================
   DAILY CHECKBOXES
   ========================= */

[q, r, c].forEach((x, i) => {

  x.onchange = () => {

    d[
      ["questions", "revision", "coaching"][i]
    ] = x.checked;

    save();
  };
});


/* =========================
   BACKLOG / OVERALL
   ========================= */

function bars() {

  let total = 0;
  let done = 0;

  for (
    const [n, x]
    of Object.entries(PROGRESS_DATA.backlog)
  ) {

    let id =
      n === "maths"
        ? "m"
        : n;

    let dEl =
      document.getElementById(id + "d");

    let b =
      document.getElementById(id + "b");

    if (dEl)
      dEl.textContent = x.done;

    if (b)
      b.style.width =
        (x.done / x.total * 100) + "%";

    total += x.total;
    done += x.done;
  }

  if (
    typeof left !== "undefined" &&
    left
  ) {
    left.textContent =
      total - done;
  }

  let pct = Math.round(
    done / total * 65 +
    (
      (
        d.lectures.filter(Boolean).length +
        (d.questions ? 1 : 0) +
        (d.revision ? 1 : 0) +
        (d.coaching ? 1 : 0)
      ) / 6
    ) * 35
  );

  if (
    typeof overall !== "undefined" &&
    overall
  ) {
    overall.textContent =
      pct + "%";
  }

  if (
    typeof overallBar !== "undefined" &&
    overallBar
  ) {
    overallBar.style.width =
      pct + "%";
  }
}


/* =========================
   COUNTDOWN
   ========================= */

function clock() {

  let z = target - new Date();

  if (z <= 0) {
    countdown.textContent =
      "BATTLE DAY";
    return;
  }

  let a =
    Math.floor(z / 864e5);

  let h =
    Math.floor(
      z % 864e5 / 36e5
    );

  let m =
    Math.floor(
      z % 36e5 / 6e4
    );

  let s =
    Math.floor(
      z % 6e4 / 1e3
    );

  countdown.textContent =
    `${a}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}


/* =========================
   INITIAL RENDER
   ========================= */

render();
bars();
clock();

setInterval(clock, 1000);

setInterval(
  () => location.reload(),
  60000
);


/* =========================
   BEST FRIEND
   ========================= */

document.getElementById(
  "friendName"
).textContent =
  PROGRESS_DATA.bestFriend.name;

document.getElementById(
  "friendRole"
).textContent =
  PROGRESS_DATA.bestFriend.role;

document.getElementById(
  "friendMessage"
).textContent =
  PROGRESS_DATA.bestFriend.message;


/* =========================
   AUTH ELEMENTS
   ========================= */

const loginBtn =
  document.getElementById("loginBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const loginEmail =
  document.getElementById("loginEmail");

const loginPassword =
  document.getElementById("loginPassword");

const authStatus =
  document.getElementById("authStatus");


/* =========================
   LOGIN
   ========================= */

loginBtn.onclick = async () => {

  try {

    await signInWithEmailAndPassword(
      auth,
      loginEmail.value.trim(),
      loginPassword.value
    );

    loginPassword.value = "";

  } catch (error) {

    console.error(error);

    authStatus.textContent =
      "Login failed: " +
      error.code;
  }
};


/* =========================
   LOGOUT
   ========================= */

logoutBtn.onclick = () =>
  signOut(auth);


/* =========================
   AUTH STATE
   ========================= */

onAuthStateChanged(
  auth,
  user => {

    if (user) {

      authStatus.textContent =
        "OWNER MODE • " +
        user.email;

      loginBtn.hidden = true;
      loginEmail.hidden = true;
      loginPassword.hidden = true;

      logoutBtn.hidden = false;

      document.body.classList.add(
        "owner-mode"
      );

    } else {

      authStatus.textContent =
        "PUBLIC VIEW";

      loginBtn.hidden = false;
      loginEmail.hidden = false;
      loginPassword.hidden = false;

      logoutBtn.hidden = true;

      document.body.classList.remove(
        "owner-mode"
      );
    }

    /*
      IMPORTANT:
      Both owner and public visitor
      listen to Firestore.
    */

    loadCloudProgress();
  }
);