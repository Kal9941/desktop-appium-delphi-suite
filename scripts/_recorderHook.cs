// Gancho global de mouse e teclado do gravador de sessão (compilado em tempo de
// execução pelo PowerShell via Add-Type — ver `_recorderNative.mjs`).
//
// ATENÇÃO: o `csc` do PowerShell 5.1 compila C# 5. Sem `?.`, sem `$"..."`,
// sem `nameof`, sem membros com corpo de expressão, sem `out var`.
//
// Protocolo:
//   saída (stdout): uma linha por evento = Base64 de JSON em UTF-8 (evita
//                   corromper acentos, mesma lição de windowsNative.js);
//   entrada (stdin): `uia <seq> <x> <y>` e `fim`.
//
// O callback do hook faz só Win32 barato e enfileira: hook de baixo nível tem
// tempo limite, e atrasá-lo trava o mouse do operador. JSON, captura de tela e
// UIA rodam fora do callback.
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Automation;

public static class Gravador
{
    private delegate IntPtr HookProc(int nCode, IntPtr wParam, IntPtr lParam);
    private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT { public int x; public int y; }

    [StructLayout(LayoutKind.Sequential)]
    private struct RECT { public int Left; public int Top; public int Right; public int Bottom; }

    [StructLayout(LayoutKind.Sequential)]
    private struct MSG
    {
        public IntPtr hwnd; public uint message; public IntPtr wParam; public IntPtr lParam;
        public uint time; public POINT pt;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct MSLLHOOKSTRUCT
    {
        public POINT pt; public uint mouseData; public uint flags; public uint time; public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct KBDLLHOOKSTRUCT
    {
        public uint vkCode; public uint scanCode; public uint flags; public uint time; public IntPtr dwExtraInfo;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, HookProc lpfn, IntPtr hMod, uint dwThreadId);
    [DllImport("user32.dll")] private static extern bool UnhookWindowsHookEx(IntPtr hhk);
    [DllImport("user32.dll")] private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);
    [DllImport("kernel32.dll")] private static extern IntPtr GetModuleHandle(string lpModuleName);
    [DllImport("kernel32.dll")] private static extern uint GetCurrentThreadId();
    [DllImport("user32.dll")] private static extern int GetMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);
    [DllImport("user32.dll")] private static extern bool PeekMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax, uint wRemoveMsg);
    [DllImport("user32.dll")] private static extern bool PostThreadMessage(uint idThread, uint msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")] private static extern IntPtr WindowFromPoint(POINT pt);
    [DllImport("user32.dll")] private static extern IntPtr GetAncestor(IntPtr hWnd, uint gaFlags);
    [DllImport("user32.dll")] private static extern IntPtr GetParent(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint msg, IntPtr wParam, StringBuilder lParam, uint flags, uint timeout, out IntPtr result);
    [DllImport("user32.dll")] private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")] private static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] private static extern short GetAsyncKeyState(int vKey);
    [DllImport("user32.dll")] private static extern short GetKeyState(int nVirtKey);
    [DllImport("user32.dll")] private static extern IntPtr GetKeyboardLayout(uint idThread);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int ToUnicodeEx(uint wVirtKey, uint wScanCode, byte[] lpKeyState, StringBuilder pwszBuff, int cchBuff, uint wFlags, IntPtr dwhkl);
    [DllImport("user32.dll")] private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] private static extern bool EnumChildWindows(IntPtr hWndParent, EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] private static extern uint GetDoubleClickTime();
    [DllImport("user32.dll")] private static extern bool SetProcessDPIAware();

    private const int WH_KEYBOARD_LL = 13;
    private const int WH_MOUSE_LL = 14;
    private const int WM_LBUTTONDOWN = 0x201;
    private const int WM_RBUTTONDOWN = 0x204;
    private const int WM_KEYDOWN = 0x100;
    private const int WM_KEYUP = 0x101;
    private const int WM_SYSKEYDOWN = 0x104;
    private const int WM_SYSKEYUP = 0x105;
    private const uint WM_QUIT = 0x12;
    private const uint WM_GETTEXT = 0x0D;
    private const uint GA_ROOT = 2;

    private static string nomeProcesso;
    private static string pastaShots;
    private static int atrasoShotMs;
    private static uint vkCheckpoint;
    private static uint vkEncerrar;
    private static HashSet<string> titulosSemTeclas = new HashSet<string>();

    private static HookProc procMouse;
    private static HookProc procTeclado;
    private static IntPtr hookMouse = IntPtr.Zero;
    private static IntPtr hookTeclado = IntPtr.Zero;
    private static uint threadDoHook;
    private static volatile bool encerrando;
    private static readonly ManualResetEvent hookPronto = new ManualResetEvent(false);

    private static readonly Stopwatch relogio = Stopwatch.StartNew();
    private static int sequencia;
    private static int shotsPendentes;
    private static readonly object travaSaida = new object();
    private static readonly JavaScriptSerializer json = new JavaScriptSerializer();
    private static readonly BlockingCollection<Dictionary<string, object>> fila =
        new BlockingCollection<Dictionary<string, object>>();
    private static readonly Dictionary<uint, bool> cachePid = new Dictionary<uint, bool>();

    // Estado só tocado pela thread do hook.
    private static readonly HashSet<uint> teclasEngolidas = new HashSet<uint>();
    private static long ultimoCliqueMs = -100000;
    private static int ultimoCliqueX;
    private static int ultimoCliqueY;
    private static string acentoPendente = null;

    // Ponto de entrada: bloqueia até receber `fim` (ou o stdin fechar).
    public static void Iniciar(string nome, string pasta, int atrasoMs, string teclaCheckpoint, string teclaEncerrar, string semTeclasCsv)
    {
        SetProcessDPIAware();
        nomeProcesso = nome.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) ? nome.Substring(0, nome.Length - 4) : nome;
        pastaShots = pasta;
        atrasoShotMs = atrasoMs;
        vkCheckpoint = (uint)char.ToUpperInvariant(teclaCheckpoint[0]);
        vkEncerrar = (uint)char.ToUpperInvariant(teclaEncerrar[0]);
        foreach (string titulo in semTeclasCsv.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
        {
            titulosSemTeclas.Add(titulo);
        }
        json.MaxJsonLength = int.MaxValue;
        Directory.CreateDirectory(pastaShots);
        // Aquecimento: o primeiro uso do serializador custa JIT; melhor agora.
        json.Serialize(new Dictionary<string, object> { { "aquecimento", 1 } });

        Thread consumidor = new Thread(ConsumirFila);
        consumidor.IsBackground = true;
        consumidor.Start();

        Thread leitorStdin = new Thread(LerComandos);
        leitorStdin.IsBackground = true;
        leitorStdin.Start();

        Thread thHook = new Thread(LacoDoHook);
        thHook.SetApartmentState(ApartmentState.STA);
        thHook.Start();
        hookPronto.WaitOne();

        if (hookMouse == IntPtr.Zero || hookTeclado == IntPtr.Zero)
        {
            Enfileirar(Evento("erro", new Dictionary<string, object> { { "texto", "SetWindowsHookEx falhou" } }));
        }
        else
        {
            Enfileirar(Evento("pronto", null));
            thHook.Join();
        }

        // Dá tempo às capturas de tela pendentes antes de fechar.
        int espera = 0;
        while (Thread.VolatileRead(ref shotsPendentes) > 0 && espera < 3000) { Thread.Sleep(50); espera += 50; }
        Enfileirar(Evento("fim", null));
        fila.CompleteAdding();
        consumidor.Join(3000);
    }

    // ---- saída ----------------------------------------------------------------

    private static Dictionary<string, object> Evento(string tipo, Dictionary<string, object> extras)
    {
        Dictionary<string, object> d = new Dictionary<string, object>();
        d["seq"] = Interlocked.Increment(ref sequencia);
        d["t"] = relogio.ElapsedMilliseconds;
        d["tipo"] = tipo;
        if (extras != null) { foreach (KeyValuePair<string, object> par in extras) { d[par.Key] = par.Value; } }
        return d;
    }

    private static void Enfileirar(Dictionary<string, object> d)
    {
        if (!fila.IsAddingCompleted) { fila.Add(d); }
    }

    private static void ConsumirFila()
    {
        foreach (Dictionary<string, object> d in fila.GetConsumingEnumerable())
        {
            try
            {
                string texto = json.Serialize(d);
                string b64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(texto));
                lock (travaSaida) { Console.Out.WriteLine(b64); Console.Out.Flush(); }
            }
            catch (Exception) { }
        }
    }

    // ---- entrada (comandos do Node) --------------------------------------------

    private static void LerComandos()
    {
        StreamReader leitor = new StreamReader(Console.OpenStandardInput(), new UTF8Encoding(false));
        string linha;
        while ((linha = leitor.ReadLine()) != null)
        {
            string[] partes = linha.Trim().Split(' ');
            if (partes[0] == "fim") { break; }
            if (partes[0] == "uia" && partes.Length == 4)
            {
                int seq = int.Parse(partes[1]);
                int x = int.Parse(partes[2]);
                int y = int.Parse(partes[3]);
                ThreadPool.QueueUserWorkItem(delegate(object estado) { ResponderUia(seq, x, y); });
            }
        }
        Encerrar();
    }

    private static void Encerrar()
    {
        if (encerrando) { return; }
        encerrando = true;
        // O stdin pode fechar ANTES de a thread do hook existir (o Node morreu durante a
        // compilação do C#): sem esperar, o WM_QUIT se perde e o hook ficaria vivo, órfão.
        hookPronto.WaitOne(10000);
        if (threadDoHook != 0) { PostThreadMessage(threadDoHook, WM_QUIT, IntPtr.Zero, IntPtr.Zero); }
    }

    private static void ResponderUia(int seqPedido, int x, int y)
    {
        object uia = null;
        try
        {
            AutomationElement el = AutomationElement.FromPoint(new System.Windows.Point(x, y));
            if (el != null)
            {
                List<string> caminho = new List<string>();
                AutomationElement atual = el;
                int profundidade = 0;
                while (atual != null && profundidade < 8)
                {
                    caminho.Insert(0, atual.Current.Name + "|" + atual.Current.ControlType.ProgrammaticName);
                    atual = TreeWalker.ControlViewWalker.GetParent(atual);
                    profundidade++;
                }
                Dictionary<string, object> info = new Dictionary<string, object>();
                info["name"] = el.Current.Name;
                info["className"] = el.Current.ClassName;
                info["controlType"] = el.Current.ControlType.ProgrammaticName;
                info["path"] = string.Join("/", caminho.ToArray());
                uia = info;
            }
        }
        catch (Exception) { uia = null; }
        Dictionary<string, object> resposta = new Dictionary<string, object>();
        resposta["tipo"] = "uia";
        resposta["ref"] = seqPedido;
        resposta["uia"] = uia;
        Enfileirar(resposta);
    }

    // ---- hook -----------------------------------------------------------------

    private static void LacoDoHook()
    {
        threadDoHook = GetCurrentThreadId();
        // PeekMessage força a criação da fila de mensagens da thread: só depois disso um
        // PostThreadMessage(WM_QUIT) de outra thread tem onde chegar.
        MSG apenasParaCriarAFila;
        PeekMessage(out apenasParaCriarAFila, IntPtr.Zero, 0x400, 0x400, 0);
        procMouse = CallbackMouse;
        procTeclado = CallbackTeclado;
        IntPtr modulo = GetModuleHandle(null);
        hookMouse = SetWindowsHookEx(WH_MOUSE_LL, procMouse, modulo, 0);
        hookTeclado = SetWindowsHookEx(WH_KEYBOARD_LL, procTeclado, modulo, 0);
        hookPronto.Set();
        if (hookMouse == IntPtr.Zero || hookTeclado == IntPtr.Zero) { return; }
        MSG msg;
        // Se o encerramento já foi pedido (stdin fechou durante a compilação), nem entra no laço.
        while (!encerrando && GetMessage(out msg, IntPtr.Zero, 0, 0) > 0) { }
        UnhookWindowsHookEx(hookMouse);
        UnhookWindowsHookEx(hookTeclado);
    }

    private static IntPtr CallbackMouse(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0)
        {
            int msg = wParam.ToInt32();
            if (msg == WM_LBUTTONDOWN || msg == WM_RBUTTONDOWN)
            {
                try
                {
                    MSLLHOOKSTRUCT s = (MSLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(MSLLHOOKSTRUCT));
                    TratarClique(msg == WM_RBUTTONDOWN, s.pt);
                }
                catch (Exception) { }
            }
        }
        return CallNextHookEx(hookMouse, nCode, wParam, lParam);
    }

    private static IntPtr CallbackTeclado(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0)
        {
            int msg = wParam.ToInt32();
            try
            {
                KBDLLHOOKSTRUCT k = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));
                if (msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN)
                {
                    if (TratarTecla(k)) { return (IntPtr)1; }
                }
                else if (msg == WM_KEYUP || msg == WM_SYSKEYUP)
                {
                    if (teclasEngolidas.Remove(k.vkCode)) { return (IntPtr)1; }
                }
            }
            catch (Exception) { }
        }
        return CallNextHookEx(hookTeclado, nCode, wParam, lParam);
    }

    // ---- resolução de janelas (Win32) -------------------------------------------

    private static bool DoProcessoAlvo(IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero) { return false; }
        uint pid;
        GetWindowThreadProcessId(hwnd, out pid);
        if (pid == 0) { return false; }
        lock (cachePid)
        {
            bool eAlvo;
            if (cachePid.TryGetValue(pid, out eAlvo)) { return eAlvo; }
            try
            {
                eAlvo = string.Equals(Process.GetProcessById((int)pid).ProcessName, nomeProcesso, StringComparison.OrdinalIgnoreCase);
            }
            catch (Exception) { eAlvo = false; }
            cachePid[pid] = eAlvo;
            return eAlvo;
        }
    }

    private static string Classe(IntPtr hwnd)
    {
        StringBuilder sb = new StringBuilder(256);
        GetClassName(hwnd, sb, sb.Capacity);
        return sb.ToString();
    }

    private static string TituloSimples(IntPtr hwnd)
    {
        StringBuilder sb = new StringBuilder(256);
        GetWindowText(hwnd, sb, sb.Capacity);
        return sb.ToString();
    }

    // Campos de entrada devolvem o CONTEÚDO digitado no WM_GETTEXT (inclusive
    // senha): nunca ler legenda desses controles.
    private static bool ClasseSensivel(string classe)
    {
        string c = classe.ToLowerInvariant();
        return c.Contains("edit") || c.Contains("memo") || c.Contains("combo");
    }

    // GetWindowText não lê o texto de controles de OUTRO processo; WM_GETTEXT
    // com timeout curto lê a legenda sem travar se o app estiver ocupado.
    private static string LegendaDoControle(IntPtr hwnd)
    {
        StringBuilder sb = new StringBuilder(256);
        IntPtr resultado;
        IntPtr ok = SendMessageTimeout(hwnd, WM_GETTEXT, (IntPtr)sb.Capacity, sb, 0x3, 50, out resultado);
        if (ok == IntPtr.Zero) { return string.Empty; }
        return sb.ToString();
    }

    private static Dictionary<string, object> InfoJanela(IntPtr hwnd, bool lerLegendaDoControle, bool raizSemTeclas)
    {
        string classe = Classe(hwnd);
        string titulo = string.Empty;
        if (!raizSemTeclas && !ClasseSensivel(classe))
        {
            titulo = lerLegendaDoControle ? LegendaDoControle(hwnd) : TituloSimples(hwnd);
            if (titulo.Length == 0 && lerLegendaDoControle) { titulo = TituloSimples(hwnd); }
        }
        RECT r;
        GetWindowRect(hwnd, out r);
        Dictionary<string, object> ret = new Dictionary<string, object>();
        ret["handle"] = string.Format("0x{0:X8}", hwnd.ToInt64());
        ret["classe"] = classe;
        ret["titulo"] = titulo;
        Dictionary<string, object> ret2 = new Dictionary<string, object>();
        ret2["esquerda"] = r.Left; ret2["topo"] = r.Top; ret2["direita"] = r.Right; ret2["base"] = r.Bottom;
        ret["retangulo"] = ret2;
        return ret;
    }

    private static bool RaizEhSemTeclas(IntPtr hwnd)
    {
        IntPtr raiz = GetAncestor(hwnd, GA_ROOT);
        if (raiz == IntPtr.Zero) { raiz = hwnd; }
        return titulosSemTeclas.Contains(TituloSimples(raiz));
    }

    private static Dictionary<string, object> FocoAtual()
    {
        IntPtr fg = GetForegroundWindow();
        Dictionary<string, object> foco = new Dictionary<string, object>();
        IntPtr raiz = fg == IntPtr.Zero ? IntPtr.Zero : GetAncestor(fg, GA_ROOT);
        if (raiz == IntPtr.Zero) { raiz = fg; }
        foco["titulo"] = raiz == IntPtr.Zero ? string.Empty : TituloSimples(raiz);
        foco["handle"] = string.Format("0x{0:X8}", fg.ToInt64());
        return foco;
    }

    // Classes `Tf*` (formulários Delphi) visíveis sob a janela de topo em foco, a
    // de topo primeiro. Serve para descobrir a tela aberta quando não houve
    // clique (checkpoint, tecla de navegação): o Node extrai o número da classe.
    private static List<object> ClassesVisiveis(IntPtr fg)
    {
        List<object> classes = new List<object>();
        if (fg == IntPtr.Zero) { return classes; }
        IntPtr raiz = GetAncestor(fg, GA_ROOT);
        if (raiz == IntPtr.Zero) { raiz = fg; }
        HashSet<string> vistas = new HashSet<string>();
        string classeRaiz = Classe(raiz);
        if (classeRaiz.StartsWith("Tf")) { vistas.Add(classeRaiz); classes.Add(classeRaiz); }
        EnumChildWindows(raiz, delegate(IntPtr filho, IntPtr lp)
        {
            if (IsWindowVisible(filho) && classes.Count < 100)
            {
                string c = Classe(filho);
                if (c.StartsWith("Tf") && vistas.Add(c)) { classes.Add(c); }
            }
            return true;
        }, IntPtr.Zero);
        return classes;
    }

    private static string CaminhoShot(int seq)
    {
        return string.Format("shots/{0:D4}.png", seq);
    }

    // ---- eventos de mouse -------------------------------------------------------

    private static void TratarClique(bool direito, POINT pt)
    {
        IntPtr alvoHwnd = WindowFromPoint(pt);
        if (!DoProcessoAlvo(alvoHwnd)) { return; }

        bool semTeclas = RaizEhSemTeclas(alvoHwnd);
        Dictionary<string, object> alvo = InfoJanela(alvoHwnd, true, semTeclas);
        List<object> cadeia = new List<object>();
        IntPtr pai = GetParent(alvoHwnd);
        int profundidade = 0;
        while (pai != IntPtr.Zero && profundidade < 12)
        {
            cadeia.Add(InfoJanela(pai, false, semTeclas));
            pai = GetParent(pai);
            profundidade++;
        }
        IntPtr raiz = GetAncestor(alvoHwnd, GA_ROOT);
        Dictionary<string, object> topo = new Dictionary<string, object>();
        topo["classe"] = raiz == IntPtr.Zero ? string.Empty : Classe(raiz);
        topo["titulo"] = raiz == IntPtr.Zero ? string.Empty : TituloSimples(raiz);

        string tipo = "clique";
        long agora = relogio.ElapsedMilliseconds;
        if (direito) { tipo = "direito"; }
        else if (agora - ultimoCliqueMs <= GetDoubleClickTime() && Math.Abs(pt.x - ultimoCliqueX) <= 4 && Math.Abs(pt.y - ultimoCliqueY) <= 4)
        {
            tipo = "duplo";
        }
        ultimoCliqueMs = agora; ultimoCliqueX = pt.x; ultimoCliqueY = pt.y;

        Dictionary<string, object> retAlvo = (Dictionary<string, object>)alvo["retangulo"];
        Dictionary<string, object> extras = new Dictionary<string, object>();
        extras["x"] = pt.x; extras["y"] = pt.y;
        extras["rx"] = pt.x - (int)retAlvo["esquerda"];
        extras["ry"] = pt.y - (int)retAlvo["topo"];
        extras["alvo"] = alvo; extras["cadeia"] = cadeia; extras["janelaTopo"] = topo;
        extras["foco"] = FocoAtual();
        Dictionary<string, object> evento = Evento(tipo, extras);
        string shot = CaminhoShot((int)evento["seq"]);
        evento["shot"] = shot;
        Enfileirar(evento);
        AgendarShot(shot);
    }

    // ---- eventos de teclado -----------------------------------------------------

    private static string NomeDaTecla(uint vk)
    {
        if (vk >= 0x70 && vk <= 0x7B) { return "F" + (vk - 0x6F); }
        switch (vk)
        {
            case 0x08: return "Backspace";
            case 0x09: return "Tab";
            case 0x0D: return "Enter";
            case 0x1B: return "Esc";
            case 0x20: return "Space";
            case 0x21: return "PageUp";
            case 0x22: return "PageDown";
            case 0x23: return "End";
            case 0x24: return "Home";
            case 0x25: return "Left";
            case 0x26: return "Up";
            case 0x27: return "Right";
            case 0x28: return "Down";
            case 0x2D: return "Insert";
            case 0x2E: return "Delete";
        }
        if ((vk >= 0x30 && vk <= 0x39) || (vk >= 0x41 && vk <= 0x5A)) { return ((char)vk).ToString(); }
        return "VK_0x" + vk.ToString("X2");
    }

    private static bool ApenasModificador(uint vk)
    {
        return vk == 0x10 || vk == 0x11 || vk == 0x12 || vk == 0x14 || vk == 0x5B || vk == 0x5C || (vk >= 0xA0 && vk <= 0xA5);
    }

    private static string CombinarAcento(string acento, string letra)
    {
        string combinante = null;
        if (acento == "´") { combinante = "́"; }
        else if (acento == "`") { combinante = "̀"; }
        else if (acento == "^") { combinante = "̂"; }
        else if (acento == "~") { combinante = "̃"; }
        else if (acento == "¨") { combinante = "̈"; }
        if (combinante == null) { return acento + letra; }
        string composto = (letra + combinante).Normalize(NormalizationForm.FormC);
        return composto.Length == 1 ? composto : acento + letra;
    }

    // ToUnicodeEx com flag 0x4 NÃO altera o estado do teclado do sistema (sem
    // isso, consumiríamos a tecla morta do operador e o acento sumiria no app).
    // Por isso a composição de acento (tecla morta + letra) é feita aqui.
    private static string ConverterCaractere(KBDLLHOOKSTRUCT k, bool shift, bool altGr, IntPtr fg, out bool morta)
    {
        morta = false;
        byte[] estado = new byte[256];
        if (shift) { estado[0x10] = 0x80; }
        // AltGr é Ctrl+Alt para o ToUnicodeEx: sem isso, "°" (AltGr+E no ABNT2) não compõe.
        if (altGr) { estado[0x11] = 0x80; estado[0x12] = 0x80; }
        if ((GetKeyState(0x14) & 1) != 0) { estado[0x14] = 1; }
        uint pid;
        IntPtr layout = GetKeyboardLayout(GetWindowThreadProcessId(fg, out pid));
        StringBuilder sb = new StringBuilder(8);
        int n = ToUnicodeEx(k.vkCode, k.scanCode, estado, sb, sb.Capacity, 0x4, layout);
        if (n < 0)
        {
            acentoPendente = sb.ToString(0, 1);
            morta = true;
            return null;
        }
        if (n == 0)
        {
            acentoPendente = null;
            return null;
        }
        string c = sb.ToString(0, n);
        // Esc, Enter, Tab e Backspace voltam como caractere de controle: são
        // tecla, não texto digitado (achado da calibração de 2026-10-28).
        if (char.IsControl(c[0]))
        {
            acentoPendente = null;
            return null;
        }
        if (acentoPendente != null)
        {
            string acento = acentoPendente;
            acentoPendente = null;
            if (c == " ") { return acento; }
            return CombinarAcento(acento, c);
        }
        return c;
    }

    // Devolve true quando a tecla deve ser ENGOLIDA (atalho do gravador).
    private static bool TratarTecla(KBDLLHOOKSTRUCT k)
    {
        IntPtr fg = GetForegroundWindow();
        if (!DoProcessoAlvo(fg)) { return false; }
        // AltGr chega ao hook como LControl + RMenu: não é Ctrl+Alt do operador. Sem esta
        // distinção, digitar "°" (AltGr+E no ABNT2) encerraria a gravação e os acentos por
        // AltGr sairiam como "ctrl+alt+tecla". Os atalhos do gravador usam o Alt ESQUERDO.
        bool lCtrl = (GetAsyncKeyState(0xA2) & 0x8000) != 0;
        bool rCtrl = (GetAsyncKeyState(0xA3) & 0x8000) != 0;
        bool lAlt = (GetAsyncKeyState(0xA4) & 0x8000) != 0;
        bool rAlt = (GetAsyncKeyState(0xA5) & 0x8000) != 0;
        bool altGr = rAlt && lCtrl && !rCtrl && !lAlt;
        bool ctrl = (lCtrl || rCtrl) && !altGr;
        bool alt = (lAlt || rAlt) && !altGr;
        bool shift = (GetAsyncKeyState(0x10) & 0x8000) != 0;

        if (ctrl && alt && (k.vkCode == vkCheckpoint || k.vkCode == vkEncerrar))
        {
            teclasEngolidas.Add(k.vkCode);
            bool eCheckpoint = k.vkCode == vkCheckpoint;
            Dictionary<string, object> extras = new Dictionary<string, object>();
            extras["foco"] = FocoAtual();
            extras["classesVisiveis"] = ClassesVisiveis(fg);
            Dictionary<string, object> evento = Evento(eCheckpoint ? "checkpoint" : "encerrar", extras);
            if (eCheckpoint)
            {
                string shot = CaminhoShot((int)evento["seq"]);
                evento["shot"] = shot;
                Enfileirar(evento);
                AgendarShot(shot);
            }
            else
            {
                Enfileirar(evento);
            }
            return true;
        }

        if (ApenasModificador(k.vkCode)) { return false; }
        if (RaizEhSemTeclas(fg)) { return false; }

        List<object> modificadores = new List<object>();
        if (ctrl) { modificadores.Add("ctrl"); }
        if (alt) { modificadores.Add("alt"); }
        if (shift) { modificadores.Add("shift"); }
        bool morta = false;
        string caractere = (ctrl || alt) ? null : ConverterCaractere(k, shift, altGr, fg, out morta);
        if (morta) { return false; }

        Dictionary<string, object> tecla = new Dictionary<string, object>();
        tecla["nome"] = NomeDaTecla(k.vkCode);
        tecla["caractere"] = caractere;
        tecla["modificadores"] = modificadores;
        Dictionary<string, object> extrasTecla = new Dictionary<string, object>();
        extrasTecla["tecla"] = tecla;
        extrasTecla["foco"] = FocoAtual();
        Dictionary<string, object> eventoTecla = Evento("tecla", extrasTecla);

        bool navegacao = k.vkCode == 0x0D || k.vkCode == 0x1B || (k.vkCode >= 0x70 && k.vkCode <= 0x7B);
        if (navegacao)
        {
            eventoTecla["classesVisiveis"] = ClassesVisiveis(fg);
            string shot = CaminhoShot((int)eventoTecla["seq"]);
            eventoTecla["shot"] = shot;
            Enfileirar(eventoTecla);
            AgendarShot(shot);
        }
        else
        {
            eventoTecla["shot"] = null;
            Enfileirar(eventoTecla);
        }
        return false;
    }

    // ---- captura de tela --------------------------------------------------------

    private static void AgendarShot(string relativo)
    {
        Interlocked.Increment(ref shotsPendentes);
        Task.Delay(atrasoShotMs).ContinueWith(delegate(Task t)
        {
            try { CapturarTela(relativo); }
            catch (Exception ex)
            {
                Dictionary<string, object> aviso = new Dictionary<string, object>();
                aviso["tipo"] = "aviso";
                aviso["texto"] = "captura falhou: " + ex.Message;
                Enfileirar(aviso);
            }
            finally { Interlocked.Decrement(ref shotsPendentes); }
        });
    }

    // União dos retângulos das janelas visíveis do app (nunca a tela inteira).
    private static void CapturarTela(string relativo)
    {
        int esq = int.MaxValue, topo = int.MaxValue, dir = int.MinValue, bas = int.MinValue;
        EnumWindows(delegate(IntPtr hwnd, IntPtr lp)
        {
            if (IsWindowVisible(hwnd) && DoProcessoAlvo(hwnd) && GetParent(hwnd) == IntPtr.Zero)
            {
                RECT r;
                GetWindowRect(hwnd, out r);
                if (r.Right - r.Left > 0 && r.Bottom - r.Top > 0)
                {
                    esq = Math.Min(esq, r.Left); topo = Math.Min(topo, r.Top);
                    dir = Math.Max(dir, r.Right); bas = Math.Max(bas, r.Bottom);
                }
            }
            return true;
        }, IntPtr.Zero);
        if (esq == int.MaxValue) { return; }
        int largura = dir - esq, altura = bas - topo;
        using (Bitmap bmp = new Bitmap(largura, altura))
        {
            using (Graphics g = Graphics.FromImage(bmp))
            {
                g.CopyFromScreen(esq, topo, 0, 0, new Size(largura, altura));
            }
            string destino = Path.Combine(Path.GetDirectoryName(pastaShots), relativo.Replace('/', Path.DirectorySeparatorChar));
            bmp.Save(destino, ImageFormat.Png);
        }
    }
}
