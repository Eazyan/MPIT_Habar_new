import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters.command import Command
from aiogram.types import WebAppInfo
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("BOT_TOKEN")
# In production, this should be the HTTPS URL of your deployed frontend
# For local dev with ngrok, use the ngrok URL. For docker-compose, it's tricky without https.
# We will use a placeholder or localhost for now, but Telegram Web Apps require HTTPS.
# For local testing on Desktop, http://localhost:3000 works.
# For mobile, you need https (e.g., via ngrok).
WEB_APP_URL = os.getenv("WEB_APP_URL", "http://localhost:3000") 

logging.basicConfig(level=logging.INFO)
bot = Bot(token=TOKEN)
dp = Dispatcher()

import redis.asyncio as redis
import json

# Redis connection
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"))

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    # Save user for notifications (Simple MVP: Save last user)
    await redis_client.set("DEMO_CHAT_ID", message.chat.id)
    
    kb = [
        [types.KeyboardButton(text="🚀 Open AI-Newsmaker", web_app=WebAppInfo(url=WEB_APP_URL))]
    ]
    keyboard = types.ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True)
    
    await message.answer(
        "Привет! Я AI-Newsmaker Bot. 🤖\n\n"
        "Я помогу тебе превратить новости в контент.\n"
        "Нажми кнопку ниже, чтобы открыть дашборд.\n\n"
        "🔔 Я пришлю уведомление, когда генерация будет готова!",
        reply_markup=keyboard
    )

@dp.message(F.text)
async def handle_text(message: types.Message):
    if message.text.startswith("http"):
        await message.answer("Вижу ссылку! Но лучше открой Mini App, там удобнее. 👇")
    else:
        await message.answer("Нажми кнопку 'Open AI-Newsmaker' чтобы начать.")

async def notification_worker(bot: Bot):
    """Listens for Redis events and sends notifications."""
    pubsub = redis_client.pubsub()
    await pubsub.subscribe("task_updates")
    
    print("🔔 Notification worker started...")
    
    async for message in pubsub.listen():
        if message["type"] == "message":
            try:
                data = json.loads(message["data"])
                chat_id = await redis_client.get("DEMO_CHAT_ID")
                
                if chat_id:
                    chat_id = int(chat_id)
                    if data.get("type") == "task_completed":
                        await bot.send_message(
                            chat_id, 
                            f"✅ **Готово!**\n\n"
                            f"Сгенерирован план: {data.get('summary')}\n"
                            f"Заходи в приложение, чтобы посмотреть.",
                            parse_mode="Markdown"
                        )
                    elif data.get("type") == "task_error":
                        await bot.send_message(
                            chat_id, 
                            f"❌ **Ошибка!**\n\n"
                            f"Не удалось сгенерировать план: {data.get('error')}",
                            parse_mode="Markdown"
                        )
            except Exception as e:
                print(f"Error processing notification: {e}")

async def main():
    asyncio.create_task(notification_worker(bot))
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
