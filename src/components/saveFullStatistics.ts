import {MessageInfo} from "./config";
import path from "path";
import fs from "fs";

const saveFullStatisticsToFile = async (messageInfo: MessageInfo) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const filePath = path.join('reports', `full_statistics_${year}-${month}.csv`);

    const statsContent = `${messageInfo.user_id},${messageInfo.user_name},${messageInfo.group_id},${messageInfo.group_name},${messageInfo.direction},${messageInfo.timestamp}\n`;

    // Проверяем, существует ли файл для текущего месяца
    if (fs.existsSync(filePath)) {
        // Записываем информацию в конец файла
        fs.appendFileSync(filePath, statsContent, 'utf8');
    } else {
        // Если файл не существует, создаем его и добавляем заголовок
        const header = 'User ID,User Name,Group ID,Group Name,Direction,Timestamp\n';
        fs.writeFileSync(filePath, header + statsContent, 'utf8');
    }

    // console.log('Полная статистика успешно сохранена в файл' + filePath);
};

export { saveFullStatisticsToFile };