import json
import os
from collections import Counter
from typing import Any, Dict, List
from openai import OpenAI

# Initialize OpenAI client (requires OPENAI_API_KEY environment variable)
# Note: Never hardcode sensitive API keys directly in scripts shared publicly.
client = OpenAI(api_key="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")


def load_json_ld(file_path: str) -> Dict[str, Any]:
    """Loads and returns JSON-LD content from a file."""
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def identify_broad_product_type(json_ld: Dict[str, Any]) -> str:
    """Uses GPT to identify the high-level broad product category from JSON-LD."""
    prompt = f"""
    Given the following JSON-LD representation of a product, identify its broad product category/type 
    (e.g., 'Wireless Noise-Canceling Headphones', 'Smart Robot Vacuum', 'Mechanical Gaming Keyboard').
    Respond ONLY with the broad product type name, nothing else.

    JSON-LD:
    {json.dumps(json_ld, indent=2)}
    """

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()


def generate_search_queries(product_type: str) -> List[str]:
    """Generates 10 industry search queries based on the product type."""
    try:
        # FIXED: Added missing OpenAI completion request block
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": "You are an e-commerce SEO expert. Respond ONLY with a JSON object containing a key 'queries' which maps to an array of 10 highly distinct, market-relevant search query strings or buying guides for the given product type."
                },
                {
                    "role": "user",
                    "content": f"Generate 10 search queries for investigating market features of: '{product_type}'"
                }
            ],
            temperature=0.3
        )
    except Exception as e:
        print(f"[-] API Request failed during query generation: {e}")
        return []

    message = response.choices[0].message
    if message.content is None:
        print(f"[-] Error: API returned empty content for '{product_type}'.")
        if getattr(message, 'refusal', None):
            print(f"    Reason for refusal: {message.refusal}")
        return [] 

    try:
        clean_content = message.content.strip()
        # Clean markdown wrappers if returned
        if clean_content.startswith("```"):
            lines = clean_content.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            clean_content = "\n".join(lines).strip()

        data = json.loads(clean_content)
        # Handle structural extract variations safely
        if isinstance(data, dict) and "queries" in data:
            return data["queries"]
        elif isinstance(data, list):
            return data
        return []
        
    except json.JSONDecodeError as e:
        print(f"[-] Failed to parse JSON string. Content received: {message.content}")
        return []


def execute_searches_and_extract_features(
    queries: List[str], product_type: str
) -> Counter:
    """
    Simulates finding top industry features for the queries using high-quality LLM prompts.
    """
    print("\n[+] Extracting market feature profiles for each query...")

    all_extracted_features = []

    for idx, query in enumerate(queries, 1):
        print(f"  ({idx}/{len(queries)}) Extracting specifications for: '{query}'...")
        prompt = f"""
        Act as a market research tool evaluating: "{query}".
        What are the top 5 key technical features, specifications, capabilities, and standards 
        frequently evaluated by consumers and experts for the industry segment: '{product_type}'?
        
        Return ONLY a JSON array of specific standard feature strings (e.g. ["Battery Life", "Active Noise Cancellation", "Multipoint Bluetooth"]).
        """

        try:
            # FIXED: Corrected non-standard client.responses.create endpoint to chat.completions
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a hardware analyst. Return a JSON object with a single key 'features' mapping to a list of strings."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            content = response.choices[0].message.content
            if content is None:
                continue

            clean_content = content.strip()
            if clean_content.startswith("```"):
                lines = clean_content.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                clean_content = "\n".join(lines).strip()

            data = json.loads(clean_content)
            features = data.get("features", []) if isinstance(data, dict) else data
            
            if isinstance(features, list):
                all_extracted_features.extend(features)
        except Exception as e:
            print(f"    Warning: Profile build failed for query '{query}': {e}")

    return Counter([f.strip().lower() for f in all_extracted_features])


def analyze_gap_and_similarity(
    json_ld: Dict[str, Any], feature_counts: Counter, product_type: str
) -> Dict[str, Any]:
    """Compares market-frequent features against JSON-LD file content."""
    # Capture the top 15 features based on simulated frequency counts
    most_common_market_features = [feature for feature, count in feature_counts.most_common(15)]

    analysis_prompt = f"""
    You are an e-commerce taxonomy expert analyzing product schema completeness.

    1. Original Product JSON-LD:
    {json.dumps(json_ld, indent=2)}

    2. Top 30 Most Frequently Occurring Industry Features found in search results for broad type '{product_type}':
    {json.dumps(most_common_market_features, indent=2)}

    Perform the following analysis:
    - Compare the original JSON-LD against these top market features.
    - Calculate a similarity/coverage percentage score (0% to 100%) indicating how well the JSON-LD covers standard market features, by dividing the number of features found in the json file against the total number of key features found.
    - Identify key standard features present in the market search results that are MISSING or NOT explicitly detailed in the JSON-LD.

    Output format: Return ONLY a valid JSON object matching this schema:
    {{
      "similarity_score_percentage": 75.0,
      "found_features": ["feature1", "feature2"],
      "missing_key_features": ["missing_feature1", "missing_feature2"],
      "reasoning": "Brief concise analysis statement"
    }}
    """

    response = client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": analysis_prompt}],
        temperature=0.2,
    )

    return json.loads(response.choices[0].message.content)


def process_product_json_ld(file_path: str):
    """Main pipeline execution."""
    print(f"--- Processing File: {file_path} ---")

    # Step 1: Load file
    json_ld_data = load_json_ld(file_path)

    # Step 2: Identify broad product type
    product_type = identify_broad_product_type(json_ld_data)
    print(f"[+] Broad Product Type Identified: '{product_type}'")

    # Step 3: Generate 10 search queries
    queries = generate_search_queries(product_type)
    print(f"[+] Generated {len(queries)} Search Queries:")
    for q in queries:
        print(f"    - {q}")

    if not queries:
        print("[-] Aborting remaining pipeline pipeline because no queries were built.")
        return

    # Step 4: Execute feature extraction
    feature_counts = execute_searches_and_extract_features(queries, product_type)

    # Step 5 & 6: Compare, compute similarity, and get missing features
    analysis = analyze_gap_and_similarity(json_ld_data, feature_counts, product_type)

    # Print Final Output Summary
    print("\n================ FINAL ANALYSIS OUTPUT ================")
    print(f"Product Type:               {product_type}")
    print(f"Feature Similarity Score:   {analysis.get('similarity_score_percentage')}%")
    print(f"Matched Standard Features:  {', '.join(analysis.get('found_features', []))}")
    print("\n[!] MISSING KEY FEATURES NOT IN ORIGINAL JSON-LD:")
    for missing in analysis.get("missing_key_features", []):
        print(f"  - {missing}")
    print(f"\nSummary Reasoning:          {analysis.get('reasoning')}")
    print("=======================================================")


if __name__ == "__main__":
    sample_file = "dummy.json"

    # Create standard mock dataset if dummy.json is absent
    if not os.path.exists(sample_file):
        dummy_json_ld = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": "AeroSound Pro Headphones",
            "description": "Over-ear wireless headphones with noise cancellation and long battery.",
            "brand": {"@type": "Brand", "name": "AeroSound"},
            "offers": {
                "@type": "Offer",
                "priceCurrency": "USD",
                "price": "199.99",
                "availability": "https://schema.org/InStock",
            },
        }
        with open(sample_file, "w") as f:

            json.dump(dummy_json_ld, f, indent=2)

    process_product_json_ld(sample_file)
