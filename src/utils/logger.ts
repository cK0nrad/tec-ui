const getTS = () => {
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');
    return `[${day}/${month}/${year} ${hours}:${minutes}:${seconds}]`;
}

export const logError = (message: String) => {
    console.error(
        `%c${getTS()} %c${message}`,
        'color: #999; font-style: italic',
        'color: #999'
    );
}

export const logInfo = (info: string) => {
    console.info(
        `%c${getTS()} %c${info}`,
        'color: #999; font-style: italic',
        'color: #999'
    );
}