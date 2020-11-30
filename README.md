# verify-code
> 拼图验证码，纯前端校验，依赖于JQ

### 说明
纯前端的校验方式，很容易绕过前端去提交，可以修改源代码并与后端进行交互，进行安全校验。如果使用不同源图片可能会导致IE11无效，[详见](https://stackoverflow.com/questions/34826748/issue-with-crossorigin-anonymous-failing-to-load-images/35043925)(有兴趣的可以通过`crossOrigin to use-credentials`尝试)。如果不考虑IE，可以使用插件自带的图片库。如果还是绕不过IE的兼容，建议使用本地图片或者同源网络图片。

### 使用方法:
1.引入 jquery & ./js/verify-code.js
2.引入 ./css/verify-code.css

### Options

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- | --- |
| width | canvas宽度 | Number | 310 |
| height | canvas高度 | Number | 155 |
| accuracy | 精度，移动的偏差范围内。如果 <1 则不进行校验 | Number | 5 |
| sliderText | 滑动文本 | String | 向右滑动 |
| images | 图片，如果不传 | Array | [] |

### Events

| 事件名	 | 说明 | 返回值 |
| --- | --- | --- |
| init | 手动初始化 | - |
| reset | 重置 | - |
| ready | 初始化成功的回调 | - |
| success | 校验成功的回调，返回操作时间 | time |
| fail | 校验失败的回调 | - |
| destroy | 销毁 | - |

### Example
```html
<div id="code-container"></div>
```

```javascript
const verifyCode = $('#code-container').VerifyCode({
  // ...props,
  ready() {
    console.log('ready');
  },
  success(time) {
    console.log('success', time);
  },
  fail() {
    console.log('fail');
  }
})
```

或者

```javascript
const verifyCode = new VerifyCode('#code-container', {
  // ...options
});

$('#code-container').on('ready', function() {
  console.log('ready');
});
$('#code-container').on('success', function(time) {
  console.log('success', time);
});
$('#code-container').on('fail', function() {
  console.log('fail');
});

verifyCode.init(); // 初始化
```