'use strict';

(function(Prime, win, doc, undefined){
	//局部变量
	var error = Prime.error,
		createCache = Prime.createcache,
		rquickExpr4Prime = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,
		rootPrime;
	
	//插件类
	//选择器类
	var Finder = (function(win, doc, undefined){
		/* nodeType 编码参考表
			1	Element	代表元素
			2	Attr	代表属性
			3	Text	代表元素或属性中的文本内容
			4	CDATASection	代表文档中的 CDATA 部分（不会由解析器解析的文本）
			5	EntityReference	代表实体引用
			6	Entity	代表实体
			7	ProcessingInstruction	代表处理指令
			8	Comment	代表注释
			9	Document	代表整个文档（DOM 树的根节点）
			10	DocumentType	向为文档定义的实体提供接口
			11	DocumentFragment	代表轻量级的 Document 对象，能够容纳文档的某个部分
			12	Notation	代表 DTD 中声明的符号
		*/
		var expando = 'Finder' + 1 * new Date(),		//唯一标识符
			support,									//浏览器兼容性判断集合
			Expr,										//选择器处理集合
			isXML,
			tokenize,
			sortInput,
			hasDuplicate,
			
			setDocument,
			document,
			docElem,
			documentIsHTML,
			unloadHandler = function() {				//兼容iframes，处理跨框架选择器
				setDocument();
			},
			preferredDoc = win.document,
			
			matches,
			contains,
			classCache = createCache(),
			tokenCache = createCache(),
			compilerCache = createCache(),
			
			arr=[],
			slice = arr.slice,
			_push = arr.push,
			push = arr.push,
			
			//空白符regexp		// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
			whitespace = "[\\x20\\t\\r\\n\\f]",
			
			//CSS中TAG/CLASS/ID选择器命名规范		// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
			identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",
			//去除首尾多余空格书写错误，用于矫正选择器
			rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),
			
			//匹配多选择器，连写逗号分隔
			rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
			//匹配关系选择符（父子、兄弟元素）
			rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),
		
			//匹配快速选择符
			matchExpr = {
				"ID": new RegExp( "^#(" + identifier + ")" ),
				"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
				"TAG": new RegExp( "^(" + identifier + "|[*])" )
			},

			//匹配XXX{[native
			rnative = /^[^{]+\{\s*\[native \w/,
			//匹配ID/TAG/CLASS 快速选择符
			rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
			//兄弟元素 快速选择符
			rsibling = /[+~]/,
			//换码符replace替换的回调函数，匹配'\'加（1到6个16进制数or空白or非换行符）		// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
			runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
			funescape = function( _, escaped, escapedWhitespace ) {
				var high = "0x" + escaped - 0x10000;
				// NaN means non-codepoint
				// Support: Firefox<24
				// Workaround erroneous numeric interpretation of +"0x"
				return high !== high || escapedWhitespace ?
					escaped :
					high < 0 ?
						// BMP codepoint
						String.fromCharCode( high + 0x10000 ) :
						// Supplemental Plane codepoint (surrogate pair)
						String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
			},
			// CSS换码符replace替换的回调函数		// https://drafts.csswg.org/cssom/#common-serializing-idioms
			rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
			fcssescape = function( ch, asCodePoint ) {
				if ( asCodePoint ) {

					// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
					if ( ch === "\0" ) {
						return "\uFFFD";
					}

					// Control characters and (dependent upon position) numbers get escaped as code points
					return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
				}

				// Other potentially-special ASCII characters get backslash-escaped
				return "\\" + ch;
			},
			
			setDocument;
		
		//兼容元素数组的push() 公共函数
		try {
			push.apply(
				arr = slice.call(preferredDoc.childNodes),
				preferredDoc.childNodes
			);
			arr[preferredDoc.childNodes.length].nodeType;
			
		} catch(ex) {
			push = {
				apply: arr.length 
					? function(target, elems){					//slice可以用即用原生slice函数
						_push.apply(target, slice.call(elems));
					} 
					: function(target, elems){					//兼容 IE9以下浏览器
						var j = target.length,
							i = 0;
						while(target[j++]=elems[i++]){};
						target.length = j - 1;
					}
			};
			
		}
		
		//构造函数
		function Finder( selector, context, results, seed ) {
			var m, i, elem, nid, match, groups, newSelector,
				newContext = context && context.ownerDocument,
				nodeType = context ? context.nodeType : 9,
				results = results || [];
			
			if ( typeof selector !== 'string' 
			|| !selector 
			|| nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {		//判断选择器 1.是否字符串 2.容器参数(context)是否是无效的元素
				return results;
			}
			
			if( !seed ){						//如果没有传seed参数，没有查找范围限制（使用原生查找器，效率较高部分）
				if( (context ? context.ownerDocument || context : preferredDoc ) !== document ){
					setDocument( context );
				}
				context = context || document;
				
				if( documentIsHTML ){
					if( nodeType !== 11 && (match = rquickExpr.exec( selector )) ){		//如果所属文档不是代码片段，并且是ID/TAG/CLASS这种高性能的选择器
						//ID 选择符
						if( (m = match[1]) ){
							if( nodeType === 9 ){				//context 是document对象
								if( (elem = context.getElementById( m )) ){
									if( elem.id === m ){
										results.push( elem );
										return results;
									}
								} else {
									return results;
								}
								
							} else {							//context 是元素对象
								if( newContext && (elem = newContext.getElementById(m)) 
								&& contains(context, elem) 
								&& elem.id === m ){
									results.push( elem );
									return results;
								}
							}
						
						//TAG 选择符
						} else if( match[2] ){
							push.apply( results, context.getElementsByTagName( seletor ) );
							return results;
						
						//CLASS 选择符
						} else if( (m = match[3]) 
						&& support.getElementsByClassName 
						&& context.getElementsByClassName ){
							push.apply( results, context.getElementsByClassName( m ) );
							return results;
						}
					}
					
					
					if( support.qsa 
					&& !compilerCache[ selector + ' ' ] ){
						if( nodeType !== 1 ){
							newContext = context;
							newSelector = selector;
						
						} else if( context.nodeName.toLowerCase() !== 'object' ){		//不处理<object>元素
							if( (nid = context.getAttribute('id')) ){
								nid = nid.replace( rcssescape, fcssescape );
							} else {
								context.setAttribute( 'id', (nid = expando) );			//添加临时id 属性，用于处理兄弟选择符
							}
							
							groups = tokenize( selector );
							i = groups.length;
							while( i-- ){
								groups[i] = '#'+ nid +' '+ toSelector( groups[i] );
							}
							newSelector = groups.join(',');
							newContext = rsibling.test( selector ) && testContext( context.parentNode ) || context;		//如果是兄弟元素选择符，元素检索范围向上扩大一级
							
						}
						
						if ( newSelector ) {
							try {
								push.apply( results,
									newContext.querySelectorAll( newSelector )
								);
								return results;
							} catch ( qsaError ) {
								//HTML5新增querySelectorAll() 选择处理器语法异常
							} finally {
								if ( nid === expando ) {
									context.removeAttribute( "id" );			//删除临时id 属性，避免对用户代码造成不必要的困扰
								}
							}
						}
					}
				}
			}
			//复杂选择器处理，低效部分
			// return select( selector.replace( rtrim, "$1" ), context, results, seed );
			return results;
		}
		
		//操作dom有效性断言检测函数 内置异常捕获
		function assert( fn ) {
			var div = document.createElement('div');
			try {
				return !!fn( div );
			} catch( ex ) {
				return false;
			} finally {
				if( div.parentNode ) {			//移除临时操作div
					div.parentNode.removeChild( div );
				}
				div = null;						//针对IE，释放内存空间
			}
		}

		//容器元素有效性检查函数
		function testContext( context ) {
			return context && typeof context.getElementsByTagName !== "undefined" && context;
		}
		
		support = Finder.support = {};
		
		//判断是HTML还是XML文档对象
		isXML = Finder.isXML = function( elem ) {
			var documentElement = elem && (elem.ownerDocument || elem).documentElement;
			return documentElement ? documentElement.nodeName !== 'HTML' : false;
		};
		
		//初始化文档对象操作
		setDocument = Finder.setDocument = function( node ) {
			var hasCompare, subWindow,
				doc = node ? node.ownerDocument || node : preferredDoc;
			
			//判断node对象是否无效、或已经初始化
			if( doc === document || doc.nodeType !== 9 || !doc.documentElement ){
				return document;
			}
			
			document = doc;
			docElem = document.documentElement;
			documentIsHTML = !isXML( document );
			
			if( preferredDoc !== document
			&& (subWindow = document.defaultView) 
			&& subWindow.top !== subWindow ) {					//兼容iframes，处理跨框架选择器
				if( subWindow.addEventListener ) {				//IE10 以上
					subWindow.addEventListener( 'unload', unloadHandler, false );
					
				} else if( subWindow.attachEvent ) {			//IE9 ~ IE10
					subWindow.attachEvent( 'onunload', unloadHandler );
				}
			}
			
			support.attributes = assert(function( elem ) {				//兼容检查getAttribute() 函数，IE8以下
				elem.className = 'i';
				return !elem.getAttribute('className');
			});
			
			support.getElementsByTagName = assert(function( elem ){		//兼容检查getElementsByTagName() 函数，判断getElementsByTagName()是否只是提取元素
				elem.appendChild( document.createComment('') );
				return !elem.getElementsByTagName('*').length;
			});
			
			support.getElementsByClassName = rnative.test( document.getElementsByClassName );		//兼容检查getElementsByClassName() 函数，IE9以下
			
			
			support.getById = assert(function( elem ) {					//兼容检查getElementById()函数处理name属性与id属性同名bug（同名name属性可被检索到）
				docElem.appendChild( elem ).id = expando;
				return !document.getElementsByName || !document.getElementsByName( expando ).length;
			});
			if( support.getById ) {
				Expr.find['ID'] = function( id, context ) {
					if ( typeof context.getElementById !== 'undefined' && documentIsHTML ) {
						var elem = context.getElementById( id );
						return elem && elem.parentNode ? [ elem ] : [];		//需要检查匹配元素的父节点确保它存在document中
					}
				};
				Expr.filter["ID"] = function( id ) {
					var attrId = id.replace( runescape, funescape );		//替换换码符
					return function( elem ) {								//返回选择符处理器，这个函数传入elem，判断elem.id是否是指定id
						return elem.getAttribute("id") === attrId;
					};
				};
				
			} else {
				Expr.find['ID'] = function( id, context ){
					if( typeof context.getElementById !== 'undefined' && documentIsHTML ){
						var node, i, elems,
							elem = context.getElementById( id );
						
						if( elem ){
							node = elem.getAttributeNode('id');
							if( node && node.value === id ){
								return [ elem ];
							}
							elems = context.getElementsByName( id );
							i = 0;
							while( (elem = elems[i++]) ){
								node = elem.getAttributeNode('id');
								if( node && node.value === id ){
									return [ elem ];
								}
							}
						}
						
						return [];
					}
				};
				Expr.filter['ID'] = function( id ){
					var attrId = id.replace( runescape, funescape );
					return function( elem ){
						var node = typeof elem.getAttributeNode !== 'undefined' && elem.getAttributeNode('id');
						return node && node.value === attrId;
					}
				};
			}
			
			Expr.find['TAG'] = support.getElementsByTagName 
				? function( tag, context ){
					if( typeof context.getElementsByTagName !== 'undefined' ){
						return context.getElementsByTagName( tag );
					
					} else if( support.qsa ){
						return context.querySelectorAll( tag );
					}
				} 
				: function( tag, context ){
					var elem, 
						tmp = [], 
						i = 0,
						results = context.getElementsByTagName( tag );
					
					if( tag === '*' ){					//过滤非元素
						while( (elem = results[i++] ) ){
							if( elem.nodeType === 1 ){
								tmp.push( elem );
							}
						} 
						return tmp;
					}
					return results;
				};
			
			Expr.find['CLASS'] = support.getElementsByClassName && function( className, context ){
				if( typeof context.getElementsByClassName !== 'undefined' && documentIsHTML ){
					return context.getElementsByClassName( className );
				}
			};
			
			
			if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {}
			if( (support.matchesSeletor = rnative.test( (matches = docElem.matches 
			|| docElem.webkitMatchesSeletor 
			|| docElem.mozMatchesSeletor 
			|| docElem.oMatchesSeletor 
			|| docElem.msMatchesSeletor) )) ){
				assert(function( elem ){
					support.disconnectedMatch = matches.call( elem, '*' );
				});
			}
			
			
			hasCompare = rnative.test( docElem.compareDocumentPosition );
			contains = hasCompare || rnative.test( docElem.contains ) 
				? function( a, b ){
					var adown = a.nodeType === 9 ? a.docmentElement : a,
						bup = b && b.parentNode;
					return a === bup || !!( bup && bup.nodeType === 1 && ( adown.contains 
						? adown.contains( bup ) : a.compareDocumentPosition && a.compareDocumentPoisition( bup ) & 16 ) );
				}
				: function( a, b ){
					if( b ){
						while( (b=b.parentNode) ){
							if( b === a ){
								return true;
							}
						}
					}
				};
			
			
			return document;
		};
		
		//对结果集去重排序
		Finder.uniqueSort = function( results ) {
			var elem,
				duplicates = [],
				j = 0,
				i = 0;

			hasDuplicate = !support.detectDuplicates;						//除非我们知道可以检测重复项，否则假设他们（重复项）存在
			sortInput = !support.sortStable && results.slice( 0 );			//把参数results转换为数组（slice.call）,得到排序的输入sortInput
			results.sort( sortOrder );										//对参数results按sortOrder排序（在文档出现的先后顺序）,顺便的得到重复项

			if ( hasDuplicate ) {
				while ( (elem = results[i++]) ) {
					if ( elem === results[ i ] ) {			//发现重复项
						j = duplicates.push( i );			//得到重复项索引j（在duplicates中的索引）
					}
				}
				while ( j-- ) {								//遍历duplicates，按索引删除results中的重复项
					results.splice( duplicates[ j ], 1 );	//这里注意，要从后向前遍历；否则会出错
				}
			}

			// Clear input after sorting to release objects
			// See https://github.com/jquery/sizzle/pull/225
			sortInput = null;

			return results;
		};
		
		//选择器处理集合
		Expr = Finder.selectors = {
			cacheLength: 50,			//选择器预处理缓存队列长度
			match: matchExpr,
			attrHandle: {},
			find: {},
			relative: {},
			preFilter: {},
			filter: {
				'TAG': function( nodeNameSelector ) {
					var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
					return nodeNameSelector === '*' ?
						function() { return true; } :
						function( elem ) {
							return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
						};
				},

				'CLASS': function( className ) {
					var pattern = classCache[ className + ' ' ];

					return pattern ||
						(pattern = new RegExp( '(^|' + whitespace + ')' + className + '(' + whitespace + '|$)' )) &&
						classCache( className, function( elem ) {
							return pattern.test( typeof elem.className === 'string' && elem.className || typeof elem.getAttribute !== 'undefined' && elem.getAttribute('class') || '' );
						});
				}
			},

		};
		
		//选择器拆解函数
		tokenize = Finder.tokenize = function( selector, parseOnly ){
			var matched, match, tokens, type,
				soFar, groups, preFilters,
				cached = tokenCache[ selector +' ' ];
				
			if( cached ){
				return parseOnly ? 0 : cached.slice(0);
			}
			
			soFar = selector;
			groups = [];
			preFilters = Expr.preFilter;
			
			while( soFar ){
				//首次执行或多个选择器逗号分隔连写的方式，生成一个新分组
				if( !matched || (match = rcomma.exec(soFar)) ){
					if( match ){
						soFar = soFar.slice( match[0].length ) || soFar;
					}
					groups.push( (tokens = []) );
				}
				matched = false;
				//如果选择器包含关系选择符（父子、兄弟元素）
				if( (match = rcombinators.exec(soFar)) ){
					matched = match.shift();
					tokens.push({
						value: matched,
						type: match[0].replace( rtrim, ' ' )
					});
					soFar = soFar.slice( matched.length );
				}
				//匹配选择符处理器
				for ( type in Expr.filter ) {
					if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
						(match = preFilters[ type ]( match ))) ) {
						matched = match.shift();
						tokens.push({
							value: matched,
							type: type,
							matches: match
						});
						soFar = soFar.slice( matched.length );
					}
				}
				if ( !matched ) {
					break;
				}
			}
			
			return parseOnly ?
				//仅做语法解析直接返回剩余的长度
				soFar.length :
				//需要实际匹配得到分组
				soFar ? 
					//有多余的就抛出错误
					error( "表达式错误", selector ) :
					//返回缓存的分组结构groups
					tokenCache( selector, groups ).slice( 0 );
		};
		
		//合并还原为选择器
		function toSelector( tokens ) {
			var i = 0,
				len = tokens.length,
				selector = "";
			for ( ; i < len; i++ ) {
				selector += tokens[i].value;
			}
			return selector;
		}

		
		// Support: Chrome 14-35+
		// Always assume duplicates if they aren't passed to the comparison function
		support.detectDuplicates = !!hasDuplicate;
		
		//调用setDocument() 当前文档对象初始化操作
		setDocument();
		
		
		return Finder;
		
	})(win, doc, undefined);
	
	
	//扩展原型
	Prime.__struct__.extend({
		init: function(selector, context, root){
			var match, elem;
			
			// 处理: $(""), $(null), $(undefined), $(false)
			if ( !selector ) {
				return this;
			}
			
			// 处理 HTML、strings
			root = root || rootPrime;
			if ( typeof selector === "string" ) {
				if ( selector[ 0 ] === "<" &&
					selector[ selector.length - 1 ] === ">" &&
					selector.length >= 3 ) {
					// Assume that strings that start and end with <> are HTML and skip the regex check
					match = [ null, selector, null ];
				} else {
					match = rquickExpr4Prime.exec( selector );
				}

				// Match html or make sure no context is specified for #id
				if ( match && ( match[ 1 ] || !context ) ) {
					// 处理: $(html) -> $(array)
					if ( match[ 1 ] ) {
						context = context instanceof Prime ? context[ 0 ] : context;

						// Option to run scripts is true for back-compat
						// Intentionally let the error be thrown if parseHTML is not present
						Prime.merge( this, Prime.parseHTML(
							match[ 1 ],
							context && context.nodeType ? context.ownerDocument || context : document,
							true
						) );

						// 处理: $(html, props)
						if ( rsingleTag.test( match[ 1 ] ) && Prime.isplainobject( context ) ) {
							for ( match in context ) {

								// Properties of context are called as methods if possible
								if ( Prime.isfunction( this[ match ] ) ) {
									this[ match ]( context[ match ] );

								// ...and otherwise set as attributes
								} else {
									this.attr( match, context[ match ] );
								}
							}
						}
						return this;

					// 处理: $(#id)
					} else {
						elem = document.getElementById( match[ 2 ] );

						if ( elem ) {

							// Inject the element directly into the jQuery object
							this[ 0 ] = elem;
							this.length = 1;
						}
						return this;
					} 
					
				// 处理: $(expr, $(...))
				} else if ( !context || context.prime ) {
					return ( context || root ).find( selector );
					
				// 处理: $(expr, context)
				// (which is just equivalent to: $(context).find(expr)
				} else {
					// return Prime.find( context ).find( selector );
				}
			
			// 处理: $(DOMElement)
			} else if ( selector.nodeType ) {
				this[ 0 ] = selector;
				this.length = 1;
				return this;

			// 处理: $(function)
			} else if ( Prime.isfunction( selector ) ) {
				return root.ready !== undefined ?
					root.ready( selector ) : 
					// Execute immediately if ready is not present
					selector( Prime );
			}

			return Prime.makearray( selector, this );
		},
		find: function( selector ) {
			var i, ret,
				len = this.length,
				self = this;

			if ( typeof selector !== "string" ) {
				return this.pushstack( Prime( selector ).filter( function() {
					for ( i = 0; i < len; i++ ) {
						if ( Prime.contains( self[ i ], this ) ) {
							return true;
						}
					}
				} ) );
			}
			ret = this.pushstack( [] );
			for ( i = 0; i < len; i++ ) {
				Prime.find( selector, self[ i ], ret );
			}
			return len > 1 ? Prime.uniquesort( ret ) : ret;
		}
	});
	
	//扩展类静态成员
	Prime.extend({
		find: Finder,
		contains: Finder.contains,
		uniquesort: Finder.uniqueSort,
		unique: Finder.uniqueSort
	});
	
	Prime.__struct__.init.prototype = Prime.prototype;			//扩展原型后，重新实现继承属性
	
	rootPrime = Prime( document );
	
})(Prime, window, document);