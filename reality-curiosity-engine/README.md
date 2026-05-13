# Reality Curiosity Engine

An immersive graph explorer for big questions about reality, science, philosophy, and consciousness.

## What It Does

- Generates a living concept universe from a user question.
- Expands any node dynamically with 4-6 related concepts.
- Adds semantic edge meaning: `supports`, `contradicts`, `extends`, `related_to`, `explains`.
- Assigns each node a knowledge category:
  - Physics
  - Philosophy
  - Neuroscience
  - AI
  - Cosmology
  - Speculative Theories
- Marks concept confidence:
  - strong scientific consensus
  - debated theory
  - speculative hypothesis
- Creates a 5-7 step curiosity path and highlights it in the graph.
- Displays intelligent node details: explanation, key thinkers, related fields, and simple/standard/advanced levels.
- Suggests 3-5 deeper follow-up questions beneath the graph.

## Architecture

```text
reality-curiosity-engine/
  backend/
    app.py
    ai_generator.py
    graph_logic.py
  frontend/
    package.json
    vite.config.js
    index.html
    src/
      App.jsx
      main.jsx
      styles.css
      components/
        GraphCanvas.jsx
        NodeDetailsPanel.jsx
        QuestionInput.jsx
        CuriosityPath.jsx
  requirements.txt
  .env.example
```

## Backend Setup

```bash
cd reality-curiosity-engine/backend
pip install -r ../requirements.txt
python app.py
```

Backend runs on `http://127.0.0.1:5000`.

## Frontend Setup

```bash
cd reality-curiosity-engine/frontend
npm install
npm start
```

Frontend runs on `http://127.0.0.1:3000` and proxies `/api` to Flask.

## Environment Variables

Use `.env.example` at project root:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=5000
```

If `OPENAI_API_KEY` is not set, deterministic fallback generation is used.

## API Endpoints

- `GET /api/health`
- `GET /api/prompts/examples`
- `POST /api/graph/start` with body:
  ```json
  { "question": "What is time?" }
  ```
- `POST /api/graph/expand` with body:
  ```json
  { "session_id": "...", "node_id": "entropy" }
  ```

## Example AI Prompts Used

`backend/ai_generator.py` contains reusable prompt templates and examples.

- Initial universe prompt generates:
  - 5-7 concepts with category/relation/confidence
  - 5-7 curiosity path steps
  - 3-5 deeper questions
- Expansion prompt generates:
  - 4-6 related concept nodes for the clicked node

## Notes

- Current graph storage is in-memory for speed and simplicity.
- Design is intentionally modular for a future Neo4j backend.
