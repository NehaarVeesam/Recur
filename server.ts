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
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  // Seed 5 example files
  const examples = [
    {
      name: "two-sum.txt",
      content: `Title: Two Sum
Date: 2026-06-23
Difficulty: Easy
Tags: Array, HashMap
Platform: LeetCode
Favorite: true
Status: Mastered

Statement:
Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.

Approach: Brute Force
Time Complexity: O(n^2)
Space Complexity: O(1)
Iterate through the array with two nested loops and check if any pair sums to the target. Very slow for large arrays.

Approach: Target Complement Hash Map (Optimal)
Time Complexity: O(n)
Space Complexity: O(n)
Use a hash map to store visited numbers. Iterate through the array and check if the complement (target - current number) exists in the map. If it does, return the current index and the index of the complement from the map.

Learning:
Learned how complement lookup reduces complexity from O(n^2) to O(n). It is a classic space-time trade-off.

Mistakes:

Code:
def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, num in enumerate(nums):
        comp = target - num
        if comp in seen:
            return [seen[comp], i]
        seen[num] = i
    return []
`
    },
    {
      name: "longest-substring.txt",
      content: `Title: Longest Substring Without Repeating Characters
Date: 2026-06-22
Difficulty: Medium
Tags: String, Sliding Window, HashMap
Platform: LeetCode
Favorite: false
Status: Need Revision

Statement:
Given a string s, find the length of the longest substring without repeating characters.

Approach: Sliding Window with Set
Time Complexity: O(n)
Space Complexity: O(min(m, n))
Use two pointers (left and right) to represent a window. Iterate through the string with the right pointer. If the character is in the set, remove characters from the left until the duplicate is gone.

Approach: Optimized Sliding Window with Map
Time Complexity: O(n)
Space Complexity: O(min(m, n))
Instead of shifting the left pointer by 1 step at a time, use a Map to store the exact index of the duplicate. Skip the left pointer directly to duplicateIndex + 1.

Learning:
Sliding window is perfectly suited for "longest/shortest contiguous subarray/substring" problems. Skipping the left pointer saves unnecessary iteration!

Mistakes:

Code:
def length_of_longest_substring(s: str) -> int:
    seen: set[str] = set()
    left = 0
    best = 0
    for right, ch in enumerate(s):
        while ch in seen:
            seen.remove(s[left])
            left += 1
        seen.add(ch)
        best = max(best, right - left + 1)
    return best
`
    },
    {
      name: "valid-parentheses.txt",
      content: `Title: Valid Parentheses
Date: 2026-06-21
Difficulty: Easy
Tags: Stack, String
Platform: LeetCode
Favorite: true
Status: Revised

Statement:
Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

Approach: Using a Stack
Time Complexity: O(n)
Space Complexity: O(n)
Iterate through the string. Push open brackets to a stack. If a closing bracket is encountered, check if it matches the open bracket at the top of the stack. If not, return false.

Learning:
Stacks are the canonical data structure for LIFO operations like validating nested structures or parsing expression trees.

Mistakes:

Code:
def is_valid(s: str) -> bool:
    stack: list[str] = []
    pairs = {")": "(", "}": "{", "]": "["}
    for ch in s:
        if ch in "({[":
            stack.append(ch)
        elif not stack or stack.pop() != pairs[ch]:
            return False
    return not stack
`
    },
    {
      name: "climbing-stairs.txt",
      content: `Title: Climbing Stairs
Date: 2026-06-20
Difficulty: Easy
Tags: DP, Math, Memoization
Platform: LeetCode
Favorite: false
Status: Mastered

Statement:
You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?

Approach: Recursive with Memoization
Time Complexity: O(n)
Space Complexity: O(n)
Use a top-down approach. Store calculated values in an array/map to avoid redundant calculations of sub-trees.

Approach: Bottom-Up DP (Space Optimized)
Time Complexity: O(n)
Space Complexity: O(1)
The number of ways to reach step n is the sum of ways to reach n-1 and n-2. This is exactly the Fibonacci sequence. We only need to keep track of the last two values (a and b), shifting them forward on each step.

Learning:
Space optimization in DP is often possible when the transition only depends on a fixed number of previous states!

Mistakes:

Code:
def climb_stairs(n: int) -> int:
    if n <= 2:
        return n
    prev2, prev1 = 1, 2
    for _ in range(3, n + 1):
        prev2, prev1 = prev1, prev1 + prev2
    return prev1
`
    },
    {
      name: "merge-intervals.txt",
      content: `Title: Merge Intervals
Date: 2026-06-19
Difficulty: Medium
Tags: Array, Sorting
Platform: LeetCode
Favorite: true
Status: Need Revision

Statement:
Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

Approach: Sort and Merge
Time Complexity: O(n log n)
Space Complexity: O(n)
First, sort the intervals based on their start times. Then, iterate through the intervals. If the current interval overlaps with the last merged one, merge them by updating the end time. Otherwise, add the current interval to the merged list.

Learning:
Sorting simplifies many interval problems because you only need to compare the current interval with the previous one. Always remember to consider the case where a later interval's end is fully enclosed in the prior one.

Mistakes:

Code:
def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda x: x[0])
    merged: list[list[int]] = []
    for start, end in intervals:
        if not merged or start > merged[-1][1]:
            merged.append([start, end])
        else:
            merged[-1][1] = max(merged[-1][1], end)
    return merged
`
    }
  ];

  for (const example of examples) {
    const filePath = path.join(DATA_DIR, example.name);
    try {
      const existing = await fs.readFile(filePath, "utf-8");
      if (existing.trim().length > 0) continue;
    } catch {
      // file missing — write seed content below
    }
    await fs.writeFile(filePath, example.content, "utf-8");
  }
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
