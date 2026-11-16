# Job board starter

A small job board for an insiderOne work sample. It is made up: the jobs and
companies are not real.

## Run it

You need Node 20 or newer. There are no packages to install.

```
npm start      # then open http://localhost:3000
npm test       # runs the tests in test/
```
## Track of modifications:

- Wrote crud operations to loadSavedIds, writeSavedIds, getSavedJobs, saveJob and removeSavedJob from saved-jobs.json file  
(under git commit - `saved jobs crud operations`)
- Wrote rest api routes GET /api/saved, POST /api/saved, DELETE /api/saved/:id to perform the crud operations from UI.  
(Under git commit - `GET POST DELETE rest routes`) 
- Built the "Saved Jobs" section on frontend using AI AGENT and save/remove button rendering by myself
(Under git commit - `saved jobs section and save/remove buttons`)
-Identified and Fixed minor incosistency with deletion operation on server.js DELETE route using AI AGENT.
(Under git commit - `delete route fix`)
-Generated test cases from AI covering Jobs and Saved Jobs rendering, Empty saved jobs list, saving and listing a job, removing a saved job, persistence after server restart.
All testcases passed.
(Under git commit - `testcase generation and execution`)

## One Important Decision
I persisted only JobId in `saved-jobs.json` rather than duplicating entire job object. 
The file rather stores an array of unique JobIds and hydrating against `jobs.json`.
This keeps the data normalized, and file writes small and fast.
The difference is negligible at such small scale, but is substantially hire on large scale.

