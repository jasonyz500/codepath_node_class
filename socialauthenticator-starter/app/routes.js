let isLoggedIn = require('./middlewares/isLoggedIn')

module.exports = (app) => {
    let passport = app.passport

    app.get('/', (req, res) => res.render('index.ejs'))

    app.get('/profile', isLoggedIn, (req, res) => {
        res.render('profile.ejs', {
            user: req.user,
            message: req.flash('error')
        })
    })

    app.get('/logout', (req, res) => {
        req.logout()
        res.redirect('/')
    })

    app.get('/login', (req, res) => {
        res.render('login.ejs', {message: req.flash('error')})
    })

    app.get('/signup', (req, res) => {
        res.render('signup.ejs', {message: req.flash('error') })
    })

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/',
        failureFlash: true
    }))

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/',
        failureFlash: true
    }))

    let scope = 'email'

    // Authentication route & Callback URL
    app.get('/auth/facebook', passport.authenticate('facebook', {scope}))
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    // Authorization route & Callback URL
    app.get('/connect/facebook', passport.authorize('facebook', {scope}))
    app.get('/connect/facebook/callback', passport.authorize('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))
}

// module.exports = (app) => {
//   let passport = app.passport

//   app.get('/', (req, res) => {
//     res.render('index.ejs', {message: req.flash('error')})
//   })

//   app.post('/login', passport.authenticate('local', {
//     successRedirect: '/profile',
//     failureRedirect: '/',
//     failureFlash: true
//   }))
//   // process the signup form
//   app.post('/signup', passport.authenticate('local-signup', {
//     successRedirect: '/profile',
//     failureRedirect: '/',
//     failureFlash: true
//   }))

//   app.get('/profile', isLoggedIn, (req, res) => {
//     res.render('profile.ejs', {
//       user: req.user,
//       message: req.flash('error')
//     })
//   })

//   app.get('/logout', (req, res) => {
//     req.logout()
//     res.redirect('/')
//   })
// }
