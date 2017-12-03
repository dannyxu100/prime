var Sizzle =
/*!
 * Sizzle CSS Selector Engine v2.2.0-pre
 * http://sizzlejs.com/
 *
 * Copyright 2008, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-12-16
 */
(function( window ) {

var i,
	//索引

	support,
	//浏览器支持

	Expr,
	//正则表达式

	getText,
	//兼容的getText函数

	isXML,
	//xml文档

	tokenize,
	//解析CSSselector，分组

	compile,
	//编译CSSselector，获得分组

	select,
	//函数，获得结果集

	outermostContext,
	//最外部的上下文

	sortInput,
	//排序输入

	hasDuplicate,
	//重复标志

	// Local document vars
	setDocument,
	//设置文档相关变量，获得相关兼容函数

	document,
	//当前文档

	docElem,
	//document.documentElement

	documentIsHTML,
	//html文档

	rbuggyQSA,
	//QSA的bug

	rbuggyMatches,
	//bug

	matches,

	contains,
	//兼容的contains函数

	// Instance-specific data
	//实例特有的数据


	//使用运算使得Date对象转换为数字，秒数，唯一标识符
	expando = "sizzle" + 1 * new Date(),

	//优先的文档
	preferredDoc = window.document,

	dirruns = 0,
	//遍历方向

	done = 0,
	//结束位置

	classCache = createCache(),
	//类缓存

	tokenCache = createCache(),
	//选择符缓存

	compilerCache = createCache(),
	//编译缓存

	//a b相同，重复标志置真
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// General-purpose constants
	//通用的常量
	//最大负数
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	//每个实例的方法

	//对象的 判断是否有自己的属性 方法
	hasOwn = ({}).hasOwnProperty,

	arr = [],

	//数组的pop方法
	pop = arr.pop,

	//数组的原生push方法
	push_native = arr.push,

	//优化的push
	push = arr.push,

	//数组的slice方法
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// http://jsperf.com/thor-indexof-vs-for/5
	//这个简装的indexOf快一些？？？
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions
	//正则表达式

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	//空白符regexp
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters

	//转换为非字符串型正则表达式 /(?:\\.|[\w-]|[^\x00-\xa0])+/ 匹配'\'+非换行符 or 字母数字下划线短横线中文 or 不是x00到xa0的字符
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	//CSSid的简单模仿，替换正则表达式characterEncoding，添加对#号的筛选
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	//转换成非字符串正则表达式是：
	// reg: \[ 加上 whitespace
	// 加上 *( 加上 characterEncoding 属性名
	// 加上 )(?: 加上 whitespace
	//加上 *([*^$|!~]?=) 操作符
	//加上 whitespace
	//加上 *(?:'((?:\\.|[^\\'])*)'|"((?:\\/|[^\\"])*)"|(identifier))  |) 这里匹配单引号or双引号值or空值
	//加上whitespace 加上*\]
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	//伪类
	pseudos = ":(" + characterEncoding + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
			//单引号or双引号中的内容
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
			//对应((?:\\.|[^\\()[\]]|attributes)*)|
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
			//其他
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	//空白开头，或（\.开头 或 不是\的字符，以空白结尾的字符串）
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	//匹配逗号
	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	//关系选择器
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	//转换为非字符串正则表达式：([^\]'"]*?) 表示尽可能少的匹配不是\]'"的字符后面接任意空白符和]
	//结果的捕获组1是属性的value
	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	//伪类
	rpseudo = new RegExp( pseudos ),
	//匹配identifier字符串
	ridentifier = new RegExp( "^" + identifier + "$" ),

	//匹配项的正则表达式
	matchExpr = {
		//ID选择器，以#开头接characterEncoding
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		//以.开头+characterEncoding
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		//匹配标签名
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		//匹配属性
		"ATTR": new RegExp( "^" + attributes ),
		//匹配伪类
		"PSEUDO": new RegExp( "^" + pseudos ),

		//匹配子节点伪类
		//^:(only|first|last|nth|nth-last)-(child|of-type)(?:\(
		//加上 whitespace
		//加上 *(even|odd|(([+-]|)(\d*)n|)  这里匹配even or odd or [+-]数字n or nothing
		//加上 whitespace*
		//加上 (?:([+-]|) + or - or nothing
		//加上whitespace*
		//(\d+)|))  数字 or nothing
		//加上 whitespace
		//加上*\)|) 这里匹配（）里面内容，or nothing
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),

		//匹配布尔值
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		//以下情况需要知道上下文
		//以关系选择符开头(除开空白符)
		//以伪类选择符开头（除去空白符），后面可能有数字，接空白符，接末尾，或非-字符
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	//匹配input,select,textarea,button
	rinputs = /^(?:input|select|textarea|button)$/i,
	//匹配标题
	rheader = /^h\d$/i,
	//匹配XXX{[native
	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	//快速的获得ID TAG CLASS选择符
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
	//兄弟选择符
	rsibling = /[+~]/,
	//单引号或斜杠
	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	//匹配'\'加（1到6个16进制数or空白or非换行符）
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),

	//这是一个replace的回调函数，后面会用到，esacaped是runescape的捕获组1，
	// escapedWhitespace是捕获组2
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		//high!==high  equal isNaN(high)
		return high !== high || escapedWhitespace ?
			//如果匹配到字母类，high为NaN，NaN！=NaN，返回本身
			//或escaped匹配到\x20空格，high==high;再判断捕获组2的内容，如果有内容说明是空白符
			//也返回本身escaped
			escaped :
			//如果匹配到\xAAA之类的数字，那么上面判断为假，执行下面代码

			high < 0 ?
				// BMP codepoint
				//escaped<0x10000,返回他的字符串形式
				String.fromCharCode( high + 0x10000 ) :

				// Supplemental Plane codepoint (surrogate pair)
				//不知道有什么用...
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	};

// Optimize for push.apply( _, NodeList )
	//优化push.apply函数
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			//NodeList.length不可信
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

	//sizzle函数，获得匹配的结果集
function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	//如果上下文存在，获取context.ownerDowcument或context,否则获取preferredDoc；
	// 再比较是否与document相同，不同就调用setDocument（context）
	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	//获得context，results
	context = context || document;
	results = results || [];
	//上下文节点类型
	nodeType = context.nodeType;

	//如果selector不是string,selector不存在，
	// 上下文节点类型不是元素节点、也不是Document类型、也不是DocumentFragment类型
	//直接返回结果
	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	//
	if ( !seed && documentIsHTML ) {
		//seed不存在


		// Try to shortcut find operations when possible (e.g., not under DocumentFragment)
		if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {
			//selector只存在三种选择器的情况下（id，tag，class）,的快速处理方法
			//context类型不是DocumentFragment,且selector中匹配到rquickExpr
			// Speed-up: Sizzle("#ID")
			//先处理ID选择器，有效缩小查找范围，提升速度
			if ( (m = match[1]) ) {
				//第一个捕获组存在，即存在ID选择器
				if ( nodeType === 9 ) {
					//context是Document类型
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document (jQuery #6963)
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						//有些浏览器使用getElementById也返回name，需要去除
						if ( elem.id === m ) {
							//判断id是否与捕获组1相同，用来过滤name属性为m，但是id不是m的元素
							results.push( elem );
							return results;
						}
					} else {
						//elem不存在
						return results;
					}
				} else {
					// Context is not a document
					//上下文不是Document类型
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						//上下文不是Document类型，如果context.ownerDocument存在且其中存在id/name为m的元素，
						// 且该元素是context的子元素,且该元素的id为m
						//添加elem到结果集，返回结果
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
				//标签名选择器
			} else if ( match[2] ) {
				//如果标签名存在第二个捕获组
				//使用getElementsByTagName返回内容添加到结果集
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// Speed-up: Sizzle(".CLASS")
				//类选择器，处理最慢放到最后
			} else if ( (m = match[3]) && support.getElementsByClassName ) {
				//第三捕获组存在内容，即类选择器；而且浏览器支持getElementsByClassName
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// QSA path
		//querySelectorAll
		if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
			//浏览器支持querySelectorAll且（rbbuggyQSA不存在或selector没有与rbuggyQSA匹配的）

			//唯一标识符
			nid = old = expando;
			newContext = context;
			//nodeType==1返回false，nodeType！=1返回selector
			newSelector = nodeType !== 1 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				//context为元素节点,节点名不是object

				//对selector分组
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					//如果上下文有id属性，赋给old

					//修改nid的值为 替换old中的每个单引号和斜杠为$&
					nid = old.replace( rescape, "\\$&" );
				} else {
					//没有id属性，则给上下文设置id属性为nid,即sizzle+数字（时间.tostring）
					//这样保证context有id属性，让QSA正常工作
					// qSA works strangely on Element-rooted queries
					// We can work around this by specifying an extra ID on the root
					// and working up from there (Thanks to Andrew Dupont for the technique)
					context.setAttribute( "id", nid );
				}
				//给nid包装一下，做成一个属性选择器
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					//给分组的每个选择器添加头部 nid属性选择器
					groups[i] = nid + toSelector( groups[i] );
				}
				//如果selector存在+~兄弟选择器，且上下文的父节点是符合要求的上下文
				// （看testContext测试参数是否有getElementsByTageName，返回参数本身或false）
				//返回context.parentNode
				//否则返回context本身
				newContext = rsibling.test( selector ) && testContext( context.parentNode ) || context;

				//以逗号分割分组（每个分组项前面添加了id属性选择器）
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				//如果newSelector存在
				try {
					//使用qsa得到结果
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						//如果old标识符为空，移除上下文id属性
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	//其他情况调用select函数，去掉selector前后的空白作为参数
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			//keys的长度大于Expr.cacheLength,删除keys的第一项并且移除cache对应的项
			delete cache[ keys.shift() ];
		}
		//添加到cache
		return (cache[ key + " " ] = value);
	}
	//返回cache对象,
	// (由于cache对象包含了cache函数，cache函数调用了父级函数作用域变量keys，
	// 外部引用了cache，形成闭包
	// keys成为chche私有变量)
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
//标记函数
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
//测试函数fn传入DOM元素div的返回值
function assert( fn ) {
	var div = document.createElement("div");

	try {
		//!!转换为bool值
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
//attrs用 | 分割的属性列表
	//给所有属性添加相同的处理程序
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = attrs.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
//检查ab先后顺序
function siblingCheck( a, b ) {
	var cur = b && a,
		//如果b存在且a存在，返回a
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
				//~b.index即对b.index按位取反，不能转换为数字则返回NaN
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	//如果支持sourceIndex就使用它,否则使用nextSibling检查
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
//返回一个检测elem是input类型 且 type属性为指定的type的函数
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
//返回一个检测节点名是input或button，type属性是指定的type的函数
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
//传入参数fn，返回一个函数，调用这个函数（argument）又返回一个函数（seed，matches），
//这个函数给fn传入参数[],seed.length,argument
// fn返回matchIndexes，seed中匹配matchIndexes的项取反，matches得到匹配项
function createPositionalPseudo( fn ) {
	//返回标记的函数
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					//如果seed[j]存在，seed[j]取非
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
//测试节点是否符合成为Sizzle的上下文
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
//测试是否是XML
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, parent,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// If no document and documentElement is available, return
	//如果doc是docuemnt或不是Document类型或没有doc.documentElement，返回document
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	//设置document,docElem,parent
	document = doc;
	docElem = doc.documentElement;
	parent = doc.defaultView;

	// Support: IE>8
	// If iframe document is assigned to "document" variable and if iframe has been reloaded,
	// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
	// IE6-8 do not support the defaultView property so parent will be undefined
	//如果iframe document被分配给 “document” 变量且iframes重新加载了，
	// 访问document变量时，IE会抛出“没有权限”的错误；
	//IE678不支持defaultView属性，parent会是undefined
	if ( parent && parent !== parent.top ) {
		// IE11 does not have attachEvent, so all must suffer
		//IE11没有attachEvent，所以先检查addEventListerer
		if ( parent.addEventListener ) {
			//卸载页面时，卸载处理函数
			parent.addEventListener( "unload", unloadHandler, false );
		} else if ( parent.attachEvent ) {
			parent.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Support tests
	---------------------------------------------------------------------- */
	//浏览器支持测试
	documentIsHTML = !isXML( doc );

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	//检查getAttribute真的返回了属性值，而不是（调用它的对象的）属性
	//(排除IE8的布尔值)
	support.attributes = assert(function( div ) {
		div.className = "i";
		//这里设置了类名，应该用"class"取得i;
		// 如果使用“className”取得i，返回false;
		//即设置了DOM元素的attribute，而不是对象的property
		return !div.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	//检查getELementsByTagName（“*”）返回的是否只有元素节点类型（可能有注释节点）
	support.getElementsByTagName = assert(function( div ) {
		//创建并添加注释节点
		div.appendChild( doc.createComment("") );
		//使用getElementsByTagName("*")如果得到结果length不为0，返回false
		return !div.getElementsByTagName("*").length;
	});

	// Support: IE<9
	//测试是否支持getElementsByClassName
	support.getElementsByClassName = rnative.test( doc.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programatically-set names,
	// so use a roundabout getElementsByName test
	//破getElemenById方法不收集程序设置的name属性，所以迂回的使用getElementsByName测试
	support.getById = assert(function( div ) {
		docElem.appendChild( div ).id = expando;
		//doc不支持getElementsByName或以id为参数没有获得元素，返回true
		return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
	});




	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				//blackberry4.6返回不在document的节点，需要检查匹配元素的父节点确保它存在document中
				return m && m.parentNode ? [ m ] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			//替换id中的\aaaa为对应字符
			var attrId = id.replace( runescape, funescape );

			//返回函数，这个函数传入elem，判断elem.id是否是指定id
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		//getElementById不被支持
		//使用getAttributeNode代替
		//删除Expr.find["ID"]
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				//获得属性节点ID
				var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
				//DocumentFragment对象没有getElementsByTagName,使用qsa
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				//碰巧，（破）gBEBN也出现在DocumentFragment节点中
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			//过滤掉可能的注释节点
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	//如果支持gEBCN
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	//(:active)选择符在IE9、Opera11.5中报错，当它应该是正确的时候
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	//qsa(:focus)选择符报错，当应该是正确的时候，在Chrome21中
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See http://bugs.jquery.com/ticket/13378
	//在IE8/9中访问iframe的document.activeElement总会抛出错误，
	// 所以允许（:focus）传递给QSA来避免这个BUG
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
		//支持原生的QSA

		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		//建立QSA正则表达式规则
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			//Select被故意置空字符串，
			// 用来测试IE如何处理没有明确的
			// 设置一个布尔值属性，
			// 因为它的存在就足够了
			docElem.appendChild( div ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\f]' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section

			//如果^=,$=,*=后面为空字符串，不应该返回任何东西
			if ( div.querySelectorAll("[msallowcapture^='']").length ) {
				//返回了内容，浏览器对QSA支持有bug，给rbuggyQSA添加正则表达式
				//[*^$]=whitespace*(?:'|"")
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			//布尔类型属性和value属性未被正确处理
			if ( !div.querySelectorAll("[selected]").length ) {
				//没有得到已设置的布尔类型属性
				//给rbuggyQSA添加正则表达式\[whitespace*(?:value|booleans)
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.2+, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.7+
			if ( !div.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				//~=操作符未被正确处理，给rbuggyQSA添加正则表达式 ~=
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			//：checked应该返回selected的options
			if ( !div.querySelectorAll(":checked").length ) {
				//没有正确处理:checked，给rbuggy添加正则表达式 :checked
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibing-combinator selector` fails
			if ( !div.querySelectorAll( "a#" + expando + "+*" ).length ) {
				//这个对.#.+[+~]处理不正确？？？
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( div ) {
			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = doc.createElement("input");
			input.setAttribute( "type", "hidden" );
			div.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			//强制对name属性大小写敏感
			if ( div.querySelectorAll("[name=d]").length ) {
				//大写属性用小写查找得到，给rbuggyQSA添加正则表达式 name whitespace* [*^$|!~]?=
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			//IE8在这里会抛出错误，不再执行后面的测试
			//在FF3.5   hidden元素一人enable
			if ( !div.querySelectorAll(":enabled").length ) {
				//对hidden处理不正确导致endble和disable不再可靠
				//添加正则表达式
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			//opera10-11对无效的伪类不抛出错误，会继续执行
			div.querySelectorAll("*,:x");
			//添加正则表达式
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {
		//如果支持原生的matchesSelector

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			//这里应该执行失败，抛出错误
			matches.call( div, "[s!='']:x" );
			//没有抛出错误，添加正则表达式
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	//rbuggyQSA为false或以|分割之前的push的正则表达式，rbuggyMatches类似
	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */

	//测试是否支持原生compareDocumentPosition
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	//contains方法
	contains = hasCompare || rnative.test( docElem.contains ) ?
		//支持原生compareDocumentPosition或contains
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			//a就是b的父节点，返回true
			//bup存在且是元素节点，若adown有contains方法，返回adown.cotains(bup),
			// 否则返回a.compareDocumentPosition(bup)&16
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		//不支持原生方法
		//b向上遍历父元素，找到与a比较，相同就返回true，没找到就false
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	//排序函数
	sortOrder = hasCompare ?
		//浏览器支持cdp方法
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			//ab相同，hasDuplicate置true，返回0
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		//如果只有一个有cdp方法，用已经存在的方法排序，返回
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		//两个都有cdp方法，两个属于同一文档
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			//断开连接置1
			1;

		// Disconnected nodes
		//断开连接的节点
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			//选择第一个和preferredDoc有关的元素
			// Choose the first element that is related to our preferred document
			if ( a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order

			return sortInput ?
				//使用原来的在sortInput的顺序
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
		//不支持原生cdp方法
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			//a or b 没有父节点
			return a === doc ? -1 ://a为doc返回-1
				b === doc ? 1 ://b为doc返回1
				aup ? -1 ://aup存在返回-1
				bup ? 1 ://bup存在返回1
				sortInput ?//sortInput存在返回原顺序
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			//如果是兄弟节点，快速比较
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			//从数组头部添加父节点
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			//从数组头部添加父节点
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		//从祖先元素开始遍历整棵树，寻找不同
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			//i>0,比较出现分歧的两个节点先后
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			//i=0没有共同的祖先元素，preferredDoc排在前面
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};
	//返回doc对象
	return doc;
};

	//检查多个元素匹配expr的部分
Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

	//兼容的matchesSelector，检查单个元素elem是否匹配expr
Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	//如果elem所属文档不是当前文档，重设文档相关变量
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	//去掉属性选择器多余的空白，添加单引号确保属性值被引号包围
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		//浏览器对matchesSelector，qsa的支持很完美
		try {
			//使用原生的machesSelector得到结果
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			//IE9的matchesSelector处理断开连接的节点时返回false，
			// 当ret有结果 or 浏览器支持断开的节点匹配 or elem不在documentFragment中时，返回ret
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {
			//出现错误，静默失败
		}
	}
	//浏览器不能完美支持qsa和matchesSelector，使用Sizzle函数，候选集设置为[elem]，检查返回结果
	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

	//检查包含关系，调用setDocument函数中定义的contains函数
Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	//获得attrHandle
	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
	//不要被Object.prototype的属性骗了
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			//检查有没有自己的name属性
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		//val为undefined时
		support.attributes || !documentIsHTML ?
			//支持getAttribute或是XML文档
			elem.getAttribute( name ) :
			//不支持getAttribute且是HTML文档
			(val = elem.getAttributeNode(name)) && val.specified ?
				//得到属性节点且有specified标记（标记在对象本身中的属性），返回属性节点value
				val.value :
				null;
};
//用来抛出错误的函数
Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
//唯一性的排序（去重）
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence

	//除非我们知道可以检测重复项，否则假设他们（重复项）存在
	hasDuplicate = !support.detectDuplicates;

	//把参数results转换为数组（slice.call）,得到排序的输入sortInput
	sortInput = !support.sortStable && results.slice( 0 );

	//对参数results按sortOrder排序（在文档出现的先后顺序）,顺便的得到重复项
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		//发现重复项
		while ( (elem = results[i++]) ) {
			//遍历results

			if ( elem === results[ i ] ) {
				//检测到相邻的重复项，添加后者在results的索引到duplicates，
				//得到重复项索引j（在duplicates中的索引）
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			//遍历duplicates，按索引删除results中的重复项
			//这里注意，要从后向前遍历；否则会出错
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225

	//这里又置空了，暂时不知道有什么用（有点像锁机制，不过js不是单线程么？？？）
	sortInput = null;

	//返回结果
	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
//一个用来检测DOM节点（数组）的文本值的通用函数
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		//没有nodeType，可能是node数组
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			//遍历数组节点，把结果连接起来
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)

		//如果是元素节点/Document类型/DocumentFragment类型
		//使用textContent属性
		//移除了innerText来保证一致性
		if ( typeof elem.textContent === "string" ) {
			//是字符串类型
			return elem.textContent;
		} else {
			// Traverse its children
			//否则遍历孩子节点
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				//递归调用
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		//如果是文本节点，或CDATA Section，返回nodeValue
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes
	//上面的判断保证了不会包含注释或处理命令节点

	//返回结果
	return ret;
};

	//Expr对象，Sizzle.selectors对象的定义
Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	//用户可调整
	cacheLength: 50,

	createPseudo: markFunction,

	//包含了ID，TAG，CLASS，ATTR，PSEUDO等选择器的正则表达式
	match: matchExpr,

	attrHandle: {},

	find: {},

	//关系选择器
	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	//预过滤
	preFilter: {
		//属性选择器预过滤
		"ATTR": function( match ) {
			//属性名放到match1
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			//匹配的属性值放到match3，不管有没有引号
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				//如果操作符是~=，给match3前后加空格
				match[3] = " " + match[3] + " ";
			}

			//返回match前四个元素
			return match.slice( 0, 4 );
		},

		//child选择器预处理
		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			//捕获组1，小写
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				//以nth开头的情况

				// nth-* requires argument
				if ( !match[3] ) {
					//nth-需要参数，参数在第三个捕获组中，如果第三个捕获组没有内容，则抛出错误
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				//false/true分别对应0/1

				//捕获组4存放 xn+y形式的 x的符号和x；
				//如果没有捕获到x（被省略）置1，
				//如果是odd或even的形式，x置2
				//捕获组5存放 xn+y形式的 y的符号和y；
				//捕获组7和捕获组8分别和其对应，如果是odd、even形式，是odd的y置1，否则置0
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				//其他情况不能有参数，否则抛出错误
				Sizzle.error( match[0] );
			}

			//返回处理过的match
			return match;
		},

		//伪类选择器预处理
		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];
			//对照前面的正则表达式看
			//捕获组6匹配attributes，捕获组2包含了3,4,5,6，anything else

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				//如果是CHILD选择器，返回null
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				//捕获组3是单引号或双引号的内容
				//给捕获组2赋值为 单引号捕获组内容 或双引号捕获组内容 或双引号空值
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
				//去掉没有引号的参数的多余内容
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)

			//处理过后捕获组1是伪类明，捕获组2是参数，返回前三个捕获组
			return match.slice( 0, 3 );
		}
	},

	//过滤函数
	filter: {

		//标签过滤函数
		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				//选择符为统配选择符，直接返回true
				function() { return true; } :
				//否则比较传入参数elem，比较elem的节点名再返回结果
				//这里有形成闭包
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		//类过滤函数
		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];
			//classCache是一个缓存对象
			//调用classCache（name，value），给缓存添加键值对，返回value值
			//这里试图从缓存获得className对应的值

			return pattern ||
					//如果从缓存中获得该值，返回它
					//否则建立className的regex，给缓存添加className键值对，并返回该值
					//这里的值是函数，函数作为一个变量和className组成键值对（这里又形成闭包）
					//函数返回值是布尔值，即测试elem.className是否匹配 or elem.getAttribute获得class是否匹配
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {

					//这里的function作为className的值存入缓存
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		//属性预过滤
		//check是检查值，name属性名，operator是操作符
		//返回布尔值
		"ATTR": function( name, operator, check ) {

			//返回函数，函数需要参数elem
			return function( elem ) {

				//获取elem的name属性
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					//如果result为空，操作符是！=返回true，否则返回false
					return operator === "!=";
				}
				if ( !operator ) {
					//如果没有操作符，result不为空，那么属性存在，返回true
					return true;
				}

				//有操作符，result不为空
				//加上空格，check后面会加上空格，方便比较
				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
						//slice（-xxx.length）检测结尾
					operator === "$=" ? check && result.slice( -check.length ) === check :
						//check后面有空格，所以匹配会正确工作
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
						//e.g.  en-
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},


		//子元素选择器过滤
		/* matches from matchExpr["CHILD"]
		 1 type (only|nth|...)
		 2 what (child|of-type)
		 3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
		 4 xn-component of xn+y argument ([+-]?\d*n|)
		 5 sign of xn-component
		 6 x of xn-component
		 7 sign of y-component
		 8 y of y-component
		 */
		"CHILD": function( type, what, argument, first, last ) {
			//first对应x
			//last对应y
			//匹配xn+y
			var simple = type.slice( 0, 3 ) !== "nth",
				//简单的子选择器

				forward = type.slice( -4 ) !== "last",
				//前向选择

				//类型限定
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				//x=1,y=0即参数为n，检查有无父元素，直接返回
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						//这里如果是简单选择器且不是向前寻找的
						// 或者 不是简单选择器（nth）且是向前的，则设置dir为nextSibling；
						//否则设置dir为previousSibling
						//尽量选择合适的查找方向

						parent = elem.parentNode,

						//ofType限定的标签名
						name = ofType && elem.nodeName.toLowerCase(),

						//不是xml且没有限定类型，使用缓存
						//使用了限定类型再使用缓存意义不大；
						//xml的查询也不会有很多，所以不缓存（我的理解）
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							//简单选择器
							while ( dir ) {
								//按合适的方向查找
								node = elem;
								while ( (node = node[ dir ]) ) {
									//遍历dir方向的元素节点
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										//按一定条件在对应方向上查找到其他元素，返回false；
										//这里只有first，last，only
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								//为only选择符反转方向
								//设置start后再次执行到这里的时候dir被置false；停止循环
								start = dir = type === "only" && !start && "nextSibling";
							}
							//上面检查了不匹配的情况。这里返回true
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];
						//如果不是last，设置start为[firstChild]，否则设置为[lastChild]

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							//向前搜索，且不是xml文档，没有oftype，使用缓存

							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							//parent上的缓存

							cache = outerCache[ type ] || [];
							//

							//cache0存dirruns
							//cache1存nodeIndex
							//cache2存diff
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							//这样的表达式好烦诶
							while ( (node = ++nodeIndex && node && node[ dir ] ||
									//++nodeIndex不为0且node存在，执行node=node[dir]

								// Fallback to seeking `elem` from the start
									//上面的不成立则置diff，nodeIndex为0，执行node=start.pop();
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									//node是元素节点且++diff不为0且node就是elem
									//如果nodeType！==1 diff不会增加
									//把dirruns nodeIndex diff存入父节点缓存，退出循环
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
							//如果有缓存结果，就使用它们
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];
							//cache[type]存在，diff置缓存的nodeIndex

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							//相同的循环
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									//限制节点类型则检查节点是否是限制的类型，否则检查节点是否是元素节点；满足条件再++diff，diff转换为布尔值为真再执行下面代码
									// Cache the index of each encountered element
									if ( useCache ) {
										//在查找过程中缓存遇到的节点的diff
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						//diff减去y
						//diff==x或diff是x的非负倍数，则匹配成功
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		//伪类过滤
		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			//伪类大小写不敏感
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			//优先考虑大小写敏感万一自定义伪类添加了大写字母
			// Remember that setFilters inherits from pseudos
			//setFilters继承自pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
						//优先考虑pseudos，不行再setFIlters  toLowercase
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			//用户可能使用createPseudo指明需要参数来创建过滤函数，就像Sizzle一样
			if ( fn[ expando ] ) {
				//原来这个标记这么用啊....
				return fn( argument );
			}

			// But maintain support for old signatures
			//维护旧的签名
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					//setFilters有自己的属性pseudo
					markFunction(function( seed, matches ) {
						//候选集seed，匹配的结果matches
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							//seed被匹配的项置false
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}
			//返回过滤函数
			return fn;
		}
		//filter结束
	},

	//伪类过滤函数
	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			//去除传递给compile函数的selector前后的空白以免误认为空白是关系选择符
			var input = [],
				results = [],
				//返回对应的过滤函数
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				//有标记，用户创建的
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				//没有标记
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			//返回过滤函数
			return function( elem ) {
				//调用Sizzle（）
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				//优先使用原生方法，不行在使用getText
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
							//是html，直接取得lang属性
						elem.lang :
							//是xml
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						//相等，或以lang-开头
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
					//向上遍历父节点，找到最近的lang属性
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );

				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			//兼容safari
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			//属性节点不作为子节点出现
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				//发现小于6的节点类型则不为空
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		//节点不为空即为父节点
		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		//h1-h6
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			//两种情况
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		//在结果集的位置
		//使用createPositionalPseudo创建位置过滤函数，fn返回匹配的index就可以了
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

	//nth与eq相同的过滤函数
Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	//使用createInputPseudo函数创建对应的过滤函数
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	//使用createButtonPseudo创建对应的过滤函数
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();
	//继承自filters，而Expr.filters被置为Expr.pseudos

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	//处理选择器，分组，每组按序分解选择符
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		//标记缓存
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		//只是语法解析，返回0，否则返回分组
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {
		//从左边开始匹配，每匹配一个选择符，入栈
		//切断已经匹配的，继续匹配

		// Comma and first run
		//遇到逗号或第一次运行
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
				//去掉第一个（上一个结束的）无效的逗号（逗号前面是空白开头）
			}
			//创建新的tokens
			groups.push( (tokens = []) );
		}

		//置false
		matched = false;

		// Combinators
		//关系选择器
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			//从头部移出一项
			//存入tokens
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				//替换后代选择器为空格
				//match0现在是捕获组1，即关系选择符
				type: match[0].replace( rtrim, " " )
			});
			//去掉匹配的
			soFar = soFar.slice( matched.length );
		}

		// Filters
		//Expr.filter定义的过滤选择器
		for ( type in Expr.filter ) {
			//遍历filter
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
					//当前type匹配到sofar，捕获内容赋值给match
				(match = preFilters[ type ]( match ))) ) {
				//preFilter中有type，预处理结果给match

				matched = match.shift();
				tokens.push({
					value: matched,
					//匹配的全部内容

					type: type,
					//类型

					matches: match
					//对sofar的捕获组
				});
				//下一个
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			//结束时没有匹配到内容，退出循环
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		//只是语法解析
		//返回多余的长度
		soFar.length :
		//需要实际匹配得到分组
		soFar ?
			//有多余的就抛出错误
			Sizzle.error( selector ) :
			// Cache the tokens
			//缓存groups
			tokenCache( selector, groups ).slice( 0 );
};

	//tokens转换为selector
function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

	//生成关系选择符过滤函数
function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		//最近的祖先元素
		// Check against closest ancestor/preceding element
		//返回此函数作为combinator的过滤函数
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					//如果遇到元素节点，或没有父节点
					//返回代用matcher的结果
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		//first不存在，返回此函数
		function( elem, context, xml ) {
			var oldCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			//不能在xml节点上设置任意的data，所以他们不能从dir chaching获益
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							//判断matcher结果，返回true，如果为false，还要继续遍历
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						//获得、创建外部缓存

						if ( (oldCache = outerCache[ dir ]) &&
								//把outerCache[dir]赋值给oldCache，如果它存在，即有缓存可用，继续

							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {
							//第一项全等于dirruns 且 第二项全等于doneName，即方向与结果都存在，继续

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
							//把这个缓存第三项传递给newCache[2]（newCaChe在outerCache中，outerCache在elem[expando]中），
							// 并返回它作为结果
							// 这一项代表这个elem在当前dir，doneName下，macher的结果；

						} else {
							//outerCache不存在，即第一次便利到这个元素

							// Reuse newcache so results back-propagate to previous elements
							outerCache[ dir ] = newCache;
							//把newCache传递给outerCache[dir]，即存入elem[expando]，建立缓存

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								//matcher当前元素结果复制给newCahce[2],如果结果为真，返回true，否则继续遍历。
								return true;
							}
						}
					}
				}
			}
		};
}

	//matchers为数组的情况，返回过滤函数
function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		//如果有多个matcher函数，每个函数都要测试
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				//有一个不为真，就返回false
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		//只有一个matcher函数，则matcher函数本身即可作为过滤函数
		matchers[0];
}


//多个上下文的情况，对每个上下文调用Sizzle，合并结果
function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

	//根据filter缩小unmatched范围，保留map对应
	//如果不传入filter，context，xml可以只生成unmatched对应的map
function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			//遍历unmatched
			if ( !filter || filter( elem, context, xml ) ) {
				//过滤函数不存在或过滤结果为真

				newUnmatched.push( elem );
				if ( mapped ) {
					//map不为null，给map添加对应的索引
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}



	//设置匹配处理函数，参数有预过滤函数，选择器，matcher函数，后置过滤函数，后置查找函数，后置选择器
function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		//如果有后置过滤函数，且没有expando标记

		postFilter = setMatcher( postFilter );
		//postFilter置为调用setMatcher获得的函数
	}
	if ( postFinder && !postFinder[ expando ] ) {
		//如果有后置 查找函数，且没有expando标记

		postFinder = setMatcher( postFinder, postSelector );
		//postFinder置调用setMatcher获得的函数
	}
	//返回标记的函数，这样就不会无限嵌套
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			//获得候选集，没有候选集则使用context的内容（经过selector过滤）
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			//对输入集进行预处理，缩小输入集，保留一个map来同步候选集结果
			matcherIn = preFilter && ( seed || !selector ) ?
				//这里使用preFilter过滤elems，对应的preMap
				condense( elems, preMap, preFilter, context, xml ) :
				//不过滤
				elems,

			matcherOut = matcher ?
				//matcher存在
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				//如果有postFinder，或过滤过的候选集，或没有候选集的postFilter，或有之前就存在的结果
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					//立即处理
					[] :

					// ...otherwise use results directly
					//否则直接使用结果
					results :
				//matcher不存在，返回输入
				matcherIn;

		// Find primary matches
		//寻找主要的匹配项
		if ( matcher ) {
			//对matcherIn过滤，得到matcherOut
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		//对输出应用postFilter（后置过滤器）
		if ( postFilter ) {
			//产生对应的postMap（没有传入filter，不过滤）
			temp = condense( matcherOut, postMap );
			//再使用postFilter对temp过滤，被匹配的temp项被置false
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			//移动匹配失败的项到matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					//temp[i]为真，即当前项没有被匹配（在condense中被匹配的被置false）

					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
					//matcherOut也置false，且把没有匹配的放回matcherIn中
				}
			}
		}

		if ( seed ) {
			//如果候选集存在

			if ( postFinder || preFilter ) {
				//如果有postFinder或preFilter

				if ( postFinder ) {
					//如果有postFinder

					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					//通过压缩当前matcherOut到postFinder的上下文获得最终的matcherOut
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match

							temp.push( (matcherIn[i] = elem) );
							//把matcherOut赋值到temp，且同时存入matcherIn
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
					//调用postFinder，对temp，得到结果matcherOut
				}

				// Move matched elements from seed to results to keep them synchronized
				//把匹配的元素从seed移动到results来保持同步
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
							//遍历matcherOut

						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {
						//如果有postFInder，只能用indexOf获得索引
						//没有postFinder，可以使用preMap获得索引

						seed[temp] = !(results[temp] = elem);
						//seed对应的项置false，把matcherOut复制到results中
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			//seed不存在

			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				//postFinder存在，过滤matcherOut添加到results
				postFinder( null, results, matcherOut, xml );
			} else {
				//postMatcher不存在，直接添加到results
				push.apply( results, matcherOut );
			}
		}
	});
}

	//通过解析的selector来获得对应的过滤函数
function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		//relative是关系选择符与对应的dir和first
		//前导的关系
		leadingRelative = Expr.relative[ tokens[0].type ],
		//隐式的关系
		implicitRelative = leadingRelative || Expr.relative[" "],
		//leadingRelative存在，i置1，否则置0
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		//获得基础的过滤函数，匹配checkContext
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),

		//checkContext有elem就匹配，这里的context是数组，即多个context，匹配任意一个就可以
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),

		//matchers函数数组
		matchers = [ function( elem, context, xml ) {

			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
					//前导关系不存在，且是xml，返回true，不是xml且context不是最外面的context返回true
					//否则：执行下面代码

				(checkContext = context).nodeType ?

					//context是单个的，使用matchContext得到结果
					matchContext( elem, context, xml ) :

					//context是数组，使用matchAnyContext得到结果
					matchAnyContext( elem, context, xml ) );

			// Avoid hanging onto element (issue #299)

			//置空
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			//在relative中有当前的选择符

			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
			//先调用elementMatcher获得匹配matchers中所有函数的过滤函数，
			// 把此函数作为参数传递给addCombinator，获得当前matcher的过滤函数，最后用数组包裹

		} else {
			//在relative中没有当前选择符

			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );
			//把token[i].matches传递给filter[type]，得到对应的过滤函数matcher

			// Return special upon seeing a positional matcher

			if ( matcher[ expando ] ) {
				//如果有expando标记，他是位置匹配器
				//需要特殊处理

				// Find the next relative operator (if any) for proper handling

				//先找到下一个关系选择器
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}

				return setMatcher(
					//调用setMatcher获得对应的过滤函数，返回

					i > 1 && elementMatcher( matchers ),
					//不是第一个选择器就要预过滤函数参数matchers

					i > 1 && toSelector(
						//不是第一个选择器就需要前置选择器，即当前位置匹配器前面的所有选择器

						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
						//如果当前位置匹配器前面是后代关系选择符，后面插入隐式的统配符*

					).replace( rtrim, "$1" ),
					//转换为selector字符串，去掉左右空白符，作为前置选择器

					matcher,
					//匹配函数

					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					//如果i<j,即当前位置匹配器到下一个关系选择器之间有其他选择器，需要后置过滤函数postFilter
					//递归调用函数本身得到对应的postFilter

					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					//如果j<len即下一个关系选择符后面还有其他选择器，需要传入postFinder参数过滤
					//同样递归调用本函数，获得对应的postFinder

					j < len && toSelector( tokens )
					//获得剩余的选择器，传入postSelector参数（）tokens在上一步被赋值为剩余的token

				);
			}

			//运行到这里，说明不是位置匹配器，直接入栈
			matchers.push( matcher );
		}
	}

	//到这里，整个tokens被处理完毕，所有处理函数按序排列在matchers中，
	// 此时调用elementMatcher，获得符合所有matchers项的过滤函数
	return elementMatcher( matchers );
}

	//多个elementMatcher和多个setMatcher的情况下，返回superMatcher
function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				//获得seed，或outermost的所有内容

				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context !== document && context;
				//context不是document则设置context为outermostContext
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				//遍历候选集

				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						//符合elementMatchers任意一个函数就添加到结果集

						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}

					if ( outermost ) {
						//如果context是最外部的，dirruns置为dirrunsUnique唯一的
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						//！matcher意味着前面的matchers一个也没有匹配到
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
						//添加到未匹配组
					}
				}
			}
			//到这里遍历完毕

			// Apply set filters to unmatched elements
			//对未匹配组使用setfilters
			matchedCount += i;
			//此时i等于len，matchCount意味着匹配的数量，i===matchCount意味着matchCount之前为0，未匹配组为0；
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
					//每个setfilter都应用到unmatched上，匹配的放到setMatched
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					//重建element matches避免排序
					if ( matchedCount > 0 ) {
						//之前有匹配项

						while ( i-- ) {
							//从后向前遍历

							if ( !(unmatched[i] || setMatched[i]) ) {
								//不在umatched也不再setMatched中，从results中探出栈
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					//去除索引占位符（即值为false的）得到真正的匹配项
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );
				//添加到结果集

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					//去重
					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	//返回superMatcher
	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

//把selector分组，得到对应的elementMatchers或setMatchers，再调用matcherFromGroupMatchers获得总的matcher
	//并缓存到compilerCache中，以后使用相同selector时，直接查询的到结果。
compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		//无缓存

		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			//无匹配组

			match = tokenize( selector );
			//分析selector，分割成数组
		}
		i = match.length;
		while ( i-- ) {
			//从后向前遍历match

			cached = matcherFromTokens( match[i] );
			//获得match[i]的处理函数

			if ( cached[ expando ] ) {
				//有expando标记

				setMatchers.push( cached );
				//把该函数添加到setMatchers，集合过滤函数
			} else {
				//没有expando标记

				elementMatchers.push( cached );
				//把该函数添加到elementMatchers，元素过滤函数
			}
		}

		// Cache the compiled function
		//调用matcherFromGroupMatchers得到总的处理函数，再把这个函数缓存到complierCache中
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		//添加属性selector
		cached.selector = selector;
	}

	//返回cached
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		//selector是function类型（compile得到的结果），compiled置selector

		match = !seed && tokenize( (selector = compiled.selector || selector) );
		//seed不存在时，match赋值为selector的解析结果

	results = results || [];

	// Try to minimize operations if there is no seed and only one group

	if ( match.length === 1 ) {
		//seed不存在且selector只有一个分组

		// Take a shortcut and set the context if the root selector is an ID

		tokens = match[0] = match[0].slice( 0 );
		//数组化，（第一组也是唯一一组）

		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				//tokens长度大于2 且 以ID选择符开头，（快速处理方法）

				support.getById && context.nodeType === 9 && documentIsHTML &&
				//支持getById，context是docuemnt，文档是html

				Expr.relative[ tokens[1].type ] ) {
				//第二个选择符是关系选择符

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			//设置上文为当前ID指向的元素

			if ( !context ) {
				//如果上下文不存在，返回结果
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
			//最后，去掉第一个选择符
		}


		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		//如果selector需要上下文（对照matchExpr看），i置0，否则置tokens.length

		while ( i-- ) {
			//不需要上下文，从右向左遍历tokens
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				//遇到关系选择符，break；
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				//type对应的find函数存在

				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
						//当前对应的selector

					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
						//如果是兄弟选择符，返回parentNode，否则原来的context，作为find的参数
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					//移除当前选择符

					selector = seed.length && toSelector( tokens );
					//获得当前selector

					if ( !selector ) {
						//selector没有剩余的

						push.apply( results, seed );
						//候选集添加到结果集

						return results;
						//返回结果
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		//候选集
		context,
		//上下文
		!documentIsHTML,
		//xml
		results,
		rsibling.test( selector ) && testContext( context.parentNode ) || context
		//outermostContext
	);//调用superMatcher
	//返回结果
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
	// Should return 1, but returns 4 (following)
	return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
	div.innerHTML = "<a href='#'></a>";
	return div.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
	div.innerHTML = "<input/>";
	div.firstChild.setAttribute( "value", "" );
	return div.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
	return div.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

return Sizzle;

})( window );