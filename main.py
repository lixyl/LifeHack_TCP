import json
from pathlib import Path
from typing import Any, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os

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
client = OpenAI(api_key=(OPENAI_API_KEY))

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

@app.post("/api/analyze")
async def analyze_endpoint(payload: AnalyzeRequest):
    print("--- RECEIVED JSON INPUT ---")
    print(payload.json_input)
    print("---------------------------")

    try:
        result = generate_questions(payload.json_input)
        return {"success": True, "result": result}
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
