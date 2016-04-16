require('./bootstrap') // Setup error handlers
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')
let session = require('express-session')
let passport = require('passport')
let express = require('express')
let morgan = require('morgan')
let LocalStrategy = require('passport-local').Strategy
let wrap = require('nodeifyit')
let crypto = require('crypto')
let SALT = 'CodePathHeartNodeJS'
let flash = require('connect-flash')
let mongoose = require('mongoose')
let User = require('./user')
mongoose.connect('mongodb://127.0.0.1:27017/authenticator')

require('songbird')


const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000

let app = express()

app.use(flash())
app.use(cookieParser('ilovethenodejs')) // Session cookies
app.use(bodyParser.json()) // req.body for PUT/POST requests (login/signup)
app.use(bodyParser.urlencoded({ extended: true }))

// In-memory session support, required by passport.session()
app.use(session({
  secret: 'ilovethenodejs',
  resave: true,
  saveUninitialized: true
}))

app.use(passport.initialize()) // Enables passport middleware
app.use(passport.session()) // Enables passport persistent sessions

app.use(express.static('public'))

app.set('view engine', 'ejs')


let user = {
    email: 'foo@foo.com',
	password: crypto.pbkdf2Sync('asdf', SALT, 4096, 512, 'sha256').toString('hex')

}

passport.serializeUser(wrap(async (user) => user.email))
passport.deserializeUser(wrap(async (email) => {
    return await User.findOne({email}).exec()
}))

passport.use('local', new LocalStrategy({
    usernameField: 'email', // Use "email" field instead of "username"
    failureFlash: true // Enables error messaging
}, wrap(async (email, password) => {
    email = (email || '').toLowerCase()
	let user = await User.promise.findOne({email: email})
	if (!user) {
		return [false, {message: 'Invalid user'}]
	}
	console.log(user);
    let passwordHash = await crypto.promise.pbkdf2(password, SALT, 4096, 512, 'sha256')
    if (passwordHash.toString('hex') !== user.password) {
       	return [false, {message: 'Invalid password'}]
    }
    return user
}, {spread: true})))

passport.use('local-signup', new LocalStrategy({
	usernameField: 'email'
}, wrap(async (email, password) => {
    email = (email || '').toLowerCase()

    if (await User.promise.findOne({email})) {
        return [false, {message: 'That email is already taken.'}]
    }

    let user = new User()
    user.email = email

    // Store password as a hash instead of plain-text
    user.password = (await crypto.promise.pbkdf2(password, SALT, 4096, 512, 'sha256')).toString('hex')
    return await user.save()
}, {spread: true})))

// start server 
app.listen(PORT, ()=> console.log(`Listening @ http://127.0.0.1:${PORT}`))

app.get('/', (req, res) => {
    res.render('index.ejs', {message: req.flash('error')})
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/',
    failureFlash: true
}))

app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/',
    failureFlash: true
}))

function isLoggedIn(req, res, next) {
	console.log(req.isAuthenticated())
    if (req.isAuthenticated()) {
		return next()
	}
    res.redirect('/')
}
app.get('/profile', isLoggedIn, (req, res) => res.render('profile.ejs', {}))

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
