var Radiobox2Api = window.Radiobox2Api || {
  data: {
    currentChannelId: 3,
    currentBroadcast: undefined,
    currentTrack: undefined,
    _gettingBroadcastInfo: false, // avoid doing the same request twice and stuff
    currentItems: undefined,
    _gettingCurrentItems: false,
    currentTrack: undefined,
    _gettingCurrentTrack: false,
    full_channels: {},
    channels: {}
  },
};

Radiobox2.getChannels = function() {
  $.get('http://radiobox2.omroep.nl/channel/search.json?q=', function(data) {
    console.dir(data);
    Radiobox2.data.full_channels = {};
    Radiobox2.data.channels = {};
    for (var i in data.results) {
      Radiobox2.data.full_channels[data.results[i].id] = data.results[i];
      Radiobox2.data.channels[data.results[i].id] = data.results[i].name;
    }
    $(document).trigger('Radiobox2.channelsReceived', [data]);    
  }, 'json');
};

Radiobox2Api.getChannelId = function() {
  return Radiobox2Api.data.currentChannelId;
};

Radiobox2Api.setChannelId = function(channelId) {
  Radiobox2Api.data.currentChannelId = channelId;
  // some more stuff needs to happen.. clearing broadcast en track
  $(document).trigger('Radiobox2.channelChanged', [channelId]);
};

Radiobox2Api.getCurrentBroadcast = function() {
  if (Radiobox2Api.data._gettingBroadcastInfo) {
    return;
  }
  Radiobox2Api.data._gettingBroadcastInfo = true;
  $.get(
    "http://radiobox2.omroep.nl/broadcast/search.json?q=channel.id:'" + Radiobox2Api.getChannelId() + "'%20AND%20startdatetime%3CNOW%20AND%20stopdatetime%3ENOW'&order=startdatetime:desc&max-results=5",
    function(data) {
      console.dir(data);
      var broadcast = data.results[0];
      Radiobox2Api.data._gettingBroadcastInfo = false;
      if (typeof(Radiobox2Api.data.currentBroadcast) !== 'undefined') && (broadcast.id == Radiobox2Api.data.currentBroadcast.id) {
        // do nothing?
      } else {
        Radiobox2Api.data.currentBroadcast = broadcast;
        $(document).trigger('Radiobox2.broadcastChanged', [broadcast]);
      }
    }
  , 'json');
};

Radiobox2Api.getCurrentItems = function() {
  if (Radiobox2Api.data._gettingCurrentItems) {
    return;
  }
  Radiobox2Api.data._gettingCurrentItems = true;
  $.get(
    "http://radiobox2.omroep.nl/item/search.json?q=channel.id:'" + Radiobox2Api.getChannelId() + "'%20AND%20startdatetime%3CNOW%20AND%20stopdatetime%3ENOW'&order=startdatetime:desc&max-results=5",
    function(data) {
      console.log('item:');
      console.dir(data);
      Radiobox2Api.data._gettingCurrentItems = false;
      Radiobox2Api.data.currentItems = data.results;
      // FIXME: should compare before calling change event ...
      $(document).trigger('Radiobox2.itemsChanged', [data.results]);
    }
  , 'json');
};

Radiobox2.getCurrentTrack = function() {
  if (Radiobox2Api.data._gettingCurrentTrack) {
    return;
  }
  Radiobox2Api.data._gettingCurrentTrack = true;
  $.get(
    '/channels/' + Radiobox2Api.getChannelId() + '/current_track',
    function(data) {
      console.log('track:');
      console.dir(data);
      Radiobox2Api.data._gettingCurrentTrack = false;
      var track = undefined;
      if (data.results.length > 0) {
        track = data.results[0];
      }
      
      var trackChanged = (typeof(track) != typeof(Radiobox2Api.data.currentTrack)) || (track.id != Radiobox2Api.data.currentTrack.id);
      if (trackChanged) {
        Radiobox2Api.data.currentTrack = track;
        $(document).trigger('Radiobox2.trackChanged', [track]);        
      }
    }
  , 'json');
};

/* Actual app */
var Radiobox2 = window.Radiobox2 || {
  data: {},
};

Radiobox2.init = function() {
  $('#radios select').change(function (what) {
    console.log('something selected!' + $('#radiobox2-form-channel').val());
    Radiobox2.update_radio_info();
    Radiobox2.get_current_broadcast_for_channel(Radiobox2.get_current_channel());
  });
  
  setInterval(function() {
      Radiobox2.time_lapsed();
  }, 10000);
};

Radiobox2.get_current_channel = function() {
  var radioId = parseInt($('#radiobox2-form-channel').val());
  return radioId;
};

Radiobox2.time_lapsed = function() {
    console.log('time lapsed !');
    var channelId = Radiobox2.get_current_channel();
    Radiobox2.get_current_broadcast_for_channel(channelId);
    Radiobox2.get_current_item_for_channel(channelId);
    Radiobox2.get_current_track_for_channel(channelId);
}

Radiobox2.update_radio_info = function() {
  var radioId = parseInt($('#radiobox2-form-channel').val());
  var radioInfo = Radiobox2.data.full_channels[radioId];
  $('#radio-info img').attr('src', radioInfo.image.url);
  $('#radio-info h1').text(radioInfo.name);
  $('#radio-info h3').text(radioInfo.epg_shortdescription);
  $('#radio-info p.description').text(radioInfo.description);
  $('#radio-info p.tags').text(radioInfo.tags);
};

Radiobox2.get_current_broadcast_for_channel = function(channelId) {
  $.get(
    "http://radiobox2.omroep.nl/broadcast/search.json?q=channel.id:'" + channelId + "'%20AND%20startdatetime%3CNOW%20AND%20stopdatetime%3ENOW'&order=startdatetime:desc&max-results=5",
    function(data) {
      console.dir(data);
      var broadcast = data.results[0];
      $('#programme img').attr('src', broadcast.image.url);
      $('#programme-info h2 .title').text(broadcast.name);
      $('#programme-info #programme-description').html(broadcast.description);
      $('#programme-info #programme-start').text(moment(broadcast.startdatetime).fromNow());
      $('#programme-info #programme-end').text(moment(broadcast.stopdatetime).fromNow());

      //$('#presenter img').attr('src', broadcast.image.url);
      $('#presenter h2').text(broadcast.presenter[0].full_name);
      $('#presenter #presenter-description').html(broadcast.presenter[0].biography);

    }
  , 'json');
};

Radiobox2.get_current_item_for_channel = function(channelId) {
  $.get(
    "http://radiobox2.omroep.nl/item/search.json?q=channel.id:'" + channelId + "'%20AND%20startdatetime%3CNOW%20AND%20stopdatetime%3ENOW'&order=startdatetime:desc&max-results=5",
    function(data) {
      console.log('item:');
      console.dir(data);
      var item = data.results[0];
    }
  , 'json');
};

Radiobox2.get_current_track_for_channel = function(channelId) {
  $.get(
    '/channels/' + channelId + '/current_track',
    function(data) {
      console.log('track:');
      console.dir(data);
      if (data.results.length > 0) {
        var item = data.results[0];
        $('#track h1 .glyphicon').removeClass('glyphicon-stop').addClass('glyphicon-play');
        $('#track h1 .artist').text(item.songfile.artist);
        $('#track h1 .title').text(item.songfile.title);
        $('#track .start').text(moment(item.startdatetime).fromNow());
        $('#track .end').text(moment(item.stopdatetime).fromNow());
        Radiobox2.get_current_songfile(item);
      } else {
        $('#track h1 .glyphicon').removeClass('glyphicon-play').addClass('glyphicon-stop');
        $('#track h1 .artist').text('');
        $('#track h1 .title').text('');
        $('#track .start').text('');
        $('#track .end').text('');
        $('.track .player').html('');
        $('#track .player').attr('data-youtube-id', '');
      }
    }
  , 'json');
};

Radiobox2.get_current_songfile = function(track) {
  console.log('track for songfile');
  console.dir(track);
  $.get(
    "http://radiobox2.omroep.nl/songversion/search.json?q=songfile.id:'" + track.songfile.id + "'",
    function (data) {
      if (data.results.length > 0) {
        console.log('got songfile!');
        var songfile = data.results[0];
        console.dir(songfile);
        if ((songfile.youtube_id != '') && ($('#track .player').attr('data-youtube-id') == '')) {
          $.get('/youtube/embed/' + songfile.youtube_id,
            function(data){
              console.log('got youtube data!');
              console.dir(data);
              $('#track .player').attr('data-youtube-id', songfile.youtube_id);
              $('#track .player').html(data.html);
            }
          , 'json');
        } else if ((typeof(songfile.audiofile) !== 'undefined') && (songfile.audiofile.url != '') ){
          // what now?
        }
      } else {
        console.log('got no songfile!');
        $('.track .player').html('');
        $('#track .player').attr('data-youtube-id', '');
      }
    }
  , 'json');  
};

Radiobox2.get_channels = function() {
  $.get('http://radiobox2.omroep.nl/channel/search.json?q=', function(data) {
    console.dir(data);
    Radiobox2.data.full_channels = {};
    Radiobox2.data.channels = {};
    for (var i in data.results) {
      Radiobox2.data.full_channels[data.results[i].id] = data.results[i];
      Radiobox2.data.channels[data.results[i].id] = data.results[i].name;
      if (data.results[i].type == "main") {
        $('#radios select').append(
        $('<option value="' + data.results[i].id + '">' + data.results[i].name + '</option>'));
      }
    }
  }, 'json');
}

$(document).ready(function() {
  console.log('hoi');
  Radiobox2.init();
  Radiobox2.get_channels();
});
