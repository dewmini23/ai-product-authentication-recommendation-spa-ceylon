"""
auth_scoring.py
Scoring logic and mock product reference store for authentication.
This module is isolated and can be tuned independently.

Decision thresholds:
  score >= 75               → verified
  50 <= score < 75          → unable_to_verify  (ambiguous/partial evidence)
  score < 50  AND brand present but label mismatch → suspected_counterfeit
  score < 50  AND brand absent                     → unable_to_verify
"""
from typing import List, Dict, Any, Tuple, Optional
from rapidfuzz import fuzz
from app.utils.auth_text import compact_text, normalize_text, extract_word_tokens

try:
    from app.utils.auth_reference_repository import get_active_auth_references_from_db
except ImportError:
    get_active_auth_references_from_db = None

# ── Short-keyword minimum length guard ────────────────────────────────────────
# Keywords shorter than this will NOT use fuzzy fallback against the full
# compact string (too many accidental matches).
SHORT_KW_THRESHOLD = 4

# ── Fuzzy thresholds ──────────────────────────────────────────────────────────
BRAND_KW_FUZZY_MIN = 80   # strict — brand must be very close
LABEL_KW_FUZZY_MIN = 88   # strict — label phrase must be very close

# ── Brand keyword set ─────────────────────────────────────────────────────────
EXPECTED_BRAND_KEYWORDS: List[str] = ["SPA", "CEYLON", "AYURVEDA"]

# Minimum brand keyword hits to consider brand "present" (suspicion-eligible)
BRAND_PRESENCE_MIN_HITS = 1

# ── Temporary mock reference store ───────────────────────────────────────────
# Replace with DB queries in a later phase.
MOCK_PRODUCT_REFERENCES: List[Dict[str, Any]] = [
    {
        "id": "mock_p1",
        "name": "Sleep Intense Body Lotion",
        "brand_keywords": ["SPA", "CEYLON", "AYURVEDA"],
        "label_keywords": ["SLEEP", "INTENSE", "BODY", "LOTION", "LAVENDER", "NEROLI"],
    },
    {
        "id": "mock_p2",
        "name": "White Jasmine Facial Scrub",
        "brand_keywords": ["SPA", "CEYLON"],
        "label_keywords": ["WHITE", "JASMINE", "FACIAL", "SCRUB", "BRIGHTENING"],
    },
    {
        "id": "mock_p3",
        "name": "Frankincense Kayalp Infusion",
        "brand_keywords": ["SPA", "CEYLON", "AYURVEDA"],
        "label_keywords": ["FRANKINCENSE", "KAYALP", "INFUSION", "RESTORATIVE"],
    },
    {
        "id": "mock_p4",
        "name": "White Rice Intensive Under-Eye Treatment Concentrate",
        "brand_keywords": ["SPA", "CEYLON", "AYURVEDA"],
        "label_keywords": [
            "WHITE", "RICE", "INTENSIVE", "UNDER-EYE",
            "TREATMENT", "CONCENTRATE",
            "PEPTIDE", "ACTION", "ADVANCED", "FORMULA",
        ],
    },
]


# ── Brand keyword matching (per-keyword, not full-string fuzzy) ───────────────

def _match_brand_keywords(brand_raw: str, brand_compact: str, expected_keywords: List[str]) -> Tuple[List[str], Dict[str, float]]:
    """
    Matches each expected brand keyword against the compact brand text.
    Strategy (per keyword):
      1. Exact compact substring match.
      2. Fuzzy token ratio against each word token in brand text (not whole string).
         This avoids "SPA" matching "SCRAPING" via partial_ratio on full string.
    Returns:
      (matched_keywords, {kw: best_score})
    """
    brand_tokens = list(extract_word_tokens(brand_raw))
    matched: List[str] = []
    scores: Dict[str, float] = {}

    for kw in expected_keywords:
        kw_c = compact_text(kw)
        # 1. Exact
        if kw_c in brand_compact:
            matched.append(kw)
            scores[kw] = 100.0
            continue
        # 2. Fuzzy against each token (not the full string)
        if len(kw_c) >= SHORT_KW_THRESHOLD:
            best = 0.0
            for tok in brand_tokens:
                s = fuzz.ratio(kw_c, tok)
                if s > best:
                    best = s
            scores[kw] = best
            if best >= BRAND_KW_FUZZY_MIN:
                matched.append(kw)
        else:
            scores[kw] = 100.0 if kw_c in brand_compact else 0.0

    return matched, scores


# ── Label keyword matching (token-based, no short-kw full-string fuzzy) ───────

def _match_label_keywords(
    label_tokens: set, label_compact: str, keywords: List[str]
) -> Tuple[int, List[str]]:
    """
    Safer label keyword matching.
    Strategy (per keyword):
      1. Token set membership (exact word match from OCR tokens).
      2. Compact substring (handles split words like 'L O T I O N').
      3. Fuzzy fallback — only for keywords >= SHORT_KW_THRESHOLD chars,
         and matched against the full compact string using token_set_ratio
         (more phrase-aware than partial_ratio).
    Returns (match_count, matched_keywords).
    """
    matched: List[str] = []
    for kw in keywords:
        kw_c = compact_text(kw)
        # 1. Exact token
        if kw.upper() in label_tokens:
            matched.append(kw)
            continue
        # 2. Compact substring
        if kw_c in label_compact:
            matched.append(kw)
            continue
        # 3. Fuzzy — only for longer keywords
        if len(kw_c) >= SHORT_KW_THRESHOLD:
            score = fuzz.token_set_ratio(kw_c, label_compact)
            if score >= LABEL_KW_FUZZY_MIN:
                matched.append(kw)
    return len(matched), matched


# ── Main scoring function ─────────────────────────────────────────────────────

def score_authentication(
    brand_raw: str, label_raw: str, ocr_reliable: bool = True
) -> Tuple[str, float, List[str], Dict[str, Any]]:
    """
    Main scoring function.
    Args:
        brand_raw: Raw OCR text from the brand_block crop.
        label_raw: Raw OCR text from the front_label crop.
    Returns:
        (status, score, reasons, debug_info)
        status: 'verified' | 'unable_to_verify' | 'suspected_counterfeit'
        score: 0.0–100.0
    """
    references = MOCK_PRODUCT_REFERENCES
    using_db = False

    if get_active_auth_references_from_db is not None:
        try:
            db_refs = get_active_auth_references_from_db()
            if db_refs:
                references = db_refs
                using_db = True
        except Exception:
            pass

    if using_db:
        print(f"[auth_scoring] Using DB references: {len(references)}")
    else:
        print("[auth_scoring] Using MOCK references")

    reasons: List[str] = []
    score = 0.0

    brand_norm = normalize_text(brand_raw)
    label_norm = normalize_text(label_raw)
    brand_compact = compact_text(brand_raw)
    label_compact = compact_text(label_raw)
    label_tokens = extract_word_tokens(label_raw)

    debug_info: Dict[str, Any] = {
        "brand_norm": brand_norm,
        "label_norm": label_norm,
        "brand_compact": brand_compact,
        "label_compact": label_compact,
        "brand_keyword_hits": [],
        "brand_keyword_scores": {},
        "label_keyword_hits": [],
        "candidate_matched": None,
        "candidate_score": 0.0,
        "final_raw_score": 0.0,
    }

    # ── Label candidate matching (up to 70 pts) ───────────────────────────────
    best_candidate: Optional[Dict] = None
    best_candidate_score = 0.0

    for candidate in references:
        match_count, matched_kws = _match_label_keywords(
            label_tokens, label_compact, candidate["label_keywords"]
        )
        candidate_pct = match_count / max(1, len(candidate["label_keywords"])) * 100.0
        if candidate_pct > best_candidate_score:
            best_candidate_score = candidate_pct
            best_candidate = {**candidate, "_matched_kws": matched_kws}

    debug_info["candidate_score"] = best_candidate_score

    if best_candidate and best_candidate_score >= 40.0:
        debug_info["candidate_matched"] = best_candidate["name"]
        debug_info["label_keyword_hits"] = best_candidate["_matched_kws"]
        label_pts = best_candidate_score * 0.70  # scale to 70 pts max
        score += label_pts
        reasons.append(
            f"Label matches '{best_candidate['name']}' "
            f"({best_candidate_score:.0f}% keyword match)."
        )
    else:
        reasons.append(
            "Unable to confidently match label text to any known product. "
            "Poor lighting, glare, or unsupported product may be the cause."
        )

    # ── Dynamic Brand scoring (up to 30 pts) ─────────────────────────────────
    expected_brand_keywords = best_candidate["brand_keywords"] if best_candidate else EXPECTED_BRAND_KEYWORDS
    debug_info["expected_brand_keywords_used"] = expected_brand_keywords
    
    brand_hits, brand_kw_scores = _match_brand_keywords(brand_raw, brand_compact, expected_brand_keywords)
    debug_info["brand_keyword_hits"] = brand_hits
    debug_info["brand_keyword_scores"] = brand_kw_scores

    brand_hit_count = len(brand_hits)
    brand_pts = 0.0

    if brand_hit_count >= 2:
        brand_pts = 30.0
        reasons.insert(0,
            f"Brand verified: {brand_hit_count}/{len(expected_brand_keywords)} "
            f"brand keywords detected ({', '.join(brand_hits)})."
        )
    elif brand_hit_count == 1:
        brand_pts = 15.0
        reasons.insert(0,
            f"Partial brand match: only '{brand_hits[0]}' detected. "
            "Brand verification inconclusive."
        )
    else:
        reasons.insert(0,
            f"No brand keywords ({' / '.join(expected_brand_keywords)}) detected in brand region. "
            "Brand block may be unreadable or absent."
        )

    score += brand_pts

    # ── Final decision ────────────────────────────────────────────────────────
    score = min(100.0, round(score, 2))
    debug_info["final_raw_score"] = score
    debug_info["counterfeit_rule_triggered"] = False

    if score >= 75.0:
        status = "verified"

    elif score >= 50.0:
        # Moderate — ambiguous evidence, not enough to judge either way
        reasons.append("Score is moderate; image quality may be limiting verification.")
        status = "unable_to_verify"

    else:
        # Low score:  if brand IS present but label does NOT match → suspicious
        # If brand is also absent → can't tell anything → unable_to_verify
        
        if best_candidate_score < 40.0 and brand_hit_count >= 1 and (
            "SPA" not in brand_hits or brand_kw_scores.get("CEYLON", 0) < 95.0
        ):
            if ocr_reliable:
                status = "suspected_counterfeit"
                debug_info["counterfeit_rule_triggered"] = True
                reasons.append("Brand text appears inconsistent (possible misspelling) and label does not match known references.")
            else:
                status = "unable_to_verify"
                debug_info["counterfeit_rule_triggered"] = False
                reasons.append("Brand text is inconsistent, but OCR quality is too low to definitively flag as counterfeit.")
            
        elif brand_hit_count >= BRAND_PRESENCE_MIN_HITS and best_candidate_score < 20.0:
            # Brand text present but label is clearly wrong/empty → counterfeit flag
            reasons.append(
                "Brand indicators detected but label content does not match "
                "any known product. This may indicate a counterfeit or mislabelled product."
            )
            status = "suspected_counterfeit"
        else:
            # Not enough evidence to flag as counterfeit; just unreadable/unknown
            status = "unable_to_verify"

    return status, score, reasons, debug_info
