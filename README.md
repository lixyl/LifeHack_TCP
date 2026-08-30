# LENNUT

### Make your product AI-ready.

LENNUT is an AI-powered e-commerce tool that helps product owners determine whether their product information is ready to be understood and recommended by AI shopping assistants.

Instead of simply checking whether a product description contains enough information, LENNUT identifies information gaps, asks targeted clarification questions to update product information using challenging consumer scenarios.

---

## The Problem

AI shopping assistants need accurate and sufficiently detailed product information to make reliable recommendations.

However, product descriptions often contain missing, unclear, or ambiguous information.

For example, a running shoe description may say that it is "lightweight" and has "good cushioning", but fail to explain:

- How it performs in wet conditions
- Whether it is suitable for long-distance running
- What type of runner it is designed for
- How it performs on different terrains

These gaps can prevent an AI shopping assistant from confidently determining whether the product is suitable for a particular customer.

---

## Our Solution

LENNUT evaluates product information from the perspective of an AI shopping assistant.

The system:

1. Analyses the provided product information in the JSON-LD Format.
2. Identifies missing, unclear, or ambiguous information.
3. Generates targeted clarification questions.
4. Allows the product owner to provide additional information.
5. Re-evaluates the updated product information.
6. Calculates an AI Readiness Score out of 100.

---

## Usage Procedure

1. Create a txt file named "api_key.txt" and enter your API key for your LLM model
2. Set up Python virtual environment, and run `uvicorn main:app --reload --port 8000` in the main project folder for backend API
3. Run `npm run dev` in the `lennut-frontend` folder to activate the web server
4. Go to `localhost:8443` on your browser to access the webpage

---

## Key Features

### AI Product Analysis

The AI analyses the supplied product information and identifies important information gaps that could affect product recommendations.

### AI Challenge Lab

The system generates questions based on five key areas:

- Consumer's Personas
- Context
- Intent
- Comparison

Questions are only generated when the information is missing, unclear, or ambiguous and would materially improve a recommendation.

### Iterative Refinement

Users can answer AI-generated questions using:

- Predetermined options
- A custom answer
- Ignore / Not Applicable

The updated information is then re-evaluated by the AI.

### AI Readiness Score

The system produces a score out of 100 based on five dimensions.

---

## AI Readiness Score

| Dimension | Weightage |
|---|---:|
| Clarity | 20% |
| Completeness | 20% |
| Persuasiveness | 20% |
| SEO Potential | 20% |
| LLM Fit | 20% |
| **Total** | **100%** |

---

## How It Works

```text
Product Information
        ↓
AI Analysis
        ↓
Identify Information Gaps
        ↓
Generate Clarification Questions
        ↓
User Provides Answers
        ↓
Update Product Information
        ↓
Re-evaluate
        ↓
AI Readiness Score
        ↓
Improve & Test Again (if required)