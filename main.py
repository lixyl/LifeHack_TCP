import json
import re
from pathlib import Path
from typing import Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

app = FastAPI()

# Enable CORS so your React frontend can talk to Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust port if needed (e.g., http://localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_KEY = "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"
client = OpenAI(api_key=OPENAI_API_KEY)

SCORE_KEYS = (
    "Clarity",
    "Completeness",
    "Persuasiveness",
    "SEO_Potential",
    "LLM_Fit",
)

class AnalyzeRequest(BaseModel):
    json_input: str

def generate_questions(json_input: str, instructions_filename: str = "instructions.md") -> Any:
    # Validate JSON input first
    json.loads(json_input)

    base_dir = Path(__file__).resolve().parent
    instructions_path = base_dir / instructions_filename

    instructions = instructions_path.read_text(encoding="utf-8")

    # Ensure explicit keyword arguments for model and messages
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": json_input},
        ],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)


def parse_scores(content: str) -> dict[str, int]:
    scores: dict[str, int] = {}
    for line in content.splitlines():
        match = re.fullmatch(r"\s*([A-Za-z_]+)\s*=\s*(\d+)\s*", line)
        if match and match.group(1) in SCORE_KEYS:
            scores[match.group(1)] = int(match.group(2))

    missing = [key for key in SCORE_KEYS if key not in scores]
    invalid = [key for key, value in scores.items() if not 1 <= value <= 100]
    if missing or invalid:
        problems = []
        if missing:
            problems.append(f"missing scores: {', '.join(missing)}")
        if invalid:
            problems.append(f"scores outside 1-100: {', '.join(invalid)}")
        raise ValueError("Invalid evaluator response (" + "; ".join(problems) + ")")
    return scores


def generate_scores(json_input: str, instructions_filename: str = "instructions1.md") -> dict[str, int]:
    base_dir = Path(__file__).resolve().parent
    instructions = (base_dir / instructions_filename).read_text(encoding="utf-8")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": json_input},
        ],
    )
    content = response.choices[0].message.content
    if not content:
        raise ValueError("Evaluator returned an empty response")
    return parse_scores(content)

@app.post("/api/analyze")
async def analyze_endpoint(payload: AnalyzeRequest):
    print("--- RECEIVED JSON INPUT ---")
    print(payload.json_input)
    print("---------------------------")

    try:
        result = generate_questions(payload.json_input)
        result["scores"] = generate_scores(payload.json_input)
        return {"success": True, "result": result}
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
