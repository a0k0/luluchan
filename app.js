require('dotenv').config();
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const champion_data = require("./champion_data.json");
const RIOT_API_KEY = process.env.RIOT_API_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const region = "jp1";

var http = require('http'); //httpモジュール呼び出し
// http.createServer(function (request, response) {
//   // リクエストを受けると以下のレスポンスを送信する
//   response.writeHead(200, {'Content-Type': 'text/plain'}); //レスポンスヘッダーに書き込み
//   response.end('Hello World\n'); // レスポンスボディに書き込み＆レスポンス送信を完了する
// }).listen(process.env.PORT || 8080); //公開ポートで待ち受け

var server = http.createServer();
server.on('request', doRequest);

var fs = require('fs');
function doRequest(req, res) {
  fs.readFile('./index.html', 'utf-8' , doReard );
  function doReard(err, data) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    res.end();
  }
}

server.listen(process.env.PORT || 8080);

client.on("ready", () => {
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  client.user.setGame(`on ${client.guilds.size} servers`);
});

client.on("guildCreate", guild => {
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setGame(`on ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setGame(`on ${client.guilds.size} servers`);
});


client.on("message", async message => {
  if(message.author.bot) return;
  if(message.content.indexOf(config.prefix) !== 0) return;
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // if(command === "ping") {
  //   const m = await message.channel.send("Ping?");
  //   m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  // }

  // if(command === "lulu 身内") {
  //   console.log("身内のげーむをみるよ！");
  //   checkMiuchiStatus(message);
  // }

  if(command === "lulu") {
    const summonerName = args.join(" ");
    if (summonerName == "かわいい") {
      var messages = [
        "おあいできて光栄ですわ！",
        "チューリップのめをみちゃだめよ。",
        "どこかで会ったかしら？",
        "はわわ・・・めがまわる・・・",
        "あ、ちょうちょ！",
        "だいへんしーん！",
        "あわわわわ！",
        "ひらめいた！"
      ];
      message.channel.send(messages[ Math.floor( Math.random() * messages.length ) ]);
    }　else if (summonerName) {
      checkSummonerStatus(summonerName, message);
    } else {
      message.channel.send("るるちゃんは見ているよ！");
    }
  }

  if(command === "lulusay") {
    const sayMessage = args.join(" ");
    message.delete().catch(O_o=>{});
    message.channel.send(sayMessage);
  }
});


client.login(DISCORD_TOKEN);






//現在のゲーム情報をDiscordに投稿する
function postCurrentGameData(data, name, summoner_data, message) {
  var game_id = data.gameId;
  //var last_game_row = log_sheet.getLastRow();

  //既に投稿されていないか確認
  //if (!findRow(log_sheet, game_id, 1)) {
  var mode = data.gameMode;
  var length = Math.ceil(data.gameLength / 60);
  var participants = data.participants;

  var team_a_string = '';
  var team_b_string = '';
  var body = '';

  var complete_count = 0;
  var max_complete_count = participants.length;


  //サモナーごとに名前を取得(10人)
  for(var i in participants) {
    var p = participants[i];
    createPersonalData(p, function(personalData) {

      var p_name = personalData.p_name;
      var p_champion = personalData.p_champion;
      var p_team = personalData.p_team;
      var p_id = personalData.p_id;
      var p_rate_data = personalData.p_rate_data;
      var p_rate = personalData.p_rate;

      if (p_team == "100") { team_a_string += p_champion + " (" + p_name + " / " + p_rate + ")　\n"; }
      else { team_b_string += p_champion + " (" + p_name + " / " + p_rate + ")　\n"; }

      complete_count++;
      if(complete_count === max_complete_count) {
        after_complete(summoner_data, name, mode, length, team_a_string, team_b_string, message);
      }
    });
  }
}

function createPersonalData(participant, onCreate) {
  var p_name = participant.summonerName;
  var p_name_encoded = encodeURIComponent(participant.summonerName);
  var p_champion = getChampionName(participant.championId);
  var p_team = participant.teamId;
  accessGetSummonerInfo(p_name_encoded, function(summoner_data) {
    var p_id = summoner_data.id;
    accessGetSummonerRate(p_id, function(summoner_rate) {
      var p_rate_data = summoner_rate[0];
      var p_rate = "";
      if (p_rate_data) {
        var p_tier = p_rate_data.tier;
        var p_rank = p_rate_data.rank;

        switch(p_tier) {
          case "BRONZE": p_tier = "B"; break;
          case "SILVER": p_tier = "S"; break;
          case "GOLD": p_tier = "G"; break;
          case "PLATINUM": p_tier = "P"; break;
          case "DIAMOND": p_tier = "D"; break;
          case "MASTER": p_tier = "M"; break;
          case "CHALLENGER": p_tier = "C"; break;
          default: break;
        }

        switch(p_rank) {
          case "V": p_rank = "5"; break;
          case "IV": p_rank = "4"; break;
          case "III": p_rank = "3"; break;
          case "II": p_rank = "2"; break;
          case "I": p_rank = "1"; break;
          default: break;
        }
        p_rate = p_tier + p_rank;
      }
      else { p_rate = "NoRank" }

      var createData = {
        "p_name": p_name,
        "p_champion": p_champion,
        "p_team": p_team,
        "p_id": p_id,
        "p_rate_data": p_rate_data,
        "p_rate": p_rate
      }

      onCreate(createData);
    });
  });
}


function after_complete(summoner_data, name, mode, length, team_a_string, team_b_string, message) {
  //本文を作成
  var icon_id = summoner_data.profileIconId;
  var embed = {
    "color": 13015781,
    "footer": {
      "text": length + "分前に開始",
    },
    "author": {
      "name": summoner_data.name + "さんがゲーム中です🎮　(" + mode + ")",
      "url": "https://jp.op.gg/summoner/userName=" + name,
      "icon_url": "http://ddragon.leagueoflegends.com/cdn/7.16.1/img/profileicon/" + icon_id + ".png"
    },
    "fields": [
      {
        "name": "Blue side",
        "value": team_a_string,
        "inline": true
      },{
        "name": "Red side",
        "value": team_b_string,
        "inline": true
      },
    ]
  };

  //post
  sendToDiscord(embed, message);

  //投稿したゲームのIDをスプレッドシートに記入（重複防止用）
  //var range = log_sheet.getRange(last_game_row + 1, 1);
  //range.setValue(game_id);
//}

// else {
//   //そのゲームはもう投稿したよ。
//   console.log('done');
// }
}


//Discordに投稿する
function sendToDiscord(embed, message) {
  message.channel.send({ "embed": embed })
  .then(message => console.log(`Send: ${embed}`))
  .catch(console.error);
}



//Championの情報を公式からコピー（1日1回）
//毎回API叩こうとしたら制限にひっかかった…
//データをしまうとこがないのでうごいてないよ
function saveStaticApi() {
  var url = "static-data/v3/champions";
  var api = "https://";
  api += region;
  api += ".api.riotgames.com/lol/";
  api += url;
  api += "?locale=ja_JP";
  api += "&api_key=" + RIOT_API_KEY;

  var option = {
    'method' : 'get',
    'contentType' : 'application/json; charset=utf-8'
  };
  //var response = UrlFetchApp.fetch(api, {'muteHttpExceptions': true});
  var json = response.getContentText();
  var data_value = data_range.setValue(json);
}


function checkSummonerStatus(name, message) {
  accessGetSummonerInfo(encodeURIComponent(name), function(summoner_data) {
    var summoner_id = summoner_data.id;
    accessGetSummonerCurrentGame(summoner_id, function(currentGame_data) {
      var status = currentGame_data.status;
      if (status) {
        console.log(status.status_code + ":" + status.message);
        if (status.status_code == "404"){
          message.channel.send(name + "さんは、いまゲームしてないみたい！");
        } else if (status.status_code == "400"){
          message.channel.send(name + "さんは、さもなーじゃないみたい！");
        }　else if (status.status_code == "429"){
          message.channel.send("えーぴーあいの制限にひっかかっちゃった・・・");
        }　else if (status.status_code == "403"){
          message.channel.send("るるちゃんにはけんげんがないみたい！");
        }　else if (status.status_code == "403"){
          message.channel.send("るるちゃんにはけんげんがないみたい！");
        } else {
          message.channel.send(status.status_code + "ばんのえらーみたい！");
        }
      }
      else {
        postCurrentGameData(currentGame_data, encodeURIComponent(name), summoner_data, message);
      }
    });
  });
}


function checkMiuchiStatus(message) {
  for (i in miuchi) {
    var name = miuchi[i];
    accessGetSummonerInfo(name, function(summoner_data) {
      var summoner_id = summoner_data.id;
      accessGetSummonerCurrentGame(summoner_id, function(currentGame_data) {
        var status = currentGame_data.status;
        if (status) {
          if (status.status_code == "404"){
            console.log(status.message); //ゲームがないよ
          } else {
            console.log(currentGame_data); //なんかのエラーっぽいよ
          }
        }
        else {
          postCurrentGameData(currentGame_data, name, summoner_data, message);
        }
      });
    });
  }
}

//inGame?
function accessGetSummonerCurrentGame(summonerId, onSuccess) {
  var url = "spectator/v3/active-games/by-summoner/" + summonerId;
  accessLolApi(url, onSuccess);
}

//Summoner名から情報を割り出す
function accessGetSummonerInfo(name, onSuccess) {
  var url = "summoner/v3/summoners/by-name/" + name;
  accessLolApi(url, onSuccess);
}

//SummonerIDからレートを割り出す
function accessGetSummonerRate(summonerId, onSuccess) {
  var url = "league/v3/positions/by-summoner/" + summonerId;
  accessLolApi(url, onSuccess);
}

//ChampionIDからChampの名前を割り出す
function getChampionName(champion_id) {
  var data = Object.keys(champion_data.data).map(function (key) {return champion_data.data[key]});
  var champion = data.filter(function(item, index){return (item.id == champion_id);});
  var name = champion[0].name;
  return name;
}

function accessLolApi(url, onSuccess) {
    var api = "https://";
    api += region;
    api += ".api.riotgames.com/lol/";
    api += url;
    api += "?locale=ja_JP";
    api += "&api_key=" + RIOT_API_KEY;

    var request = require('request');
    request.get({
      "url": api,
      "json": true
    }, function (error, response, body) {
      if(onSuccess) {
        onSuccess(body);
      }
    });
}
