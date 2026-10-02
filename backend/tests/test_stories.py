"""Tests for story generation (mocked AI), category isolation, numbering, and deletion."""
from tests.conftest import FakeAIProvider, make_story_json


def _create_category(client, name="Gen Category"):
    resp = client.post("/api/categories", json={"name": name})
    assert resp.status_code == 201
    return resp.json()["id"]


def test_generate_story_mock(client, mock_ai_provider):
    cat_id = _create_category(client, "Gen Category One")
    provider = FakeAIProvider([make_story_json(title="Unique Story One")])
    mock_ai_provider(provider)

    resp = client.post(f"/api/categories/{cat_id}/stories/generate", json={"story_idea": "test idea"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Unique Story One"
    assert data["category_id"] == cat_id
    assert data["episode_number"] == 1
    assert len(data["scenes"]) == 2
    assert data["seo_package"]["youtube_title"] == "Unique Story One"
    assert data["ai_model"] == "fake-model"
    assert data["ai_provider"] == "openai"


def test_generate_story_records_requested_ai_provider(client, mock_ai_provider):
    cat_id = _create_category(client, "Provider Tracking Category")
    provider = FakeAIProvider([make_story_json(title="Ollama Story")])
    mock_ai_provider(provider)

    resp = client.post(f"/api/categories/{cat_id}/stories/generate", json={"ai_provider": "ollama"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["ai_provider"] == "ollama"
    assert data["ai_model"] == "fake-model"

    fetched = client.get(f"/api/stories/{data['id']}").json()
    assert fetched["ai_provider"] == "ollama"


def test_generate_story_with_flow_prompt_requested(client, mock_ai_provider):
    cat_id = _create_category(client, "Flow Prompt Category")
    flow_text = "Wide shot of Raj and Simran at a cafe, rain starts, they laugh and share an umbrella..."
    provider = FakeAIProvider([make_story_json(title="Flow Prompt Story", flow_prompt=flow_text)])
    mock_ai_provider(provider)

    resp = client.post(
        f"/api/categories/{cat_id}/stories/generate",
        json={"include_title": True, "include_description": False, "include_tags": False, "include_flow_prompt": True},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["seo_package"]["flow_prompt"] == flow_text


def test_story_numbering_increments(client, mock_ai_provider):
    cat_id = _create_category(client, "Numbering Category")

    mock_ai_provider(
        FakeAIProvider(
            [
                make_story_json(
                    title="First Episode",
                    location="Cafe",
                    summary="Raj surprises Simran with a candlelit coffee date.",
                    hook="The barista winks mysteriously.",
                    ending="They share a laugh over spilled coffee.",
                    signature={
                        "primary_theme": "romantic date",
                        "location": "Cafe",
                        "conflict_type": "shyness",
                        "hook_type": "mystery",
                        "ending_type": "laughter",
                        "relationship_dynamic": "playful couple",
                    },
                )
            ]
        )
    )
    resp1 = client.post(f"/api/categories/{cat_id}/stories/generate", json={})
    assert resp1.status_code == 201
    assert resp1.json()["episode_number"] == 1

    mock_ai_provider(
        FakeAIProvider(
            [
                make_story_json(
                    title="Second Episode",
                    location="Beach",
                    summary="Simran challenges Raj to a sunset volleyball match.",
                    hook="A rogue wave soaks their phones.",
                    ending="They bury a time capsule in the sand.",
                    signature={
                        "primary_theme": "friendly competition",
                        "location": "Beach",
                        "conflict_type": "rivalry",
                        "hook_type": "surprise",
                        "ending_type": "bittersweet",
                        "relationship_dynamic": "competitive couple",
                    },
                )
            ]
        )
    )
    resp2 = client.post(f"/api/categories/{cat_id}/stories/generate", json={})
    assert resp2.status_code == 201
    assert resp2.json()["episode_number"] == 2


def test_story_belongs_to_correct_category(client, mock_ai_provider):
    cat_a = _create_category(client, "Category A")
    cat_b = _create_category(client, "Category B")

    mock_ai_provider(
        FakeAIProvider(
            [
                make_story_json(
                    title="Story In A",
                    location="Cafe",
                    summary="Raj surprises Simran with a candlelit coffee date.",
                    hook="The barista winks mysteriously.",
                    ending="They share a laugh over spilled coffee.",
                    signature={
                        "primary_theme": "romantic date",
                        "location": "Cafe",
                        "conflict_type": "shyness",
                        "hook_type": "mystery",
                        "ending_type": "laughter",
                        "relationship_dynamic": "playful couple",
                    },
                )
            ]
        )
    )
    client.post(f"/api/categories/{cat_a}/stories/generate", json={})

    mock_ai_provider(
        FakeAIProvider(
            [
                make_story_json(
                    title="Story In B",
                    location="Beach",
                    summary="Simran challenges Raj to a sunset volleyball match.",
                    hook="A rogue wave soaks their phones.",
                    ending="They bury a time capsule in the sand.",
                    signature={
                        "primary_theme": "friendly competition",
                        "location": "Beach",
                        "conflict_type": "rivalry",
                        "hook_type": "surprise",
                        "ending_type": "bittersweet",
                        "relationship_dynamic": "competitive couple",
                    },
                )
            ]
        )
    )
    client.post(f"/api/categories/{cat_b}/stories/generate", json={})

    stories_a = client.get(f"/api/categories/{cat_a}/stories").json()
    stories_b = client.get(f"/api/categories/{cat_b}/stories").json()

    assert len(stories_a) == 1
    assert len(stories_b) == 1
    assert stories_a[0]["title"] == "Story In A"
    assert stories_b[0]["title"] == "Story In B"


def test_delete_story(client, mock_ai_provider):
    cat_id = _create_category(client, "Delete Category")
    mock_ai_provider(FakeAIProvider([make_story_json(title="To Be Deleted")]))
    resp = client.post(f"/api/categories/{cat_id}/stories/generate", json={})
    story_id = resp.json()["id"]

    del_resp = client.delete(f"/api/stories/{story_id}")
    assert del_resp.status_code == 204

    get_resp = client.get(f"/api/stories/{story_id}")
    assert get_resp.status_code == 404


def test_generation_rejects_duplicate_until_attempts_exhausted(client, mock_ai_provider):
    cat_id = _create_category(client, "Duplicate Category")
    mock_ai_provider(FakeAIProvider([make_story_json(title="Same Idea Every Time", location="Cafe")]))
    resp1 = client.post(f"/api/categories/{cat_id}/stories/generate", json={})
    assert resp1.status_code == 201

    # Same exact title/content again -> every regeneration attempt is a duplicate -> 502 after exhausting attempts.
    mock_ai_provider(FakeAIProvider([make_story_json(title="Same Idea Every Time", location="Cafe")]))
    resp2 = client.post(f"/api/categories/{cat_id}/stories/generate", json={})
    assert resp2.status_code == 502


def test_create_manual_story(client):
    cat_id = _create_category(client, "Manual Category")
    resp = client.post(
        f"/api/categories/{cat_id}/stories/manual",
        json={
            "title": "A Hand-Written Episode",
            "hook": "Written by a human.",
            "summary": "Added manually so future AI generations avoid repeating it.",
            "story_text": "Full manually authored story text.",
            "ending": "A manually written ending.",
            "location": "village",
            "mood": "nostalgic",
            "characters": ["Raj", "Simran"],
            "status": "APPROVED",
            "signature": {
                "primary_theme": "nostalgia",
                "location": "village",
                "conflict_type": "misunderstanding",
                "hook_type": "flashback",
                "ending_type": "reunion",
                "relationship_dynamic": "childhood friends",
            },
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "A Hand-Written Episode"
    assert data["category_id"] == cat_id
    assert data["episode_number"] == 1
    assert data["status"] == "APPROVED"
    assert data["scenes"] == []

    # It now counts toward this category's duplicate-detection history for future AI generations.
    stories = client.get(f"/api/categories/{cat_id}/stories").json()
    assert len(stories) == 1
    assert stories[0]["title"] == "A Hand-Written Episode"
