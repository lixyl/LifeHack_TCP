import json
from typing import Any, Dict


def parse_json_file(file_path: str) -> Dict[str, Any]:
    """Parse a JSON file whose top-level value is an object."""
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError("The JSON file must contain an object at the top level.")

    return data
