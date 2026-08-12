import json
from typing import Dict, Any
from app.config import OPENAI_API_KEY
from app.pii_sanitizer import sanitize_pii

def classify_with_llm(raw_email_subject: str, raw_email_body: str) -> Dict[str, Any]:
    """
    Fallback LLM classifier for unstructured or non-regex email alerts.
    
    CRITICAL: Sanitizes all PII before sending to OpenAI.
    Extracts expense amount, currency, merchant name, and category.
    """
    full_text = f"Subject: {raw_email_subject}\nBody: {raw_email_body}"
    sanitized_text = sanitize_pii(full_text)

    if not OPENAI_API_KEY:
        return {
            "success": False,
            "error": "OPENAI_API_KEY not configured",
            "amount": None,
            "currency": "INR",
            "merchant": "Unclassified Merchant",
            "category": "Other",
            "parser_used": "llm_failed_no_key"
        }

    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)

        system_prompt = (
            "You are an expense tracking assistant. Your job is to extract financial transaction "
            "details from sanitized email alerts. Return ONLY valid JSON with no markdown syntax. "
            "JSON structure:\n"
            "{\n"
            '  "amount": float or null,\n'
            '  "currency": "INR" or currency code,\n'
            '  "merchant": "Clean vendor or recipient name",\n'
            '  "category": "Food & Dining" | "Transport" | "Shopping" | "Bills & Utilities" | "Donation/Charity" | "Entertainment & Leisure" | "Other"\n'
            "}"
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Extract expense details from this sanitized alert:\n\n{sanitized_text}"}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        parsed = json.loads(content)

        return {
            "success": True if parsed.get("amount") else False,
            "amount": parsed.get("amount"),
            "currency": parsed.get("currency", "INR"),
            "merchant": parsed.get("merchant", "Unclassified Merchant"),
            "category": parsed.get("category", "Other"),
            "parser_used": "llm_openai_sanitized"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "amount": None,
            "currency": "INR",
            "merchant": "Unclassified Merchant",
            "category": "Other",
            "parser_used": "llm_error"
        }
