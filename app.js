var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
require('./models/models.js')
var index = require('./routes/index');
var api = require('./routes/api');
var authenticate = require('./routes/authenticate')(passport);
var mongoose = require('mongoose');    
var http = require('http');                   
//localconnect//mongoose.connect('mongodb://localhost/mymeetings');   
//remoteconnect//
mongoose.connect('mongodb://admin:admin@ds047592.mongolab.com:47592/mymeetings');


var app = express(); 

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));

app.use(session({
  secret: 'keyboard cat'
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
app.use('/auth', authenticate);
app.use('/api', api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

//// Initialize Passport
var initPassport = require('./passport-init');
initPassport(passport);

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.set(process.env.PORT || 3000);

var server = http.Server(app);
var io = require('socket.io')(server);

io.on('connection', function(socket){
    socket.on('chat message', function(msg){
      io.sockets.in(msg.room).emit('onMessage', msg);
    });
    socket.on('create', function(room) {
      socket.join(room);
    });
  });


server.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});


module.exports = app;
