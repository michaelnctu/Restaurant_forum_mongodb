const restController = require('../controllers/restController.js')
const adminController = require('../controllers/adminController.js')
const userController = require('../controllers/userController.js')
const passport = require('../config/passport.js')

module.exports = (app, passport) => {

  const authenticated = (req, res, next) => {
    console.log(req.user)
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/signin')
  }
  const authenticatedAdmin = (req, res, next) => {
    if (req.isAuthenticated()) {

      if (req.user.isAdmin) {
        console.log("執行admin")
        return next()
      }

      return res.redirect('/')
    }
    res.redirect('/signin')
  }



  app.get('/', authenticated, (req, res) => res.redirect('/restaurants'))

  app.get('/restaurants', authenticated, restController.getRestaurants)

  app.get('/admin', authenticatedAdmin, (req, res) => res.redirect('/admin/restaurants'))


  app.get('/admin/restaurants', authenticatedAdmin, adminController.getRestaurants)

  app.get('/admin/restaurants/:id', authenticatedAdmin, adminController.getRestaurant)


  app.get('/admin/restaurants/:id/edit', authenticatedAdmin, adminController.editRestaurant)

  app.put('/admin/restaurants/:id', authenticatedAdmin, adminController.putRestaurant)


  app.get('/admin/restaurants/create', authenticatedAdmin, adminController.createRestaurant)

  app.post('/admin/restaurants', authenticatedAdmin, adminController.postRestaurant)


  app.get('/signup', userController.signUpPage) //負責 render 註冊的頁面

  app.post('/signup', userController.signUp)  //signUp：負責實際處理註冊的行為

  app.get('/signin', userController.signInPage)

  app.post('/signin', passport.authenticate('local', { failureRedirect: '/signin', faulureFlash: true }), userController.signIn)

  app.get('/logout', userController.logout)



}

