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
      $('#programme h1').text(broadcast.name);
      $('#programme #programme-description').html(broadcast.description);
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
