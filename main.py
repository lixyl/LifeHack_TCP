import json
import re
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel

app = FastAPI()

# Enable CORS so your React frontend can talk to Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


class RefineRequest(BaseModel):
    original_input: str
    appended_info: str


class GenerateDescriptionRequest(BaseModel):
    json_input: str
    clarification_answers: str


def generate_questions(json_input: str, instructions_filename: str = "instructions.md") -> Any:
    # Validate JSON input first
    json.loads(json_input)

    base_dir = Path(__file__).resolve().parent
    instructions_path = base_dir / instructions_filename

    instructions = instructions_path.read_text(encoding="utf-8")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": json_input},
        ],
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


def refine_analysis(updated_text: str, instructions_filename: str = "instructions.md") -> Any:
    """Prompt OpenAI to re-analyze the enhanced/appended product description."""
    base_dir = Path(__file__).resolve().parent
    instructions_path = base_dir / instructions_filename

    instructions = instructions_path.read_text(encoding="utf-8")

    prompt = (
        "Re-evaluate the following updated product information which includes newly provided user clarifications. "
        "Recalculate all score metrics (overall, grade, llmScore, category scores) showing improvements:\n\n"
        f"{updated_text}"
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
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


def generate_description_json(
    json_input: str,
    clarification_answers: str,
    instructions_filename: str = "instruction2.md",
) -> str:
    """Generate a descriptor and append it to the input object's description."""
    product_data = json.loads(json_input)
    clarification_data = json.loads(clarification_answers)

    if not isinstance(product_data, dict):
        raise ValueError("Product JSON must contain an object")
    if not isinstance(clarification_data, list):
        raise ValueError("Clarification answers must contain a JSON array")

    base_dir = Path(__file__).resolve().parent
    instructions = (base_dir / instructions_filename).read_text(encoding="utf-8")
    user_prompt = (
        "Generate the requested product descriptor using the following data.\n\n"
        "ORIGINAL PRODUCT JSON:\n"
        f"{json.dumps(product_data, ensure_ascii=False, indent=2)}\n\n"
        "CLARIFICATION ANSWERS:\n"
        f"{json.dumps(clarification_data, ensure_ascii=False, indent=2)}"
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": user_prompt},
        ],
    )
    generated_description = response.choices[0].message.content
    if not generated_description:
        raise ValueError("The LLM returned an empty description")

    existing_description = str(product_data.get("description", "")).strip()
    product_data["description"] = "\n\n".join(
        part
        for part in (existing_description, generated_description.strip())
        if part
    )

    return json.dumps(product_data, ensure_ascii=False, indent=2)

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


@app.post("/api/generate-description")
async def generate_description_endpoint(payload: GenerateDescriptionRequest):
    try:
        generated_json = generate_description_json(
            json_input=payload.json_input,
            clarification_answers=payload.clarification_answers,
        )
        return {
            "success": True,
            "generated_json": generated_json,
        }
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON input: {e}")
    except Exception as e:
        print("Description generation error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/refine")
async def refine_endpoint(payload: RefineRequest):
    print("--- REFINING ANALYSIS WITH ADDED USER DATA ---")

    # Combine initial input with newly captured clarifications
    combined_description = (
        f"INITIAL INPUT:\n{payload.original_input}\n\n"
        f"ADDITIONAL USER CLARIFICATIONS:\n{payload.appended_info}"
    )

    try:
        refined_result = refine_analysis(combined_description)
        return {
            "success": True,
            "refined_text": combined_description,
            "result": refined_result,
        }
    except Exception as e:
        print("Error refining analysis:", e)
        raise HTTPException(status_code=500, detail=str(e))
