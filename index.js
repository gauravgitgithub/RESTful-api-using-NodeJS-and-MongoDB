var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/db');
var User = require('./app/models/user');
var port = process.env.PORT || 5000;
var jwt = require('jwt-simple');


app.use(bodyParser.urlencoded({ extended:false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.use(passport.initialize());

app.get('/', function(req, res) {
    res.send("Server running at https://localhost/"+port)
  });

mongoose.connect(config.database);
require('./config/passport')(passport);

var apiRoutes = express.Router();

var RandomPassword;
var counter = 0;

apiRoutes.post('/signup',function(req,res){
    var RandomPassword = Math.random().toString(36).substring(8);;
    if(!req.body.email ){
        res.json({
            success : false,
            msg : 'Please pass email '
        })
    }
    else{
        var newUser = new User({
            email : req.body.email,
            password : RandomPassword,
            sex : null
        });
        newUser.save(function(err){
            if(err){
                res.json({
                    success: false,
                    msg : 'Email already exists'
                });
            }
            else{
                res.json({
                    success: true,
                    msg : 'User created ',
                    password : RandomPassword
                });
            }

        });
    }

});

apiRoutes.post('/login', function(req,res){
    User.findOne({
        email : req.body.email
    }, function(err, user){
            if(err) throw err;

            if(!user){
                res.json({
                    success: false,
                    msg : 'User not found with this Email'
                });
            }
            else
            {
                user.comparePassword(req.body.password, function(err, isMatch){
                    if(isMatch && !err){
                        var token = jwt.encode(user, config.secret);
                        res.json({
                            success: true,
                            authToken : 'JWT '+token
                        });
                    }
                    else{
                        res.json({
                            success: false,
                            msg : 'Wrong Password'
                        });
                    }
                });
            }
            
    });

});

apiRoutes.get('/info',passport.authenticate('jwt',{ session : false }), function(req,res){
    var token = getToken(req.headers);
    if(token){
        var decode = jwt.decode(token, config.secret);
        User.findOne({
            email : decode.email
        }, function(err, user){
            if(err) {
                res.json({
                    success: false,
                    msg : 'Error Occurred !'
                })
            }
            if(!user){
                res.json({
                    success : false,
                    msg : 'Authentication failed .'
                });
            }
            else{
                res.json({
                    success: true,
                    msg : 'Login Successfull , Welcome '+user.email+'. SEX : '+user.sex
                });
            }
        }
        );
    }else{
        res.json({
            success: false,
            msg : 'Invalid Token .'

        });
    }
});

var getToken = function(headers){
    if(headers && headers.authorization){
        var splitToken = headers.authorization.split(' ');
        if(splitToken.length === 2){
            return splitToken[1];
        }else{
            return null;
        }
    }else{
        return null;
    }

};

apiRoutes.post('/signin', function(req,res){

});

app.use('/api',apiRoutes);

app.listen(port);