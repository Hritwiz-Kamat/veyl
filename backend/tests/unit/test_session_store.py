"""
Unit tests for SessionStore.
"""
from datetime import timedelta
from app.storage.session_store import SessionStore
from app.schemas.finding import Finding


def test_session_lifecycle():
    store = SessionStore(ttl_minutes=15)

    finding = Finding(
        id="f1",
        entity_type="PERSON",
        start=0,
        end=5,
        replacement="[PERSON_1]",
        severity="medium",
        confidence=0.9,
        source="presidio",
        selected_by_default=True,
    )

    session_id = store.create_session("Hello Alice", [finding])
    assert session_id is not None

    session = store.get_session(session_id)
    assert session is not None
    assert session.original_text == "Hello Alice"
    assert "f1" in session.findings

    # Deletion
    deleted = store.delete_session(session_id)
    assert deleted is True
    assert store.get_session(session_id) is None


def test_session_expiration():
    # Store with zero/negative TTL to test expiration
    store = SessionStore(ttl_minutes=0)
    store.ttl = timedelta(seconds=-1)

    session_id = store.create_session("Expired text", [])
    assert store.get_session(session_id) is None

