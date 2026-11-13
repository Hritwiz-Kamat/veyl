"""
Severity policy mapping.
Assigns risk levels to entity types:
  - critical: Secrets, tokens, credentials, private keys
  - high: National IDs (SSN), financial accounts, credit cards, passports
  - medium: Direct PII (Person, Email, Phone, Location, IP Address)
  - low: Weak identifiers (Date/Time, Generic URLs, IDs)
"""
from app.schemas.finding import Severity

CRITICAL_ENTITIES = {
    "CREDENTIAL",
    "API_KEY",
    "SECRET",
    "PASSWORD",
    "PRIVATE_KEY",
    "BEARER_TOKEN",
    "JWT",
    "AWS_KEY",
    "GITHUB_TOKEN",
    "OPENAI_KEY",
    "SLACK_TOKEN",
}

HIGH_ENTITIES = {
    "US_SSN",
    "CREDIT_CARD",
    "BANK_ACCOUNT",
    "IBAN_CODE",
    "US_PASSPORT",
    "PASSPORT",
    "US_DRIVER_LICENSE",
    "MEDICAL_LICENSE",
    "CRYPTO",
}

MEDIUM_ENTITIES = {
    "PERSON",
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "LOCATION",
    "IP_ADDRESS",
    "NRP",
    "AU_ABN",
    "AU_ACN",
    "AU_TFN",
    "AU_MEDICARE",
    "UK_NHS",
}

LOW_ENTITIES = {
    "DATE_TIME",
    "URL",
    "GENERIC_ID",
    "CUSTOM_ID",
}


def get_severity_for_entity(entity_type: str) -> Severity:
    upper = entity_type.upper()
    if upper in CRITICAL_ENTITIES:
        return "critical"
    if upper in HIGH_ENTITIES:
        return "high"
    if upper in MEDIUM_ENTITIES:
        return "medium"
    return "low"


SEVERITY_ORDER: dict[Severity, int] = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}

