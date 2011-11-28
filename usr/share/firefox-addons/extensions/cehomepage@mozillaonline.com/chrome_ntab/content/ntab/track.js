var tracker = (function() {
	var _trackurl = 'http://www.g-fox.cn/livemargins/ntab.gif';
	
	function _trace_link(link) {
		if (!link.href || (link.href.indexOf('http://') != 0 && link.href.indexOf('https://') != 0))
			return;
		
		if (!_identify(link))
			return;
		
		tracker.track({
			type: 'link',
			action: 'click',
			href: link.href,
			title: link.title
		});
	}
		
	function _identify(link) {
		while (link) {
			if (CSS.is(link, 'no-link-trace')) {
				return false;
			}
			
			if (CSS.is(link, 'link-trace')) {
				return true;
			}
			
			link = link.parentNode;
		}
		
		return false;
	}
	
	return {
		track: function(option) {
			option = extend(option, {
				type: '',
				action: '',
				fid: '',
				sid: '',
				href: '',
				title: ''
			});
			
			if (!option.type && !option.sid && !option.action)
				return;
			
			var image = new Image();
			var args = [];
			args.push('c=ntab');
			args.push('t=' + encodeURIComponent(option.type));
			args.push('a=' + encodeURIComponent(option.action));
			args.push('d=' + encodeURIComponent(option.sid));
			args.push('f=' + encodeURIComponent(option.fid));
			if (option.title) {
				args.push('ti=' + encodeURIComponent(option.title));
			}
			if (option.href) {
				args.push('hr=' + encodeURIComponent(option.href));
			}
			args.push('r=' + Math.random());
			image.src = _trackurl + '?' + args.join('&');
		},
		
		onclick: function(event) {
			var target = event.target;
			if (!(target instanceof HTMLAnchorElement) && target.parentNode && target.parentNode instanceof HTMLAnchorElement) {
				target = target.parentNode;
			}
			
			if (!(target instanceof HTMLAnchorElement))
				return;
			
			_trace_link(target);
		}
	}
})();

document.addEventListener('click', tracker.onclick, false);