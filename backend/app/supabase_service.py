from typing import Dict, Any
import logging
from app.config import SUPABASE_URL, SUPABASE_KEY

logger = logging.getLogger("supabase_service")

# Fallback local in-memory store if Supabase credentials are missing
in_memory_expenses = []

def save_expense(expense_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Saves parsed expense into Supabase 'expenses' table.
    Falls back to in-memory store if SUPABASE_URL/KEY are missing during setup.
    """
    record = {
        "amount": expense_data.get("amount", 0.0),
        "currency": expense_data.get("currency", "INR"),
        "merchant": expense_data.get("merchant", "Unknown Merchant"),
        "category": expense_data.get("category", "Other"),
        "account_no": expense_data.get("account_no", ""),
        "raw_info": expense_data.get("raw_info", ""),
        "transaction_date": expense_data.get("transaction_date"),
    }

    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.warning("Supabase credentials not configured. Saving to local mock memory store.")
        import uuid
        from datetime import datetime
        record["id"] = str(uuid.uuid4())
        record["created_at"] = datetime.now().isoformat()
        in_memory_expenses.append(record)
        return {"status": "saved_mock", "data": record}

    try:
        from supabase import create_client, Client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table("expenses").insert(record).execute()
        return {"status": "saved_supabase", "data": response.data}
    except Exception as e:
        logger.error(f"Error saving to Supabase: {e}")
        # Save to mock fallback on network error
        import uuid
        from datetime import datetime
        record["id"] = str(uuid.uuid4())
        record["created_at"] = datetime.now().isoformat()
        in_memory_expenses.append(record)
        return {"status": "saved_mock_fallback", "error": str(e), "data": record}

def fetch_all_expenses() -> list:
    """Returns all expenses from Supabase or local in-memory store."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return list(in_memory_expenses)

    try:
        from supabase import create_client, Client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table("expenses").select("*").order("transaction_date", desc=True).execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Error fetching from Supabase: {e}")
        return list(in_memory_expenses)

def update_expense(expense_id: str, updated_data: Dict[str, Any]) -> Dict[str, Any]:
    """Updates an existing expense in Supabase or local memory."""
    global in_memory_expenses
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        for idx, item in enumerate(in_memory_expenses):
            if str(item.get("id")) == str(expense_id):
                in_memory_expenses[idx].update(updated_data)
                return {"status": "updated_mock", "data": in_memory_expenses[idx]}
        return {"status": "not_found"}

    try:
        from supabase import create_client, Client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table("expenses").update(updated_data).eq("id", expense_id).execute()
        return {"status": "updated_supabase", "data": response.data}
    except Exception as e:
        logger.error(f"Error updating Supabase expense: {e}")
        return {"status": "error", "error": str(e)}

def delete_expense(expense_id: str) -> Dict[str, Any]:
    """Deletes an expense from Supabase or local memory."""
    global in_memory_expenses

    if not SUPABASE_URL or not SUPABASE_KEY:
        in_memory_expenses = [item for item in in_memory_expenses if str(item.get("id")) != str(expense_id)]
        return {"status": "deleted_mock"}

    try:
        from supabase import create_client, Client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        supabase.table("expenses").delete().eq("id", expense_id).execute()
        return {"status": "deleted_supabase"}
    except Exception as e:
        logger.error(f"Error deleting from Supabase: {e}")
        return {"status": "error", "error": str(e)}

