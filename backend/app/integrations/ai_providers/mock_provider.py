"""
Mock AI Provider.
Simulates external AI handoffs (ChatGPT, Claude, Cursor) for demonstration purposes.
Enforces that only server-side sanitized content is transmitted and requires explicit user confirmation.
Never transmits raw or unmasked data.
"""
from datetime import datetime, timezone
from typing import Dict, Any


SUPPORTED_MOCK_PROVIDERS = {
    "mock-chatgpt": "OpenAI ChatGPT (Mock)",
    "mock-claude": "Anthropic Claude (Mock)",
    "mock-cursor": "Cursor AI (Mock)",
}


class MockAIProvider:
    @staticmethod
    def get_supported_destinations() -> Dict[str, str]:
        return dict(SUPPORTED_MOCK_PROVIDERS)

    @classmethod
    def simulate_completion(cls, destination: str, sanitized_text: str) -> Dict[str, Any]:
        """
        Simulates receiving a sanitized prompt and generating an AI completion
        referencing the privacy-safe placeholders.
        """
        provider_name = SUPPORTED_MOCK_PROVIDERS.get(destination, "Generic AI Assistant (Mock)")

        # Create a helpful simulated response reflecting the sanitized text
        lines = [
            f"Hello! I am {provider_name}.",
            f"I have successfully received your privacy-sanitized prompt ({len(sanitized_text)} characters).",
            "Notice: All sensitive personal identifiable information and credentials were sanitized into secure pseudonyms before reaching this endpoint.",
            "",
            "Here is my simulated response to your sanitized request:",
            f"> \"Processing sanitized prompt: {sanitized_text[:120]}{'...' if len(sanitized_text) > 120 else ''}\"",
            "",
            "Status: Safe AI handoff complete with 0 raw data leaks.",
        ]

        return {
            "destination": destination,
            "provider_name": provider_name,
            "simulated_response": "\n".join(lines),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

