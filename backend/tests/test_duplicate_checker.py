"""Tests for duplicate detection logic (normalized title + TF-IDF + signature overlap)."""
from app.models.story import Story
from app.schemas.story import StorySignature
from app.services.duplicate_checker import (
    check_duplicate_title,
    check_tfidf_similarity,
    evaluate_duplicate,
    normalize_title,
)


def _make_story(title, hook="", summary="", location="", ending="", signature_json=None):
    return Story(
        category_id=1,
        episode_number=1,
        title=title,
        hook=hook,
        summary=summary,
        story_text="",
        ending=ending,
        location=location,
        signature_json=signature_json,
    )


def test_normalize_title():
    assert normalize_title("  Hello, World!!  ") == "hello world"


def test_duplicate_title_detection():
    previous = [_make_story("Rainy Date Night")]
    assert check_duplicate_title("rainy date night!!", previous) is True
    assert check_duplicate_title("A Completely Different Title", previous) is False


def test_tfidf_similarity_high_for_near_identical_text():
    previous_texts = ["Raj and Simran get stuck in rain at a lakeside restaurant during their date night."]
    candidate = "Raj and Simran get stuck in rain at a lakeside restaurant during their date night."
    score = check_tfidf_similarity(candidate, previous_texts)
    assert score > 90


def test_tfidf_similarity_low_for_different_text():
    previous_texts = ["Raj and Simran get stuck in rain at a lakeside restaurant during their date night."]
    candidate = "A moral story about an honest woodcutter who finds a golden axe in the forest."
    score = check_tfidf_similarity(candidate, previous_texts)
    assert score < 30


def test_evaluate_duplicate_rejects_similar_signature():
    sig_json = StorySignature(
        primary_theme="romantic date",
        location="lakeside restaurant",
        conflict_type="weather interruption",
        hook_type="unexpected problem",
        ending_type="romantic confession",
        relationship_dynamic="playful couple",
    ).model_dump_json()
    previous = [_make_story("Episode One", summary="They meet at a restaurant.", signature_json=sig_json)]
    candidate_signature = StorySignature(
        primary_theme="romantic date",
        location="lakeside restaurant",
        conflict_type="weather interruption",
        hook_type="unexpected problem",
        ending_type="romantic confession",
        relationship_dynamic="playful couple",
    )
    result = evaluate_duplicate(
        candidate_title="Episode Two: Totally Different Words",
        candidate_hook="",
        candidate_summary="A new day begins.",
        candidate_location="lakeside restaurant",
        candidate_ending="",
        candidate_signature=candidate_signature,
        previous_stories=previous,
        threshold=72,
    )
    assert result.is_duplicate is True


def test_evaluate_duplicate_accepts_different_concept():
    previous = [_make_story("Episode One", summary="They meet at a restaurant.", location="restaurant")]
    result = evaluate_duplicate(
        candidate_title="A Totally Different Adventure",
        candidate_hook="",
        candidate_summary="They go on a road trip to the mountains.",
        candidate_location="mountain cabin",
        candidate_ending="",
        candidate_signature=StorySignature(primary_theme="adventure", location="mountain cabin"),
        previous_stories=previous,
        threshold=72,
    )
    assert result.is_duplicate is False
