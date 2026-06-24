import express from "express";
import path from "path";
import fs from "fs/promises";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";

const DATA_DIR = path.join(process.cwd(), "problems");

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
      const { content } = req.body;
      if (typeof content !== "string") {
        return res.status(400).json({ error: "Content must be a string" });
      }
      await fs.writeFile(path.join(DATA_DIR, filename), content, "utf-8");
      res.json({ success: true });
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
