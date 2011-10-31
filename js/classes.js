MB = {
	lists: {},
	current: null,
	artist: null,
	user: null,
	
	init: function(){
		var lists = localStorage.getObject('lists');
		var load = false;
		
				
		if (location.hash.length > 0) {
			var id = location.hash.replace('#','');
			this.getServerList(id);
		}	else {
			for(var i in lists) {
				if (lists.hasOwnProperty(i)) {
					var l = this.add(lists[i].name);
					l.artists = lists[i].artists;
					if (!load) {
						load = true;
						this.select(l.id);
					}
				}
			}
		}
		
		if (!load && location.hash.length == 0) {
			var l = this.add('Default');
			this.select(l.id);
		} 
		
		this.user = localStorage.getItem('user') || 'Pokki-User';
	},
	
	setUser: function(user) {
	   this.user = user;
	   localStorage.setItem('user', user);
	},
	
	add: function(name){
		var list = List.create(name);
		this.lists[list.id] = list;
		
		$('.lists').append('<a href="#" data-id="'+list.id+'">'+list.name+'</a>');
		return list;
	},
	
	remove: function(id){
		delete this.lists[id];
		
		$('.lists').find('a[data-id="'+MB.current+'"]').remove();
		if (id == this.current) {
			this.current = null;
			$('.list-select').text('Select playlist');
			$('.library .artists, .tracks').empty();
		}		
	},
	
	rename: function(id, name){
		this.lists[id].setName(name);
		$('.lists').find('a[data-id="'+MB.current+'"]').text(name);
	},
	
	loadFile: function(){
		
	},
	
	loadSystem: function(){
		
	},
	
	loadText: function(txt) {
		var str = txt.split('\n');
		var art = null;
		var songs = [];
		for(var i=0; i < str.length; i++) {
			var txt = str[i].replace(/\.mp3/g,'');
			var s = txt.split(' - ');
			var artist = s == null ? txt : s[0];
			
			if (art != null && art != artist) {
				this.lists[this.current].addTracks($.trim(art), songs);
				art = artist;
				songs = [];
			}
			art = artist;
			if (s != null && s[1] && s[1] != '')
				songs.push(s[1]);
		}
		this.lists[this.current].addTracks(art, songs);
		this.lists[this.current].renderArtists();
	},
	
	loadServer: function(dlg){
		dlg.html('<div id="loadServer"><h3>Select playlist to load below</h3></div>');
		$.get('http://music.airy.me/server.php?do=getLists', function(r){
			var lists = JSON.parse(r);
			for(var i=0; i<lists.length; i++) {
				if (lists[i] == '.' || lists[i] == '..' || lists[i] == '.svn') continue;
				dlg.find('#loadServer').append('<a href="#" rel="'+lists[i]+'">'+lists[i]+'</a>');
			}
			$('#loadServer a').click(function(){
				dlg.dialog('close');
				var id = $(this).attr('rel');
				MB.getServerList(id);
			});
		});
	},
	
	getServerList: function(id) {
		$.post('http://music.airy.me/server.php?do=loadList',{id:id},function(r){
			if (r == 'error') return;
			var lists = JSON.parse(r);
			for(var i in lists) {
				if (i == 'list_name' || !lists.hasOwnProperty(i)) continue;
				var l = MB.add(lists[i].name);
				l.artists = lists[i].artists;
				if (MB.current == null) MB.select(l.id);
			}
			$.jGrowl("Added playlists");
			lbar.update();
		});	
	},
	
	saveFile: function(){
		
	},
	
	saveLocal: function(){
		localStorage.setObject('lists', this.lists);
		$.jGrowl("Saved playlists!");
	},
	
	saveServer: function(){
		var lists = {};
		for (var k in MB.lists) {
			if (MB.lists.hasOwnProperty(k))
				lists[k] = {};
				lists[k].name = MB.lists[k].name;
				lists[k].artists = MB.lists[k].artists;
		}
		lists.list_name = this.user;
		$.post('http://music.airy.me/server.php?do=saveList', lists, function(r){
			if (r == 'OK')
				$.jGrowl("Saved playlists to server!");
			else
				console.log(r);
		});	
			
		
	},
	
	// rendering
	
	select: function(id){
		this.current = id;
		this.renderArtists();
		$('.tracks').empty();
		$('.list-select').text(this.lists[id].name);		
		$('#playlist').fadeIn();
	},
	
	renderArtists: function(){
		this.lists[this.current].renderArtists();
		lbar.update();
	},
	
	renderTracks: function(id){
		this.artist = id;
		$('.tracks').empty();
		if (id == '_SHOW_ALL') {
			$('#playlist .actions span').removeClass('active').filter('.playlist').addClass('active');
			for(var i in this.lists[this.current].artists) {
				if (this.lists[this.current].artists.hasOwnProperty(i))
					this.lists[this.current].renderTracks(i);
			}
			sbar.update();
		} else {
			if (typeof this.lists[this.current].artists[id] != 'undefined') {
				this.lists[this.current].renderTracks(id);
				$('#playlist .actions span').removeClass('active').filter('.playlist').addClass('active');
				sbar.update();
			}
			else
				LAST.getTopTracks(id);
		} 
		// if show all - for each artist - render tracks
		
	},
	
	addTrack: function(a, t) {
		this.lists[this.current].addTrack(a, t);
	},
	
	delArtist: function(a) {
		this.lists[this.current].delArtist(a);
		//this.renderArtists();
		if (this.artist == a) {
			$('.tracks').empty();
		}
	},
	
	delTrack: function(row) {
		this.lists[this.current].delTrack(row.data('artist'), row.data('title'));
	},
	
	addSource: function(a, t, s, d) {
		this.lists[this.current].addSource(a, t, s, d);
	}
	
	
	
	
}

List = {
	id: null,
	name: null,
	artists: {},
		
	create:	function(name){
		var l = $.extend(true, {}, this); 
		l.setName(name);
		do {
			l.id = 'playlist' + Math.floor(Math.random()*10000).toString();
		} while (typeof MB.lists[l.id] !== 'undefined')
		return l;
	},
	
	setName: function(n){
		if (n == '') n = 'changeme';
		this.name = n.substring(0,15).toLowerCase();
		return this;
	},
	
	addArtist: function(a){
		this.artists[a] = {};
		this.artists[a].name = a;
		this.artists[a].tracks = [];
	},
	
	addTracks: function(a, t) {
		if (!this.artists[a]) this.addArtist(a);
		for(var i in t) {
			this.artists[a].tracks.push({title: $.trim(t[i]), artist:a});
		}
	},
	
	addTrack: function(a, t) {
		if (!this.artists[a]) this.addArtist(a);
		this.artists[a].tracks.push({title:t, artist:a});
	},
	
	delArtist: function(a) {
		delete this.artists[a];
	},
	
	delTrack: function(a, t) {
		this.artists[a].tracks.splice(this.getTrack(a, t),1);
	},
	
	renderArtists: function() {
		if (this.artists.length == 0) return;
		
		$('.library .artists').html('<a href="#" rel="_SHOW_ALL">All Artists</a>');
		var sorted = [];
		for(var i in this.artists) {
			sorted.push(this.artists[i].name);
		}
		sorted.sort(SORT_ASC);
		
		for(var j=0; j<sorted.length; j++) {
			$('.library .artists').append('<a href="#" rel="'+sorted[j]+'"><span class="delete">X</span>'+sorted[j]+'</a>');				
		}

	},
	
	renderTracks: function(a){
		this.artists[a].tracks.sort(SORTOBJ_ASC);
			
		for(var j=0, t=this.artists[a].tracks; j<t.length; j++) {
			/* var source = t[j].source || '';
			var duration = t[j].duration || ''; */
			$('.tracks').append('<a href="#" rel="list" data-artist="'+t[j].artist+'" data-title="'+t[j].title+'">'+t[j].title+'<span class="delete">x</span><span class="info"></span></a>');
			
		}
	},
	
	addSource: function(a, t, s, d) {
		this.artists[a].tracks[this.getTrack(a, t)].source = s;
		this.artists[a].tracks[this.getTrack(a, t)].duration = d;
	},
	
	getTrack: function(a, t) {
		if (typeof this.artists[a] == 'undefined') return -1;
		for(var i=0, l=this.artists[a].tracks.length; i<l; i++) {
			if (this.artists[a].tracks[i].title.toLowerCase() == t.toLowerCase())
				return i;
		}
		return -1;
	}
	
}


DL = {
	artist: null,
	title: null,
	
	getFiles: function(t) {
		this.artist = t.attr('data-artist');
		this.title = t.attr('data-title');
		var q = cleanArgs(this.artist+' '+this.title);
		cur = t;
		var data = { access_token:token, q:q, sort:0 }
		$.get('https://api.vkontakte.ru/method/audio.search', data, DL.onGetFiles);
	},
	
	onGetFiles: function(json) {
	    var data = 	JSON.parse(json);
		if (typeof data.error != 'undefined') {
			if (data.error.error_code == 11) authVK();
			if (data.error.error_code == 7) authVK();
			console.log(data.error);
			return;
		}
		var total = data.response[0];
		var sort = new Array();
		for (key in data.response) {
			var d = data.response[key];
			if (typeof(d.duration) == 'undefined') continue;
			if (d.duration < 160 || d.duration > 900) continue;
			if (sort[d.duration] == null) sort[d.duration] = 1;
			else sort[d.duration]++; 
		}
		var keys = arsort(sort, 'SORT_NUMERIC');
		var dur = keys[0];
		if (keys[1] > keys[0]) {
			if (sort[keys[1]] > 25 || sort[keys[0]] - sort[keys[1]] < 6) dur = keys[1];
		}
		
		var selecta = [];
		for (key in data.response) {
			var d = data.response[key];
			if (typeof(d.title) == 'undefined') continue
			if (d.duration != dur) continue;	
			if (!checkTitle(DL.title, d.title)) continue;
			var duration = parseInt(d.duration / 60) + ":" + ( (d.duration % 60) > 9 ? d.duration % 60 : "0" + d.duration % 60 );	
			selecta.push({d:duration, s:d.url});
		}
		var mp3 = selecta[Math.floor(Math.random()*selecta.length)];	
		cur.attr('data-source', mp3.s);
		cur.find('.info').html(mp3.d);
		cur.attr('href', mp3.s);
		cur.click();
	}
}

LAST = {
	url: 'http://ws.audioscrobbler.com/2.0/?api_key=b25b959554ed76058ac220b7b2e0a026&format=json&',
	found: [],
	query: '',
	
	clean: function(q){
		q = encodeURIComponent(q);
		return q;
	},
	
	getTopTracks: function(art) {
		this.found = [];
		$('.tracks').empty();		
		art = this.clean(art);
		$.getJSON(this.url+'method=artist.gettoptracks&artist='+art+'&callback=?',function(j){
			LAST.onGetTopTracks(j);
		});	
	},
	
	onGetTopTracks: function(d) {
		$(d.toptracks.track).each(function(){
			var title = cleanTitle(this.name);
			if (!in_array(title, LAST.found)) {
				
				var op = '<span class="add last">h</span>';
				if (MB.lists[MB.current].getTrack(MB.artist, title) != -1) op = '<span class="last">y</span>';
				$('.tracks').append('<a href="#" rel="last" data-artist="'+this.artist.name+'" data-title="'+cap(title)+'">'+cap(title)+op+'<span class="info"></span></a>');
				LAST.found.push(title);
			}			
		});
		$('.tracks').append('<a href="#" rel="more-tracks">*** Get More Tracks ***</a>');
		$('#playlist .actions span').removeClass('active').filter('.lastfm').addClass('active');
		sbar.update();
	},
	
	getList: function(art) {
        this.found = [];
        $('.tracks').empty();
        art = this.clean(art);
        $.get('http://www.last.fm/music/'+art+'/+charts?rangetype=6month&subtype=tracks', LAST.onGetList);    
    },
    
    onGetList: function(e) {
        var data = $("#content", cleanU(e));
        var artist = trim($('.pagehead .breadcrumb a', data).eq(1).text());
        
        var tracks = $('.modulechartstracks .chart6month tr td.subjectCell div', data).toArray();
    
        for (var i=0; i<150; i++){
            var t = tracks[i];
            var title = $(t).find('> a').text() || '';
            
            if (title.toLowerCase().indexOf('podcast') != -1) continue; // remove podcasts      
            title = cleanTitle(title.replace(/\-/g,' '));
            if (title == '' || title == undefined) continue;
            
            if (!in_array(title, LAST.found)) {
                var op = '<span class="add last">h</span>';
                if (MB.lists[MB.current].getTrack(MB.artist, title) != -1) op = '<span class="last">y</span>';
                $('.tracks').append('<a href="#" rel="last" data-artist="'+artist+'" data-title="'+cap(title)+'">'+cap(title)+op+'<span class="info"></span></a>');
                LAST.found.push(title);
            }
            if (LAST.found.length > 80) i = 150;
        }
        $('#playlist .actions span').removeClass('active').filter('.lastfm').addClass('active');
        sbar.update();
    },
	
	findArtists: function(v) {
		if (v.length < 3) return;
		var query = cleanArgs(v);
		$.getJSON(LAST.url+'method=artist.search&artist='+query+'&callback=?',function(j){
			LAST.onGetArtists(j);
		});		
	},
	
	onGetArtists: function(d) {
		var i = 0;
		$('.library .artists').empty();
		$(d.results.artistmatches.artist).each(function(){
			i++;
			if (i > 10) return false;
			if (typeof this.image != 'undefined') {
				var img = this.image[1]['#text'];
				var img2 = this.image[3]['#text'];
			}
			else	var img = '';
			if (img == '') img = img2 = 'assets/img/musicalnote.png';
			var name = decURI(this.name);
			var url = this.url;
			$('.library .artists').append('<a href="#" rel="'+name+'">'+name+'</a>');
		});
		lbar.update();
	},
	
	findSimilar: function(v) {
		if (!v || v.length < 3) return;
		var query = cleanArgs(v);
		$.getJSON(LAST.url+'method=artist.getsimilar&artist='+query+'&callback=?',function(j){
			LAST.onFindSimilar(j);
		});	
	},
	
	onFindSimilar: function(d) {
		if (typeof d.similarartists == 'undefined') return;
		$('.library .artists').empty();
		$(d.similarartists.artist).each(function(){
			$('.library .artists').append('<a href="#" rel="'+this.name+'">'+this.name+'</a>');
		});
		lbar.update();
	}
	
}