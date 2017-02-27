'use strict';

var Https = require('https');
var config = require('./config');

var projectIds = config.projectIds;

getProjectStories(projectIds)
  .then(followStories);

function buildOwnerQueryString() {
  let owners = config.searchByOwners;
  let queryStr = '';
  for(let i = 0; i < owners.length; ++i) {
    if(i > 0) {
      queryStr += '%20' + config.searchCondition + '%20';
    }
    queryStr += 'owner%3A' + owners[i];
  }
  return queryStr;
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
    console.log('Please follow: ', story.name);
    updateFollower(story, config.membersByName[followerName])
      .then(function (story) {
        console.log("Followed: ", story.name);
      })
      .catch(console.error);
  } else {
    console.log('Following: ', story.name);
  }
}

function followStories(stories) {
  stories.forEach(function (story) {
    follow(story, config.follower);
  });
}

function getStories(projectId) {
  var requestOptions = {
    host: config.host,
    path: config.api + '/projects/' + projectId +
    '/search?fields=stories(stories(follower_ids,project_id,name))&query=' + buildOwnerQueryString(),
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

function getProjectStories(projectIds) {
  let promises = [];
  projectIds.forEach(function (projectId) {
    promises.push(getStories(projectId));
  });

  return Promise.all(promises)
    .then(function (storiesArray2d) {
      let allStories = [];
      storiesArray2d.forEach(function (stories) {
        allStories = allStories.concat(stories);
      });
      return allStories;
    })
}

function updateFollower(story, followerId) {
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