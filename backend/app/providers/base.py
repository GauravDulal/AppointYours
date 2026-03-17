from abc import ABC, abstractmethod
from typing import Optional

class MessageProvider(ABC):
    @abstractmethod
    async def send_message(self, recipient_id: str, content: str) -> bool:
        pass

    @abstractmethod
    async def receive_message(self, data: dict) -> dict:
        pass
