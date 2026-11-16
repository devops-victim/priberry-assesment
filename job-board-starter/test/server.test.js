import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createApp } from "../server.js";

const savedJobsPath = new URL("../saved-jobs.json", import.meta.url);
const originalSavedJobs = await readFile(savedJobsPath);

let server;
let baseUrl;

async function startServer() {
  server = createApp();
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

async function stopServer() {
  if (!server?.listening) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function request(path, options) {
  return fetch(`${baseUrl}${path}`, options);
}

beforeEach(async () => {
  await stopServer();
  await writeFile(savedJobsPath, "[]\n", "utf8");
  await startServer();
});

after(async () => {
  await stopServer();
  await writeFile(savedJobsPath, originalSavedJobs);
});

test("renders the jobs and saved jobs sections", async () => {
  const page = await request("/");
  const html = await page.text();

  assert.equal(page.status, 200);
  assert.match(html, /id="jobs"/);
  assert.match(html, /id="saved-jobs"/);

  const jobsResponse = await request("/api/jobs");
  const jobs = await jobsResponse.json();
  assert.equal(jobsResponse.status, 200);
  assert.ok(jobs.length >= 8);
  assert.ok(jobs.every((job) => job.id && job.title));
});

test("lists no saved jobs initially", async () => {
  const response = await request("/api/saved");

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
});

test("saves a job and lists it in saved jobs", async () => {
  const saveResponse = await request("/api/saved", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: "j1" })
  });

  assert.equal(saveResponse.status, 201);
  assert.equal((await saveResponse.json()).job.id, "j1");

  const savedResponse = await request("/api/saved");
  assert.deepEqual((await savedResponse.json()).map((job) => job.id), ["j1"]);
});

test("removes a saved job", async () => {
  await request("/api/saved", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: "j1" })
  });

  const removeResponse = await request("/api/saved/j1", { method: "DELETE" });
  assert.equal(removeResponse.status, 200);

  const savedResponse = await request("/api/saved");
  assert.deepEqual(await savedResponse.json(), []);
});

test("keeps saved jobs after the server restarts", async () => {
  await request("/api/saved", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: "j2" })
  });
  await stopServer();
  await startServer();

  const savedResponse = await request("/api/saved");
  assert.deepEqual((await savedResponse.json()).map((job) => job.id), ["j2"]);
});
