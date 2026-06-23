# Recur

A local-first journal for tracking Data Structures and Algorithms practice — approaches, mistakes, revisions, and Python solutions, stored as plain text files you own.

---
## Features

- Structured problem logs with overview, approaches, learning, mistakes, and code sections
- Revision queue for problems marked *Need Revision*
- Python editor with syntax highlighting and optional formatting via [Black](https://black.readthedocs.io/)
- Search, sort, and filter by difficulty, tags, favorites, and recency
- Analytics dashboard for progress and topic coverage

## Getting Started

**Requirements:** Node.js 18+. Python 3 is optional (only needed for the code formatter).

```bash
git clone <your-repo-url>
cd recur
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

Use the `PORT` environment variable to change the listen port (default `3000`).

## Data Storage

Problem logs are saved in the `problems/` directory at the project root. Files use a simple key–section format (`Title:`, `Statement:`, `Approach:`, `Learning:`, `Mistakes:`, `Code:`, etc.). See [`template.txt`](template.txt) for a complete example.

External edits to `.txt` files are supported — refresh the browser to load changes made outside the app.

## Development

| Command | Description |
| :------ | :---------- |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run lint` | Type-check the project |
| `npm run verify` | Run parser and API smoke tests |

## License

Personal project. Use and modify freely for your own learning workflow.
