import re

def sanitize_pii(text: str) -> str:
    """
    Sanitizes Personal Identifiable Information (PII) from email body/subject
    before passing text to third-party LLMs (e.g. OpenAI).
    
    Strips:
    - Customer Names ("Dear Name,")
    - Account & Card numbers ("XX3065", "A/c no. XX1234", "Card Ending 4321")
    - Email addresses
    - Phone numbers
    """
    if not text:
        return ""

    sanitized = text

    # Remove salutations with names ("Dear Priyadarshi Chatterjee,", "Dear John Doe,")
    sanitized = re.sub(r'(Dear\s+)[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*,?', r'\1[REDACTED_NAME],', sanitized, flags=re.IGNORECASE)

    # Remove Account numbers: A/c no. XX3065, Account Number: XX3065, etc.
    sanitized = re.sub(r'(?:A/c\s*(?:no\.?|number)|Account\s*(?:no\.?|number))\s*:?\s*[X\d]+', 'Account: [REDACTED_ACCOUNT]', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r'\b[X\d]{2,4}\d{4}\b', '[REDACTED_ACCOUNT]', sanitized)
    sanitized = re.sub(r'\bXX+\d+\b', '[REDACTED_ACCOUNT]', sanitized)

    # Remove Card Numbers (16-digit or 4-digit masked cards)
    sanitized = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[REDACTED_CARD]', sanitized)
    sanitized = re.sub(r'\b(?:ending in|card ending|card no\.?)\s*:?\s*[X\d]+\b', 'Card: [REDACTED_CARD]', sanitized, flags=re.IGNORECASE)

    # Remove Emails
    sanitized = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[REDACTED_EMAIL]', sanitized)

    # Remove Phone numbers
    sanitized = re.sub(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', '[REDACTED_PHONE]', sanitized)

    return sanitized
