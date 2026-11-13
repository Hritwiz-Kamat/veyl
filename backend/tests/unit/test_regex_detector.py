"""
Unit tests for RegexDetector.
Uses only synthetic test fixtures.
"""
import pytest
from app.privacy_engine.detectors.regex_detector import RegexDetector, luhn_checksum

detector = RegexDetector()


def test_luhn_checksum():
    # Valid synthetic test card (Visa test number)
    assert luhn_checksum("4012888888881881") is True
    # Invalid card
    assert luhn_checksum("4012888888881882") is False


def test_ssn_detection():
    fake_ssn = "123-45-6789"
    text = f"My SSN is {fake_ssn}."
    findings = detector.analyze(text)
    ssn_findings = [f for f in findings if f.entity_type == "US_SSN"]
    assert len(ssn_findings) == 1
    assert text[ssn_findings[0].start:ssn_findings[0].end] == fake_ssn


def test_ipv4_detection():
    ip = "192.168.1.100"
    text = f"Server is at {ip}:8080."
    findings = detector.analyze(text)
    ip_findings = [f for f in findings if f.entity_type == "IP_ADDRESS"]
    assert len(ip_findings) == 1
    assert text[ip_findings[0].start:ip_findings[0].end] == ip


def test_credit_card_detection():
    card = "4012-8888-8888-1881"
    text = f"Paid with card {card}."
    findings = detector.analyze(text)
    cc_findings = [f for f in findings if f.entity_type == "CREDIT_CARD"]
    assert len(cc_findings) == 1
    assert text[cc_findings[0].start:cc_findings[0].end] == card

