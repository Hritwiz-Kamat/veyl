"""
Unit tests for SecretDetector.
Uses only synthetic, non-sensitive credential patterns.
"""
import pytest
from app.privacy_engine.detectors.secret_detector import SecretDetector

detector = SecretDetector()


def test_clean_text_has_no_secrets():
    text = "The quick brown fox jumps over the lazy dog."
    findings = detector.analyze(text)
    assert len(findings) == 0


def test_openai_key_detection():
    fake_key = "sk-test1234567890abcdefghijklmnopqrstuvwxyz"
    text = f"My OpenAI key is {fake_key}."
    findings = detector.analyze(text)
    assert len(findings) == 1
    assert findings[0].entity_type == "OPENAI_KEY"
    assert text[findings[0].start:findings[0].end] == fake_key
    assert findings[0].source == "secret"


def test_aws_access_key_detection():
    fake_aws = "AKIAIOSFODNN7EXAMPLE"
    text = f"AWS credentials: aws_access_key_id = {fake_aws}"
    findings = detector.analyze(text)
    assert len(findings) == 1
    assert findings[0].entity_type == "AWS_KEY"
    assert text[findings[0].start:findings[0].end] == fake_aws


def test_github_token_detection():
    fake_gh = "ghp_1234567890abcdefghijklmnopqrstuvwxyzAB"
    text = f"Export GITHUB_TOKEN={fake_gh}"
    findings = detector.analyze(text)
    assert len(findings) == 1
    assert findings[0].entity_type == "GITHUB_TOKEN"
    assert text[findings[0].start:findings[0].end] == fake_gh


def test_private_key_detection():
    fake_pem = (
        "-----BEGIN RSA PRIVATE KEY-----\n"
        "MIIEowIBAAKCAQEA0syntheticKeyFixtureNotReal12345\n"
        "-----END RSA PRIVATE KEY-----"
    )
    text = f"Here is the certificate:\n{fake_pem}\nPlease keep safe."
    findings = detector.analyze(text)
    assert len(findings) == 1
    assert findings[0].entity_type == "PRIVATE_KEY"
    assert text[findings[0].start:findings[0].end] == fake_pem


def test_password_assignment_detection():
    text = "Connect with user='admin' and password='SuperSecretPassword123!'."
    findings = detector.analyze(text)
    assert len(findings) == 1
    assert findings[0].entity_type == "PASSWORD"
    assert text[findings[0].start:findings[0].end] == "SuperSecretPassword123!"

