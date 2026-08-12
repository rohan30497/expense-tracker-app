import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from root project directory or backend folder
root_env = Path(__file__).resolve().parent.parent.parent / ".env"
if root_env.exists():
    load_dotenv(dotenv_path=root_env)
else:
    load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
API_SECRET_TOKEN = os.getenv("API_SECRET_TOKEN", "my-secret-webhook-token")
PORT = int(os.getenv("PORT", 8000))
