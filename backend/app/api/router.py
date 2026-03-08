from fastapi import APIRouter

from app.api import auth, projects, photos, scripts, ai_configs, video_tasks, bgm

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(projects.router, prefix="/projects", tags=["项目管理"])
api_router.include_router(photos.router, prefix="/projects/{project_id}/photos", tags=["照片管理"])
api_router.include_router(scripts.router, prefix="/scripts", tags=["剧本管理"])
api_router.include_router(ai_configs.router, prefix="/ai-configs", tags=["AI配置"])
api_router.include_router(video_tasks.router, prefix="/video-tasks", tags=["视频生成"])
api_router.include_router(bgm.router, prefix="/bgm", tags=["BGM库"])
