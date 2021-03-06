const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const BearerStrategy = require('passport-http-bearer').Strategy
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const blacklist = require('../../redis/manipula-blacklist')

const Usuario = require('./usuarios-modelo')
const { InvalidArgumentError } = require('../erros')

function verificaUsuario(usuario) {
  if (!usuario) {
    throw new InvalidArgumentError('Não existe usuário com esse e-mail')
  }
}

async function verificaTokenNaBlacklist(token) {
  const tokenNaBlacklist = await blacklist.contemToken(token)

  if (tokenNaBlacklist) {
    throw new jwt.JsonWebTokenError('Token inválido por logout')
  }
}

async function verificaSenha(senha, senhaHash) {
  const senhaValida = await bcrypt.compare(senha, senhaHash)

  if (!senhaValida) {
    throw new InvalidArgumentError('E-mail ou senha inválidos')
  }

  return senhaValida
}

passport.use(
  new LocalStrategy({
    usernameField: 'email',
    passwordField: 'senha',
    session: false
  }, async (email, senha, done) => {
    try {
      const usuario = await Usuario.buscaPorEmail(email)

      verificaUsuario(usuario)
      await verificaSenha(senha, usuario.senhaHash)

      done(null, usuario)
    } catch (error) {
      done(error)
    }
  })
)

passport.use(
  new BearerStrategy(async (token, done) => {
    try {
      await verificaTokenNaBlacklist(token)
      
      const payload = jwt.verify(token, process.env.JWT_KEY)
      const usuario = await Usuario.buscaPorId(payload.id)
      done(null, usuario, { token })
    } catch (error) {
      done(error)
    }
  })
)
