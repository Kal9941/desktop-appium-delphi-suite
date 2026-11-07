import { execFileSync, spawn } from 'node:child_process'

// Apps Delphi/VCL como este não expõem AutomationId estável (ver PENDÊNCIA em
// LoginPage.js) e a tela de login é uma janela de topo SEPARADA da janela
// principal (não um filho dela) — uma sessão Appium presa à janela principal
// não enxerga os controles da janela de login via getSource(). Por isso
// precisamos: 1) localizar a janela de topo certa via Win32 nativo, 2) anexar
// a sessão Appium a ela via capability `appium:appTopLevelWindow`.
//
// Não há biblioteca Node nativa para EnumWindows/GetWindowRect no projeto;
// em vez de adicionar uma dependência nativa (ffi-napi etc.), despachamos
// PowerShell e parseamos a saída JSON.
const CLASS_DEFINITION_PS1 = `
Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public class PsWindowEnum {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
    [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    public struct RECT { public int Left, Top, Right, Bottom; }

    // Primeiro plano + clique físico: controles gráficos sem elemento UIA (ex.: o
    // botão Calcular da 145, um TPanel) ignoram o toque/clique do Appium quando a
    // janela não está em primeiro plano; o mouse do SO com a janela ativa funciona.
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int cmd);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
    [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);

    public static void Activate(long handle) {
        IntPtr hWnd = new IntPtr(handle);
        // SW_RESTORE só se minimizada: restaurar uma janela maximizada a encolhe e
        // desloca as telas MDI (posições x/y dos seletores deixam de valer).
        if (IsIconic(hWnd)) ShowWindow(hWnd, 9);
        keybd_event(0x12, 0, 0, UIntPtr.Zero);
        keybd_event(0x12, 0, 2, UIntPtr.Zero);
        SetForegroundWindow(hWnd);
    }

    public static void ClickAt(int x, int y) {
        SetCursorPos(x, y);
        System.Threading.Thread.Sleep(120);
        mouse_event(0x2, 0, 0, 0, UIntPtr.Zero);
        mouse_event(0x4, 0, 0, 0, UIntPtr.Zero);
    }

    // Duplo clique (grades de "Localizar registro..." escolhem a linha assim).
    public static void DoubleClickAt(int x, int y) {
        SetCursorPos(x, y);
        System.Threading.Thread.Sleep(120);
        mouse_event(0x2, 0, 0, 0, UIntPtr.Zero);
        mouse_event(0x4, 0, 0, 0, UIntPtr.Zero);
        System.Threading.Thread.Sleep(80);
        mouse_event(0x2, 0, 0, 0, UIntPtr.Zero);
        mouse_event(0x4, 0, 0, 0, UIntPtr.Zero);
    }

    // Botão direito (menu de contexto da grade de estoque da 112).
    public static void RightClickAt(int x, int y) {
        SetCursorPos(x, y);
        System.Threading.Thread.Sleep(120);
        mouse_event(0x8, 0, 0, 0, UIntPtr.Zero);
        mouse_event(0x10, 0, 0, 0, UIntPtr.Zero);
    }

    public static List<object> GetWindowsForProcess(uint targetPid) {
        var results = new List<object>();
        EnumWindows((hWnd, lParam) => {
            uint pid;
            GetWindowThreadProcessId(hWnd, out pid);
            if (pid == targetPid && IsWindowVisible(hWnd)) {
                int len = GetWindowTextLength(hWnd);
                var sb = new StringBuilder(len + 1);
                GetWindowText(hWnd, sb, sb.Capacity);
                RECT rect;
                GetWindowRect(hWnd, out rect);
                results.Add(new {
                    handle = string.Format("0x{0:X8}", hWnd.ToInt64()),
                    title = sb.ToString(),
                    left = rect.Left,
                    top = rect.Top,
                    width = rect.Right - rect.Left,
                    height = rect.Bottom - rect.Top,
                });
            }
            return true;
        }, IntPtr.Zero);
        return results;
    }
}
"@
`

// Títulos de janela têm acento ("Soluções", "Atenção") e o stdout do
// PowerShell mistura com o codepage do console, corrompendo esses caracteres
// (mojibake) mesmo pedindo encoding 'utf-8' do lado do Node. Para não
// depender do codepage do processo filho, cada resposta sempre vem como
// Base64 de bytes UTF-8 — Base64 é ASCII puro, não há como corromper no
// caminho.
const RESPONSE_DELIMITER = '<<<WDIO_ENUM_END>>>'
const NATIVE_CALL_TIMEOUT_MS = 10000

// `[R-RESIL]` (achado 2026-10-09, ver AGENTS.md §4): a versão anterior
// despachava um `powershell.exe` NOVO a cada chamada, recompilando o bloco
// C# via `Add-Type` toda vez — `Add-Type` dispara o compilador C# (`csc.exe`)
// por baixo, o que é bem mais caro que só abrir o PowerShell, e esta função é
// chamada a cada ~300ms dentro dos loops de polling de `waitForWindow`/
// `proceedPastLoginToMainWindow`. Sob carga de VM isso sozinho já explicava
// timeouts do tipo "function timed out" sem erro específico (o event loop
// ficava preso num `execFileSync` síncrono antes de qualquer timeout interno
// ser checado). Corrigido trocando por UM processo PowerShell persistente
// (lido via stdin/stdout), que compila a classe C# uma única vez por
// execução e, daí em diante, só executa a chamada já compilada — validado
// com protótipo ao vivo: ~1.3s pra compilar na primeira vez, 1-11ms por
// chamada depois (ver histórico desta sessão).
let psProcess = null
let stdoutBuffer = ''
let pendingRequests = []

function spawnPersistentPowerShell() {
  const proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '-'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  proc.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk.toString('utf-8')
    drainPendingResponses()
  })

  proc.on('exit', () => {
    const error = new Error('Processo PowerShell persistente encerrou inesperadamente')
    for (const request of pendingRequests) {
      clearTimeout(request.timer)
      request.reject(error)
    }
    pendingRequests = []
    stdoutBuffer = ''
    if (psProcess === proc) psProcess = null
  })

  proc.stdin.write(CLASS_DEFINITION_PS1 + '\n')
  return proc
}

function drainPendingResponses() {
  let delimiterIndex
  while ((delimiterIndex = stdoutBuffer.indexOf(RESPONSE_DELIMITER)) !== -1) {
    const piece = stdoutBuffer.slice(0, delimiterIndex).trim()
    stdoutBuffer = stdoutBuffer.slice(delimiterIndex + RESPONSE_DELIMITER.length)
    const request = pendingRequests.shift()
    if (request) {
      clearTimeout(request.timer)
      request.resolve(piece)
    }
  }
}

function sendPersistentCommand(command) {
  if (!psProcess) psProcess = spawnPersistentPowerShell()
  const proc = psProcess

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests = pendingRequests.filter((request) => request.timer !== timer)
      // Trava real (não só lentidão transitória dentro do próprio orçamento
      // do chamador): mata o processo preso em vez de deixá-lo pendurado —
      // a próxima chamada relança um processo novo (self-heal), igual ao
      // espírito do retry em `launchAndAttachToLogin`.
      proc.kill()
      reject(
        new Error(
          `Comando PowerShell persistente não respondeu em ${NATIVE_CALL_TIMEOUT_MS}ms — ` +
            'provável lentidão transitória da VM (ver AGENTS.md §4 [R-RESIL]).'
        )
      )
    }, NATIVE_CALL_TIMEOUT_MS)

    pendingRequests.push({ resolve, reject, timer })
    proc.stdin.write(command + '\n')
  })
}

// Encerra o processo PowerShell persistente (se existir) — chamado no `after`
// global do wdio e no `cleanup()` dos scripts ad hoc, pra não deixar
// `powershell.exe` residual entre execuções (`[R-PROC]`).
export function shutdownPersistentPowerShell() {
  if (psProcess) {
    psProcess.stdin.end()
    psProcess.kill()
    psProcess = null
  }
}

export async function listVisibleWindowsForProcess(pid) {
  const command =
    `$json = [PsWindowEnum]::GetWindowsForProcess(${Number(pid)}) | ConvertTo-Json -Compress; ` +
    `if (-not $json) { $json = "[]" }; ` +
    `Write-Output ([Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($json))); ` +
    `Write-Output "${RESPONSE_DELIMITER}"`
  const rawBase64 = await sendPersistentCommand(command)
  if (!rawBase64) return []
  const raw = Buffer.from(rawBase64, 'base64').toString('utf-8')
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : [parsed]
}

// Ativa a janela (`handle` no formato "0x0001ABCD" de listVisibleWindowsForProcess).
export async function activateWindow(handle) {
  await sendPersistentCommand(
    `[PsWindowEnum]::Activate([Convert]::ToInt64("${handle}", 16)); Start-Sleep -Milliseconds 150; Write-Output "${RESPONSE_DELIMITER}"`
  )
}

// Clique de mouse do SO em coordenada de tela (a janela alvo precisa estar ativa).
export async function physicalClick(x, y) {
  await sendPersistentCommand(
    `[PsWindowEnum]::ClickAt(${Number(x)}, ${Number(y)}); Write-Output "${RESPONSE_DELIMITER}"`
  )
}

export async function physicalDoubleClick(x, y) {
  await sendPersistentCommand(
    `[PsWindowEnum]::DoubleClickAt(${Number(x)}, ${Number(y)}); Write-Output "${RESPONSE_DELIMITER}"`
  )
}

export async function physicalRightClick(x, y) {
  await sendPersistentCommand(
    `[PsWindowEnum]::RightClickAt(${Number(x)}, ${Number(y)}); Write-Output "${RESPONSE_DELIMITER}"`
  )
}

// Captura da tela inteira pelo SO (PNG). O `saveScreenshot` do driver consulta a UIA, o que
// FECHA as telas MDI do Omni (418 e filhas): nelas, o checkpoint usa esta captura.
// `regiao` ({ left, top, width, height }) recorta a captura (print por etapa: só a área das janelas
// do PS01, sem o papel de parede, que deixava o PNG da tela de Login com ~1,4 MB). Sem `regiao`,
// a tela inteira. Gravar em JPEG pelo encoder do .NET foi bloqueado pelo antivírus (AMSI) em
// 2026-11-06: não usar.
export async function captureScreen(caminho, { regiao } = {}) {
  const alvo = String(caminho).replace(/'/g, "''")
  const area = regiao
    ? `$b = [System.Drawing.Rectangle]::Intersect((New-Object System.Drawing.Rectangle ${Math.round(regiao.left)}, ${Math.round(regiao.top)}, ${Math.round(regiao.width)}, ${Math.round(regiao.height)}), [System.Windows.Forms.SystemInformation]::VirtualScreen); `
    : `$b = [System.Windows.Forms.SystemInformation]::VirtualScreen; `
  await sendPersistentCommand(
    `Add-Type -AssemblyName System.Windows.Forms,System.Drawing; ` +
      area +
      `$bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height; ` +
      `$g = [System.Drawing.Graphics]::FromImage($bmp); ` +
      `$g.CopyFromScreen($b.Left, $b.Top, 0, 0, $bmp.Size); ` +
      `$bmp.Save('${alvo}'); $g.Dispose(); $bmp.Dispose(); Write-Output "${RESPONSE_DELIMITER}"`
  )
}

// Conta os pixels escuros (soma R+G+B abaixo do limite) num quadrado de (2 * raio + 1) px em
// volta de (x, y), lido da tela pelo SO. Serve para ler controles sem elemento UIA, como a
// caixa `Sel` da grade do Omni (marcada = 17 pixels escuros, desmarcada = 0, medido 2026-10-29).
export async function contarPixelsEscuros(x, y, { raio = 4, limiteSoma = 250 } = {}) {
  const lado = raio * 2 + 1
  const resposta = await sendPersistentCommand(
    `Add-Type -AssemblyName System.Drawing; ` +
      `$bmp = New-Object System.Drawing.Bitmap ${lado}, ${lado}; ` +
      `$g = [System.Drawing.Graphics]::FromImage($bmp); ` +
      `$g.CopyFromScreen(${Number(x) - raio}, ${Number(y) - raio}, 0, 0, $bmp.Size); ` +
      `$n = 0; for ($i = 0; $i -lt ${lado}; $i++) { for ($j = 0; $j -lt ${lado}; $j++) { ` +
      `$c = $bmp.GetPixel($i, $j); if (($c.R + $c.G + $c.B) -lt ${Number(limiteSoma)}) { $n++ } } }; ` +
      `$g.Dispose(); $bmp.Dispose(); Write-Output $n; Write-Output "${RESPONSE_DELIMITER}"`
  )
  return Number(resposta)
}

export function spawnApp(executablePath, args = []) {
  const child = spawn(executablePath, args, { detached: true, stdio: 'ignore' })
  child.unref()
  return child.pid
}

export function killProcessByName(processName) {
  try {
    execFileSync('taskkill', ['/IM', processName, '/F'], {
      stdio: 'ignore',
      timeout: NATIVE_CALL_TIMEOUT_MS,
    })
  } catch (error) {
    // `killed: true` = foi o NOSSO timeout que matou o taskkill, não o
    // taskkill terminando sozinho com erro (ex.: "processo não encontrado",
    // caso normal e silencioso) — nesse caso não dá pra assumir que o
    // processo-alvo morreu, então o erro sobe em vez de ser engolido.
    if (error.killed) {
      throw new Error(
        `taskkill /IM ${processName} /F não respondeu em ${NATIVE_CALL_TIMEOUT_MS}ms — ` +
          'provável lentidão transitória da VM (ver AGENTS.md §4 [R-RESIL]).'
      )
    }
    // processo não estava rodando — não é um erro para o chamador
  }
}

export async function waitForWindow(pid, predicate, { timeoutMs = 20000, intervalMs = 300 } = {}) {
  const deadline = Date.now() + timeoutMs
  let lastSeen = []
  while (Date.now() < deadline) {
    lastSeen = await listVisibleWindowsForProcess(pid)
    const match = lastSeen.find(predicate)
    if (match) return match
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  throw new Error(
    `Nenhuma janela correspondente encontrada para o processo ${pid} em ${timeoutMs}ms. ` +
      `Janelas visíveis no momento: ${JSON.stringify(lastSeen)}`
  )
}
