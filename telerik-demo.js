Tweets = new Mongo.Collection('tweets');

if (Meteor.isClient) {
  Meteor.subscribe('latest_tweets', function() {
    console.log("subscribed latest tweets");
  })

  Template.tweets.rendered = function() {

    var dataSource = new kendo.data.DataSource({
      pageSize: 3
    });

    $('#tweets').kendoListView({
      dataSource: dataSource,
      template: kendo.template($("#tweet").html())
    });

    $('#pager').kendoPager({
      dataSource: dataSource
    });

    this.autorun(function() {
      var current_values = dataSource.data();
      var updated_values = Tweets.find({}, {sort: {timestamp_ms: -1}}).fetch();


      var current_ids = _.map(current_values, function(x) { return x.id; });
      var updated_ids = _.map(updated_values, function(x) { return x.id; });

      // retrieve new tweets
      // every timw we update the datasource, the telerik listview re-renders itself
      // so we cannot rely on Mutation Observers to detect dom insertions
      // because all nodes in the view are rendered again and therefore they
      // are indeed new nodes for the browser
      // for an overview of Mutation Events: http://updates.html5rocks.com/2012/02/Detect-DOM-changes-with-Mutation-Observers
      var diff = _.difference(updated_ids, current_ids);

      // update dataSource and trigger listview render
      dataSource.data(updated_values);

      // fade in new nodes
      _.each(diff, function(x) {
        $('div[data-twitter-id="'  + x + '"').addClass('fade-in');
      })

    });
  };



  // *** this is what you would normally do to detect dom node insertion!

  // document.addEventListener("DOMNodeInserted", function(event) {
  //   if($(event.target).hasClass("tweet")) {
  //     // a new tweet has been added to the DOM, start fading
  //     event.target.classList.add('fade-in');
  //     // console.warn("Another node has been inserted! ", event, event.target);
  //   }
  // }, false);

  // ***



  // animation is complete, remove class
  var animationListener = function(event){
    if (event.animationName == "fade-in") {
      console.log("remove class fade-in from", event.target);
      // event.target.classList.remove('fade-in');
    }
  }

  // setup listeners for the animationend event
  document.addEventListener("animationend", animationListener, false); // standard + firefox
  document.addEventListener("MSAnimationEnd", animationListener, false); // IE
  document.addEventListener("webkitAnimationEnd", animationListener, false); // Chrome + Safari
}

if (Meteor.isServer) {
  Meteor.startup(function () {

  var t = new TwitMaker({
    consumer_key:          '...'
    , consumer_secret:     '...'
    , access_token:        '...'
    , access_token_secret: '...'
  })

  // var italy = ['6.5711455345', '36.6383507886', '18.6658782959', '47.0952051132'];
  var milan = ['8.9936308861', '45.3026233328', '9.5197601318', '45.6359571671'];
  var stream = t.stream('statuses/filter', { locations: milan, language: 'it' })

  stream.on('tweet', Meteor.bindEnvironment(function (tweet) {
    Tweets.insert(tweet);
  }, function () {
    console.log('Failed to bind environment');
  }));

  Meteor.publish('latest_tweets', function() {
    return Tweets.find({}, {sort: {timestamp_ms: -1}, limit: 30});
  })


  });
}
