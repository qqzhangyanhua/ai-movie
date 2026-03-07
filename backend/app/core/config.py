from pathlib import Path

from pydantic_settings import BaseSettings

_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Movie"
    API_V1_PREFIX: str = "/api/v1"

    # Database (required in production)
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT (required in production)
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Encryption (required in production)
    FERNET_KEY: str

    # Upload limits
    MAX_FILE_SIZE_MB: int = 10
    MAX_PHOTOS_PER_PROJECT: int = 50
    MAX_STORAGE_PER_USER_MB: int = 500
    UPLOAD_DIR: str = "uploads"

    # Storage
    STORAGE_PROVIDER: str = "local"  # local | s3
    S3_BUCKET: str | None = None
    S3_REGION: str | None = None
    S3_ACCESS_KEY: str | None = None
    S3_SECRET_KEY: str | None = None

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    model_config = {"env_file": str(_ENV_FILE), "case_sensitive": True, "extra": "ignore"}

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
