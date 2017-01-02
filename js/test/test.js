QUnit.module('Module Prime');
QUnit.test( 'isarray', function( assert ) {
	assert.ok( $.isarray(new Array()), '数组' );
	assert.ok( $.isarray([]), '数组字面量' );
	assert.ok( $.isarray([1,2,3]), '非空数组' );
	assert.ok( !$.isarray(''), '字符串' );
	assert.ok( !$.isarray(1), '数字' );
	assert.ok( !$.isarray(true), '布尔' );
});
QUnit.test( 'isnumber', function( assert ) {
	assert.ok( $.isnumber(0), '零' );
	assert.ok( $.isnumber(-1), '负数' );
	assert.ok( $.isnumber(.5), '小数' );
	assert.ok( $.isnumber(5), '整数' );
	assert.ok( !$.isnumber('5'), '字符串' );
});




QUnit.test( 'extend', function( assert ) {
	var a = {
			a1: 'aaa',
			a2: 200,
			a3: true,
			a4: [1,2,3],
			a5: {
				a51: 1,
				a52: '2'
			}
		},
		b = {};
		
	$.extend(b, a);
	
	assert.ok( b.a1, '字符串属性扩展' );
	assert.ok( b.a2, '数值属性扩展' );
	assert.ok( b.a3, '布尔属性扩展' );
	assert.ok( b.a4[1], '数组属性扩展' );
	assert.ok( b.a5.a51, '引用对象扩展' );
});








QUnit.module('Module Finder');
QUnit.test( 'find', function( assert ) {
	assert.ok( $.find(), '选择器' );
});
















