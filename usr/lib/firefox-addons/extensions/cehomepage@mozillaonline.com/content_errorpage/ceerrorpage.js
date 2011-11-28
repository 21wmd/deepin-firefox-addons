function addURLLink(event) {
	var contentDoc=event.target;
	var contentWin=contentDoc.defaultView;
	if(contentDoc.documentURI.match(/^about:neterror/) && contentWin == contentWin.top){
		var iframe = contentDoc.createElement('iframe');
		iframe.width = '625px';
		iframe.height = '0px';
		iframe.style.border = 'none';
		var errorPageContainer = contentDoc.getElementById('errorPageContainer');
		errorPageContainer.appendChild(iframe);
		iframe.src = 'http://i.firefoxchina.cn/newtab/net_error.html';
		iframe.addEventListener('load', function(){
			iframe.height = '330px';
		}, false);
		var timer = 0;
		var interval = setInterval(function(){
			if(timer < 150) {
				if(iframe.contentDocument.readyState == 'complete' || iframe.contentDocument.readyState == 'interactive') {
					iframe.height = '330px';
					timer = 0;
					clearInterval(interval);
				} else {
					timer++;
				}
			} else {
				timer = 0;
				clearInterval(interval);
			}
		}, 200);
	}
}

window.document.getElementById('appcontent').addEventListener('DOMContentLoaded', addURLLink, false);
