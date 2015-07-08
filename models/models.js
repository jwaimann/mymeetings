var mongoose = require('mongoose');
var uuid = require('uuid');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    _id: String,
    username: String,
    password: String, //hash created from password
    created_at: {type: Date, default: Date.now},
    meetings: [{ type: String, ref: 'Meeting' }]
}).pre('save', function (next) {
    if (this._id === undefined) {
        this._id = uuid.v1();
    }
    next();
});

var postSchema = new Schema({
    created_by: String,
    created_at: {type: Date, default: Date.now},
    text: String
});

var topicSchema = new Schema({
    _id: String,
    created_by: String,
    created_at: {type: Date, default: Date.now},
    text: String,
    done: {type: Boolean, default: false},
});

var meetingSchema = new Schema({
    _id: String,
    created_by:  { type: String, ref: 'User' },
    created_at: {type: Date, default: Date.now},
    name: String,
    identifier: String,
    posts: [postSchema],
    topics: [topicSchema],
    users: [{ type: String, ref: 'User' }]
}).pre('save', function (next) {
    if (this._id === undefined) {
        this._id = uuid.v1();
    }
    next();
});

mongoose.model('Meeting', meetingSchema);
mongoose.model('Topic', topicSchema);
mongoose.model('Post', postSchema);
mongoose.model('User', userSchema);
