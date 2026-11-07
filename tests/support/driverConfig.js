// Driver do Appium usado pelos testes. Padrão: `Windows` (WinAppDriver). Para comparar com
// o alternativo: `AUTOMATION_NAME=NovaWindows npx wdio run wdio.conf.js ...`.
export const AUTOMATION_NAME = process.env.AUTOMATION_NAME || 'Windows'
