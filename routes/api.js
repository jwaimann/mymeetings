var express = require('express');
var router = express.Router();
var mongoose = require( 'mongoose' );
var Post = mongoose.model('Post');
var Topic = mongoose.model('Topic');
var Meeting = mongoose.model('Meeting');
var User = mongoose.model('User');


    //Used for routes that must be authenticated.
function isAuthenticated (req, res, next) {
    // if user is authenticated in the session, call the next() to call the next request handler 
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response objects

    if (req.isAuthenticated()){
        return next();
    }

    // if the user is not authenticated then redirect him to the login page
    return res.redirect('#/login');
};

//Register the authentication middleware
router.use('/posts', isAuthenticated);
router.use('/meetings',isAuthenticated);
router.use('/post',isAuthenticated);
router.use('/topic',isAuthenticated);
router.use('/user',isAuthenticated);


router.route('/post')
.post(function(req,res){
    Meeting.findById(req.body.meeting_id,function(err,meeting){
          if(err)
                res.send(err);
          var post = new Post();
          post.text = req.body.text;
          User.findOne({"_id":req.body.created_by_id},function (err, user) {
            if (err){
                return res.send(500, err);
            }
            post.created_by = user.username;
            meeting.posts.push(post);
            meeting.save(function(err, meeting) {
                if (err){
                    return res.send(500, err);
                }
                return res.json(post);
            });
       });
          
    });  
});

router.route('/topic')
    .post(function(req,res){
        Meeting.findOne({"_id":req.body.meeting_id},function(err,meeting){
              if(err)
                    res.send(err);
              var topic = new Topic();
              topic.text = req.body.text;
              topic.created_by = req.body.created_by;
              meeting.topics.push(topic);
              meeting.save(function(err, meeting) {
                    if (err){
                        return res.send(500, err);
                    }       
                    return res.json(topic);                
              });                    
        });  
    });
    
router.route('/topic/:id')
    .get(function(req, res){
        Meeting.findById(req.params.id,function(err, meeting){
            if(err)
                res.send(err);
            res.json(meeting.topics);
        });
    }); 
    
router.route('/post/:id')
    .get(function(req, res){
        Meeting.findById(req.params.id,function(err, meeting){
            if(err)
                res.send(err);
            res.json(meeting.posts);
        });
    });
    
router.route('/user/:id')
    .get(function(req, res){
        Meeting.findById(req.params.id).
        populate('users').
        exec(function(err, meeting){
            if(err)
                res.send(err);
            res.json(meeting.users);
        });
    });
    

router.route('/user')
.post(function(req,res){
    Meeting.findById(req.body.meeting_id,function(err,meeting){
          if(err)
                res.send(err);
          var current_user = new User();
          User.findOne({"_id":req.body.user_id}, function(err, user){
            if(err)
                res.send(err);
            current_user = user;
            if(meeting.users.indexOf(current_user._id) == -1)
            {
                meeting.users.push(current_user._id);
                meeting.save(function(err, meeting) {
                    if (err){
                        return res.send(500, err);
                    }
                    current_user.meetings.push(meeting._id);
                    current_user.save();
                    return res.json(user);
                });
            }
          });         
    });  
});

//api for all meetings
router.route('/meetings')

    //creates a new meeting
    .post(function(req, res){
       
        var new_meeting = new Meeting();
        new_meeting.name = req.body.name;
        new_meeting.posts = [];
        new_meeting.topics = [];
        new_meeting.users = [];
        var id =req.body.created_by_id;
        User.findOne({"_id":id}, function(err, user){
            if(err)
                res.send(err);

            var current_user = user;
            new_meeting.created_by = current_user.username;
            new_meeting.users.push(current_user._id);
            
            new_meeting.save(function(err, meeting) {
                if (err){
                    console.log(err);
                    return res.send(500, err);
                }
                current_user.meetings.push(meeting._id);
                current_user.save();
                return res.json(meeting);
            });
        });
    });
 
 router.route('/meetings/:user_id')   
    //gets all meetings for specific user
    .get(function(req, res){
        var id =req.params.user_id;
        User.findOne({"_id":id})
        .populate('meetings')
        .exec(function (err, user) {
            if (err){
                return res.send(500, err);
            }
            return res.json(user.meetings);
       });
    });
    
//api for a specfic meeting
router.route('/meetings/:id')
     //gets specified meeting
    .get(function(req, res){
        Meeting.findById(req.params.id)
        .populate('users')
        .exec(function(err, meeting){
            if(err)
                res.send(err);
            res.json(meeting);
        });
    }) 

    //deletes the meeting
    .delete(function(req, res) {
        Meeting.remove({
            _id: req.params.id
        }, function(err) {
            if (err)
                res.send(err);
            res.json("deleted :(");
        });
    });   

//api for all posts
router.route('/posts')

    //creates a new post
    .post(function(req, res){
        var post = new Post();
        post.text = req.body.text;
        post.created_by = req.body.created_by;
        post.save(function(err, post) {
            if (err){
                return res.send(500, err);
            }
            return res.json(post);
        });
    })

    //gets all posts
    .get(function(req, res){
        Post.find(function(err, posts){
            if(err){
                return res.send(500, err);
            }
            return res.send(posts);
        });
    });

//api for a specfic post
router.route('/posts/:id')

    //updates specified post
    .put(function(req, res){
        Post.findById(req.params.id, function(err, post){
            if(err)
                res.send(err);

            post.created_by = req.body.created_by;
            post.text = req.body.text;

            post.save(function(err, post){
                if(err)
                    res.send(err);

                res.json(post);
            });
        });
    })

    //gets specified post
    .get(function(req, res){
        Post.findById(req.params.id, function(err, post){
            if(err)
                res.send(err);
            res.json(post);
        });
    }) 

    //deletes the post
    .delete(function(req, res) {
        Post.remove({
            _id: req.params.id
        }, function(err) {
            if (err)
                res.send(err);
            res.json("deleted :(");
        });
    });


module.exports = router;