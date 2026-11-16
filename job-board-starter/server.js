// A small job board: a JSON API and one page. Run with `npm start`.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { loadJobs, searchJobs } from "./lib/jobs.js";
import { getSavedJobs, saveJob, removeSavedJob } from "./lib/saved.js";

const PORT = Number(process.env.PORT ?? 3000);

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const buffers = [];

  for await (const chunk of req) {
    buffers.push(chunk);
  }

  const text = Buffer.concat(buffers).toString("utf8");
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    const err = new Error("Invalid JSON");
    err.status = 400;
    throw err;
  }
}

export function createApp() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");

      if (req.method === "GET" && url.pathname === "/api/jobs") {
        const jobs = await loadJobs();
        return sendJson(res, 200, searchJobs(jobs, url.searchParams.get("q")));
      }

      if (req.method === "GET" && url.pathname === "/api/saved") {
        const jobs = await getSavedJobs();
        return sendJson(res, 200, jobs);
      }

      if (req.method === "POST" && url.pathname === "/api/saved") {
        const { jobId } = await readJson(req);

        try {
          const savedJob = await saveJob(body.jobId);
          return sendJson(res, 201, { success: true, job: savedJob });
        } catch (err) {
          return sendJson(res, err.status ?? 400, { error: err.message });
        }
      }

      if (req.method === "DELETE" && url.pathname === "/api/saved") {
        const { jobId } = await readJson(req);
        if (!jobId) {
          return sendJson(res, 400, { error: "jobId is required" });
        }

        await removeSavedJob(jobId);
        return sendJson(res, 200, { success: true });
      }

      if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/app.js")) {
        const file = url.pathname === "/" ? "index.html" : "app.js";
        const type = file.endsWith(".html") ? "text/html" : "text/javascript";
        const body = await readFile(new URL(`./public/${file}`, import.meta.url));
        res.writeHead(200, { "content-type": `${type}; charset=utf-8` });
        return res.end(body);
      }

      sendJson(res, 404, { error: "Not found" });
    } catch (err) {
      console.error(err);
      sendJson(res, 500, { error: "Something went wrong" });
    }
  });
}

// Started directly (npm start), not imported by a test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createApp().listen(PORT, () => console.log(`Job board on http://localhost:${PORT}`));
}
