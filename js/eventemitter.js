'use strict';

//自定义类插件
(function(prime, win, doc, undefined){
	//局部变量
	
	
	//插件类
	//事件对象封装类
	var Event = (function () {
		// a whitelist of properties (for different event types) tells us what to check for and copy
		var commonProps = str2arr('altKey attrChange attrName bubbles cancelable ctrlKey currentTarget '
				+ 'detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey '
				+ 'srcElement target timeStamp type view which propertyName path'),
			mouseProps = commonProps.concat(str2arr('button buttons clientX clientY dataTransfer '
				+ 'fromElement offsetX offsetY pageX pageY screenX screenY toElement movementX movementY region')),
			mouseWheelProps = mouseProps.concat(str2arr('wheelDelta wheelDeltaX wheelDeltaY wheelDeltaZ ' + 'axis')) // 'axis' is FF specific
		, keyProps     = commonProps.concat(str2arr('char charCode key keyCode keyIdentifier '          +
		'keyLocation location isComposing code'))
		, textProps    = commonProps.concat(str2arr('data'))
		, touchProps   = commonProps.concat(str2arr('touches targetTouches changedTouches scale rotation'))
		, messageProps = commonProps.concat(str2arr('data origin source'))
		, stateProps   = commonProps.concat(str2arr('state'))
		, overOutRegex = /over|out/
		// some event types need special handling and some need special properties, do that all here
		, typeFixers   = [
		{ // key events
		reg: /key/i
		, fix: function (event, newEvent) {
		newEvent.keyCode = event.keyCode || event.which
		return keyProps
		}
		}
		, { // mouse events
		reg: /click|mouse(?!(.*wheel|scroll))|menu|drag|drop/i
		, fix: function (event, newEvent, type) {
		newEvent.rightClick = event.which === 3 || event.button === 2
		newEvent.pos = { x: 0, y: 0 }
		if (event.pageX || event.pageY) {
		newEvent.clientX = event.pageX
		newEvent.clientY = event.pageY
		} else if (event.clientX || event.clientY) {
		newEvent.clientX = event.clientX + doc.body.scrollLeft + root.scrollLeft
		newEvent.clientY = event.clientY + doc.body.scrollTop + root.scrollTop
		}
		if (overOutRegex.test(type)) {
		newEvent.relatedTarget = event.relatedTarget
		|| event[(type == 'mouseover' ? 'from' : 'to') + 'Element']
		}
		return mouseProps
		}
		}
		, { // mouse wheel events
		reg: /mouse.*(wheel|scroll)/i
		, fix: function () { return mouseWheelProps }
		}
		, { // TextEvent
		reg: /^text/i
		, fix: function () { return textProps }
		}
		, { // touch and gesture events
		reg: /^touch|^gesture/i
		, fix: function () { return touchProps }
		}
		, { // message events
		reg: /^message$/i
		, fix: function () { return messageProps }
		}
		, { // popstate events
		reg: /^popstate$/i
		, fix: function () { return stateProps }
		}
		, { // everything else
		reg: /.*/
		, fix: function () { return commonProps }
		}
		]
		, typeFixerMap = {} // used to map event types to fixer functions (above), a basic cache mechanism

		, Event = function (event, element, isNative) {
		if (!arguments.length) return
		event = event || ((element.ownerDocument || element.document || element).parentWindow || win).event
		this.originalEvent = event
		this.isNative       = isNative
		this.isBean         = true

		if (!event) return

		var type   = event.type
		, target = event.target || event.srcElement
		, i, l, p, props, fixer

		this.target = target && target.nodeType === 3 ? target.parentNode : target

		if (isNative) { // we only need basic augmentation on custom events, the rest expensive & pointless
		fixer = typeFixerMap[type]
		if (!fixer) { // haven't encountered this event type before, map a fixer function for it
		for (i = 0, l = typeFixers.length; i < l; i++) {
		if (typeFixers[i].reg.test(type)) { // guaranteed to match at least one, last is .*
		typeFixerMap[type] = fixer = typeFixers[i].fix
		break
		}
		}
		}

		props = fixer(event, this, type)
		for (i = props.length; i--;) {
		if (!((p = props[i]) in this) && p in event) this[p] = event[p]
		}
		}
		}

		// preventDefault() and stopPropagation() are a consistent interface to those functions
		// on the DOM, stop() is an alias for both of them together
		Event.prototype.preventDefault = function () {
		if (this.originalEvent.preventDefault) this.originalEvent.preventDefault()
		else this.originalEvent.returnValue = false
		}
		Event.prototype.stopPropagation = function () {
		if (this.originalEvent.stopPropagation) this.originalEvent.stopPropagation()
		else this.originalEvent.cancelBubble = true
		}
		Event.prototype.stop = function () {
		this.preventDefault()
		this.stopPropagation()
		this.stopped = true
		}
		// stopImmediatePropagation() has to be handled internally because we manage the event list for
		// each element
		// note that originalElement may be a Bean#Event object in some situations
		Event.prototype.stopImmediatePropagation = function () {
		if (this.originalEvent.stopImmediatePropagation) this.originalEvent.stopImmediatePropagation()
		this.isImmediatePropagationStopped = function () { return true }
		}
		Event.prototype.isImmediatePropagationStopped = function () {
		return this.originalEvent.isImmediatePropagationStopped && this.originalEvent.isImmediatePropagationStopped()
		}
		Event.prototype.clone = function (currentTarget) {
		//TODO: this is ripe for optimisation, new events are *expensive*
		// improving this will speed up delegated events
		var ne = new Event(this, this.element, this.isNative)
		ne.currentTarget = currentTarget
		return ne
		}
		return Event;
	}());
	
	//事件代理类
	var EventEmitter = (function(win, doc, undefined){
		//构造函数
		function EventEmitter(){
			return;
		}
		
		var manager = (function () {
			var map = {};
			//事件监听器查询匹配函数
			//fn回调函数返回false, 可中断循环
			var findall = function (elem, type, orig, handler, root, fn) {
				var prefix = root ? 'r' : '$';		//普通监听器加$前缀，根监听器加r前缀
				if ( !type || type == '*' ) {		//查询所有监听器
					for ( var t in map ) {
						if (t.charAt(0) == prefix) {
							findall(elem, t.substr(1), orig, handler, root, fn);
						}
					}
				} else {
					var list = map[prefix + type], 
						all = (elem == '*'),
						i = 0,
						len = list.length;
						
					if ( !list ) {
						return;
					}
					for ( ; i < len; i++ ) {
						if ( (all || list[i].matches(elem, orig, handler)) && !fn(list[i], list, i, type) ) {
							return;
						}
					}
				}
			};
			return {
				has: function (elem, type, orig, root) {
					var i, list = map[(root ? 'r' : '$') + type];
					if (list) {
						for (i = list.length; i--;) {		//执行循环提高效率
							if ( !list[i].root && list[i].matches(elem, orig, null) ) {
								return true;
							}
						}
					}
					return false;
				},
				get: function (elem, type, orig, root) {
					var entries = [];
					findall(elem, type, orig, null, root, function (entry) {
						return entries.push(entry);
					});
					return entries;
				},
				put: function (entry) {
					var has = !entry.root && !this.has(entry.elem, entry.type, null, false),
						key = (entry.root ? 'r' : '$') + entry.type,
						(map[key] || (map[key] = [])).push(entry);
					return has;
				},
				del: function (entry) {
					findall(entry.elem, entry.type, null, entry.handler, entry.root, function (entry, list, i) {
						list.splice(i, 1);
						entry.removed = true;
						if (list.length === 0) {
							delete map[(entry.root ? 'r' : '$') + entry.type];
						}
						return false;
					})
				},
				entries: function () {			//获取所有entry
					var t, entries = [];
					for (t in map) {
						if (t.charAt(0) == '$') {
							entries = entries.concat(map[t]);
						}
					}
					return entries;
				}
			};
		}());
		
		
		return EventEmitter;
	})(win, doc);
	
	
	
	
	//扩展原型
	prime.__struct__.extend({
		plugin1: PluginName
	});
	
	//扩展类静态成员
	prime.extend({
		pluginhander: function(){
			var p = prime();
			//TODO:
			
			return p.plugin1();
		}
	});
	
})(prime, window, document);