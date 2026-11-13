"""
Unit tests for SessionStore.
"""
import os
import time
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


def test_cleanup_stale_disk_files(tmp_path):
    store = SessionStore(ttl_minutes=15)
    test_dir = str(tmp_path / "uploads")
    os.makedirs(test_dir, exist_ok=True)

    # 1. Create a stale file
    stale_file = os.path.join(test_dir, "stale.txt")
    with open(stale_file, "w") as f:
        f.write("stale content")

    # Manually set its mtime to 1 hour ago
    one_hour_ago = time.time() - 3600
    os.utime(stale_file, (one_hour_ago, one_hour_ago))

    # 2. Create an active file associated with an in-memory session
    active_file = os.path.join(test_dir, "active.txt")
    with open(active_file, "w") as f:
        f.write("active content")
    os.utime(active_file, (one_hour_ago, one_hour_ago))

    sess_id = store.create_file_session(
        file_path=active_file,
        file_type="text",
        text="active",
        findings=[],
    )

    # Run stale cleanup with 1800s threshold
    purged = store.cleanup_stale_disk_files(directories=[test_dir], max_age_seconds=1800)
    assert purged == 1

    # Assert stale file was deleted, but active session file was preserved
    assert not os.path.exists(stale_file)
    assert os.path.exists(active_file)

    # Cleanup session
    store.delete_session(sess_id)
    assert not os.path.exists(active_file)

