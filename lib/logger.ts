import pino from "pino";
import fs from "fs";
import path from "path";

const level = process.env.LOG_LEVEL ?? "info";
const logDir = process.env.LOG_DIR ?? path.join(process.cwd(), "logs");

// File logging is opt-out (LOG_TO_FILE=false), not opt-in: IIS deploys rely
// on it (see deploy/DEPLOY-NOTES.txt - app.log is the first place to check
// for connectivity issues), but the Docker image runs as a non-root user
// with no writable /app/logs and no log volume mounted, so mkdirSync there
// throws EACCES. Docker disables it via docker-compose.yml and relies on
// stdout instead (`docker compose logs sidi-web`). Vercel's filesystem is
// read-only (mkdir /var/task/logs throws ENOENT), so it's off there too;
// stdout shows up in the deployment's Logs tab.
const fileLoggingEnabled =
    process.env.LOG_TO_FILE !== "false" && !process.env.VERCEL;

const streams: pino.StreamEntry[] = [{ stream: process.stdout }];

if (fileLoggingEnabled) {
    fs.mkdirSync(logDir, { recursive: true });
    streams.push({
        stream: pino.destination({
            dest: path.join(logDir, "app.log"),
            sync: false,
        }),
    });
}

export const logger = pino({ level }, pino.multistream(streams));
