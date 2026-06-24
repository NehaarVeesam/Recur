import fs from 'fs/promises';
import path from 'path';

// Optional: writes demo problem files into problems/ when missing or nearly empty.
// Not run automatically — use `npm run restore-seed` if you want sample data.

const DATA_DIR = path.join(process.cwd(), 'problems');

const examples = [
  {
    name: 'climbing-stairs.txt',
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
`,
  },
  {
    name: 'longest-substring.txt',
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
`,
  },
  {
    name: 'valid-parentheses.txt',
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
`,
  },
  {
    name: 'merge-intervals.txt',
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
`,
  },
];

for (const example of examples) {
  const filePath = path.join(DATA_DIR, example.name);
  let existing = '';
  try {
    existing = await fs.readFile(filePath, 'utf-8');
  } catch {
    // missing file
  }
  if (existing.trim().length < 100) {
    await fs.writeFile(filePath, example.content, 'utf-8');
    console.log('Restored', example.name);
  } else {
    console.log('Skipped', example.name);
  }
}
