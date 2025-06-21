// ========== SAVE TIME CAPSULE ==========
function saveCapsule() {
  const message = document.getElementById("message").value.trim();
  const unlockDate = document.getElementById("unlockdate").value;
  const password = document.getElementById("password").value.trim();

  if (!message || !unlockDate) {
    return showStatus("❗ Please enter a message and select an unlock date.", "red");
  }

  const unlockTime = new Date(unlockDate).getTime();
  const now = new Date().getTime();

  if (isNaN(unlockTime)) {
    return showStatus("⚠️ Invalid date format.", "red");
  }

  const capsule = {
    message,
    unlockDate: unlockTime,
    password: password ? btoa(password) : null,
    createdAt: now,
    location: null
  };

  fetch("https://ipapi.co/json/")
    .then(res => res.json())
    .then(data => {
      capsule.location = `${data.city}, ${data.country_name}`;
      finishSaving(capsule);
    })
    .catch(() => {
      capsule.location = "Unknown";
      finishSaving(capsule);
    });
}

function finishSaving(capsule) {
  const capsules = JSON.parse(localStorage.getItem("timeCapsules")) || [];
  capsules.push(capsule);
  localStorage.setItem("timeCapsules", JSON.stringify(capsules));
  showStatus("✅ Capsule saved! Come back on the unlock date to view it.", "green");
  document.getElementById("message").value = "";
  document.getElementById("unlockdate").value = "";
  document.getElementById("password").value = "";
}

function showStatus(message, color) {
  const statusDiv = document.getElementById("capsuleStatus");
  if (statusDiv) {
    statusDiv.innerText = message;
    statusDiv.style.color = color;
  } else {
    alert(message);
  }
}

// ========== VIEW CAPSULES ==========
function viewCapsules() {
  const container = document.getElementById("capsuleList");
  if (!container) return;

  const capsules = JSON.parse(localStorage.getItem("timeCapsules")) || [];
  container.innerHTML = capsules.length === 0 ? "<p class='text-center text-gray-400'>No capsules saved yet.</p>" : "";

  capsules.forEach((capsule, index) => {
    const now = Date.now();
    const unlockTime = new Date(capsule.unlockDate);
    const isUnlocked = now >= capsule.unlockDate;

    const capsuleDiv = document.createElement("div");
    capsuleDiv.className = `rounded-xl p-4 mb-4 ${isUnlocked ? "bg-green-800" : "bg-gray-800"} hover:bg-opacity-90 cursor-pointer transition relative`;

    const status = isUnlocked ? "🟢 Capsule is ready to be viewed" : "🔒 Locked - Countdown running...";
    const dateStr = unlockTime.toLocaleDateString() + " " + unlockTime.toLocaleTimeString();

    capsuleDiv.innerHTML = `
      <div class="text-lg font-semibold">📦 Capsule ${index + 1}</div>
      <div class="text-sm text-gray-300 mb-1">Unlock Time: ${dateStr}</div>
      <div class="text-sm mb-2" id="countdown-${index}">${status}</div>
      <button onclick="deleteCapsule(${index})" class="absolute top-2 right-2 text-sm text-red-400 hover:text-red-600">🗑 Delete</button>
    `;

    capsuleDiv.addEventListener("click", (e) => {
      if (e.target.tagName.toLowerCase() === "button") return;
      if (isUnlocked) {
        if (capsule.password) {
          const entered = prompt("🔐 Enter password to unlock capsule:");
          if (entered && btoa(entered) === capsule.password) {
            showCapsuleMessage(capsule);
          } else {
            alert("❌ Incorrect password.");
          }
        } else {
          const view = confirm("🔓 Capsule is unlocked! View message?");
          if (view) showCapsuleMessage(capsule);
        }
      } else {
        alert("⏳ This capsule is still locked. Try again after the unlock date.");
      }
    });

    container.appendChild(capsuleDiv);

    if (!isUnlocked) {
      const countdownEl = document.getElementById(`countdown-${index}`);
      startCountdown(capsule.unlockDate, countdownEl);
    }
  });
}

function deleteCapsule(index) {
  const confirmDelete = confirm("Are you sure you want to delete this capsule?");
  if (!confirmDelete) return;

  let capsules = JSON.parse(localStorage.getItem("timeCapsules")) || [];
  capsules.splice(index, 1);
  localStorage.setItem("timeCapsules", JSON.stringify(capsules));
  viewCapsules();
  showStatus("🗑 Capsule deleted successfully.", "red");
}

function showCapsuleMessage(capsule) {
  const messageBox = document.createElement("div");
  messageBox.className = "fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-6 z-50 animate-fadeIn";

  // Create a safe download button separately
  const blob = new Blob([capsule.message], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  messageBox.innerHTML = `
    <div class="bg-white text-black max-w-lg w-full rounded-lg p-6 shadow-lg text-center">
      <h2 class="text-2xl font-bold mb-4">📬 Your Message</h2>
      <p class="mb-4 whitespace-pre-wrap">${capsule.message}</p>
      <p class="text-sm text-gray-600 mb-2">Location: ${capsule.location || "Unknown"}</p>
      <a href="${url}" download="time_capsule_message.txt" class="bg-indigo-600 hover:bg-indigo-800 text-white px-4 py-2 rounded-md inline-block">Download</a>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-2 mt-4 text-red-600">Close</button>
    </div>
  `;

  document.body.appendChild(messageBox);
}


function downloadMessage(message) {
  const blob = new Blob([message], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "time_capsule_message.txt";
  a.click();
  URL.revokeObjectURL(url);
}

function startCountdown(unlockTime, countdownElement) {
  function update() {
    const now = Date.now();
    const diff = unlockTime - now;

    if (diff <= 0) {
      countdownElement.innerText = "🔓 Capsule is ready!";
      clearInterval(timerId);
      viewCapsules();
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    countdownElement.innerText = `⏳ Unlocks in ${hours}h ${minutes}m ${seconds}s`;
  }

  update();
  const timerId = setInterval(update, 1000);
}
