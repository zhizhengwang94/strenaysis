# Strenaysis

`strenaysis` is a lightweight Python package that serves a browser-based, agentic workflow for structuring data analysis and data scientist interview answers.

## What this first version does

- Landing page with `Problem to Solve`
- `Start to Build the Structure` button
- OpenAI-powered roadmap generation with editable nodes
- `Confirm This Is the Roadmap` step
- Guided detail capture across:
  - metric
  - drivers
  - data
  - model
  - decision
  - result
  - takeaway

If `OPENAI_API_KEY` is not set, the app falls back to your interview roadmap template so the flow still works.

## Run

1. Install the package:

```bash
pip install -e .
```

2. Optionally set your API key:

```bash
set OPENAI_API_KEY=your_key_here
```

3. Start the app:

```bash
strenaysis
```

4. Open the printed local URL in your browser.

## Deploy On Render

`strenaysis` can be deployed as a simple Python web service on Render.

1. Push this repo to GitHub.
2. Go to [Render](https://render.com/) and create a new `Web Service`.
3. Connect the repo and let Render detect the included `render.yaml`.
4. If Render asks for commands manually, use:

```bash
python -m pip install --upgrade pip && pip install .
```

as the build command, and:

```bash
python -m strenaysis
```

as the start command.

5. Add `OPENAI_API_KEY` as an environment variable when you want the live OpenAI-driven behavior.

This first hosted version does not include user authentication yet, so anyone with the Render URL can use it.

## Notes

- This version focuses on the product skeleton and workflow.
- The detailed bucket-specific prompts can be added next.
- The server uses only the Python standard library, so it does not require Flask or FastAPI.
