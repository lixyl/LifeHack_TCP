export type ChallengeStatus = "PASSED" | "PARTIAL" | "FAILED";
export type ChallengeType = "Persona" | "Context" | "Intent" | "Comparison";

export type QuestionOption = { label: string; value: string };

export type ChallengeQuestion = {
  question: string;
  options: QuestionOption[];
  whyFailed: string;
  missingKnowledge: string[];
};

export type Challenge = {
  id: number;
  type: ChallengeType;
  icon: string;
  query: string;
  confidence: number;
  status: ChallengeStatus;
  missing: string | null;
  panel: ChallengeQuestion;
};

export type ChallengeReport = {
  productName: string;
  readiness: number;
  passed: number;
  partial: number;
  failed: number;
  challenges: Challenge[];
};

// ── Context-aware question bank ───────────────────────────────────────────────
function buildPanels(description: string): Record<number, ChallengeQuestion> {
  const isShoe        = /(shoe|sneaker|boot|footwear|sole|grip|outsole)/i.test(description);
  const isElectronics = /(battery|charging|wireless|bluetooth|processor|screen|display)/i.test(description);
  const isClothing    = /(fabric|wash|wear|fit|size|sleeve|collar|jacket|shirt|pants)/i.test(description);
  const isBag         = /(bag|backpack|strap|pocket|zipper|compartment|carry)/i.test(description);
  const isSkincare    = /(skin|moistur|serum|spf|cream|lotion|retinol|hyaluron)/i.test(description);
  const isFood        = /(calorie|protein|ingredient|sugar|organic|vegan|gluten)/i.test(description);

  if (isShoe) return {
    1: {
      question: "What skill level or activity intensity is this shoe designed for?",
      whyFailed: "I can't confidently match this product to the runner's fitness level because the description lacks audience-specific language.",
      missingKnowledge: ["Target runner profile", "Recommended pace or mileage range"],
      options: [
        { label: "Casual walkers & beginners", value: "beginner" },
        { label: "Recreational runners (up to 30 km/week)", value: "recreational" },
        { label: "Intermediate runners (30–60 km/week)", value: "intermediate" },
        { label: "Elite / competitive athletes (60+ km/week)", value: "elite" },
      ],
    },
    2: {
      question: "What is the outsole grip rating on wet surfaces?",
      whyFailed: "I can't determine whether this shoe is safe in wet conditions — no traction data or outsole material is described.",
      missingKnowledge: ["Wet-weather grip rating", "Outsole compound / rubber type"],
      options: [
        { label: "Basic grip — road use only", value: "road" },
        { label: "All-surface — light trail & wet pavement", value: "allsurface" },
        { label: "Trail-rated — moderate off-road traction", value: "trail" },
        { label: "Technical trail — aggressive lugs, wet rock certified", value: "technical" },
      ],
    },
    3: {
      question: "What is the primary performance advantage over the previous generation?",
      whyFailed: "The description doesn't give me a clear, specific reason why a buyer should switch brands or upgrade.",
      missingKnowledge: ["Differentiating feature vs. competitors", "Upgrade benefit over prior model"],
      options: [
        { label: "Lighter weight (>10% reduction)", value: "lighter" },
        { label: "Better energy return / cushioning stack", value: "cushioning" },
        { label: "Improved durability (midsole lifespan)", value: "durability" },
        { label: "Superior fit system (adaptive lacing, wider toe box)", value: "fit" },
      ],
    },
    4: {
      question: "How does the midsole stack height compare to leading competitors?",
      whyFailed: "Without stack height or cushioning data, I cannot position this product against well-known alternatives.",
      missingKnowledge: ["Stack height (mm)", "Midsole foam technology name"],
      options: [
        { label: "Low-profile (under 25 mm) — ground-feel focused", value: "low" },
        { label: "Standard (25–33 mm) — balanced cushion", value: "standard" },
        { label: "Max cushion (33–40 mm) — long-distance comfort", value: "max" },
        { label: "Super-shoe (40+ mm) — carbon-plate performance", value: "super" },
      ],
    },
    5: {
      question: "What is the toe box width classification of this shoe?",
      whyFailed: "Foot shape compatibility isn't addressed, leaving me unable to recommend this for non-standard foot widths.",
      missingKnowledge: ["Toe box width (narrow / standard / wide)", "Last shape description"],
      options: [
        { label: "Narrow — slim performance last", value: "narrow" },
        { label: "Standard — average foot width", value: "standard" },
        { label: "Wide — generous toe splay", value: "wide" },
        { label: "Extra-wide / bunion-friendly", value: "xwide" },
      ],
    },
    6: {
      question: "How much cushioning does this shoe provide for high-impact joints?",
      whyFailed: "I lack specifics on cushioning type or impact absorption to advise someone recovering from injury.",
      missingKnowledge: ["Impact absorption rating", "Heel drop (mm)", "Cushioning foam type"],
      options: [
        { label: "Minimal — 0–4 mm drop, natural feel", value: "minimal" },
        { label: "Moderate — 6–8 mm drop, light cushion", value: "moderate" },
        { label: "High — 10–12 mm drop, structured support", value: "high" },
        { label: "Maximum — motion control, orthopaedic-grade support", value: "maxcontrol" },
      ],
    },
  };

  if (isElectronics) return {
    1: {
      question: "What is the rated battery life under continuous use?",
      whyFailed: "I cannot advise on all-day usability without a verified battery runtime figure.",
      missingKnowledge: ["Battery capacity (mAh / Wh)", "Rated screen-on time"],
      options: [
        { label: "Up to 4 hours — light use only", value: "4h" },
        { label: "4–8 hours — half-day portable", value: "8h" },
        { label: "8–14 hours — full work day", value: "14h" },
        { label: "14+ hours — extended / multi-day", value: "14plus" },
      ],
    },
    2: {
      question: "What is the display brightness at peak nits?",
      whyFailed: "Outdoor readability can't be confirmed without a peak brightness specification.",
      missingKnowledge: ["Peak display brightness (nits)", "Anti-glare coating grade"],
      options: [
        { label: "Under 300 nits — indoor only", value: "low" },
        { label: "300–500 nits — most indoor conditions", value: "mid" },
        { label: "500–1000 nits — bright office / indirect sun", value: "high" },
        { label: "1000+ nits — direct sunlight readable", value: "ultra" },
      ],
    },
    3: {
      question: "What is the primary processor tier in this device?",
      whyFailed: "Without a processor tier, I can't compare value against refurbished alternatives.",
      missingKnowledge: ["Processor model / generation", "Performance tier (entry / mid / pro)"],
      options: [
        { label: "Entry-level — everyday tasks, light productivity", value: "entry" },
        { label: "Mid-range — multitasking, light creative work", value: "mid" },
        { label: "Pro-class — video editing, 3D rendering", value: "pro" },
        { label: "Workstation-grade — ML / data science workloads", value: "workstation" },
      ],
    },
    4: {
      question: "Which generation upgrade most defines this model vs. its predecessor?",
      whyFailed: "I can't position this against last year's model without a clear differentiating spec.",
      missingKnowledge: ["Generation improvement summary", "Benchmark delta vs. prior model"],
      options: [
        { label: "CPU / GPU performance leap (>20%)", value: "perf" },
        { label: "Battery life extension (>2 hours)", value: "battery" },
        { label: "Display quality upgrade (resolution / refresh / HDR)", value: "display" },
        { label: "Form factor redesign (thinner, lighter, new ports)", value: "form" },
      ],
    },
    5: {
      question: "What is the operating temperature range of this device?",
      whyFailed: "Cold-weather use cases can't be evaluated without a specified operating temperature floor.",
      missingKnowledge: ["Min operating temperature (°C)", "Cold-weather performance notes"],
      options: [
        { label: "0°C to 35°C — standard indoor range", value: "standard" },
        { label: "-10°C to 40°C — light outdoor / travel use", value: "outdoor" },
        { label: "-20°C to 50°C — field / expedition grade", value: "field" },
        { label: "MIL-SPEC rated — certified extreme conditions", value: "milspec" },
      ],
    },
    6: {
      question: "How intuitive is initial setup for a non-technical user?",
      whyFailed: "Setup complexity is unaddressed, making it hard to recommend to less technical audiences.",
      missingKnowledge: ["Setup steps count", "Guided setup / onboarding notes"],
      options: [
        { label: "Plug-and-play — ready in under 2 minutes", value: "instant" },
        { label: "Simple — under 10 minutes with on-screen guide", value: "simple" },
        { label: "Moderate — 15–30 min, some configuration needed", value: "moderate" },
        { label: "Technical — requires IT support or manual reading", value: "technical" },
      ],
    },
  };

  if (isClothing) return {
    1: {
      question: "What is the breathability rating of the fabric?",
      whyFailed: "I can't advise on thermal comfort without a breathability or moisture-wicking rating.",
      missingKnowledge: ["Breathability rating (g/m²/24h)", "Moisture-wicking certification"],
      options: [
        { label: "Under 2,000 g/m² — light breathability", value: "low" },
        { label: "2,000–4,999 g/m² — moderate, casual active wear", value: "mid" },
        { label: "5,000–9,999 g/m² — high, sport performance", value: "high" },
        { label: "10,000+ g/m² — extreme, alpine / endurance sport", value: "extreme" },
      ],
    },
    2: {
      question: "What is the fabric's dress code compatibility?",
      whyFailed: "Without style classification, I can't confirm suitability for semi-formal settings.",
      missingKnowledge: ["Dress code category", "Occasion suitability notes"],
      options: [
        { label: "Casual — weekend, leisure, streetwear", value: "casual" },
        { label: "Smart-casual — office, dinner, events", value: "smartcasual" },
        { label: "Business — professional settings", value: "business" },
        { label: "Formal — black tie or equivalent", value: "formal" },
      ],
    },
    3: {
      question: "What are the washing instructions for this garment?",
      whyFailed: "Care requirements are absent, leaving buyers unable to evaluate long-term maintenance.",
      missingKnowledge: ["Wash temperature limit", "Tumble dry / dry-clean notes"],
      options: [
        { label: "Machine wash cold, tumble dry low", value: "easy" },
        { label: "Machine wash warm, lay flat to dry", value: "moderate" },
        { label: "Hand wash only, air dry", value: "delicate" },
        { label: "Dry clean only", value: "drycleane" },
      ],
    },
    4: {
      question: "How does the fabric quality compare to similar price-point garments?",
      whyFailed: "No comparative quality indicators exist to position this garment on the value spectrum.",
      missingKnowledge: ["Thread count / GSM weight", "Quality tier vs. market"],
      options: [
        { label: "Entry-level — functional, budget-conscious", value: "entry" },
        { label: "Mid-range — solid everyday quality", value: "mid" },
        { label: "Premium — noticeably better hand-feel and finish", value: "premium" },
        { label: "Luxury — artisan construction, heritage materials", value: "luxury" },
      ],
    },
    5: {
      question: "What is the garment weight (GSM) of the fabric?",
      whyFailed: "Without fabric weight, durability for daily use cannot be properly assessed.",
      missingKnowledge: ["Fabric weight (GSM)", "Estimated lifespan under daily wear"],
      options: [
        { label: "Under 150 GSM — ultra-light, sheer", value: "ultralight" },
        { label: "150–250 GSM — lightweight, warm weather", value: "light" },
        { label: "250–400 GSM — mid-weight, year-round", value: "mid" },
        { label: "400+ GSM — heavy, outerwear / winter", value: "heavy" },
      ],
    },
    6: {
      question: "How would you describe the presentation and unboxing experience?",
      whyFailed: "Gift suitability can't be evaluated without packaging or perceived luxury cues.",
      missingKnowledge: ["Packaging quality", "Gift-readiness description"],
      options: [
        { label: "Basic poly bag — functional only", value: "basic" },
        { label: "Branded tissue wrap in a plain box", value: "branded" },
        { label: "Premium box with ribbon and care card", value: "premium" },
        { label: "Luxury presentation — embossed, gift-wrapped", value: "luxury" },
      ],
    },
  };

  if (isBag) return {
    1: {
      question: "What is the bag's carry capacity in litres?",
      whyFailed: "Daily commute suitability can't be determined without volume and organisation details.",
      missingKnowledge: ["Capacity (litres)", "Number of compartments"],
      options: [
        { label: "Under 15 L — essentials only (tablet + lunch)", value: "small" },
        { label: "15–25 L — daily commuter (laptop + gym kit)", value: "commuter" },
        { label: "25–40 L — weekend / 2-day travel", value: "weekend" },
        { label: "40+ L — multi-day travel or hiking", value: "large" },
      ],
    },
    2: {
      question: "What are the carry-on dimensions of this bag?",
      whyFailed: "Airline carry-on compliance can't be confirmed without declared dimensions.",
      missingKnowledge: ["Dimensions (cm / in)", "Airline compatibility note"],
      options: [
        { label: "Fits under the seat in front (personal item)", value: "underseat" },
        { label: "Carry-on compliant — most airlines (≤55×40×20 cm)", value: "carryon" },
        { label: "Carry-on for low-cost carriers only (≤40×20×25 cm)", value: "budget" },
        { label: "Oversized — check-in or regional airlines only", value: "oversized" },
      ],
    },
    3: {
      question: "What is the maximum load the shoulder straps are rated for?",
      whyFailed: "Without a weight capacity, practical daily load limits can't be advised.",
      missingKnowledge: ["Max load capacity (kg)", "Strap padding / ergonomic rating"],
      options: [
        { label: "Up to 5 kg — light daily carry", value: "light" },
        { label: "5–10 kg — standard laptop + gear", value: "medium" },
        { label: "10–15 kg — heavy commute or school load", value: "heavy" },
        { label: "15+ kg — hiking / expedition grade", value: "expedition" },
      ],
    },
    4: {
      question: "How does the material durability compare to standard canvas alternatives?",
      whyFailed: "No material spec or durability claim is present to differentiate from generic alternatives.",
      missingKnowledge: ["Material type and denier rating", "Durability comparison claim"],
      options: [
        { label: "Similar to standard canvas — basic use", value: "basic" },
        { label: "Ballistic nylon — 2–3× more tear resistant", value: "nylon" },
        { label: "Cordura® or equivalent — heavy-duty, abrasion-proof", value: "cordura" },
        { label: "Technical / military-spec fabric", value: "milspec" },
      ],
    },
    5: {
      question: "What is the water resistance level of this bag?",
      whyFailed: "Weather protection during cycling commutes is unknown without a waterproofing standard.",
      missingKnowledge: ["Water resistance rating (mm / IPX)", "Seam sealing details"],
      options: [
        { label: "No water resistance — fair weather only", value: "none" },
        { label: "DWR coating — light rain resistant", value: "dwr" },
        { label: "Waterproof base + DWR body", value: "partial" },
        { label: "Fully waterproof — submersible rated", value: "full" },
      ],
    },
    6: {
      question: "How is the bag's quality perceived as a gift item?",
      whyFailed: "Gift premium perception can't be assessed without describing materials, packaging, or brand positioning.",
      missingKnowledge: ["Packaging and presentation", "Perceived luxury tier"],
      options: [
        { label: "Utilitarian — gift card optional", value: "util" },
        { label: "Presentable — clean design, decent brand label", value: "decent" },
        { label: "Premium gift — quality materials, branded packaging", value: "premium" },
        { label: "Luxury gift — heritage craftsmanship, gift box", value: "luxury" },
      ],
    },
  };

  if (isSkincare) return {
    1: {
      question: "What skin type is this product formulated for?",
      whyFailed: "Without skin type classification, suitability for a specific user can't be confirmed.",
      missingKnowledge: ["Target skin type", "Tested skin condition notes"],
      options: [
        { label: "Dry / very dry — barrier-repair focus", value: "dry" },
        { label: "Normal / combination — balanced formulation", value: "normal" },
        { label: "Oily / acne-prone — lightweight, non-comedogenic", value: "oily" },
        { label: "Sensitive / reactive — fragrance-free, hypoallergenic", value: "sensitive" },
      ],
    },
    2: {
      question: "What SPF level does this product provide?",
      whyFailed: "UV protection level is missing, which is critical for recommending outdoor skincare.",
      missingKnowledge: ["SPF rating", "Broad-spectrum UVA/UVB certification"],
      options: [
        { label: "No SPF — indoor use only", value: "none" },
        { label: "SPF 15 — everyday minimal protection", value: "spf15" },
        { label: "SPF 30 — standard outdoor protection", value: "spf30" },
        { label: "SPF 50+ — high UV exposure, sport / beach use", value: "spf50" },
      ],
    },
    3: {
      question: "What is the primary active ingredient concentration?",
      whyFailed: "Efficacy comparisons require concentration data for the hero ingredient.",
      missingKnowledge: ["Active ingredient %", "Clinical evidence tier"],
      options: [
        { label: "Entry dose — cosmetic effect, low actives", value: "entry" },
        { label: "Standard — proven cosmetic benefit", value: "standard" },
        { label: "Clinical-strength — dermatologist-grade", value: "clinical" },
        { label: "Prescription-equivalent — maximum actives", value: "rx" },
      ],
    },
    4: {
      question: "How does the texture compare to other products in this category?",
      whyFailed: "Texture preferences are highly personal; without a description, comparison is impossible.",
      missingKnowledge: ["Texture descriptor", "Absorption speed"],
      options: [
        { label: "Watery / serum — fast absorbing", value: "serum" },
        { label: "Light lotion — balanced hydration", value: "lotion" },
        { label: "Rich cream — occlusive, overnight repair", value: "cream" },
        { label: "Balm / oil — ultra-rich, barrier-sealing", value: "balm" },
      ],
    },
    5: { question: "What is the product's pH level?", whyFailed: "pH compatibility with other skincare steps is unknown.", missingKnowledge: ["pH level", "Layering order recommendation"],
      options: [
        { label: "pH 3–4 — exfoliant / acid range", value: "acid" },
        { label: "pH 5–6 — skin-barrier compatible", value: "barrier" },
        { label: "pH 7 — neutral", value: "neutral" },
        { label: "pH 7+ — alkaline, cleansing use", value: "alkaline" },
      ],
    },
    6: { question: "Is the formulation vegan and cruelty-free certified?", whyFailed: "Ethical certification status is absent from the description.", missingKnowledge: ["Vegan certification", "Cruelty-free certification body"],
      options: [
        { label: "Not certified — no claim made", value: "none" },
        { label: "Brand claims vegan — not third-party verified", value: "claim" },
        { label: "Leaping Bunny or PETA certified", value: "certified" },
        { label: "Certified vegan + B Corp / ethical supply chain", value: "fullethical" },
      ],
    },
  };

  if (isFood) return {
    1: {
      question: "What is the protein content per serving?",
      whyFailed: "Nutritional suitability for training can't be confirmed without macro breakdown.",
      missingKnowledge: ["Protein (g) per serving", "Serving size (g)"],
      options: [
        { label: "Under 5 g — minimal protein", value: "low" },
        { label: "5–15 g — moderate — snack tier", value: "moderate" },
        { label: "15–30 g — high — meal replacement tier", value: "high" },
        { label: "30+ g — sport / performance supplement tier", value: "sport" },
      ],
    },
    2: { question: "What allergens are present in this product?", whyFailed: "Allergen information is critical for recommending food products and is absent.", missingKnowledge: ["Allergen declaration", "Cross-contamination warning"],
      options: [
        { label: "Contains gluten, dairy, nuts", value: "common" },
        { label: "Gluten-free, contains dairy only", value: "gf" },
        { label: "Dairy-free, contains gluten", value: "df" },
        { label: "Free from top 14 allergens", value: "free" },
      ],
    },
    3: { question: "Is this product certified organic?", whyFailed: "Organic sourcing claims are absent, limiting trust for health-focused buyers.", missingKnowledge: ["Organic certification body", "Sourcing region"],
      options: [
        { label: "Not organic — conventional farming", value: "none" },
        { label: "Brand claims natural — not certified", value: "claim" },
        { label: "USDA Organic or EU Organic certified", value: "certified" },
        { label: "Demeter Biodynamic certified", value: "biodynamic" },
      ],
    },
    4: { question: "How does the sugar content compare to category averages?", whyFailed: "Without sugar data, diabetic or low-sugar diet suitability can't be evaluated.", missingKnowledge: ["Sugar (g) per 100g", "Added vs. natural sugar split"],
      options: [
        { label: "High sugar (>15 g/100g) — indulgent", value: "high" },
        { label: "Moderate (5–15 g/100g) — everyday", value: "mod" },
        { label: "Low sugar (<5 g/100g) — health-conscious", value: "low" },
        { label: "No added sugar — natural sugars only", value: "none" },
      ],
    },
    5: { question: "What is the shelf life of this product?", whyFailed: "Durability for bulk buying or travel can't be assessed without shelf life data.", missingKnowledge: ["Best-before duration", "Storage requirements"],
      options: [
        { label: "Under 1 week — fresh / refrigerated", value: "fresh" },
        { label: "1–4 weeks — chilled short shelf life", value: "short" },
        { label: "1–12 months — ambient stable", value: "ambient" },
        { label: "12+ months — long shelf life / preserved", value: "long" },
      ],
    },
    6: { question: "Is this product suitable for vegan diets?", whyFailed: "Dietary suitability signals are missing from the description.", missingKnowledge: ["Vegan suitability", "Animal-derived ingredient list"],
      options: [
        { label: "Not vegan — contains animal products", value: "no" },
        { label: "Vegetarian — no meat, may contain dairy/eggs", value: "veggie" },
        { label: "Vegan — no animal products", value: "vegan" },
        { label: "Certified vegan by third party", value: "certifiedvegan" },
      ],
    },
  };

  // Generic fallback panels
  return {
    1: {
      question: "Who is the primary target audience for this product?",
      whyFailed: "I can't match this product to a specific buyer profile without audience-defining language.",
      missingKnowledge: ["Target user demographic", "Primary use case"],
      options: [
        { label: "General consumers — broad household appeal", value: "general" },
        { label: "Young professionals (25–35)", value: "youngpro" },
        { label: "Active lifestyle / sports enthusiasts", value: "active" },
        { label: "Industry specialists / professional users", value: "specialist" },
      ],
    },
    2: {
      question: "Under what environmental conditions is this product designed to perform?",
      whyFailed: "Context-specific performance can't be confirmed — no environmental use case is described.",
      missingKnowledge: ["Primary use environment", "Environmental resistance rating"],
      options: [
        { label: "Indoor / controlled environments only", value: "indoor" },
        { label: "Outdoor — fair weather conditions", value: "fair" },
        { label: "Outdoor — all-weather rated", value: "allweather" },
        { label: "Extreme conditions — industrial or expedition grade", value: "extreme" },
      ],
    },
    3: {
      question: "What is the single strongest reason a customer would choose this over alternatives?",
      whyFailed: "I can't justify a recommendation switch without a clearly stated competitive advantage.",
      missingKnowledge: ["Primary differentiator", "Unique value proposition"],
      options: [
        { label: "Superior performance vs. comparable products", value: "performance" },
        { label: "Better value — more features per dollar", value: "value" },
        { label: "Premium quality — materials or craftsmanship", value: "quality" },
        { label: "Unique design or exclusive features not found elsewhere", value: "unique" },
      ],
    },
    4: {
      question: "How would you benchmark this product against category leaders?",
      whyFailed: "No comparative benchmarks or competitive claims are present in the description.",
      missingKnowledge: ["Category benchmark data", "Named competitor comparisons"],
      options: [
        { label: "Budget tier — priced below category average", value: "budget" },
        { label: "Mid-tier — on par with mainstream alternatives", value: "mid" },
        { label: "Premium — outperforms most in category", value: "premium" },
        { label: "Best-in-class — category leader by key metric", value: "best" },
      ],
    },
    5: {
      question: "How long is this product designed to last under regular use?",
      whyFailed: "Durability expectations are unset, leaving long-term value impossible to assess.",
      missingKnowledge: ["Expected lifespan", "Warranty or durability guarantee"],
      options: [
        { label: "Under 1 year — seasonal or disposable use", value: "short" },
        { label: "1–3 years — standard consumer lifespan", value: "standard" },
        { label: "3–7 years — above-average durability", value: "durable" },
        { label: "7+ years — heirloom or professional-grade longevity", value: "heirloom" },
      ],
    },
    6: {
      question: "How would a recipient perceive this as a gift?",
      whyFailed: "Gift premium perception can't be evaluated without a description of finish, packaging, or brand positioning.",
      missingKnowledge: ["Packaging and presentation quality", "Perceived brand prestige"],
      options: [
        { label: "Practical — appreciated for function", value: "practical" },
        { label: "Thoughtful — solid quality, well-presented", value: "thoughtful" },
        { label: "Impressive — clearly premium, memorable", value: "impressive" },
        { label: "Exceptional — luxury feel, gift-of-the-year tier", value: "exceptional" },
      ],
    },
  };
}

export function generateChallenges(
  description: string,
  result: AnalysisResult
): ChallengeReport {
  const words = description.toLowerCase();

  // Derive signals
  const hasMaterials = /(material|made from|crafted|leather|steel|wood|cotton|fabric|aluminum)/i.test(description);
  const hasDimensions = /(\d+\s*(cm|mm|inch|in|ft|kg|g|lb|oz|ml|l\b|%))/i.test(description);
  const hasWeather = /(waterproof|weather|rain|wet|outdoor|wind|temperature|cold|heat)/i.test(description);
  const hasAudience = /(beginner|professional|intermediate|expert|athlete|runner|cyclist|traveler|student)/i.test(description);
  const hasBenefits = /(helps|enables|boosts|improves|reduces|increases|saves|delivers)/i.test(description);
  const hasComparison = /(vs|versus|compared|unlike|better than|outperforms)/i.test(description);
  const hasUseCase = /(for|ideal for|perfect for|designed for|suitable for)/i.test(description);
  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;

  // Detect product type for realistic queries
  const isShoe = /(shoe|sneaker|boot|footwear|sole|grip|outsole)/i.test(description);
  const isElectronics = /(battery|charging|wireless|bluetooth|processor|screen|display)/i.test(description);
  const isClothing = /(fabric|wash|wear|fit|size|sleeve|collar|jacket|shirt|pants)/i.test(description);
  const isBag = /(bag|backpack|strap|pocket|zipper|compartment|carry)/i.test(description);

  function productQuery(persona: string, context: string, intent: string, comparison: string) {
    if (isShoe) return { persona, context, intent, comparison };
    if (isElectronics) return {
      persona: "I use my laptop for 10-hour work days. Will the battery last?",
      context: "I need to use this outdoors in direct sunlight. Is the screen readable?",
      intent: "What makes this better than buying a refurbished model?",
      comparison: "How does this compare to last year's version for video editing?",
    };
    if (isClothing) return {
      persona: "I run hot. Will this be comfortable in summer?",
      context: "I need to wear this to a business casual event. Is it appropriate?",
      intent: "Can I machine wash this without it shrinking?",
      comparison: "Is the quality noticeably better than high-street alternatives?",
    };
    if (isBag) return {
      persona: "I commute daily by bike. Is this bag practical for me?",
      context: "I travel carry-on only. Will this fit in an overhead bin?",
      intent: "How many days of gear can realistically fit in this?",
      comparison: "Is this more durable than a standard canvas backpack?",
    };
    return { persona, context, intent, comparison };
  }

  const queries = productQuery(
    "I'm an intermediate runner training for a half marathon. Are these suitable?",
    "I'm running a half marathon in Singapore during heavy rain. Will these have enough grip?",
    "I want to switch from my current brand. What specific advantage does this offer?",
    "How does this compare to the leading competitor for long-distance trail running?"
  );

  // Score each challenge based on description signals
  const personaConf = Math.min(97, Math.round(
    (hasAudience ? 45 : 15) + (hasBenefits ? 30 : 0) + (wordCount >= 50 ? 22 : wordCount / 3)
  ));
  const contextConf = Math.min(97, Math.round(
    (hasWeather ? 55 : 10) + (hasDimensions ? 20 : 0) + (hasMaterials ? 20 : 0)
  ));
  const intentConf = Math.min(97, Math.round(
    (hasBenefits ? 35 : 5) + (hasUseCase ? 30 : 5) + (wordCount >= 40 ? 25 : wordCount / 2)
  ));
  const comparisonConf = Math.min(97, Math.round(
    (hasComparison ? 60 : 8) + (hasMaterials ? 20 : 0) + (hasDimensions ? 15 : 0)
  ));

  function status(conf: number): ChallengeStatus {
    if (conf >= 70) return "PASSED";
    if (conf >= 40) return "PARTIAL";
    return "FAILED";
  }

  function missing(conf: number, type: ChallengeType): string | null {
    if (conf >= 70) return null;
    const gaps: Record<ChallengeType, string> = {
      Persona: "Target audience & skill level",
      Context: hasWeather ? "Surface-specific performance data" : "Environmental use conditions",
      Intent: "Explicit benefit statements",
      Comparison: "Competitive differentiation claims",
    };
    return gaps[type];
  }

  const panels = buildPanels(description);

  const challenges: Challenge[] = [
    { id: 1, type: "Persona",     icon: "◉", query: queries.persona,     confidence: personaConf,     status: status(personaConf),     missing: missing(personaConf, "Persona"),     panel: panels[1] },
    { id: 2, type: "Context",     icon: "◈", query: queries.context,     confidence: contextConf,     status: status(contextConf),     missing: missing(contextConf, "Context"),     panel: panels[2] },
    { id: 3, type: "Intent",      icon: "◎", query: queries.intent,      confidence: intentConf,      status: status(intentConf),      missing: missing(intentConf, "Intent"),      panel: panels[3] },
    { id: 4, type: "Comparison",  icon: "◇", query: queries.comparison,  confidence: comparisonConf,  status: status(comparisonConf),  missing: missing(comparisonConf, "Comparison"), panel: panels[4] },
    {
      id: 5, type: "Context", icon: "◈",
      query: isShoe
        ? "I have wide feet and supinate. Will these work for me?"
        : isElectronics
        ? "I need to use this in -10°C mountain conditions. Any concerns?"
        : "I need this to last 3+ years with daily use. Is it durable enough?",
      confidence: Math.min(97, Math.round((hasMaterials ? 50 : 12) + (hasDimensions ? 30 : 5))),
      status: status(Math.min(97, Math.round((hasMaterials ? 50 : 12) + (hasDimensions ? 30 : 5)))),
      missing: missing(Math.min(97, Math.round((hasMaterials ? 50 : 12) + (hasDimensions ? 30 : 5))), "Context"),
      panel: panels[5],
    },
    {
      id: 6, type: "Persona", icon: "◉",
      query: isShoe
        ? "I'm recovering from a knee injury. Is this cushioning sufficient?"
        : isElectronics
        ? "I'm not very tech-savvy. Is this easy to set up and use daily?"
        : "I'm gifting this to someone — does it come across as a premium product?",
      confidence: Math.min(97, Math.round((hasBenefits ? 40 : 10) + (wordCount >= 60 ? 35 : wordCount / 2))),
      status: status(Math.min(97, Math.round((hasBenefits ? 40 : 10) + (wordCount >= 60 ? 35 : wordCount / 2)))),
      missing: missing(Math.min(97, Math.round((hasBenefits ? 40 : 10) + (wordCount >= 60 ? 35 : wordCount / 2))), "Persona"),
      panel: panels[6],
    },
  ];

  const passed  = challenges.filter((c) => c.status === "PASSED").length;
  const partial = challenges.filter((c) => c.status === "PARTIAL").length;
  const failed  = challenges.filter((c) => c.status === "FAILED").length;
  const readiness = Math.round((passed * 100 + partial * 50) / (challenges.length * 100) * 100);

  // Detect a product name from description (first 2–4 capitalized words or generic fallback)
  const nameMatch = description.match(/^([A-Z][a-zA-Z0-9]+([\s-][A-Z][a-zA-Z0-9]+){0,3})/);
  const productName = nameMatch ? nameMatch[0] : words.split(" ").slice(0, 2).join(" ");

  return { productName, readiness, passed, partial, failed, challenges };
}

export type ScoreCategory = {
  label: string;
  score: number;
  note: string;
  color: string;
};

export type AnalysisResult = {
  productId?: string;
  overall: number;
  grade: string;
  categories: ScoreCategory[];
  summary: string;
  llmScore: number;
  llmVerdict: string;
  llmRationale: string;
};

export function analyzeDescription(text: string): AnalysisResult {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const charCount = text.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const hasNumbers = /\d/.test(text);
  const hasBullets = /[-•*]/.test(text);
  const hasEmotional =
    /(amazing|powerful|transform|elevate|premium|luxury|innovative|revolutionary|breakthrough|exceptional|superior)/i.test(
      text
    );
  const hasBenefits =
    /(helps|enables|allows|ensures|prevents|boosts|improves|reduces|increases|saves|delivers|provides|features|designed)/i.test(
      text
    );
  const hasMaterials =
    /(material|made from|crafted|built|constructed|fabric|leather|steel|wood|cotton|silk|aluminum|carbon|composite)/i.test(
      text
    );
  const hasDimensions =
    /(\d+\s*(cm|mm|inch|in|ft|kg|g|lb|oz|ml|l\b|%))/i.test(text);
  const hasTargetAudience =
    /(for|ideal for|perfect for|designed for|suitable for|great for)/i.test(
      text
    );
  const hasComparison =
    /(vs|versus|compared|unlike|better than|outperforms)/i.test(text);

  const clarity = Math.min(
    100,
    Math.round(
      (words.length >= 20 ? 30 : words.length * 1.5) +
        (sentences.length >= 2 ? 25 : sentences.length * 12) +
        (hasBullets ? 20 : 0) +
        (charCount >= 150 ? 25 : charCount / 6)
    )
  );

  const completeness = Math.min(
    100,
    Math.round(
      (hasMaterials ? 25 : 5) +
        (hasDimensions ? 25 : 5) +
        (hasNumbers ? 20 : 0) +
        (words.length >= 50 ? 30 : words.length * 0.6)
    )
  );

  const persuasiveness = Math.min(
    100,
    Math.round(
      (hasEmotional ? 35 : 0) +
        (hasBenefits ? 35 : 0) +
        (words.length >= 30 ? 30 : words.length)
    )
  );

  const seoScore = Math.min(
    100,
    Math.round(
      (words.length >= 30 ? 30 : words.length) +
        (hasNumbers ? 20 : 0) +
        (words.length >= 60 ? 30 : 0) +
        (sentences.length >= 3 ? 20 : sentences.length * 6)
    )
  );

  // LLM recommendability: structured, factual, specific, benefit-rich content
  const llmScore = Math.min(
    100,
    Math.round(
      (hasBenefits ? 22 : 0) +
        (hasDimensions ? 18 : 0) +
        (hasMaterials ? 15 : 0) +
        (words.length >= 60 ? 20 : words.length / 3) +
        (hasTargetAudience ? 12 : 0) +
        (hasComparison ? 8 : 0) +
        (sentences.length >= 4 ? 5 : 0)
    )
  );

  const overall = Math.round(
    (clarity + completeness + persuasiveness + seoScore) / 4
  );

  const grade =
    overall >= 85
      ? "A"
      : overall >= 70
      ? "B"
      : overall >= 55
      ? "C"
      : overall >= 40
      ? "D"
      : "F";

  const summary =
    overall >= 85
      ? "This is polished, high-converting product copy. The description is specific, benefit-driven, and structurally sound. It communicates value clearly to both customers and search engines."
      : overall >= 70
      ? "A competent product description with solid fundamentals. Adding more concrete specifications and emotionally resonant language would push it into top-tier territory."
      : overall >= 55
      ? "The description covers the basics but lacks depth. Customers and algorithms both reward specificity — add materials, dimensions, and clear benefit statements."
      : overall >= 40
      ? "Thin and underdeveloped. This copy risks low engagement and poor discoverability. A complete rewrite with structured benefits and concrete specs is recommended."
      : "Critically sparse. This description does not provide enough signal for customers, search engines, or AI assistants to recommend or surface the product.";

  const llmVerdict =
    llmScore >= 75
      ? "Likely to be recommended"
      : llmScore >= 50
      ? "Occasionally surfaced"
      : llmScore >= 30
      ? "Rarely cited by AI"
      : "Not LLM-discoverable";

  const llmRationale =
    llmScore >= 75
      ? "This description contains structured, factual, benefit-rich content that language models favor when answering product queries. High specificity and clear use-case framing make it easy for AI to extract and cite."
      : llmScore >= 50
      ? "The copy has some factual anchors LLMs can use, but lacks the specificity and structured benefits that make it consistently surface in AI-generated recommendations."
      : llmScore >= 30
      ? "LLMs struggle to extract meaningful attributes from this description. Without concrete specs, target use cases, or explicit benefits, the product is unlikely to appear in AI-driven discovery."
      : "This description is too sparse for AI models to extract product attributes. It will not be cited in conversational or generative search results.";

  return {
    overall,
    grade,
    summary,
    llmScore,
    llmVerdict,
    llmRationale,
    categories: [
      {
        label: "Clarity",
        score: clarity,
        note:
          clarity < 60 ? "Add structure and full sentences" : "Well-structured",
        color: "#7c6aff",
      },
      {
        label: "Completeness",
        score: completeness,
        note:
          completeness < 60 ? "Missing specs or materials" : "Good coverage",
        color: "#22d3ee",
      },
      {
        label: "Persuasiveness",
        score: persuasiveness,
        note:
          persuasiveness < 60
            ? "Add benefit-driven language"
            : "Strong voice",
        color: "#f472b6",
      },
      {
        label: "SEO Potential",
        score: seoScore,
        note: seoScore < 60 ? "Expand keyword density" : "Searchable content",
        color: "#34d399",
      },
      {
        label: "LLM Fit",
        score: llmScore,
        note: llmVerdict,
        color: "#fb923c",
      },
    ],
  };
}
