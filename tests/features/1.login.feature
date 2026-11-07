# language: pt
Funcionalidade: Login
  Como usuário do sistema
  Quero autenticar com usuário e senha
  Para acessar a tela principal

  Cenário: 1.1 Autentica com usuário e senha válidos
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal

  Cenário: 1.2 Efetua logout após autenticação
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    Quando efetuo logout
    Então volto para a tela de login

  Cenário: 1.3 Aviso de reconexão ao logar após encerramento abrupto (sem logout)
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    Quando abro o sistema novamente e informo usuário e senha válidos
    Então vejo o aviso de reconexão e a tela principal

  Cenário: 1.4 Login digitando o usuário pelo teclado virtual
    Dado que estou na tela de login
    Quando digito o usuário pelo teclado virtual e informo a senha válida
    Então vejo a tela principal

  Cenário: 1.5 Login digitando a senha pelo teclado virtual
    Dado que estou na tela de login
    Quando digito a senha pelo teclado virtual e informo o usuário válido
    Então vejo a tela principal

  Cenário: 1.6 Login digitando usuário e senha pelo teclado virtual
    Dado que estou na tela de login
    Quando digito o usuário e a senha pelo teclado virtual
    Então vejo a tela principal

  Cenário: 1.7 Não autentica com usuário inválido
    Dado que estou na tela de login
    Quando informo um usuário inválido e a senha válida
    Então permaneço na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal

  Cenário: 1.8 Não autentica com senha inválida
    Dado que estou na tela de login
    Quando informo o usuário válido e uma senha inválida
    Então permaneço na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
