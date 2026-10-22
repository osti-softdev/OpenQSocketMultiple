---
trigger: always_on
description: Automatically use graphify knowledge graph at graphify-out/ for fast mapping before changes and update the graph after code modifications.
---

# Antigravity Context & Architecture Instructions

## Architectural Mapping (Graphify & Obsidian)

- Before executing tasks, refactoring code, or answering complex structural questions, consult the Graphify knowledge map located in `graphify-out/` and your Obsidian vault directory.
- Treat files inside `graphify-out/` and markdown notes in the workspace as the primary context for module dependencies and project design logic.
- When generating code modifications, ensure changes remain compliant with the architectural nodes defined in your vault documentation.

---

## Codebase Graph & Navigation Rules

This project maintains an active graphify knowledge graph in `graphify-out/`.

### 1. Before Making Modifications (Fast Mapping)

Before modifying, refactoring, or adding code to any module, function, or endpoint:

- **Query First**: Run `graphify query "<symbol or module>"` (e.g., `graphify query "Categories"`) via terminal tool execution to instantly map all incoming/outgoing imports, callers, controllers, and database queries.
- **Trace Relationships**: Use `graphify path "<Source>" "<Target>" --undirected` to trace relationships between files, controllers, and routes before editing.
- **Check God Nodes & Clusters**: Check `graphify-out/GRAPH_REPORT.md` or `graphify-out/graph.json` to understand shared dependencies and avoid breaking consumers.

### 2. After Making Modifications (Keep Graph Fresh)

- **Mandatory Update**: Whenever code files are added, deleted, or modified, immediately run:
  ```bash
  graphify update .
  ```
