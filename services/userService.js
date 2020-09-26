const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const Restaurant = db.Restaurant
const Comment = db.Comment
const Favorite = db.Favorite
const Like = db.Like
const Followship = db.Followship

const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

const fs = require('fs')







const userService = {

  addFollowing: (req, res, callback) => {
    return Followship.create({
      followerId: req.user.id,
      followingId: req.params.userId
    })
      .then((followship) => {
        return callback({ status: 'success', message: '' })
      })
  },

  removeFollowing: (req, res) => {
    return Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then((followship) => {
        followship.destroy()
          .then((followship) => {
            return callback({ status: 'success', message: '' })
          })
      })
  },

  addLike: (req, res) => {

    return Like.findOrCreate({
      where: { RestaurantId: req.params.restaurantId, UserId: req.user.id },
      defaults: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    }).then((restaurant) => {
      return callback({ status: 'success', message: '' })
    })

  },

  removeLike: (req, res) => {
    return Like.findOne({
      where: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((Like) => {
        Like.destroy()
          .then((restaurant) => {
            return callback({ status: 'success', message: '' })
          })
      })
  },


  getTopUser: (req, res) => {
    // 撈出所有 User 與 followers 資料
    return User.findAll({
      include: [
        { model: User, as: 'Followers' }
      ]
    }).then(users => {
      // 整理 users 資料
      users = users.map(user => ({
        ...user.dataValues,
        // 計算追蹤者人數
        FollowerCount: user.Followers.length,
        // 判斷目前登入使用者是否已追蹤該 User 物件
        isFollowed: req.user.Followings.map(d => d.id).includes(user.id)
      }))
      // 依追蹤者人數排序清單
      users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)
      return callback({ users: users })
    })
  },


  addFavorite: (req, res) => {
    return Favorite.create({
      UserId: req.user.id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return callback({ status: 'success', message: '' })
      })
  },

  removeFavorite: (req, res) => {
    return Favorite.findOne({
      where: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((favorite) => {
        favorite.destroy()
          .then((restaurant) => {
            return callback({ status: 'success', message: '' })
          })
      })
  },

  //A19-Q2
  getUser: (req, res) => {
    return User.findByPk(req.params.id, {
      include: [
        { model: Restaurant, as: 'FavoritedRestaurants' },
        { model: User, as: 'Followings' },
        { model: User, as: 'Followers' },
        { model: Comment, include: [Restaurant] }
      ]
    }).then(user => {
      console.log('user model', user.toJSON())
      return callback({ user: user.toJSON() })
    })
  },

  //A19-Q2
  putUser: (req, res, next) => {
    if (!req.body.name) {
      return callback({ status: 'error', message: 'name did not exist' })
    }


    if (Number(req.params.id) !== req.user.id) {
      return callback({ status: 'error', message: 'permission denied' })
    }

    const { file } = req
    if (file) {
      console.log("client Id 是", IMGUR_CLIENT_ID)
      imgur.setClientID(IMGUR_CLIENT_ID);
      imgur.upload(file.path, (err, img) => {
        //error handling
        if (err) {
          next(err)
          return
        }

        return User.findByPk(req.params.id)
          .then((user) => {
            user.update({
              name: req.body.name,
              image: file ? img.data.link : null
            }).then((user) => {
              return callback({ status: 'sucess', message: 'user was successfully  updated' })
            })
          })
      })
    } else {
      return User.findByPk(req.params.id)
        .then((user) => {
          user.update({
            name: req.body.name,
            image: user.image
          }).then((user) => {
            return callback({ status: 'sucess', message: 'user was successfully  updated' })
          })
        })
    }
  },

  signUpPage: (req, res) => {
    return res.render('signup')
  },

  signUp: (req, res) => {

    if (req.body.passwordCheck !== req.body.password) {
      req.flash('error_messages', "兩次密碼輸入不同!")
      return res.redirect('/signup')
    } else {
      User.findOne({ where: { email: req.body.email } }).then(user => {
        if (user) {
          req.flash('error_messages', '信箱重複!')
          return res.redirect('/signup')
        } else {
          User.create({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null)
          }).then(user => {
            req.flash('success_messages', '成功註冊帳號!')
            return res.redirect('/signin')
          })

        }
      })
    }

  },

  signInPage: (req, res) => {
    return res.render('signin')
  },

  signIn: (req, res) => {
    req.flash('success_messages', '成功登入!')
    res.redirect('/restaurants')
  },

  logout: (req, res) => {
    req.flash('success_messages', '登出成功!')
    req.logout()
    res.redirect('/signin')
  }
}


module.exports = userService
