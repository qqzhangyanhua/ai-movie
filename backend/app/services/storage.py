from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

try:
    import boto3
    from botocore.exceptions import ClientError
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False


class StorageProvider(ABC):
    """存储提供者抽象接口"""

    @abstractmethod
    async def upload(self, file_data: bytes, key: str) -> str:
        """上传文件，返回访问 URL"""
        pass

    @abstractmethod
    async def delete(self, key: str) -> None:
        """删除文件"""
        pass

    @abstractmethod
    async def get_url(self, key: str) -> str:
        """获取访问 URL"""
        pass


class LocalStorage(StorageProvider):
    """本地文件系统存储"""

    def __init__(self, base_dir: str, base_url: str = "/uploads"):
        self.base_dir = Path(base_dir)
        self.base_url = base_url
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def upload(self, file_data: bytes, key: str) -> str:
        file_path = self.base_dir / key
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(file_data)
        return f"{self.base_url}/{key}"

    async def delete(self, key: str) -> None:
        file_path = self.base_dir / key
        if file_path.exists():
            file_path.unlink()

    async def get_url(self, key: str) -> str:
        return f"{self.base_url}/{key}"


class S3Storage(StorageProvider):
    """AWS S3 / 阿里云 OSS 存储"""

    def __init__(self, bucket: str, region: str, access_key: str, secret_key: str):
        if not HAS_BOTO3:
            raise ImportError("boto3 is required for S3Storage")
        self.bucket = bucket
        self.s3_client = boto3.client(
            's3',
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key
        )

    async def upload(self, file_data: bytes, key: str) -> str:
        self.s3_client.put_object(Bucket=self.bucket, Key=key, Body=file_data)
        return f"https://{self.bucket}.s3.amazonaws.com/{key}"

    async def delete(self, key: str) -> None:
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=key)
        except ClientError:
            pass

    async def get_url(self, key: str) -> str:
        return f"https://{self.bucket}.s3.amazonaws.com/{key}"


def get_storage_provider(
    provider: str,
    upload_dir: str,
    s3_bucket: Optional[str] = None,
    s3_region: Optional[str] = None,
    s3_access_key: Optional[str] = None,
    s3_secret_key: Optional[str] = None,
) -> StorageProvider:
    """获取存储提供者实例"""
    if provider == "s3":
        if not all([s3_bucket, s3_region, s3_access_key, s3_secret_key]):
            raise ValueError("S3 storage requires bucket, region, access_key, and secret_key")
        return S3Storage(s3_bucket, s3_region, s3_access_key, s3_secret_key)
    return LocalStorage(upload_dir)
