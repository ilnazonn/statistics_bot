var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import path from "path";
import fs from "fs";
const saveFullStatisticsToFile = (messageInfo) => __awaiter(void 0, void 0, void 0, function* () {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const filePath = path.join('reports', `full_statistics_${year}-${month}.csv`);
    const statsContent = `${messageInfo.user_id},${messageInfo.user_name},${messageInfo.group_id},${messageInfo.group_name},${messageInfo.direction},${messageInfo.timestamp}\n`;
    // Проверяем, существует ли файл для текущего месяца
    if (fs.existsSync(filePath)) {
        // Записываем информацию в конец файла
        fs.appendFileSync(filePath, statsContent, 'utf8');
    }
    else {
        // Если файл не существует, создаем его и добавляем заголовок
        const header = 'User ID,User Name,Group ID,Group Name,Direction,Timestamp\n';
        fs.writeFileSync(filePath, header + statsContent, 'utf8');
    }
    // console.log('Полная статистика успешно сохранена в файл' + filePath);
});
export { saveFullStatisticsToFile };
