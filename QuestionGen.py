"""Generate product questions with instructions loaded from Markdown."""

import json
from pathlib import Path
from openai import OpenAI

OPENAI_API_KEY = "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"

def generate_questions(json_input: str, instructions_path: str) -> str:
    """Generate an LLM response for product data encoded as a JSON string.

    The ``OPENAI_API_KEY`` environment variable must be set. The model's text
    output is returned unchanged so the caller can decide whether to parse it.

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
    return response.output_text

with open("sample.json") as js:
    testing = js.read()
print(generate_questions(testing, "llm/question_generation.md"))