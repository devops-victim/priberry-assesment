const list = document.getElementById("jobs");
const search = document.getElementById("search");
const savedList = document.getElementById("saved-jobs");

let currentSavedJobs = [];

async function fetchSaved() {
  const res = await fetch("/api/saved");
  if (res.ok) {
    currentSavedJobs = await res.json();
  }
}

function renderSaved() {
  savedList.innerHTML = "";
  if (currentSavedJobs.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-notice";
    empty.textContent = "No saved jobs yet.";
    savedList.append(empty);
    return;
  }

  for (const job of currentSavedJobs) {
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.textContent = `${job.title} at ${job.company}, ${job.location}. Rs ${job.stipend.toLocaleString("en-IN")} a month.`;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", async () => {
      await fetch(`/api/saved/${encodeURIComponent(job.id)}`, { method: "DELETE" });
      await refreshAll();
    });

    li.append(text, removeBtn);
    savedList.append(li);
  }
}

async function showJobs(query = "") {
  const res = await fetch(`/api/jobs?q=${encodeURIComponent(query)}`);
  const jobs = await res.json();
  const savedIds = new Set(currentSavedJobs.map((j) => j.id));

  list.innerHTML = "";
  for (const job of jobs) {
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.textContent = `${job.title} at ${job.company}, ${job.location}. Rs ${job.stipend.toLocaleString("en-IN")} a month.`;

    const saveBtn = document.createElement("button");
    const isSaved = savedIds.has(job.id);
    saveBtn.textContent = isSaved ? "Saved" : "Save";
    saveBtn.disabled = isSaved;

    if (!isSaved) {
      saveBtn.addEventListener("click", async () => {
        saveBtn.disabled = true;
        await fetch("/api/saved", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jobId: job.id })
        });
        await refreshAll();
      });
    }

    li.append(text, saveBtn);
    list.append(li);
  }
}

async function refreshAll() {
  await fetchSaved();
  renderSaved();
  await showJobs(search.value);
}

search.addEventListener("input", () => showJobs(search.value));
refreshAll();