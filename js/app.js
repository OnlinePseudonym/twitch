const ROOT_URL = 'https://api.twitch.tv/helix';
const CLIENT_ID = '7x4y0srzfv2bitgk1p32uhps75lbkd'

const defaultStreamers = ["esl_sc2", "ogamingsc2", "freecodecamp", "habathcx", "shroud", "drdisrespectlive", "ninja", "loltyler1", "lirik", "beyondthesummit" ];

async function fetchUrl(type, query, id = defaultStreamers) {
  const arg = id.map(streamer => `${query}=${streamer}&`).join('');
  const url = `${ROOT_URL}/${type}?${arg}`;
  const data = await (await fetch(url, {
    method: 'GET',
    headers: {
      'Client-ID': CLIENT_ID,
    },
  })).json();
  return data;
}

function openTwitch() {
  url = `https://www.twitch.tv/${this.innerText}`;
  window.open(url);
}

function addOnClickLinks() {
  const names = document.querySelectorAll('.streamer__name');
  names.forEach(name => name.addEventListener('click', openTwitch));
}

function displayStreamers(arr) {
  const streamers = document.querySelector('.streamers');
  const markup = arr.map(entry => {
    let status = '';
    let streamerOutput = entry.stream
      ? (status = ' online', `<div class="streamer__game">
        <h3 class="streamer__game--title">- ${entry.game.name}</h3>
        <img class="streamer__game--pic" src="${entry.game.box_art_url.replace('{width}','40').replace('{height}','40')}" />
      </div>`)
      : '';
    return `
      <div class="streamer">
        <img class="streamer__pic" src="${entry.user.profile_image_url}"/>
        <div class="streamer__details">
          <h2 class="streamer__name">${entry.user.display_name}</h2>
          ${streamerOutput}
          <div class="led ${status}"></div>
          <p class="streamer__desc">${entry.user.description}</p>
        </div>
      </div>`;
  });
  streamers.innerHTML = markup.join('');
  addOnClickLinks();
}

async function fetchStreamers() {
  const userData = await fetchUrl('users', 'login');
  const streamData = await fetchUrl('streams', 'user_login');
  
  const inactiveUsers = userData.data.filter(el => {
    return !streamData.data.some(f => {
      return f.user_id === el.id;
    })
  }).map(user => {
    return {
      user : user,
    }
  });
  
  const activeUsers = await Promise.all(userData.data
    .filter(el => {
    return streamData.data.some(f => {
      return f.user_id === el.id;
    })
  }).map(user => {
    let obj = {};
    streamData.data.forEach(stream => {
      if (stream.user_id === user.id) {
        obj = {
          user: user,
          stream: stream,
        }
      }
    })
    return obj
  }).map(async user => {
    return {
      user: user.user,
      stream: user.stream,
      game: await fetchUrl('games', 'id', [user.stream.game_id]),
    };
  }))
  
  const finalArray = activeUsers.map(user => {
    return {
      user: user.user,
      stream: user.stream,
      game: user.game.data[0],
    }
  });

  const output = [...finalArray,...inactiveUsers];
  displayStreamers(output);
}

fetchStreamers();
