$(function(){
    $('#minimize').click(function(){
       pokki.closePopup(); 
    });

    $.receiveMessage(function(e) {
        if (e.data == 'next_track') {
            $('.tracks .active').next().click();    
        }
    });
    
	dlg = $('#dialog').dialog({autoOpen:false});

	$('.menu-open').click(function(){
		$('.preferences').slideToggle('slow');
	});
	
	$('.preferences a').click(function(e){
		switch(this.rel) {
			case 'login': authVK(); break;
			case 'logout': localStorage.setItem('user',''); location.reload(true); break;
			case 'add': addList(); break;
			case 'delete': deleteList(); break;
			case 'rename': renameList(); break;
			case 'load': loadMusic(); break;
			case 'save': saveMusic(); break;
			case 'help': pokki.openURLInDefaultBrowser('http://music.airy.me/about.html'); break;
		}
		$(this).parent().hide();
		e.preventDefault();
	});
	
	$('.list-select').click(function(){
		$('.lists').slideToggle('slow');
	});
	
	$('.lists a').live('click', function(e){
		var id = $(this).data('id');
		MB.select(id);
		$('.lists').hide();		
		e.preventDefault();			
	});
	
	$('.library .artists a').live('click', function(e){
		if ($(e.target).is('.delete')) return;
		$('.library .artists a').removeClass('active');
		$(this).addClass('active');
		$('.tracks').empty();
		var id = $(this).attr('rel');
		MB.artist = id;
		if ($(this).parent().hasClass('live')) {
		    LAST.getTopTracks(id);    
            //LAST.getList(id);
		} else {
		    MB.renderTracks(id);
		}
			
		e.preventDefault();
	});
	
	$('.library .artists a .delete').live('click', function(e){
		var art = $(this).parent().attr('rel');
		MB.delArtist(art);
		$(this).parent().remove();
		sbar.update();
		e.preventDefault();
	});
	
	
	
	$('.library .tools .search').click(function(e){
		var sel = $('.library .searchbox .find').val();
		if (sel != '')
			LAST.findArtists(sel);
			
		var timeout = null;
		$('.library .searchbox .find').attr('placeholder','find artist').unbind('keyup').keyup(function(event){
			clearTimeout(timeout);
			if (event.keyCode == '13')
				LAST.findArtists($(this).val());
			else
				timeout = setTimeout(LAST.findArtists, 400, $(this).val());
		});
	});
	
	$('.library .tools .similar').click(function(e){
		var sel = $('.library .searchbox .find').val();
		if (sel != '')
			LAST.findSimilar(sel);
		else {
			sel = $('.library .artists .active').attr('rel');
			$('.library .searchbox .find').attr('value', sel);
			if (sel != '')
				LAST.findSimilar(sel);
		}
		
		var timeout = null;
		$('.library .searchbox .find').attr('placeholder','find similar').unbind('keyup').keyup(function(event){
			clearTimeout(timeout);
			if (event.keyCode == '13')
				LAST.findSimilar($(this).val());
			else
				timeout = setTimeout(LAST.findSimilar, 400, $(this).val());
		});
	});
	
	$('.library .tools .save').click(function(e){
		MB.saveLocal();
	});
	
	$('.library .tools .music').click(function(e){
		MB.renderArtists(this.current);
		$('.library .searchbox .find').attr('placeholder','filter artists').unbind('keyup').keyup(function(event){
			filter($(this).val());
		});
		e.preventDefault();		
	});
	
	
	$('.actions .lastfm').click(function(e){
		var a = MB.artist;
		LAST.getTopTracks(a);
		//LAST.getList(a);
		e.preventDefault();
	});
	
	$('.actions .playlist').click(function(e){
		var a = MB.artist;
		MB.renderTracks(a);
		e.preventDefault();
	});
	
	
	
	$(".tracks a").live('click',function(e){
		if ($(e.target).is('span')) return;
		if (typeof $(this).attr('data-source') != 'undefined' && $(this).attr('data-source') != '') {
		  	if (e.altKey != true) {
				$('.tracks a').removeClass('active');
				$(this).addClass('active');
				var file = $(this).attr('data-source');
				$(this).attr('href', file).attr('data-downloadurl', 'audio/mpeg:'+cap($(this).attr('data-artist'))+' - '+cap($(this).attr('data-title'))+':'+file).dragout();
				//$("#jp").jPlayer("setMedia", {mp3:file}).jPlayer("play");
				$.postMessage(file, 'http://music.airy.me', document.getElementById("player").contentWindow);
				e.preventDefault();
			}
		} else if ($(this).attr('rel') == 'more-tracks') {
		    LAST.getList(MB.artist);
		} else {	
			DL.getFiles($(this));
			e.preventDefault();
		}
	});
	
	$('.tracks a .delete').live('click',function(e){
		var row = $(this).parent();
		MB.delTrack(row);
		if (row.hasClass('active')) row.next().click();
		row.remove();
		sbar.update();
		e.preventDefault();
	});
	
	$('.tracks a .add').live('click', function(e){
		MB.addTrack(MB.artist, $(this).parent().attr('data-title'));
		$(this).removeClass('add').text('y');
		e.preventDefault();
	});
	
	// init scrollbars
	window.sbar = $('#scrollbar1');
	sbar.tinyscrollbar();
	window.lbar = $('#scrollbar2');
	lbar.tinyscrollbar();
	
	MB.init();

	lbar.update();
	sbar.update();
	
	autosave = setInterval(function(){
		MB.saveLocal();
	}, 240000);

	
	$('.library .searchbox .find').attr('placeholder','filter artists').unbind('keyup').keyup(function(event){
		filter($(this).val());
	});
	
	authVK();
	ovrl = $('#ovrl').overlay({
        top: "center",
        left: "center",        
        mask: {
            color: '#333',
            loadSpeed: 200,
            opacity: 0.7
        },
        closeOnClick: false,
    });

	setTimeout(function(){
	    if (typeof token == 'undefined' || !token) {
	        ovrl.data('overlay').load();
	    }
	}, 500);
    
});

function filter(arg) {
	if (arg == '')
		$('.library .artists a').show();
	else {
		$('.library .artists a').hide();
		$('.library .artists a[rel^="'+arg+'"]').show();
		lbar.update();
	}
	
	
}

function authVK() {
    var token_url = 'http://api.vk.com/blank.html';
    // 1902594
    var url = 'http://api.vk.com/oauth/authorize?client_id=1902594&scope=24&display=popup&response_type=token&redirect_uri='+token_url;
    pokki.showWebSheet(url, 600, 340, function(_url) {
        if (_url.match(/^http:\/\/api.vk.com\/blank.html/)) {
            token = _url.substring(_url.indexOf('=')+1,_url.indexOf('&'));
            pokki.hideWebSheet();
            console.log(token);
            if (token == 'access_denied') {
                ovrl.data('overlay').load();
                ovrl.html('You have to authorize this app');
            } else {
                ovrl.data('overlay').close();
            }
            
        } else {
            return true;    
        }
    }, function(error) {
    
    });
}

function addList() {
	dlg.html('<div id="addList"><h3>Playlist name</h3><input type="text"><div class="btns"><button class="blue">Create</button></div></div>').dialog('option', {title:"Create List", width: 300}).dialog('open');
	$('#dialog button').click(function(){
		var name = $('#dialog input').val();
		var list = MB.add(name);
		dlg.dialog('close');
	});
	
}

function deleteList() {
	if (MB.current == null) return;
	$("#dialog-confirm").html('<div id="delList">Are you sure want to delete this playlist?</div>').dialog({resizable: false,	height:120, width: 300,	modal: true,
		buttons: {
			"Delete": function() {
				$(this).dialog("close");
				MB.remove(MB.current);
			},
			Cancel: function() {
				$(this).dialog("close");
			}
		}
	});
}

function renameList() {
	dlg.html('<div id="renList"><h3>New playlist name</h3><input type="text"><div class="btns"><button class="blue">Rename</button></div></div>').dialog('option', {title:"Rename List", width: 300}).dialog('open');
	$('#dialog button').click(function(){
		var name = $('#dialog input').val();
		MB.rename(MB.current, name);
		$('.list-select').text(name);
		dlg.dialog('close');
	});
	
}

function loadMusic() {
	dlg.html('<div id="loadMusic"><h3>Select where to load music from:</h3><button class="blue" rel="server">Server</button><button class="blue" rel="text">Text</button><button class="blue" rel="file">File</button></div>').dialog('option',{title:"Load Music", width: 346}).dialog('open');
	$('#dialog button').click(function(e){
		switch($(this).attr('rel')) {
			case 'file':
				dlg.html('<div id="fileUpload"><h3>Drag file into area below</h3><textarea></textarea></div>');
				$('#fileUpload textarea').bind({
					dragenter: function(){$(this).addClass('highlighted'); return false;},
					dragover: function(){return false;},
					dragleave: function(){$(this).removeClass('highlighted');	return false;}, 
					drop: function(e) {
						var dt = e.originalEvent.dataTransfer;
						//if (dt.files[0].type == 'text/plain') {
							var reader = new FileReader();
							reader.onload = function(e) {
								var str = e.target.result;
								$('#fileUpload .btns').remove();
								$('#fileUpload textarea').text(str).after('<div class="btns"><button class="blue">Process</button></div>');
								$('#fileUpload button').click(function(){
									MB.loadText($('#fileUpload textarea').val());
									dlg.dialog('close');
								});
							}
							reader.readAsText(dt.files[0]);	
						//}
						return false;      
					}
				});
			break;
			case 'text':
				$('#loadMusic').html('<h3>Paste tracklist below</h3><textarea></textarea><div class="btns"><button class="blue">Process</button></div>');
				$('#loadMusic button').click(function(){
					MB.loadText($('#loadMusic textarea').val());
					dlg.dialog('close');
				});
			break;
			case 'server':
				MB.loadServer(dlg);
			break;
		}
	});
}

function saveMusic() {
	saveMusicDialog();
}

function saveMusicDialog() {
	dlg.html('<div id="saveMusic"><h3>Select where to save music:</h3><button class="blue" rel="browser">In Browser</button>					 <button class="blue" rel="server">To Server</button> <button class="blue" rel="file">Into File</button></div>').dialog('option',{title:"Save Music", width: 346}).dialog('open');
	$('#dialog button').click(function(){
	    dlg.dialog('close');
		switch($(this).attr('rel')) {
			case 'file': break;
			case 'browser': MB.saveLocal(); break;
			case 'server': saveMusicServer(); break;
		}
	});
}

function saveMusicServer() {
   dlg.html('<div id="saveMusic"><h3>Provide nickname:</h3><input type=text id=nick value="'+MB.user+'"> <button class="blue">Save</button>                    </div>').dialog('option',{title:"Save to Server", width: 346}).dialog('open');
    $('#dialog button').click(function(){
        MB.setUser($('#dialog input').val());

        MB.saveServer();
        dlg.dialog('close');
    }); 
}
