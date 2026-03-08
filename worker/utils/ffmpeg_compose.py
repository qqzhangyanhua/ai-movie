"""FFmpeg video composition stub."""


def compose_video(
    clips: list,
    bgm_url: str | None,
    voiceover_url: str | None,
    subtitle_url: str | None,
    output_path: str,
) -> str:
    """Compose video from clips. Stub - would use FFmpeg in production.

    When subtitle_url is provided, burn subtitles into the video:
    ffmpeg -i concat.mp4 -vf "subtitles=subtitle.srt:force_style='FontSize=24,PrimaryColour=&HFFFFFF'"
    -c:a copy output.mp4
    """
    return output_path
