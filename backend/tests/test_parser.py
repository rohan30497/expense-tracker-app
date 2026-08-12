from app.parser import parse_axis_bank_email

def test_parse_axis_bank_email():
    subject = "INR 500.00 was debited from your A/c no. XX3065."
    body = """
    AXIS BANK

    23-07-2026

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

    res = parse_axis_bank_email(subject, body)

    assert res["success"] is True
    assert res["amount"] == 500.00
    assert res["currency"] == "INR"
    assert res["account_no"] == "XX3065"
    assert "SACHKHAND" in res["merchant"].upper()
    assert res["category"] == "Donation/Charity"
    assert res["parser_used"] == "regex_axis"
