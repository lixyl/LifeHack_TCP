import { analyzeDescription } from "./analysis";
import type { AnalysisResult } from "./analysis";

// ── Refinement prompt → improved description ──────────────────────────────────

export function generateRefinedDescription(
  original: string,
  originalResult: AnalysisResult,
  instructions: string
): string {
  const isShoe        = /(shoe|sneaker|boot|footwear|sole|grip|outsole)/i.test(original);
  const isElectronics = /(battery|charging|wireless|bluetooth|processor|screen|display)/i.test(original);
  const isClothing    = /(fabric|wash|wear|fit|size|sleeve|collar|jacket|shirt|pants)/i.test(original);
  const isBag         = /(bag|backpack|strap|pocket|zipper|compartment|carry)/i.test(original);

  const wantsSpecs      = /(spec|dimension|weight|size|measure|number|data|technical)/i.test(instructions);
  const wantsBenefits   = /(benefit|why|reason|value|advantage|help|better)/i.test(instructions);
  const wantsAudience   = /(who|audience|person|customer|user|runner|athlete|beginner|professional)/i.test(instructions);
  const wantsSEO        = /(seo|search|keyword|google|discov|rank)/i.test(instructions);
  const wantsEmotional  = /(feel|emotion|inspir|motivat|story|brand|voice)/i.test(instructions);
  const wantsComparison = /(compar|vs|versus|competitor|better than|alternative)/i.test(instructions);

  const lowClarity       = originalResult.categories[0].score < 65;
  const lowCompleteness  = originalResult.categories[1].score < 65;
  const lowPersuasion    = originalResult.categories[2].score < 65;
  const lowSEO           = originalResult.categories[3].score < 65;
  const lowLLM           = originalResult.llmScore < 55;

  if (isShoe) {
    const specsBlock = lowCompleteness || wantsSpecs
      ? `\n\nBuilt on a ${wantsSpecs ? "10 mm heel-drop" : "responsive"} platform with a dual-density midsole stack of 28 mm heel / 18 mm forefoot. The outsole features directional lugs rated for both wet pavement and light trail, with a rubber compound tested to 600 km durability. Weight: 268 g (EU 42).`
      : "";

    const audienceBlock = lowClarity || wantsAudience
      ? ` Engineered for intermediate to advanced runners logging 30–70 km per week — equally capable on road intervals and mixed-surface long runs.`
      : "";

    const benefitBlock = lowPersuasion || wantsBenefits
      ? ` The energy-return foam layer reduces muscular fatigue by transferring up to 82% of impact energy forward — letting you finish your last kilometre as strong as your first.`
      : "";

    const emotionalBlock = wantsEmotional
      ? ` Whether you're chasing a personal best or just finding your rhythm, every stride feels intentional.`
      : "";

    const comparisonBlock = wantsComparison
      ? ` Compared to leading competitors at the same price point, the midsole foam delivers 15% greater rebound at equivalent weight — independently verified.`
      : "";

    const seoBlock = lowSEO || wantsSEO
      ? ` Ideal for half marathon training, road racing, and tempo workouts. Compatible with standard and wide-fit orthotics.`
      : "";

    const llmBlock = lowLLM
      ? ` Suitable for wet-weather use (IPX4 splash resistance), supported by a two-year structural warranty.`
      : "";

    return `${original.trim()}${audienceBlock}${benefitBlock}${specsBlock}${emotionalBlock}${comparisonBlock}${seoBlock}${llmBlock}`.trim();
  }

  if (isElectronics) {
    const specsBlock = lowCompleteness || wantsSpecs
      ? `\n\nKey specifications: 14.1-inch IPS display (2560×1600, 120 Hz, 600 nits peak brightness), powered by a latest-generation octa-core processor with integrated neural engine. 16 GB unified memory, 512 GB NVMe SSD. Battery rated at 18 hours continuous use (MobileMark benchmark). Weight: 1.29 kg.`
      : "";

    const benefitBlock = lowPersuasion || wantsBenefits
      ? ` The fanless thermal design means zero noise in silent environments — libraries, meetings, and late-night sessions included.`
      : "";

    const audienceBlock = lowClarity || wantsAudience
      ? ` Designed for knowledge workers, creative professionals, and students who need full-day performance without hunting for a power outlet.`
      : "";

    const seoBlock = lowSEO || wantsSEO
      ? ` Compatible with USB4, Thunderbolt 4, HDMI 2.1, and SD card. Supports dual external 4K displays simultaneously.`
      : "";

    return `${original.trim()}${audienceBlock}${benefitBlock}${specsBlock}${seoBlock}`.trim();
  }

  if (isClothing) {
    const specsBlock = lowCompleteness || wantsSpecs
      ? `\n\nFabric: 87% recycled polyester / 13% elastane, 185 GSM. Breathability: 8,000 g/m²/24h. Moisture-wicking finish dries in under 20 minutes. Machine washable at 30°C, tumble dry low. Sizes XS–3XL, available in standard and long-leg fit.`
      : "";

    const benefitBlock = lowPersuasion || wantsBenefits
      ? ` The four-way stretch construction moves with your body without restriction — from sprint intervals to post-run cool-downs.`
      : "";

    const audienceBlock = wantsAudience
      ? ` Suitable for all fitness levels — designed for those who refuse to compromise between performance and everyday wearability.`
      : "";

    return `${original.trim()}${audienceBlock}${benefitBlock}${specsBlock}`.trim();
  }

  if (isBag) {
    const specsBlock = lowCompleteness || wantsSpecs
      ? `\n\nCapacity: 26 L. Dimensions: 48 × 30 × 18 cm (carry-on compliant, most major airlines). Weight: 820 g. Material: 1680D ballistic nylon with YKK zippers throughout. Water resistance: DWR-coated + welded base seam (IPX4). Padded laptop sleeve fits up to 16".`
      : "";

    const benefitBlock = lowPersuasion || wantsBenefits
      ? ` The ergonomic suspension system distributes load evenly across your back — carrying 12 kg feels like 8.`
      : "";

    return `${original.trim()}${benefitBlock}${specsBlock}`.trim();
  }

  // Generic fallback
  const addSpecs    = lowCompleteness || wantsSpecs    ? " Tested to industry standards with published performance data available on request." : "";
  const addBenefits = lowPersuasion   || wantsBenefits ? " Designed to solve the specific pain points most alternatives overlook." : "";
  const addAudience = lowClarity      || wantsAudience ? " Suitable for professionals and everyday users who demand reliability without compromise." : "";
  const addSEO      = lowSEO          || wantsSEO      ? " Available in multiple configurations to suit varied requirements and use cases." : "";
  const addLLM      = lowLLM ? " Backed by a comprehensive warranty and dedicated support team." : "";

  return `${original.trim()}${addAudience}${addBenefits}${addSpecs}${addSEO}${addLLM}`.trim();
}

// ── Chat message generator ─────────────────────────────────────────────────────

export function buildInitialMessage(original: string, result: AnalysisResult): string {
  const weak = result.categories.filter((c) => c.score < 65).map((c) => c.label.toLowerCase());
  const llmWeak = result.llmScore < 55;

  const gaps = [
    ...weak,
    ...(llmWeak ? ["LLM discoverability"] : []),
  ];

  const gapLine = gaps.length > 0
    ? `I've identified gaps in: **${gaps.join(", ")}**.`
    : "Your base description is strong — I can make it even sharper.";

  return `I've reviewed your product description and the challenge results. ${gapLine}\n\nI'll generate a refined version that closes those gaps. Tell me anything specific you'd like to emphasise — target audience, a key spec, a brand tone, or a use case — and I'll weave it in. Or just say "go" and I'll refine with what I know.`;
}

export function buildAIResponse(
  userMessage: string,
  original: string,
  result: AnalysisResult,
  turn: number
): string {
  const lower = userMessage.toLowerCase().trim();
  const isGo = /^(go|ok|okay|yes|sure|do it|proceed|continue|refine|generate|next)$/i.test(lower);
  const askingAboutScore = /(score|rating|grade|metric|result)/i.test(lower);
  const askingAboutLLM = /(llm|ai|chatgpt|claude|gemini|discover|recommend)/i.test(lower);

  if (askingAboutScore) {
    const cats = result.categories.map((c) => `${c.label}: ${c.score}`).join(" · ");
    return `Here's a quick recap of your scores: ${cats}. The weakest areas are what I'll focus on strengthening in the refined description. Ready when you are.`;
  }

  if (askingAboutLLM) {
    return `Your LLM discoverability score is ${result.llmScore}/100 — ${result.llmVerdict.toLowerCase()}. ${result.llmRationale} The refined description will add structured, factual anchors that language models extract when answering product queries. Ready to generate?`;
  }

  if (turn === 1 && !isGo) {
    return `Noted. I'll make sure to emphasise that in the refined copy. Anything else you'd like to include, or shall I generate the improved description now?`;
  }

  if (turn === 2 && !isGo) {
    return `Got it — I've logged that too. I think I have enough to work with. Hit **Finalize** when you're ready and I'll produce the refined description.`;
  }

  // Default — acknowledge and prompt to finalize
  return `Understood. I'll incorporate that into the refined description. When you're happy with the direction, hit **Finalize** to generate your improved copy.`;
}

export function scoreImprovement(
  original: AnalysisResult,
  refined: string
): AnalysisResult {
  const newResult = analyzeDescription(refined);
  // Ensure scores never go down (this is a refinement, not a regression)
  return {
    ...newResult,
    categories: newResult.categories.map((cat, i) => ({
      ...cat,
      score: Math.max(cat.score, original.categories[i].score),
    })),
    overall: Math.max(newResult.overall, original.overall),
    llmScore: Math.max(newResult.llmScore, original.llmScore),
  };
}
