# statistics_bot
0. Устанавливаем Node.js и pm2
1. git clone https://github.com/ilnazonn/statistics_bot
2. cd в папку куда клонировали
3. Там выполняем npm i
4. Создаем в корне проекта файл .env с данными:
   BOT_TOKEN=ваш токен
   YOUR_TG=имя пользователя тг
5. После успешной загрузки выполняем npm run build
6. Запускаем pm2 start statistics_bot.js