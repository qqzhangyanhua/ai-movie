import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
DATABASE_URL = os.getenv("DATABASE_URL", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
SUNO_API_KEY = os.getenv("SUNO_API_KEY", "")
VIDEO_PROVIDER = os.getenv("VIDEO_PROVIDER", "mock")
VIDEO_API_KEY = os.getenv("VIDEO_API_KEY", "")
VIDEO_BASE_URL = os.getenv("VIDEO_BASE_URL", "")
VIDEO_MODEL = os.getenv("VIDEO_MODEL", "")
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "")
S3_BUCKET = os.getenv("S3_BUCKET", "")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "")
S3_REGION = os.getenv("S3_REGION", "us-east-1")
