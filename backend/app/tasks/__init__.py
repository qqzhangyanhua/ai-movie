from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "ai_movie",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_max_tasks_per_child=100,
    task_time_limit=3600,  # 1 hour
    task_soft_time_limit=3300,
)

celery_app.autodiscover_tasks(["app.tasks"])
