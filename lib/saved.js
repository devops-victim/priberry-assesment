import { readFile, writeFile } from "node:fs/promises";
import { findJob, loadJobs } from "./jobs.js";

const savedJobsPath = new URL("../saved-jobs.json", import.meta.url);

export async function loadSavedIds(path = savedJobsPath) {
    try {
        const raw = await readFile(path, "utf8");
        return JSON.parse(raw);
    } catch (error) {
        if (error.code === "ENOENT") return [];
        throw error;
    }
}

export async function writeSavedIds(ids, path = savedJobsPath) {
    await writeFile(path, `${JSON.stringify(ids, null, 2)}\n`, "utf8");
}

export async function getSavedJobs(path = savedJobsPath) {
    const [ids, allJobs] = await Promise.all([
        loadSavedIds(path),
        loadJobs()
    ]);
    return ids.map((id) => findJob(allJobs, id)).filter(Boolean);
}

export async function saveJob(jobId, path = savedJobsPath) {
    if (!jobId || typeof jobId !== "string") {
        throw new Error("Job ID must be a non-empty string");
    }

    const allJobs = await loadJobs();
    const exists = findJob(allJobs, jobId);

    if (!exists) {
        const err = new Error(`Job with ID ${jobId} does not exist`);
        err.status = 404;
        throw err;
    }

    const ids = await loadSavedIds(path);
    if (!ids.includes(jobId)) {
        ids.push(jobId);
        await writeSavedIds(ids, path);
    }

    return exists;
}

export async function removeSavedJob(jobId, path = savedJobsPath) {
    const ids = await loadSavedIds(path);
    const filtered = ids.filter((id) => id !== jobId);
    await writeSavedIds(filtered, path);
    return { success: true };
}