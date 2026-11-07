import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from 'expect-webdriverio'
import { LoginPage } from '../pages/LoginPage.js'
import { MainPage } from '../pages/MainPage.js'
import { TecladoVirtualPage } from '../pages/TecladoVirtualPage.js'
import {
  launchAndAttachToLogin,
  proceedPastLoginToMainWindow,
  waitForLogoutReturnToLogin,
  waitForTecladoVirtualWindow,
  reattachToLoginWindow,
} from '../support/appLifecycle.js'
import { loadEnv } from '../support/loadEnv.js'

const env = loadEnv()

let loginPage
let mainPage

Given('que estou na tela de login', async function () {
  await launchAndAttachToLogin(env.app.executablePath, env.app.processName)
  loginPage = new LoginPage(driver)
})

When('informo usuário e senha válidos', async function () {
  await loginPage.login({
    usuario: env.credentials.usuario,
    senha: env.credentials.senha,
  })
})

Then('vejo a tela principal', async function () {
  // Diálogo "Atenção: usuário já está conectado" pode aparecer a qualquer
  // momento aqui se a execução anterior não encerrou a sessão no Firebird de
  // forma limpa — tratado dentro de proceedPastLoginToMainWindow (ver
  // PENDÊNCIA em tests/support/appLifecycle.js).
  await proceedPastLoginToMainWindow()
  mainPage = new MainPage(driver)
  const statusBarEl = mainPage.statusBarUsuario(env.credentials.usuario)
  await statusBarEl.waitForDisplayed({ timeout: 10000 })
  await expect(statusBarEl).toBeDisplayed()
})

When('efetuo logout', async function () {
  await mainPage.logout()
})

Then('volto para a tela de login', async function () {
  await waitForLogoutReturnToLogin()
  loginPage = new LoginPage(driver)
  const usuarioEl = loginPage.usuarioField()
  await usuarioEl.waitForDisplayed({ timeout: 10000 })
  await expect(usuarioEl).toBeDisplayed()
})

When('abro o sistema novamente e informo usuário e senha válidos', async function () {
  // `launchAndAttachToLogin` mata o processo atual via hard-kill
  // (`taskkill /F`) antes de abrir um novo — aqui, diferente do uso normal
  // (isolamento entre cenários), o processo anterior AINDA está logado
  // (sessão ativa no Firebird). É exatamente esse encerramento abrupto sem
  // logout prévio que o cenário 1.3 reproduz (achado 2026-10-09: sair pelo
  // botão "Sair" faz uma desconexão limpa, igual ao Logout — NÃO deixa a
  // sessão presa; só um kill sem aviso prévio ao app reproduz o aviso).
  await launchAndAttachToLogin(env.app.executablePath, env.app.processName)
  loginPage = new LoginPage(driver)
  await loginPage.login({
    usuario: env.credentials.usuario,
    senha: env.credentials.senha,
  })
})

When('digito o usuário pelo teclado virtual e informo a senha válida', async function () {
  const usuarioEl = loginPage.usuarioField()
  await usuarioEl.click()

  await loginPage.abrirTecladoVirtual()
  await waitForTecladoVirtualWindow()
  const teclado = new TecladoVirtualPage(driver)
  await teclado.digitar(env.credentials.usuario)
  await teclado.confirmar()

  // Fechar o teclado não abre janela nova — a sessão volta pra mesma janela
  // de Login de antes, só precisa reanexar (ver appLifecycle.js).
  await reattachToLoginWindow()
  loginPage = new LoginPage(driver)
  await loginPage.senhaField().click()
  await loginPage.senhaField().setValue(env.credentials.senha)
  await loginPage.conectarButton().click()
})

When('digito a senha pelo teclado virtual e informo o usuário válido', async function () {
  const senhaEl = loginPage.senhaField()
  await senhaEl.click()

  await loginPage.abrirTecladoVirtual()
  await waitForTecladoVirtualWindow()
  const teclado = new TecladoVirtualPage(driver)
  await teclado.digitar(env.credentials.senha)
  await teclado.confirmar()

  // Fechar o teclado não abre janela nova — a sessão volta pra mesma janela
  // de Login de antes, só precisa reanexar (ver appLifecycle.js).
  await reattachToLoginWindow()
  loginPage = new LoginPage(driver)
  await loginPage.usuarioField().click()
  await loginPage.usuarioField().setValue(env.credentials.usuario)
  await loginPage.conectarButton().click()
})

When('digito o usuário e a senha pelo teclado virtual', async function () {
  const usuarioEl = loginPage.usuarioField()
  await usuarioEl.click()
  await loginPage.abrirTecladoVirtual()
  await waitForTecladoVirtualWindow()
  let teclado = new TecladoVirtualPage(driver)
  await teclado.digitar(env.credentials.usuario)
  await teclado.confirmar()
  await reattachToLoginWindow()
  loginPage = new LoginPage(driver)

  const senhaEl = loginPage.senhaField()
  await senhaEl.click()
  await loginPage.abrirTecladoVirtual()
  await waitForTecladoVirtualWindow()
  teclado = new TecladoVirtualPage(driver)
  await teclado.digitar(env.credentials.senha)
  await teclado.confirmar()
  await reattachToLoginWindow()
  loginPage = new LoginPage(driver)

  await loginPage.conectarButton().click()
})

// Credenciais propositalmente inválidas — não vêm de env.json/env.local.json
// porque não representam um registro real a buscar, só uma entrada que
// precisa não casar com nenhum usuário/senha existente.
const USUARIO_INVALIDO = 'usuario_inexistente_xyz'
const SENHA_INVALIDA = 'senha_errada_xyz_123'

When('informo um usuário inválido e a senha válida', async function () {
  await loginPage.login({ usuario: USUARIO_INVALIDO, senha: env.credentials.senha })
})

When('informo o usuário válido e uma senha inválida', async function () {
  await loginPage.login({ usuario: env.credentials.usuario, senha: SENHA_INVALIDA })
})

Then('permaneço na tela de login', async function () {
  // Achado (2026-10-09, ver PROJECT_CONTEXT.md "Login com usuário/senha
  // inválidos"): não existe diálogo de erro nem texto inline exposto via UI
  // Automation nessa tela — a única evidência observável é a tela de login
  // continuar ali (campos limpos, foco de volta no Usuário). Settle de 2s
  // antes de assertar, pra não confirmar cedo demais caso a validação seja
  // assíncrona.
  await new Promise((resolve) => setTimeout(resolve, 2000))
  const usuarioEl = loginPage.usuarioField()
  await usuarioEl.waitForDisplayed({ timeout: 10000 })
  await expect(usuarioEl).toBeDisplayed()
  await expect(loginPage.conectarButton()).toBeDisplayed()
})

Then('vejo o aviso de reconexão e a tela principal', async function () {
  // Diferente de "Então vejo a tela principal" (que tolera o aviso em
  // silêncio): aqui a PRÓPRIA aparição do aviso é o que o cenário prova —
  // por isso a asserção principal nunca fica condicionada a um `if`
  // (R-ANTIFALSO).
  const reconnectDialogShown = await proceedPastLoginToMainWindow()
  expect(reconnectDialogShown).toBe(true)

  mainPage = new MainPage(driver)
  const statusBarEl = mainPage.statusBarUsuario(env.credentials.usuario)
  await statusBarEl.waitForDisplayed({ timeout: 10000 })
  await expect(statusBarEl).toBeDisplayed()
})
