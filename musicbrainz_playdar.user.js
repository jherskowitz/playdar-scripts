// ==UserScript==
// @name           Musicbrainz playdar
// @namespace      http://alastair.githib.com
// @include        http://musicbrainz.org/release/*
// ==/UserScript==


function load_script (url) {
    // Load the playdar.js
    var s = document.createElement('script');
    s.src = url;
    document.getElementsByTagName("head")[0].appendChild(s);
}
var playdar_web_host = "www.playdar.org";
// same js is served, this is just for log-grepping ease.
load_script('http://' + playdar_web_host + '/static/playdar.js?greasemonkey');
load_script('http://' + playdar_web_host + '/static/soundmanager2-nodebug-jsmin.js?greasemonkey');

function GM_wait() {
    Playdar = unsafeWindow.Playdar;
    soundManager = unsafeWindow.soundManager;
    if (typeof Playdar == 'undefined' || typeof soundManager == 'undefined') {
        window.setTimeout(GM_wait, 100); 
    } else { 
        setup_playdar();
    }
}
GM_wait(); // wait for playdar.js to load.

function setup_playdar () {
    Playdar.setup({
        name: "Musicbrainz Greasemonkey",
        website: "http://musicbrainz.org",
        receiverurl: ""
    });
    var listeners = {
	    onStat: function (detected) {
		    if (detected) {
		        console.debug('Playdar detected');
		    } else {
		        console.debug('Playdar unavailable');
		    }
	    },
	    onAuth: function () {
            console.debug('Access to Playdar authorised');
            do_search();
	    },
	    onAuthClear: function () {
            console.debug('User revoked authorisation');
	    }
    };

    Playdar.client.register_listeners(listeners);
    
    soundManager.url = 'http://' + playdar_web_host + '/static/soundmanager2_flash9.swf';
    soundManager.flashVersion = 9;
    soundManager.onload = function () {
        Playdar.setup_player(soundManager);
        Playdar.client.init();
        console.debug("soundmanager loaded");
    };

};

function start_status (qid, node) {
    var status = document.createElement('span');
    status.id = qid;
    status.style.border = 0;
    status.style.margin = "0 0 0 0";
    status.style.backgroundRepeat = "no-repeat";
    status.style.backgroundImage = 'url("http://' + playdar_web_host + '/static/spinner_10px.gif")';
    status.style.color = "#fff";
    status.style.width = "13px";
    status.style.height = "13px";
    status.style.textAlign = "center";
    status.style.fontSize = "9px";
    status.innerHTML = "&nbsp; &nbsp;";
    
    var parent = node.parentNode;
    parent.insertBefore(status, node);
}

function do_search () {
    var artist = document.getElementsByClassName("artisttitle")[0];
    var release = document.getElementsByClassName("releasebegin")[0];

    var artistName = artist.children[0].children[0].children[1].children[0].innerHTML;
    var releaseName = release.children[0].children[0].children[0].children[0].children[0].innerHTML;
    console.debug(artistName);
    console.debug(releaseName);

    var tracks = document.getElementsByClassName("track");
    for (var i = 0; i < tracks.length; i++) {
        t = tracks[i];
        var anchor = t.children[1].children[0];
        var trackName = anchor.innerHTML
        var qid = Playdar.Util.generate_uuid();
        start_status(qid, anchor);
        Playdar.client.register_results_handler(results_handler, qid);
        Playdar.client.resolve(artistName, releaseName, trackName, qid);
    }
};

var results_handler = function (response, final_answer) {
    if (final_answer) {
        if (response.results.length) {
            var element = document.getElementById(response.qid);
            var sid = response.results[0].sid;
            Playdar.player.register_stream(response.results[0]);
            element.style.backgroundImage = 'none';
            element.innerHTML = "<a href=\"#\">♫&nbsp;</a>";
            element.addEventListener('click', function(event) {
                Playdar.player.play_stream(sid);
                event.stopPropagation();
                event.preventDefault();
            }, true);
        }
    }
};
 