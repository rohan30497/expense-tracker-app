from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.config import API_SECRET_TOKEN, PORT
from app.parser import parse_axis_bank_email
from app.llm_classifier import classify_with_llm
from app.supabase_service import save_expense, fetch_all_expenses, update_expense, delete_expense

app = FastAPI(
    title="Automated Email Expense Tracker API",
    description="Backend service for parsing bank email alerts, sanitizing PII, LLM fallback, and saving to database.",
    version="1.0.0"
)

# Enable CORS for frontend web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmailPayload(BaseModel):
    subject: str
    body: str
    secret_token: Optional[str] = None

@app.get("/")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "expense-tracker-backend",
        "version": "1.0.0"
    }

@app.post("/api/process-email")
def process_email(payload: EmailPayload):
    """
    Main webhook endpoint to process incoming bank alert emails.
    1. Runs Regex parser (Axis Bank / generic rules).
    2. If Regex fails or lacks amount, sanitizes PII and calls OpenAI LLM fallback.
    3. Saves record into database.
    """
    # Token check for security (optional based on payload secret or skip if empty)
    if API_SECRET_TOKEN and payload.secret_token and payload.secret_token != API_SECRET_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid API Secret Token")

    # Step 1: Attempt Regex Parser
    parsed_result = parse_axis_bank_email(payload.subject, payload.body)

    # Step 2: Fallback to LLM if Regex failed to extract amount or merchant
    if not parsed_result.get("success"):
        llm_result = classify_with_llm(payload.subject, payload.body)
        if llm_result.get("success"):
            parsed_result["amount"] = llm_result.get("amount")
            parsed_result["currency"] = llm_result.get("currency", "INR")
            parsed_result["merchant"] = llm_result.get("merchant", "Unclassified Merchant")
            parsed_result["category"] = llm_result.get("category", "Other")
            parsed_result["parser_used"] = llm_result.get("parser_used")
            parsed_result["success"] = True

    if not parsed_result.get("amount"):
        return {
            "status": "skipped",
            "message": "Email did not contain valid expense amount or supported transaction alert format.",
            "parsed_data": parsed_result
        }

    # Step 3: Save to Database (Supabase / local fallback)
    save_result = save_expense(parsed_result)

    return {
        "status": "success",
        "expense": parsed_result,
        "storage": save_result
    }


class ExpenseUpdatePayload(BaseModel):
    merchant: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    account_no: Optional[str] = None
    raw_info: Optional[str] = None

@app.get("/api/expenses")
def get_expenses():
    """Fetch all expenses for dashboard rendering."""
    expenses = fetch_all_expenses()
    return {"status": "success", "count": len(expenses), "data": expenses}

@app.put("/api/expenses/{expense_id}")
def update_expense_endpoint(expense_id: str, payload: ExpenseUpdatePayload):
    """Update merchant, amount, category, or account details for an expense."""
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    res = update_expense(expense_id, update_data)
    return {"status": "success", "result": res}

@app.delete("/api/expenses/{expense_id}")
def delete_expense_endpoint(expense_id: str):
    """Delete an expense record completely."""
    res = delete_expense(expense_id)
    return {"status": "success", "result": res}

