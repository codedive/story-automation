"""Multi-stage duplicate detection: normalized title match, TF-IDF text similarity, and concept-signature overlap."""
import re
from dataclasses import dataclass

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.models.story import Story
from app.schemas.story import StorySignature


def normalize_title(title: str) -> str:
    """Lowercase, strip punctuation, and collapse whitespace for exact-title comparison."""
    title = title.lower()
    title = re.sub(r"[^\w\s]", "", title)
    title = re.sub(r"\s+", " ", title).strip()
    return title


def _combined_text(title: str | None, hook: str | None, summary: str | None, location: str | None, ending: str | None) -> str:
    return " ".join(filter(None, [title, hook, summary, location, ending]))


@dataclass
class DuplicateCheckResult:
    is_duplicate: bool
    similarity_score: float  # 0-100
    reason: str


def check_duplicate_title(candidate_title: str, previous_stories: list[Story]) -> bool:
    """Stage 1: normalized exact-title match against the same category's history."""
    normalized_candidate = normalize_title(candidate_title)
    return any(normalize_title(story.title) == normalized_candidate for story in previous_stories)


def check_tfidf_similarity(candidate_text: str, previous_texts: list[str]) -> float:
    """Stage 2: TF-IDF cosine similarity (0-100) against previous combined texts."""
    previous_texts = [t for t in previous_texts if t and t.strip()]
    if not previous_texts or not candidate_text.strip():
        return 0.0
    documents = previous_texts + [candidate_text]
    vectorizer = TfidfVectorizer(stop_words="english")
    try:
        tfidf_matrix = vectorizer.fit_transform(documents)
    except ValueError:
        return 0.0
    candidate_vector = tfidf_matrix[-1]
    previous_vectors = tfidf_matrix[:-1]
    similarities = cosine_similarity(candidate_vector, previous_vectors)[0]
    if similarities.size == 0:
        return 0.0
    return float(similarities.max() * 100)


def check_signature_overlap(candidate_signature: StorySignature, previous_signatures: list[StorySignature]) -> float:
    """Stage 3: concept-signature overlap (0-100) to catch reworded repeats of the same premise."""
    if not previous_signatures:
        return 0.0
    fields = ["primary_theme", "location", "conflict_type", "hook_type", "ending_type", "relationship_dynamic"]
    best = 0.0
    for prev in previous_signatures:
        matches = 0
        total = 0
        for field in fields:
            cand_val = (getattr(candidate_signature, field, "") or "").strip().lower()
            prev_val = (getattr(prev, field, "") or "").strip().lower()
            if not cand_val and not prev_val:
                continue
            total += 1
            if cand_val and prev_val and cand_val == prev_val:
                matches += 1
        if total == 0:
            continue
        overlap = (matches / total) * 100
        best = max(best, overlap)
    return best


def evaluate_duplicate(
    candidate_title: str,
    candidate_hook: str,
    candidate_summary: str,
    candidate_location: str,
    candidate_ending: str,
    candidate_signature: StorySignature,
    previous_stories: list[Story],
    threshold: float,
) -> DuplicateCheckResult:
    """Run all duplicate-detection stages and return the worst (highest) similarity found."""
    if check_duplicate_title(candidate_title, previous_stories):
        return DuplicateCheckResult(True, 100.0, "Duplicate title (normalized match) found in this category.")

    candidate_text = _combined_text(candidate_title, candidate_hook, candidate_summary, candidate_location, candidate_ending)
    previous_texts = [_combined_text(s.title, s.hook, s.summary, s.location, s.ending) for s in previous_stories]
    tfidf_score = check_tfidf_similarity(candidate_text, previous_texts)

    previous_signatures: list[StorySignature] = []
    for s in previous_stories:
        if s.signature_json:
            try:
                previous_signatures.append(StorySignature.model_validate_json(s.signature_json))
            except Exception:
                continue
    signature_score = check_signature_overlap(candidate_signature, previous_signatures)

    final_score = max(tfidf_score, signature_score)
    is_duplicate = final_score >= threshold
    reason = ""
    if is_duplicate:
        reason = (
            "Story concept/signature too similar to a previous story in this category."
            if signature_score >= tfidf_score
            else "Story text too similar (TF-IDF) to a previous story in this category."
        )
    return DuplicateCheckResult(is_duplicate, round(final_score, 2), reason)
