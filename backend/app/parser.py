import re
from datetime import datetime
from typing import Dict, Any, Optional

CATEGORY_KEYWORDS = {
    "Food & Dining": ["SWIGGY", "ZOMATO", "MCDONALD", "STARBUCKS", "KFC", "DOMINOS", "RESTAURANT", "CAFE", "BAKERY", "FOOD", "DINER", "PIZZA"],
    "Transport": ["UBER", "OLA", "RAPIDO", "METRO", "FUEL", "PETROL", "SHELL", "HPCL", "BPCL", "INDIANOIL", "CAB", "TAXI", "IRCTC", "RAILWAY"],
    "Shopping": ["AMAZON", "FLIPKART", "MYNTRA", "AJIO", "DMART", "TATA", "RELIANCE", "ZUDIO", "SUPERMARKET", "STORE", "MALL", "GROCERY"],
    "Bills & Utilities": ["ELECTRICITY", "WATER", "GAS", "AIRTEL", "JIO", "VODAFONE", "VI", "BROADBAND", "RECHARGE", "TATA PLAY", "DTH", "UTILITY"],
    "Donation/Charity": ["SACHKHAND", "FOUNDATION", "DONATION", "TRUST", "NGO", "RELIEF", "CHARITY", "CARE", "TEMPLE"],
    "Entertainment & Leisure": ["NETFLIX", "SPOTIFY", "PRIME", "APPLE", "BOOKMYSHOW", "CINEMA", "THEATRE", "GAME", "STEAM", "YOUTUBE"],
}

def auto_categorize(merchant_text: str) -> str:
    """Classifies merchant into predefined category using keyword matching."""
    if not merchant_text:
        return "Other"
    
    text_upper = merchant_text.upper()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in text_upper:
                return cat
    return "Other"

def clean_merchant_name(raw_info: str) -> str:
    """Cleans raw transaction info string to extract clear merchant name."""
    if not raw_info:
        return "Unknown Merchant"
    
    # UPI transaction pattern: UPI/P2M/657080037142/M/S.SACHKHAND FOUND
    upi_match = re.search(r'UPI/(?:P2M|P2A|CBDC)?/?\d+/(.+)', raw_info, re.IGNORECASE)
    if upi_match:
        merchant = upi_match.group(1).strip()
        # Clean prefix like M/S. or M/s. or M/s
        merchant = re.sub(r'^(?:M/S\.?|MS\.?)\s*', '', merchant, flags=re.IGNORECASE)
        if merchant:
            return merchant

    # Fallback to stripping common prefixes
    cleaned = re.sub(r'^(?:UPI/|POS/|NEFT/|IMPS/|DEBIT/|CARD/)', '', raw_info, flags=re.IGNORECASE)
    cleaned = re.sub(r'^(?:M/S\.?|MS\.?)\s*', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip() or raw_info.strip()

def parse_axis_bank_email(subject: str, body: str) -> Dict[str, Any]:
    """
    Regex parser for Axis Bank transaction alert emails.
    Sample email body format:
    Amount Debited: INR 500.00
    Account Number: XX3065
    Date & Time: 23-07-26, 15:34:43 IST
    Transaction Info: UPI/P2M/657080037142/M/S.SACHKHAND FOUND
    """
    full_text = f"{subject}\n{body}"
    
    # 1. Amount Extraction
    amount: Optional[float] = None
    currency: str = "INR"
    
    # Priority A: "Amount Debited:\nINR 500.00" or "Amount Debited: 500.00"
    amt_match = re.search(r'Amount\s*Debited:\s*(?:[^\d\n\r]*)([A-Z]{3})?\s*([\d,]+\.?\d*)', full_text, re.IGNORECASE)
    
    # Priority B: "INR 500.00 was debited" or "debited by INR 500.00"
    if not amt_match:
        amt_match = re.search(r'([A-Z]{3})\s*([\d,]+\.?\d*)\s*(?:was\s+)?debited', full_text, re.IGNORECASE)
    if not amt_match:
        amt_match = re.search(r'debited\s*(?:by|with)?\s*([A-Z]{3})?\s*([\d,]+\.?\d*)', full_text, re.IGNORECASE)

    if amt_match:
        # If group(1) has currency, capture it
        if amt_match.group(1) and amt_match.group(1).isalpha():
            currency = amt_match.group(1).upper()
        amount_str = amt_match.group(2).replace(',', '')
        try:
            amount = float(amount_str)
        except ValueError:
            amount = None

    # 2. Account Extraction
    account_no = None
    acct_match = re.search(r'(?:Account\s*Number|A/c\s*no\.?)\s*:?\s*([X\d]+)', full_text, re.IGNORECASE)
    if acct_match:
        account_no = acct_match.group(1).strip()

    # 3. Date & Time Extraction
    transaction_date = datetime.now().isoformat()
    date_match = re.search(r'Date\s*&\s*Time:\s*([\d\-]+,\s*[\d:]+)', full_text, re.IGNORECASE)
    if date_match:
        raw_date_str = date_match.group(1).strip()
        try:
            # Parse '23-07-26, 15:34:43'
            dt = datetime.strptime(raw_date_str, "%d-%m-%y, %H:%M:%S")
            transaction_date = dt.isoformat()
        except Exception:
            pass

    # 4. Merchant / Info Extraction
    raw_info = None
    info_match = re.search(r'Transaction\s*Info:\s*([^\n\r]+)', full_text, re.IGNORECASE)
    if info_match:
        raw_info = info_match.group(1).strip()

    merchant = clean_merchant_name(raw_info) if raw_info else "Unknown Merchant"
    category = auto_categorize(merchant if raw_info else full_text)

    success = (amount is not None and amount > 0 and merchant != "Unknown Merchant")

    return {
        "success": success,
        "amount": amount,
        "currency": currency,
        "merchant": merchant,
        "category": category,
        "account_no": account_no,
        "raw_info": raw_info or subject,
        "transaction_date": transaction_date,
        "parser_used": "regex_axis"
    }
