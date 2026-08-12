from app.pii_sanitizer import sanitize_pii

def test_pii_sanitizer_axis_email():
    raw_email_body = """
    Dear Priyadarshi Chatterjee,

    Here's the summary of your transaction:
        
    Amount Debited:
    INR 500.00
        
    Account Number:
    XX3065
        
    Date & Time:
    23-07-26, 15:34:43 IST
        
    Transaction Info:
    UPI/P2M/657080037142/M/S.SACHKHAND FOUND
    """

    sanitized = sanitize_pii(raw_email_body)

    # Assert Name and Account number are scrubbed
    assert "Priyadarshi Chatterjee" not in sanitized
    assert "XX3065" not in sanitized
    assert "[REDACTED_NAME]" in sanitized
    assert "[REDACTED_ACCOUNT]" in sanitized
    # Assert non-PII financial info remains intact
    assert "INR 500.00" in sanitized
    assert "SACHKHAND" in sanitized
