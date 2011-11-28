var EXPORTED_SYMBOLS = ['defaultQuickDial'];

defaultQuickDial = {
	dialData: {
		'1': {
			title: decodeURIComponent('Linux%20Deepin%20%E4%B8%BB%E9%A1%B5'),
			url: 'http://www.linuxdeepin.com/',
			icon: 'chrome://ntab/skin/logo/ld.ico'
		},

		'2': {
			title: decodeURIComponent('1616.net%20%E4%B8%AA%E4%BA%BA%E9%97%A8%E6%88%B7'),
			url: 'http://www.1616.net/',
			icon: 'chrome://ntab/skin/logo/1616.ico'
		},

		'3': {
			title: decodeURIComponent('Linux%20Deepin%20%E5%AF%BC%E8%88%AA'),
			url: 'http://start.linuxdeepin.com/',
			icon: 'chrome://ntab/skin/logo/ld.ico'
		},

		'4': {
			title: decodeURIComponent('%E7%81%AB%E7%8B%90%E7%BD%91%E5%9D%80%E5%A4%A7%E5%85%A8'),
			url: 'http://www.huohu123.com/?src=qd',
			icon: 'chrome://ntab/skin/logo/mozilla.ico'
		},

		'5': {
			title: decodeURIComponent('%E7%99%BE%E5%BA%A6'),
			url: 'http://www.baidu.com/s?ie=utf8&wd=',
			icon: 'chrome://ntab/skin/logo/baidu.ico'
		},

		'6': {
			title: decodeURIComponent('%E5%8D%93%E8%B6%8A%E7%BD%91'),
			url: 'http://www.amazon.cn/?source=mozilla9-23',
			icon: 'chrome://ntab/skin/logo/joyo.ico'
		},

		'7': {
			title: decodeURIComponent('%E4%BA%AC%E4%B8%9C%E5%95%86%E5%9F%8E'),
			url: 'http://click.union.360buy.com/JdClick/?unionId=206&siteId=8&to=http://www.360buy.com/',
			icon: 'chrome://ntab/skin/logo/360.ico'
		}
	},

	snapshotMap: {
		'http://www.linuxdeepin.com/': 'chrome://ntab/skin/thumb/master/ld.png',
		'http://start.linuxdeepin.com/': 'chrome://ntab/skin/thumb/master/ldstart.png',
		'http://www.1616.net/': 'chrome://ntab/skin/thumb/master/1616.png',
		'http://www.baidu.com/': 'chrome://ntab/skin/thumb/master/baidu.png',
		'http://www.baidu.com/s?ie=utf8&wd=': 'chrome://ntab/skin/thumb/master/baidu.png',
		'http://www.renren.com/': 'chrome://ntab/skin/thumb/master/renren.png',
		'http://www.360buy.com/': 'chrome://ntab/skin/thumb/master/360.png',
		'http://click.union.360buy.com/JdClick/?unionId=206&siteId=8&to=http://www.360buy.com/': 'chrome://ntab/skin/thumb/master/360.png',
		'http://www.tmall.com/': 'chrome://ntab/skin/thumb/master/taobao.png',
		'http://s.click.taobao.com/t_9?p=mm_12811289_0_0&l=http%3A%2F%2Fmall.taobao.com%2F': 'chrome://ntab/skin/thumb/master/tmall.png',
		'http://www.tmall.com/go/chn/tbk_channel/tmall_new.php?pid=mm_28347190_2425761_9313997&eventid=101334': 'chrome://ntab/skin/thumb/master/tmall.png',		'http://click.mz.simba.taobao.com/rd?w=mmp4ptest&f=http%3A%2F%2Fwww.taobao.com%2Fgo%2Fchn%2Ftbk_channel%2Fonsale.php%3Fpid%3Dmm_28347190_2425761_9313997&k=e02915d8b8ad9603' : 'chrome://ntab/skin/thumb/master/taobaohot.jpg',
		'http://www.sina.com.cn/': 'chrome://ntab/skin/thumb/master/sina.png',
		'http://www.amazon.cn/': 'chrome://ntab/skin/thumb/master/joyo.png',
		'http://www.amazon.cn/?source=mozilla9-23': 'chrome://ntab/skin/thumb/master/joyo.png',
        'http://www.google.com/': 'chrome://ntab/skin/thumb/master/google.jpg',
        'http://www.google.com.hk/': 'chrome://ntab/skin/thumb/master/google.jpg',
        'http://www.youdao.com/': 'chrome://ntab/skin/thumb/master/youdao.jpg',
        'http://cn.bing.com/': 'chrome://ntab/skin/thumb/master/bing.jpg',
        'http://www.bing.com/': 'chrome://ntab/skin/thumb/master/bing.jpg',
	},

	sitesTabs: [{
		nameStr: 'ntab.dial.label.navsites',
		urlPref: 'moa.ntab.dial.sitesurl',
		tabId:   'nav_sites',
		showIcon: false,
		panelId: 'nav_sites_panel'					// can be none
	}]
};
