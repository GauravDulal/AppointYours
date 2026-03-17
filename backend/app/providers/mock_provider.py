from app.providers.base import MessageProvider
import logging

class MockProvider(MessageProvider):
    def __init__(self, channel: str):
        self.channel = channel
        self.logger = logging.getLogger(f"MockProvider-{channel}")

    async def send_message(self, recipient_id: str, content: str) -> bool:
        self.logger.info(f"Sending {self.channel} message to {recipient_id}: {content}")
        return True

    async def receive_message(self, data: dict) -> dict:
        self.logger.info(f"Received {self.channel} message: {data}")
        return data

class InstagramProvider(MockProvider):
    def __init__(self):
        super().__init__("Instagram")

class FacebookProvider(MockProvider):
    def __init__(self):
        super().__init__("Facebook")

class WhatsAppProvider(MockProvider):
    def __init__(self):
        super().__init__("WhatsApp")
