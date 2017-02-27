'use strict';

var Https = require('https');
var config = require('./config');

var projectIds = config.projectIds;

getProjectStories(projectIds);

function getProjectStories(projectIds) {
  projectIds.forEach(function (projectId) {
    getStories(projectId)
      .then(function (stories) {
        followStories(stories);
      })
      .catch(console.error);
  });
}

function followStories(stories) {
  stories.forEach(function (story) {
    follow(story, "SH");
  });
}

function follow(story, followerName) {
  let currentFollowers = story.follower_ids;
  let following = false;

  currentFollowers.forEach(function (currentFollowerId) {
    if (config.membersByID[currentFollowerId] == followerName) {
      following = true;
    }
  });

  if (!following) {
    console.log('Please follow', story.name);
    req(story, config.membersByName[followerName])
      .then(function (story) {
        console.log("Followed: ", story.name);
      })
      .catch(console.error);
  } else {
    console.log('Already following', story.name);
  }
}

function req(story, followerId) {
  var payload = {follower_ids: [followerId]};
  var requestOptions = {
    host: config.host,
    path: config.api + '/projects/' + story.project_id +
    '/stories/' + story.id,
    method: 'PUT',
    headers: {
      'X-TrackerToken': config.apiToken,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(JSON.stringify(payload))
    }
  };

  return new Promise(function (resolve, reject) {
    var data = '';
    var req = Https.request(requestOptions, function (res) {
      res.setEncoding('utf8');

      res.on('data', function (chunk) {
        data += chunk;
      });

      res.on('end', function () {
        resolve(JSON.parse(data));
      });
    });

    req.on('err', reject);
    req.end(JSON.stringify(payload));
  });
}


function getStories(projectId) {
  var requestOptions = {
    host: config.host,
    path: config.api + '/projects/' + projectId +
    '/search?fields=stories(stories(follower_ids,project_id,name))&query=owner%3AMA',
    //owner%3AMA%20or%20owner%3AAA',
    method: 'GET',
    headers: {
      'X-TrackerToken': config.apiToken
    }
  };

  return new Promise(function (resolve, reject) {
    var data = '';
    var req = Https.request(requestOptions, function (res) {
      res.setEncoding('utf8');


      res.on('data', function (chunk) {
        data += chunk;
      });

      res.on('end', function () {
        resolve(JSON.parse(data).stories.stories);
      });
    });
    req.end();

    req.on('err', reject);
  });
}