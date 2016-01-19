var rfr = require('rfr');
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var Code = require('code');
var expect = Code.expect;
var Promise = require('bluebird');

var Utility = rfr('app/util/Utility');
var logger = Utility.createLogger(__filename);

var Storage = rfr('app/models/Storage.js');
var TestUtils = rfr('test/TestUtils');

lab.experiment('Stream Model Tests', function () {

  var streamDetails = {
    title: 'I am going to dance',
    appInstance: 'appInstance',
    roomId: '123',
  };

  // a more recent stream
  var streamDetails2 = {
    title: 'hello, look at me! More recent!',
    appInstance: 'another appInstance',
    roomId: '546',
    createdAt: new Date('2016-12-12')
  };

  // ended stream
  var streamDetails3 = {
    title: 'this is an ended stream',
    appInstance: 'third appInstance',
    roomId: '555',
    live: false,
    endedAt: new Date('2015-12-25')
  };

  var userDetails = {
    username: 'Alex Chan',
    email: 'alex@gmail.com',
    password: 'secretpass',
  };

  var userDetails2 = {
    username: 'Betty Pro',
    email: 'betty@gmail.com',
    password: 'secretpass',
  };

  lab.beforeEach({timeout: 10000}, function(done) {
    // Delete database, run before every single test
    TestUtils.resetDatabase(done);
  });

  lab.test('Create Stream', function(done) {
    Storage.createUser(userDetails).then(function(user) {
      return user.userId;
    }).then(function(userId) {
      return Storage.createStream(userId, streamDetails);
    }).then(function(stream) {
      expect(stream.title).to.equal('I am going to dance');
      done();
    });
  });

  lab.test('Create Stream with invalid userId', function(done) {
    Storage.createStream('123-123-123', streamDetails).catch(function(err) {
      expect(err.name).to.equal('TypeError');
      expect(err.message).to.equal("Cannot read property 'addStream' of null");
      done();
    });
  });

  lab.test('Get Stream by Id', function(done) {
    Storage.createUser(userDetails).then(function(user) {
      return user.userId;
    }).then(function(userId) {
      return Storage.createStream(userId, streamDetails);
    }).then(function(stream) {
      return Storage.getStreamById(stream.streamId);
    }).then(function(res) {
      expect(res.title).to.equal('I am going to dance');
      done();
    });
  });

  lab.test('Get Stream by invalid streamId', function(done) {
    Storage.createUser(userDetails).then(function(user) {
      return user.userId;
    }).then(function(userId) {
      return Storage.createStream(userId, streamDetails);
    }).then(function(stream) {
      return Storage.getStreamById({streamId: '123-123'});
    }).then(function(res) {
      expect(res).to.be.null();
      done();
    });
  });

  lab.test('Get list of streams', function(done) {
    var userPromise = Storage.createUser(userDetails);
    var userPromise2 = Storage.createUser(userDetails2);

    var streamPromise = userPromise.then(function(user) {
      return Storage.createStream(user.userId, streamDetails3)
        .then(function(stream) {
          return Storage.createStream(user.userId, streamDetails2);
        });
    });

    var streamPromise2 = userPromise2.then(function(user2) {
      return Storage.createStream(user2.userId, streamDetails);
    });

    return Promise.join(streamPromise, streamPromise2,
      function() {
        Storage.getListOfStreams().then(function(res) {
          expect(res[0].title).to.equal('hello, look at me! More recent!');
          expect(res[1].title).to.equal('I am going to dance');
          expect(res[2].title).to.equal('this is an ended stream');
          done();
        });
      });

  });

  lab.test('Update stream details', function (done) {

    var newStreamAttributes = {
      title: 'a new title',
      duration: '100000',
      totalStickers: 203,
      totalViewers: 23123
    };

    Storage.createUser(userDetails).then(function(user) {
      return user.userId;
    }).then(function(userId) {
      return Storage.createStream(userId, streamDetails);
    }).then(function(stream) {
      return Storage.updateStreamAttributes(stream.streamId,
          newStreamAttributes);
    }).then(function(updatedStream) {
      expect(updatedStream.title).to.equal('a new title');
      expect(updatedStream.duration).to.equal('100000');
      expect(updatedStream.totalStickers).to.equal(203);
      expect(updatedStream.totalViewers).to.equal(23123);
      done();
    });
  });

});