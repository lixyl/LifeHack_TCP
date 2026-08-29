import json
from typing import Any, Dict
from pathlib import Path
from openai import OpenAI

OPENAI_API_KEY = "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"

def generate_questions(json_input: str, instructions_path: str) -> str:
    """Generate an LLM response for product data encoded as a JSON string.
    Raises:
        json.JSONDecodeError: If ``json_input`` is not valid JSON.
        OSError: If the instructions file cannot be read.
    """
    # Validate the input before spending an API request on malformed JSON.
    json.loads(json_input)

    instructions = Path(instructions_path).read_text(encoding="utf-8")

    client = OpenAI(api_key = OPENAI_API_KEY)
    response = client.responses.create(
        model="gpt-4o-mini",
        instructions=instructions,
        input=json_input,
    )
    return json.loads(response.output_text)

def parse_json_file(file_path: str) -> Dict[str, Any]:
    """Parse a JSON file whose top-level value is an object."""
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError("The JSON file must contain an object at the top level.")

    return data
