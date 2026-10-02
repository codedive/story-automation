"""Tests for Category CRUD API."""


def test_create_category(client):
    resp = client.post(
        "/api/categories",
        json={
            "name": "Test Category",
            "description": "desc",
            "default_language": "English",
            "default_duration": "60 Seconds",
            "visual_style": "2D Animated",
            "custom_instructions": "Be creative.",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Category"
    assert data["description"] == "desc"


def test_create_category_duplicate_name_rejected(client):
    client.post("/api/categories", json={"name": "Unique Name"})
    resp = client.post("/api/categories", json={"name": "Unique Name"})
    assert resp.status_code == 400


def test_edit_category(client):
    resp = client.post("/api/categories", json={"name": "Editable"})
    cat_id = resp.json()["id"]
    resp2 = client.put(f"/api/categories/{cat_id}", json={"description": "Updated desc", "default_language": "Hindi"})
    assert resp2.status_code == 200
    body = resp2.json()
    assert body["description"] == "Updated desc"
    assert body["default_language"] == "Hindi"


def test_delete_category(client):
    resp = client.post("/api/categories", json={"name": "ToDelete"})
    cat_id = resp.json()["id"]
    resp2 = client.delete(f"/api/categories/{cat_id}")
    assert resp2.status_code == 204
    resp3 = client.get(f"/api/categories/{cat_id}")
    assert resp3.status_code == 404


def test_list_categories_includes_story_count(client):
    resp = client.post("/api/categories", json={"name": "WithCount"})
    cat_id = resp.json()["id"]
    resp2 = client.get("/api/categories")
    assert resp2.status_code == 200
    match = next(c for c in resp2.json() if c["id"] == cat_id)
    assert match["story_count"] == 0
