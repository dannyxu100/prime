'use strict';

//自定义类插件
(function(prime, win, doc, undefined){
	//局部变量
	
	
	//插件类
	//事件代理类
	var EventEmitter = (function(win, doc, undefined){
		var doc	= document || {},
			root = doc.documentElement || {},
			namespaceRegex = /[^\.]*(?=\..*)\.|.*/,
			nameRegex = /\..*/,
			addEvent = 'addEventListener',
			removeEvent = 'removeEventListener',
			W3C_MODEL = root[addEvent],
			eventSupport = W3C_MODEL ? addEvent : 'attachEvent'
		
		//事件对象封装类
		var Event = (function () {
			// a whitelist of properties (for different event types) tells us what to check for and copy
			var commonProps = str2arr('altKey attrChange attrName bubbles cancelable ctrlKey currentTarget \
					detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey \
					srcElement target timeStamp type view which propertyName path'),
				mouseProps = commonProps.concat(str2arr('button buttons clientX clientY dataTransfer \
					fromElement offsetX offsetY pageX pageY screenX screenY toElement movementX movementY region')),
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

			Event = function (event, element, isNative) {
				if (!arguments.length){
					return;
				}
				event = event || ((element.ownerDocument || element.document || element).parentWindow || win).event;
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
			var wrappedHandler = function (element, fn, condition, args) {
				var call = function (event, eargs) {
						return fn.apply(element, args ? (slice.call(eargs, event ? 0 : 1).concat(args)) : eargs);
					},
					findTarget = function (event, eventElement) {
						return fn.__beanDel ? fn.__beanDel.ft(event.target, element) : eventElement;
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
			
			var RegEntry = function (element, type, handler, original, namespaces, args, root) {
				var customType = customEvents[type],
					isNative;

				if (type == 'unload') {		// self clean-up
					handler = once(removeListener, element, type, handler, original);
				}

				if (customType) {
					if (customType.condition) {
						handler = wrappedHandler(element, handler, customType.condition, args);
					}
					type = customType.base || type;
				}

				this.isNative = isNative = nativeEvents[type] && !!element[eventSupport];
				this.customType = !W3C_MODEL && !isNative && type;
				this.element = element;
				this.type = type;
				this.original = original;
				this.namespaces = namespaces;
				this.eventType = W3C_MODEL || isNative ? type : 'propertychange';
				this.target = targetElement(element, isNative);
				this[eventSupport] = !!this.target[eventSupport];
				this.root = root;
				this.handler = wrappedHandler(element, handler, null, args);
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
		
		
		//事件记录管理工具
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
		
		
		
		//构造函数
		function EventEmitter(){
			return;
		}
		
		//添加事件响应
		EventEmitter.on = function( elem, events, selector, fn ){
			// if(){
				
			// }
		}
		
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