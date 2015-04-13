/* global require:false */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserSchema = new Schema({
    id: String,
    id_str: String,
    name: String,
    screen_name: String,
    location: String,
    profile_location: Object,
    url: String,
    description: String,
    protected: Boolean,
    followers_count: Number,
    friends_count: Number,
    listed_count: Number,
    created_at: String,
    favourites_count: Number,
    utc_offset: Number,
    time_zone: String,
    geo_enabled: Boolean,
    verified: Boolean,
    statuses_count: Number,
    lang: String,
    contributors_enabled: Boolean,
    is_translator: Boolean,
    is_translation_enabled: Boolean,
    profile_background_color: String,
    profile_background_image_url: String,
    profile_background_image_url_https: String,
    profile_background_tile: Boolean,
    profile_image_url: String,
    profile_image_url_https: String,
    profile_banner_url: String,
    profile_link_color: String,
    profile_sidebar_border_color: String,
    profile_sidebar_fill_color: String,
    profile_text_color: String,
    profile_use_background_image: Boolean,
    default_profile: Boolean,
    default_profile_image: Boolean,
    following: Object,
    follow_request_sent: Object,
    notifications: Object
});

var TweetSchema = new Schema({
    created_at: Date,
    id: String,
    id_str: String,
    text: String,
    source: String,
    truncated: Boolean,
    in_reply_to_status_id: String,
    in_reply_to_status_id_str: String,
    in_reply_to_user_id: String,
    in_reply_to_user_id_str: String,
    in_reply_to_screen_name: String,
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    geo: Object,
    coordinates: Object,
    place: Object,
    contributors: Object,
    retweet_count: Number,
    favorite_count: Number,
    entities: {
        hashtags: [],
        symbols: [],
        user_mentions: [],
        urls: []
    },
    favorited: Boolean,
    retweeted: Boolean,
    lang: String,
    retweeted_status: {type: Schema.Types.ObjectId, ref: 'Tweet'},
    timestamp_ms: Date
});

UserSchema.virtual('date')
    .get(function() {
        return this._id.getTimestamp();
    });
TweetSchema.virtual('date')
    .get(function() {
        return this._id.getTimestamp();
    });

mongoose.model('User', UserSchema);
mongoose.model('Tweet', TweetSchema);
