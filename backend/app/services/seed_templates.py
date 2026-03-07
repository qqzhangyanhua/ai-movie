"""Seed system templates into the database."""
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.script import Script

SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")

SYSTEM_TEMPLATES = [
    {
        "title": "生日祝福",
        "description": "温馨的生日祝福模板，适合朋友、家人的生日视频制作",
        "content": {
            "scenes": [
                {"id": "s1", "photo_id": "", "duration": 3.0, "caption": "今天是个特别的日子", "transition": "fade", "order": 0},
                {"id": "s2", "photo_id": "", "duration": 4.0, "caption": "回忆那些美好的瞬间", "transition": "dissolve", "order": 1},
                {"id": "s3", "photo_id": "", "duration": 3.0, "caption": "感谢你出现在我的生命里", "transition": "fade", "order": 2},
                {"id": "s4", "photo_id": "", "duration": 3.0, "caption": "愿你的每一天都充满阳光", "transition": "zoom", "order": 3},
                {"id": "s5", "photo_id": "", "duration": 4.0, "caption": "生日快乐！🎂", "transition": "fade", "order": 4},
            ],
            "metadata": {"total_duration": 17.0, "bgm": None},
        },
    },
    {
        "title": "旅行回忆",
        "description": "动感的旅行回忆模板，记录旅途中的精彩瞬间",
        "content": {
            "scenes": [
                {"id": "s1", "photo_id": "", "duration": 2.5, "caption": "出发，去看看这个世界", "transition": "slide", "order": 0},
                {"id": "s2", "photo_id": "", "duration": 3.0, "caption": "每一站都是一段故事", "transition": "zoom", "order": 1},
                {"id": "s3", "photo_id": "", "duration": 3.0, "caption": "遇见不同的风景", "transition": "slide", "order": 2},
                {"id": "s4", "photo_id": "", "duration": 3.0, "caption": "感受不同的文化", "transition": "zoom", "order": 3},
                {"id": "s5", "photo_id": "", "duration": 2.5, "caption": "品尝当地的美食", "transition": "slide", "order": 4},
                {"id": "s6", "photo_id": "", "duration": 3.0, "caption": "结识有趣的人们", "transition": "dissolve", "order": 5},
                {"id": "s7", "photo_id": "", "duration": 3.0, "caption": "这段旅程，值得铭记", "transition": "fade", "order": 6},
            ],
            "metadata": {"total_duration": 20.0, "bgm": None},
        },
    },
    {
        "title": "产品介绍",
        "description": "专业的产品介绍模板，适合电商和品牌推广",
        "content": {
            "scenes": [
                {"id": "s1", "photo_id": "", "duration": 3.0, "caption": "重新定义品质生活", "transition": "zoom", "order": 0},
                {"id": "s2", "photo_id": "", "duration": 4.0, "caption": "精选材料，匠心打造", "transition": "slide", "order": 1},
                {"id": "s3", "photo_id": "", "duration": 3.5, "caption": "细节决定品质", "transition": "zoom", "order": 2},
                {"id": "s4", "photo_id": "", "duration": 3.5, "caption": "多种场景，随心搭配", "transition": "slide", "order": 3},
                {"id": "s5", "photo_id": "", "duration": 3.0, "caption": "立即拥有", "transition": "fade", "order": 4},
            ],
            "metadata": {"total_duration": 17.0, "bgm": None},
        },
    },
    {
        "title": "故事叙事",
        "description": "电影感叙事模板，适合讲述一段完整的故事",
        "content": {
            "scenes": [
                {"id": "s1", "photo_id": "", "duration": 4.0, "caption": "故事，从这里开始", "transition": "fade", "order": 0},
                {"id": "s2", "photo_id": "", "duration": 3.0, "caption": "那些平凡的日子里", "transition": "dissolve", "order": 1},
                {"id": "s3", "photo_id": "", "duration": 3.0, "caption": "有些事情悄然发生", "transition": "fade", "order": 2},
                {"id": "s4", "photo_id": "", "duration": 3.5, "caption": "改变了我们的轨迹", "transition": "dissolve", "order": 3},
                {"id": "s5", "photo_id": "", "duration": 3.0, "caption": "我们学会了珍惜", "transition": "fade", "order": 4},
                {"id": "s6", "photo_id": "", "duration": 3.0, "caption": "也学会了放下", "transition": "dissolve", "order": 5},
                {"id": "s7", "photo_id": "", "duration": 3.5, "caption": "每一个结局", "transition": "fade", "order": 6},
                {"id": "s8", "photo_id": "", "duration": 4.0, "caption": "都是新的开始", "transition": "fade", "order": 7},
            ],
            "metadata": {"total_duration": 27.0, "bgm": None},
        },
    },
]


def seed_system_templates(session: Session) -> None:
    """Insert system templates if they don't exist."""
    existing = session.execute(
        select(Script).where(Script.source_type == "system")
    ).scalars().all()

    existing_titles = {s.title for s in existing}

    for template in SYSTEM_TEMPLATES:
        if template["title"] in existing_titles:
            continue
        script = Script(
            user_id=SYSTEM_USER_ID,
            project_id=None,
            title=template["title"],
            description=template["description"],
            content=template["content"],
            is_template=True,
            is_public=True,
            source_type="system",
        )
        session.add(script)

    session.commit()
