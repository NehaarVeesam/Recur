import express from "express";
import path from "path";
import fs from "fs/promises";
import { readFileSync } from "fs";
import crypto from "crypto";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";

const DATA_DIR = path.join(process.cwd(), "problems");

function loadEnvFile() {
  try {
    const content = readFileSync(path.join(process.cwd(), ".env"), "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    // .env optional if vars are already set in the environment
  }
}

loadEnvFile();

function getAuthCredentials() {
  const username = (process.env.R_Username || "").trim();
  const password = process.env.R_Password ?? "";
  return { username, password };
}

function buildSessionToken(username: string, password: string): string {
  return crypto
    .createHmac("sha256", password || "recur")
    .update(`recur:${username}`)
    .digest("hex");
}

function getExpectedToken(): string | null {
  const { username, password } = getAuthCredentials();
  if (!username || !password) return null;
  return buildSessionToken(username, password);
}

function extractBearerToken(req: express.Request): string | null {
  const header = req.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7).trim() || null;
  }
  return null;
}

function isAuthenticated(req: express.Request): boolean {
  const expected = getExpectedToken();
  if (!expected) return false;
  const token = extractBearerToken(req);
  if (!token || token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function formatPythonCode(code: string): Promise<string> {
  const trimmed = code.trim();
  if (!trimmed) return code;

  const commands: Array<[string, string[]]> = [
    ["python", ["-m", "black", "-q", "--stdin-filename", "solution.py", "-"]],
    ["py", ["-m", "black", "-q", "--stdin-filename", "solution.py", "-"]],
    ["black", ["-q", "--stdin-filename", "solution.py", "-"]],
  ];

  const errors: string[] = [];

  for (const [cmd, args] of commands) {
    try {
      const formatted = await new Promise<string>((resolve, reject) => {
        const proc = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
        let stdout = "";
        let stderr = "";
        proc.stdout.on("data", (chunk) => { stdout += chunk; });
        proc.stderr.on("data", (chunk) => { stderr += chunk; });
        proc.on("error", (err) => reject(err));
        proc.on("close", (exitCode) => {
          if (exitCode === 0) resolve(stdout);
          else reject(new Error(stderr.trim() || `${cmd} exited with code ${exitCode}`));
        });
        proc.stdin.write(code.endsWith("\n") ? code : `${code}\n`);
        proc.stdin.end();
      });
      return formatted;
    } catch (err: any) {
      errors.push(err?.message || String(err));
    }
  }

  const hint = errors.find((e) => /syntax|parse|invalid/i.test(e));
  if (hint) throw new Error(hint);
  throw new Error("Python formatter not found. Install Black: pip install black");
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function startServer() {
  await ensureDataDir();
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  app.post("/api/login", (req, res) => {
    const { username, password } = getAuthCredentials();
    if (!username || !password) {
      return res.status(500).json({ error: "Login credentials are not configured on the server" });
    }

    const inputUsername = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const inputPassword = typeof req.body?.password === "string" ? req.body.password : "";

    if (!inputUsername || !inputPassword) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const userOk =
      inputUsername.length === username.length &&
      crypto.timingSafeEqual(Buffer.from(inputUsername), Buffer.from(username));
    const passOk =
      inputPassword.length === password.length &&
      crypto.timingSafeEqual(Buffer.from(inputPassword), Buffer.from(password));

    if (!userOk || !passOk) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = buildSessionToken(username, password);
    res.json({ success: true, token });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ authenticated: false });
    }
    res.json({ authenticated: true, username: getAuthCredentials().username });
  });

  // API Routes
  app.get("/api/problems", async (req, res) => {
    try {
      const files = await fs.readdir(DATA_DIR);
      const problemsFiles = files.filter(f => f.endsWith('.txt'));
      
      const problems = [];
      for (const file of problemsFiles) {
        const content = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
        problems.push({ filename: file, content });
      }
      res.json(problems);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to read problems" });
    }
  });

  app.post("/api/problems/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      if (!filename.endsWith('.txt')) {
        return res.status(400).json({ error: "Must be a .txt file" });
      }
      const { content, renameTo } = req.body;
      if (typeof content !== "string") {
        return res.status(400).json({ error: "Content must be a string" });
      }

      const targetFilename =
        typeof renameTo === "string" && renameTo.endsWith(".txt") && renameTo !== filename
          ? renameTo
          : filename;

      if (targetFilename !== filename) {
        const newPath = path.join(DATA_DIR, targetFilename);
        try {
          await fs.access(newPath);
          return res.status(409).json({ error: "A problem with that filename already exists" });
        } catch {
          // available
        }
      }

      await fs.writeFile(path.join(DATA_DIR, targetFilename), content, "utf-8");

      if (targetFilename !== filename) {
        try {
          await fs.unlink(path.join(DATA_DIR, filename));
        } catch {
          // old draft file may already be gone
        }
      }

      res.json({ success: true, filename: targetFilename });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to write problem" });
    }
  });

  app.post("/api/format-python", async (req, res) => {
    try {
      const { code } = req.body;
      if (typeof code !== "string") {
        return res.status(400).json({ error: "Code must be a string" });
      }
      const formatted = await formatPythonCode(code);
      res.json({ formatted });
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Failed to format Python code" });
    }
  });

  app.delete("/api/problems/:filename", async (req, res) => {
      try {
        const filename = req.params.filename;
        if (!filename.endsWith('.txt')) {
          return res.status(400).json({ error: "Must be a .txt file" });
        }
        await fs.unlink(path.join(DATA_DIR, filename));
        res.json({ success: true });
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to delete problem" });
      }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
