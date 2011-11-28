var templates = (function() {
	return {
		get dialEditingTemplate() {
			var promptTemplate = [];
			promptTemplate.push('	<div>');
			promptTemplate.push('		<label>' + _('ntab.dial.editdialog.label.title') + '</label>');
			promptTemplate.push('		<input type="text" class="input-title"/>');
			promptTemplate.push('		<br/>');
			promptTemplate.push('		<label>' + _('ntab.dial.editdialog.label.url') + '</label>');
			promptTemplate.push('		<input type="text" class="input-url"/>');
			promptTemplate.push('		<input type="checkbox" class="checkbox-refresh" />');
			promptTemplate.push('		<span class="refresh">' + _('ntab.dial.editdialog.label.refresh') + '</span>');
			promptTemplate.push('	</div>');
			promptTemplate.push('	<div class="tabbox">');
			promptTemplate.push('		<div class="tabs">');
			promptTemplate.push('			<div class="tab selected">' + _('ntab.dial.editdialog.label.mostvisitedsites') + '</div>');
			promptTemplate.push('			<div class="tab">' + _('ntab.dial.editdialog.label.bookmarks') + '</div>');
			promptTemplate.push('			<div class="tab">' + _('ntab.dial.editdialog.label.navsites') + '</div>');
			promptTemplate.push('		</div>');
			promptTemplate.push('		<div class="tabpanels">');
			promptTemplate.push('			<div class="tabpanel sites-list mostvisited-sites div-table">');
			promptTemplate.push('			</div>');
			promptTemplate.push('			<div class="tabpanel sites-list bookmark-sites div-table">');
			promptTemplate.push('			</div>');
			promptTemplate.push('			<div class="tabpanel sites-list nav-sites div-table">');
			promptTemplate.push('			</div>');
			promptTemplate.push('		</div>');
			promptTemplate.push('	</div>');
			
			return promptTemplate.join('');
		}
	};
})();