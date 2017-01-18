
$.config({
	log: true,
	error: true
});

$(function(){
	// $.log('启用日志输出');
	// $.error('启用异常输出');
	
	/* Finder */
	// var $btns = $('.btn');
	// var $btns = $('.btn');
	// var $btns2 = Sizzle('#mainbody .btn:first');
	// var $btns3 = Sizzle('#mainbody .wrapper:first:not(hidden) .btn');
	// var $btns4 = Sizzle('#mainbody .wrapper .section:first:not(hidden) .btn');
	// var $btns5 = Sizzle('.section:odd:not(hidden) .btn:odd:not(hidden)');
	// var $btns6 = Sizzle('.wrapper:not(hidden) .input:first,.section:odd:not(hidden) .btn:odd:not(hidden)');
	// var $btns7 = Sizzle('.section:odd:not(hidden) .btn', null, [], Sizzle('#mainbody .wrapper'));
	// var $btns8 = Sizzle('form[method], .section:not(hidden) .btn:odd:not(hidden)');
	// var $wrapper = Sizzle('#mainbody>.wrapper:first');
	// var obj = finder();
	
	
	/* EventEmitter */
	var $body = $(document.body),
		$btns = $('.btn');
	$body.on('click', function(){
		console.log('body click event');
	});
	$btns.on('click', function( evt ){
		console.log('btn click event');
		evt.stopPropagation();
	});
	$body.on('mouseenter', '.btn.hover', function(){
		console.log('hover event');
	});
	debugger;
});