'use strict';

//自定义类插件
(function(Prime, win, doc, undefined){
	//局部变量
	var isstring = Prime.isstring,
		isfunction = Prime.isfunction,
		error = Prime.error,
		slice = [].slice,
		str2arr = function (s, d) {
			return s.split(d || ' ')
		};
	
	//插件类
	//事件代理类
	var EventEmitter = (function(win, doc, undefined){
		doc	= doc || {};
		
		var root = doc.documentElement || {},
			namespaceRegex = /[^\.]*(?=\..*)\.|.*/,
			nameRegex = /\..*/,
			addEvent = 'addEventListener',
			removeEvent = 'removeEventListener',
			W3C_MODEL = root[addEvent],
			eventSupport = W3C_MODEL ? addEvent : 'attachEvent',
			ONE = {},													// singleton for quick matching making add() do one()
			selectorEngine, 
			setSelectorEngine = function (e) {
				if (!arguments.length) {
					selectorEngine = doc.querySelectorAll
						? function (s, r) {
							return r.querySelectorAll(s)
						} 
						: function () {
							error('事件代理类', '未安装选择器插件') 	// eeek
						}
				} else {
					selectorEngine = e
				}
			},
			targetElement = function (elem, isNative) {				// if we're in old IE we can't do onpropertychange on doc or win so we use doc.documentElement for both
				return !W3C_MODEL 
				&& !isNative 
				&& (elem === doc || elem === win) ? root : elem;
			}
			// events that we consider to be 'native', anything not in this list will
			// be treated as a custom event
			standardNativeEvents = 'click dblclick mouseup mousedown contextmenu '		// mouse buttons
			+ 'mousewheel mousemultiwheel DOMMouseScroll '								// mouse wheel
			+ 'mouseover mouseout mousemove selectstart selectend '            			// mouse movement
			+ 'keydown keypress keyup '                                        			// keyboard
			+ 'orientationchange '                                            			// mobile
			+ 'focus blur change reset select submit '                         			// form elements
			+ 'load unload beforeunload resize move DOMContentLoaded '         			// window
			+ 'readystatechange message '                                      			// window
			+ 'error abort scroll ',                                              		// misc
			
			// element.fireEvent('onXYZ'... is not forgiving if we try to fire an event
			// that doesn't actually exist, so make sure we only do these on newer browsers
			w3cNativeEvents = 'show '                                                   // mouse buttons
			+ 'input invalid '                                                 			// form elements
			+ 'touchstart touchmove touchend touchcancel '                     			// touch
			+ 'gesturestart gesturechange gestureend '                         			// gesture
			+ 'textinput '                                                     			// TextEvent
			+ 'readystatechange pageshow pagehide popstate '                   			// window
			+ 'hashchange offline online '                                     			// window
			+ 'afterprint beforeprint '                                        			// printing
			+ 'dragstart dragenter dragover dragleave drag drop dragend '      			// dnd
			+ 'loadstart progress suspend emptied stalled loadmetadata '       			// media
			+ 'loadeddata canplay canplaythrough playing waiting seeking '     			// media
			+ 'seeked ended durationchange timeupdate play pause ratechange '  			// media
			+ 'volumechange cuechange '                                        			// media
			+ 'checking noupdate downloading cached updateready obsolete ',    			// appcache
		
			// convert to a hash for quick lookups
			nativeEvents = (function (hash, events, i) {
				for (i = 0; i < events.length; i++){
					events[i] && (hash[events[i]] = 1);
				}
				return hash;
			}( {}, str2arr(standardNativeEvents + (W3C_MODEL ? w3cNativeEvents : '')) )),
			
			// custom events are events that we *fake*, they are not provided natively but
			// we can use native events to generate them
			customEvents = (function () {
				var isAncestor = ('compareDocumentPosition' in root)
				? function (elem, container) {
					return container.compareDocumentPosition 
						&& (container.compareDocumentPosition(elem) & 16) === 16;
				}
				: ('contains' in root)
					? function (elem, container) {
						container = (container.nodeType === 9 || container === window) ? root : container;
						return container !== elem && container.contains(elem);
					}
					: function (elem, container) {
						while (elem = elem.parentNode){
							if (elem === container){
								return 1;
							}
						}
						return 0;
					};
				
				var check = function (event) {
					var related = event.relatedTarget;
					return !related ? related == null 
					: (related !== this && related.prefix !== 'xul' && !/document/.test(this.toString())
						&& !isAncestor(related, this));
				};

				return {
					mouseenter: { 
						base: 'mouseover', 
						condition: check
					},
					mouseleave: {
						base: 'mouseout',
						condition: check
					},
					mousewheel: {
						base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel'
					}
				};
			}());

		
		//事件对象封装类
		var Event = (function () {
			// a whitelist of properties (for different event types) tells us what to check for and copy
			var commonProps = str2arr('altKey attrChange attrName bubbles cancelable ctrlKey currentTarget'
				+ 'detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey'
				+ 'srcElement target timeStamp type view which propertyName path'),
				mouseProps = commonProps.concat(str2arr('button buttons clientX clientY dataTransfer'
				+ 'fromElement offsetX offsetY pageX pageY screenX screenY toElement movementX movementY region')),
				mouseWheelProps = mouseProps.concat(str2arr('wheelDelta wheelDeltaX wheelDeltaY wheelDeltaZ axis')),	// 'axis' is firefox 特有
				keyProps = commonProps.concat(str2arr('char charCode key keyCode keyIdentifier keyLocation location isComposing code')),
				textProps = commonProps.concat(str2arr('data')),
				touchProps = commonProps.concat(str2arr('touches targetTouches changedTouches scale rotation')),
				messageProps = commonProps.concat(str2arr('data origin source')),
				stateProps = commonProps.concat(str2arr('state')),
				overOutRegex = /over|out/,
				//有些事件需要做兼容处理，有些事件需要兼容属性名
				typeFixers = [{
					reg: /key/i,												//键盘按键事件
					fix: function (event, newEvent) {
						newEvent.keyCode = event.keyCode || event.which;
						return keyProps;
					}
				},{
					reg: /click|mouse(?!(.*wheel|scroll))|menu|drag|drop/i,		//鼠标事件
					fix: function (event, newEvent, type) {
						newEvent.rightClick = event.which === 3 || event.button === 2;
						newEvent.pos = { x:0, y:0 };
						if (event.pageX || event.pageY) {
							newEvent.clientX = event.pageX;
							newEvent.clientY = event.pageY;
						} else if (event.clientX || event.clientY) {
							newEvent.clientX = event.clientX + doc.body.scrollLeft + root.scrollLeft;
							newEvent.clientY = event.clientY + doc.body.scrollTop + root.scrollTop;
						}
						if (overOutRegex.test(type)) {
							newEvent.relatedTarget = event.relatedTarget 
								|| event[(type == 'mouseover' ? 'from' : 'to') + 'Element'];
						}
						return mouseProps;
					}
				},{
					reg: /mouse.*(wheel|scroll)/i,			//鼠标滚轮事件
					fix: function () {
						return mouseWheelProps;
					}
				},{
					reg: /^text/i,							//文本事件
					fix: function () {
						return textProps;
					}
				},{
					reg: /^touch|^gesture/i,				//触屏和手势事件
					fix: function () {
						return touchProps;
					}
				},{
					reg: /^message$/i,						//消息事件
					fix: function () {
						return messageProps;
					}
				},{
					reg: /^popstate$/i,						//历史记录条目发生变化事件
					fix: function () {
						return stateProps;
					}
				},{
					reg: /.*/,								//其他所有事件
					fix: function () {
						return commonProps;
					}
				}],
				typeFixerMap = {};	// used to map event types to fixer functions (above), a basic cache mechanism

			var Event = function (event, elem, isNative) {
				if (!arguments.length){
					return;
				}
				event = event || ((elem.ownerDocument || elem.document || elem).parentWindow || win).event;
				this.originalEvent = event;
				this.isNative = isNative;
				// this.isBean = true;

				if (!event){
					return;
				}

				var type = event.type,
					target = event.target || event.srcElement,
					i, l, p, props, fixer;

				this.target = (target && target.nodeType === 3) ? target.parentNode : target;

				if (isNative) { // we only need basic augmentation on custom events, the rest expensive & pointless
					fixer = typeFixerMap[type];
					if (!fixer) { // haven't encountered this event type before, map a fixer function for it
						for (i = 0, l = typeFixers.length; i < l; i++) {
							if (typeFixers[i].reg.test(type)) { // guaranteed to match at least one, last is .*
								typeFixerMap[type] = fixer = typeFixers[i].fix;
								break;
							}
						}
					}

					props = fixer(event, this, type);
					for (i = props.length; i--;) {
						if (!((p = props[i]) in this) && p in event){
							this[p] = event[p];
						}
					}
				}
			};

			// preventDefault() and stopPropagation() are a consistent interface to those functions
			// on the DOM, stop() is an alias for both of them together
			Event.prototype.preventDefault = function () {
				if (this.originalEvent.preventDefault) {
					this.originalEvent.preventDefault();
				} else {
					this.originalEvent.returnValue = false;
				}
			}
			Event.prototype.stopPropagation = function () {
				if (this.originalEvent.stopPropagation) {
					this.originalEvent.stopPropagation();
				} else {
					this.originalEvent.cancelBubble = true;
				}
			}
			Event.prototype.stop = function () {
				this.preventDefault();
				this.stopPropagation();
				this.stopped = true;
			}
			// stopImmediatePropagation() has to be handled internally because we manage the event list for
			// each element
			// note that originalElement may be a Bean#Event object in some situations
			Event.prototype.stopImmediatePropagation = function () {
				if (this.originalEvent.stopImmediatePropagation) {
					this.originalEvent.stopImmediatePropagation();
				}
				this.isImmediatePropagationStopped = function () { 
					return true;
				}
			}
			Event.prototype.isImmediatePropagationStopped = function () {
				return this.originalEvent.isImmediatePropagationStopped 
					&& this.originalEvent.isImmediatePropagationStopped();
			}
			Event.prototype.clone = function (currentTarget) {
				//TODO: this is ripe for optimisation, new events are *expensive*
				// improving this will speed up delegated events
				var ne = new Event(this, this.element, this.isNative);
				ne.currentTarget = currentTarget;
				return ne;
			}
			return Event;
		}());
		//事件记录类
		var RegEntry = (function () {
			// each handler is wrapped so we can handle delegation and custom events
			var wrappedHandler = function (elem, fn, condition, args) {
				var call = function (event, eargs) {
						return fn.apply(elem, args ? (slice.call(eargs, event ? 0 : 1).concat(args)) : eargs);
					},
					findTarget = function (event, eventElement) {
						return fn.__beanDel ? fn.__beanDel.ft(event.target, elem) : eventElement;
					},
					handler = condition 
						? function (event) {
							var target = findTarget(event, this); 	// deleated event
							if (condition.apply(target, arguments)) {
								if (event){
									event.currentTarget = target;
								}
								return call(event, arguments);
							}
						}
						: function (event) {
							if (fn.__beanDel) {						// delegated event, fix the fix
								event = event.clone(findTarget(event));
							}
							return call(event, arguments)
						};
				handler.__beanDel = fn.__beanDel;
				return handler;
			};
			
			var RegEntry = function (elem, type, handler, original, namespaces, args, root) {
				var customType = customEvents[type],
					isNative;

				if (type == 'unload') {		// self clean-up
					handler = once(removeListener, elem, type, handler, original);
				}

				if (customType) {
					if (customType.condition) {
						handler = wrappedHandler(elem, handler, customType.condition, args);
					}
					type = customType.base || type;
				}

				this.isNative = isNative = nativeEvents[type] && !!elem[eventSupport];
				this.customType = !W3C_MODEL && !isNative && type;
				this.element = elem;
				this.type = type;
				this.original = original;
				this.namespaces = namespaces;
				this.eventType = W3C_MODEL || isNative ? type : 'propertychange';
				this.target = targetElement(elem, isNative);
				this[eventSupport] = !!this.target[eventSupport];
				this.root = root;
				this.handler = wrappedHandler(elem, handler, null, args);
			}

			// given a list of namespaces, is our entry in any of them?
			RegEntry.prototype.inNamespaces = function (checkNamespaces) {
				var i, j, c = 0;
				if (!checkNamespaces){
					return true;
				}
				if (!this.namespaces){
					return false;
				}
				for (i = checkNamespaces.length; i--;) {
					for (j = this.namespaces.length; j--;) {
						if (checkNamespaces[i] == this.namespaces[j]) {
							c++;
						}
					}
				}
				return checkNamespaces.length === c;
			};

			// match by element, original fn (opt), handler fn (opt)
			RegEntry.prototype.matches = function (checkElement, checkOriginal, checkHandler) {
				return this.element === checkElement 
					&& (!checkOriginal || this.original === checkOriginal) 
					&& (!checkHandler || this.handler === checkHandler);
			};

			return RegEntry;
		}());
		//事件登记管理
		var Registry = (function () {
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
		
		
		
		// we attach this listener to each DOM event that we need to listen to, only once
		// per event type per DOM element
		function rootListener(event, type) {
			if ( !W3C_MODEL && type && event && event.propertyName != '_on' + type ){
				return;
			}

			var listeners = Registry.get(this, type || event.type, null, false),
				l = listeners.length,
				i = 0;

			event = new Event( event, this, true );
			if ( type ){
				event.type = type;
			}

			// iterate through all handlers registered for this type, calling them unless they have
			// been removed by a previous handler or stopImmediatePropagation() has been called
			for ( ; i < l && !event.isImmediatePropagationStopped(); i++ ) {
				if ( !listeners[i].removed ){
					listeners[i].handler.call( this, event );
				}
			}
		}
		//DOM对象添加（或移除）事件监听
		var listener = W3C_MODEL
		? function ( elem, type, add ) {						// new browsers
			elem[add ? addEvent : removeEvent]( type, rootListener, false );
		}
		: function ( elem, type, add, custom ) {				// IE8 and below, use attachEvent/detachEvent and we have to piggy-back propertychange events
			var entry;											// to simulate event bubbling etc.
			if ( add ) {
				Registry.put(entry = new RegEntry(
					elem,
					custom || type,
					function ( event ) { // handler
						rootListener.call( elem, event, custom );
					},
					rootListener, 
					null, 
					null, 
					true // is root
				));
				if ( custom && elem['_on' + custom] == null ){
					elem['_on' + custom] = 0;
				}
				entry.target.attachEvent( 'on' + entry.eventType, entry.handler );
				
			} else {
				entry = Registry.get( elem, custom || type, rootListener, true )[0];
				if ( entry ) {
					entry.target.detachEvent( 'on' + entry.eventType, entry.handler );
					Registry.del( entry );
				}
			}
		};
		//触发事件
		var fireListener = W3C_MODEL 
		? function (isNative, type, elem) {					// modern browsers, do a proper dispatchEvent()
			var evt = doc.createEvent(isNative ? 'HTMLEvents' : 'UIEvents');
			evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, win, 1);
			elem.dispatchEvent(evt);
		} 
		: function (isNative, type, elem) {					// old browser use onpropertychange, just increment a custom property to trigger the event
			elem = targetElement(elem, isNative);
			isNative ? elem.fireEvent('on' + type, doc.createEventObject()) : elem['_on' + type]++;
		};
		//移除事件监听
		function removeListener ( elem, orgType, handler, namespaces ) {
			var type = orgType && orgType.replace( nameRegex, '' ),
				handlers = Registry.get( elem, type, null, false ),
				removed  = {}, i, l;

			for ( i = 0, l = handlers.length; i < l; i++ ) {
				if ( (!handler || handlers[i].original === handler) && handlers[i].inNamespaces(namespaces) ) {
					// TODO: this is problematic, we have a Registry.get() and Registry.del() that
					// both do Registry searches so we waste cycles doing this. Needs to be rolled into
					// a single Registry.forAll(fn) that removes while finding, but the catch is that
					// we'll be splicing the arrays that we're iterating over. Needs extra tests to
					// make sure we don't screw it up. @rvagg
					Registry.del(handlers[i]);
					if ( !removed[ handlers[i].eventType ] && handlers[i][eventSupport] ){
						removed[ handlers[i].eventType ] = {
							t: handlers[i].eventType,
							c: handlers[i].type
						};
					}
				}
			}
			
			for ( i in removed ) {													// check each type/element for removed listeners and remove the rootListener where it's no longer needed
				if ( !Registry.has(elem, removed[i].t, null, false) ) {				// last listener of this type, remove the rootListener
					listener( elem, removed[i].t, false, removed[i].c );
				}
			}
		}
		//一次性事件
		function once (rm, elem, type, fn, fnOriginal) {
			return function () {
				fn.apply(this, arguments);
				rm(elem, type, fnOriginal);
			};
		}
		//事件委托
		function delegate ( selector, fn ){
			var findtarget = function(){
				var array = isstring( selector ) ? selectorEngine( selector, root ) : selector, i;
				for( ; target && target !== root; target = target.parentNode ){
					for( i = array.length; i++ ){
						if( array[i] === target ){
							return target;
						}
					}
				}
			}
			
			function handler( event ){
				var match = findtarget( event.target, this );
				if( match ){
					fn.apply( match, arguments );
				}
				
				handler.__beanDel = {
					ft: findtarget,
					selector: selector
				}
			}
			return handler;
		}

		
		//构造函数
		function EventEmitter(){
			return;
		}
		//绑定事件
		EventEmitter.on = function( elem, events, selector, fn ){
			var type, fnOriginal, args, types;
			if( undefined === selector && 'object' === typeof events ){
				for( type in events ){
					if( events.hasOwnProperty(type) ){
						on.call(this, elem, type, events[type]);
					}
				}
				return;
			}
			
			if( !isfunction(selector) ){
				fnOriginal = fn;
				args = slice.call( arguments, 4 );
				fn = detegate( selector, fnOriginal, selectorEngine )
			} else {
				args = slice.call( arguments, 3 );
				fn = fnOriginal = selector;
			}
			
			types = str2arr(events);

			if( this === ONE ){												// special case for one(), wrap in a self-removing handler
				fn = once( off, elem, events, fn, fnOriginal );
			}

			for ( i = types.length; i--; ) {								// add new handler to the registry and check if it's the first for this element/type
				first = registry.put(entry = new RegEntry(
					elem, 
					types[i].replace( nameRegex, '' ), 						// event type
					fn,
					originalFn,
					str2arr( types[i].replace(namespaceRegex, ''), '.' ), 	// namespaces
					args,
					false													// not root
				));
				if (entry[eventSupport] && first) {							// first event of this type on this element, add root listener
					listener( elem, entry.eventType, true, entry.customType );
				}
			}
			return elem;
		}
		//绑定一次性事件
		EventEmitter.add = function ( elem, events, fn, delfn) {
			return on.apply( null, !isstring(fn) 
				? slice.call(arguments) 
				: [ elem, fn, events, delfn ].concat( arguments.length > 3 ? slice.call(arguments, 5) : [] )
			);
		}
		//绑定一次性事件
		EventEmitter.one = function () {
			return on.apply(ONE, arguments);
		}
		//克隆事件
		EventEmitter.clone = function (dstElem, srcElem, type) {
			var handlers = registry.get(srcElem, type, null, false), 
				len = handlers.length, 
				i = 0, args, beanDel;

			for ( ; i < len; i++ ) {
				if ( handlers[i].original ) {
					args = [ dstElem, handlers[i].type ];
					if ( beanDel = handlers[i].handler.__beanDel ){
						args.push( beanDel.selector );
					}
					args.push( handlers[i].original );
					on.apply( null, args );
				}
			}
			return dstElem;
		}
		//触发事件
		EventEmitter.fire = function ( elem, type, args ) {
			var types = str2arr( type ),
				i, j, l, names, handlers;

			for ( i = types.length; i--; ) {
				type = types[i].replace( nameRegex, '' );
				if ( names = types[i].replace(namespaceRegex, '') ){
					names = str2arr( names, '.' );
				}
				if ( !names && !args && elem[eventSupport] ) {
					fireListener( nativeEvents[type], type, elem );
				} else {
					// non-native event, either because of a namespace, arguments or a non DOM element
					// iterate over all listeners and manually 'fire'
					handlers = registry.get( elem, type, null, false );
					args = [false].concat( args );
					for ( j = 0, l = handlers.length; j < l; j++ ) {
						if ( handlers[j].inNamespaces(names) ) {
							handlers[j].handler.apply( elem, args );
						}
					}
				}
			}
			return elem;
		}
		//移除事件
		EventEmitter.off = function ( elem, typeSpec, fn ) {
			var isstr = isstring( typeSpec ),
				k, type, namespaces, i;

			if (isstr && typeSpec.indexOf(' ') > 0) { 						// off(el, 't1 t2 t3', fn) or off(el, 't1 t2 t3')
				typeSpec = str2arr(typeSpec);
				for (i = typeSpec.length; i--;){
					off( elem, typeSpec[i], fn );
				}
				return elem;
			}

			type = isstr && typeSpec.replace(nameRegex, '');
			if (type && customEvents[type]){
				type = customEvents[type].base;
			}

			if (!typeSpec || isstr) {										// off(el) or off(el, t1.ns) or off(el, .ns) or off(el, .ns1.ns2.ns3)
				if (namespaces = isstr && typeSpec.replace(namespaceRegex, '')){
					namespaces = str2arr(namespaces, '.');
				}
				removeListener(elem, type, fn, namespaces);
			} else if (isFunction(typeSpec)) {								// off(el, fn)
				removeListener(elem, null, typeSpec)
			} else {														// off(el, { t1: fn1, t2, fn2 })
				for (k in typeSpec) {
					if (typeSpec.hasOwnProperty(k)){
						off(elem, k, typeSpec[k]);
					}
				}
			}

			return elem;
		}
		//选择器插件
		EventEmitter.selector = setSelectorEngine;
		//事件对象构造
		EventEmitter.event = Event;
		
		
		setSelectorEngine();
		return EventEmitter;
	})(win, doc);
	
	
	
	
	//扩展原型
	Prime.__struct__.extend({
		plugin1: PluginName
	});
	
	//扩展类静态成员
	Prime.extend({
		pluginhander: function(){
			var p = Prime();
			//TODO:
			
			return p.plugin1();
		}
	});
	
})(Prime, window, document);