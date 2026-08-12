"""
Local Test Script: Simulates sending an Axis Bank transaction email alert
to the local FastAPI backend (or Docker backend).
"""
import requests
import json

URL = "http://localhost:8000/api/process-email"

sample_payload = {
    "subject": "INR 2500.00 was debited from your A/c no. XX3065.",
    "body": """
    AXIS BANK

    Dear Priyadarshi Chatterjee,

    Here's the summary of your transaction:
        
    Amount Debited:
    INR 30000.00
        
    Account Number:
    XX3065
        
    Date & Time:
    23-07-26, 15:34:43 IST
        
    Transaction Info:
    UPI/P2M/657080037142/M/S.SACHKHAND FOUND
    """,
    "secret_token": "my-secret-webhook-token"
}

def main():
    print(f"Sending mock Axis Bank transaction email alert to {URL}...")
    try:
        res = requests.post(URL, json=sample_payload)
        print(f"Response Status Code: {res.status_code}")
        print("Response JSON:")
        print(json.dumps(res.json(), indent=2))
    except Exception as e:
        print(f"Error connecting to local server: {e}")

if __name__ == "__main__":
    main()
