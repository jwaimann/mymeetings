var app = angular.module('mymeetingsApp', ['ngRoute', 'ngResource', 'luegg.directives']).run(function ($rootScope) {
  $rootScope.authenticated = false;
  $rootScope.current_user = '';
  $rootScope.current_user_id = '';

  $rootScope.signout = function () {
    $http.get('auth/signout');
    $rootScope.authenticated = false;
    $rootScope.current_user = '';
    $rootScope.current_user_id = '';
  };
});

app.config(function ($routeProvider) {
  $routeProvider
    .when('/meetings', {
        templateUrl: 'main.html',
        controller: 'meetingsController'
    })
    .when('/meetings/:id', {
        templateUrl: 'meeting.html',
        controller: 'mainController'
    })
    .when('/login', {
        templateUrl: 'login.html',
        controller: 'authController'
    })
    .when('/register', {
        templateUrl: 'register.html',
        controller: 'authController'
    });
});

app.factory('postService', function ($resource) {
  return $resource('/api/posts/:id');
});

app.factory('messageService', function ($resource) {
  return $resource('/api/post/:id');
});

app.factory('userService', function ($resource) {
  return $resource('/api/user/:id');
});

app.factory('topicService', function ($resource) {
  return $resource('/api/topic/:id');
});

app.factory('meetingService', function ($resource) {
  return $resource('/api/meetings/:id');
});

app.factory('meetingsService', function ($resource) {
  return $resource('/api/meetings/:user_id');
});

app.controller('meetingsController', function (meetingsService, meetingService, $scope, $rootScope, $routeParams) {
  $scope.meetings = meetingsService.query({ user_id: $rootScope.current_user_id });

  $scope.post = function () {
        $scope.newMeeting.created_by = $rootScope.current_user;
        $scope.newMeeting.created_by_id = $rootScope.current_user_id;
        $scope.newMeeting.created_at = Date.now();
        meetingService.save($scope.newMeeting, function () {
	     $scope.meetings = meetingsService.query({ user_id: $rootScope.current_user_id });
        });
        $scope.newMeeting = { created_by: '', name: '', created_at: '' };
    };
});


app.controller('mainController', function (postService, userService, topicService, messageService, $scope, $rootScope, $routeParams) {
  $scope.meeting_id = $routeParams.id;
  $scope.posts = messageService.query({ id: $scope.meeting_id });
  $scope.todos = topicService.query({ id: $scope.meeting_id });
  $scope.users = userService.query({ id: $scope.meeting_id });
    $scope.newPost = { created_by: '', text: '', created_at: '' };
  $scope.newTodo = { created_by: '', text: '', created_at: '', done: false };

  var socket = io.connect();

  /*if($rootScope.current_user_id != ''){
    var user = {user_id : $rootScope.current_user_id , meeting_id : $scope.meeting_id};
    userService.save(user, function(res){
       socket.emit('new user',  res);
    });
  }*/

  socket.on('chat message', function (msg) {
    $scope.posts.push(msg);
    $scope.$apply();
  });

  socket.on('topic message', function (msg) {
    $scope.todos.push(msg);
    $scope.$apply();
  });
  
  /*socket.on('new user', function(msg){
	     $scope.users.push(msg);
       $scope.$apply();  
  });*/

    $scope.post = function () {
      $scope.newPost.created_by = $rootScope.current_user;
      $scope.newPost.created_by_id = $rootScope.current_user_id;
      $scope.newPost.created_at = Date.now();
      $scope.newPost.meeting_id = $scope.meeting_id;
  
      messageService.save($scope.newPost, function (res) {
              socket.emit('chat message', res);
              $scope.newPost = { created_by: '', text: '', created_at: '' };
      });
    };

  $scope.addTodo = function () {
    $scope.newTodo.created_by = $rootScope.current_user;
    $scope.newTodo.created_by_id = $rootScope.current_user_id;
    $scope.newTodo.created_at = Date.now();
    $scope.newTodo.done = false;
    $scope.newTodo.meeting_id = $scope.meeting_id;

    topicService.save($scope.newTodo, function (res) {
            socket.emit('topic', res);
            $scope.newTodo = { created_by: '', text: '', created_at: '', meeting_id: '', done: false };
    });
  };

  /*$scope.toggleSync = function (item) {
        socket.emit('topic changed', '');
  };*/
});



app.controller('authController', function ($scope, $http, $rootScope, $location) {
  $scope.user = { username: '', password: '' };
  $scope.error_message = '';

  $scope.login = function () {
    $http.post('/auth/login', $scope.user).success(function (data) {
      if (data.state == 'success') {
        $rootScope.authenticated = true;
        $rootScope.current_user = data.user.username;
        $rootScope.current_user_id = data.user._id;
        $location.path('/meetings');
      }
      else {
        $scope.error_message = data.message;
      }
    });
  };

  $scope.register = function () {
    $http.post('/auth/signup', $scope.user).success(function (data) {
      if (data.state == 'success') {
        $rootScope.authenticated = true;
        $rootScope.current_user = data.user.username;
        $rootScope.current_user_id = data.user._id;
        $location.path('/meetings');
      }
      else {
        $scope.error_message = data.message;
      }
    });
  };
});