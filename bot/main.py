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
WEB_APP_URL = os.getenv("WEB_APP_URL", "https://example.com") 

logging.basicConfig(level=logging.INFO)
bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    kb = [
        [types.KeyboardButton(text="🚀 Open AI-Newsmaker", web_app=WebAppInfo(url=WEB_APP_URL))]
    ]
    keyboard = types.ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True)
    
    await message.answer(
        "Привет! Я AI-Newsmaker Bot. 🤖\n\n"
        "Я помогу тебе превратить новости в контент.\n"
        "Нажми кнопку ниже, чтобы открыть дашборд.",
        reply_markup=keyboard
    )

@dp.message(F.text)
async def handle_text(message: types.Message):
    if message.text.startswith("http"):
        await message.answer("Вижу ссылку! Но лучше открой Mini App, там удобнее. 👇")
    else:
        await message.answer("Нажми кнопку 'Open AI-Newsmaker' чтобы начать.")

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
