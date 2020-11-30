(function ($, window, document) {
  'use strict';

  const PI = Math.PI;
  const l = 42; // 拼接块的大小
  const r = 10; // 拼接块圆的半径
  const L = l + r * 2 + 3; // 拼接块实际长度

  let VerifyCode = function (ele, opt) {
    this.$element = ele instanceof $ ? ele : $(ele);
    this.defaults = {
      width: 310, // 画布宽度
      height: 155, // 画布高度
      accuracy: 5, // 精度
      sliderText: '向右滑动', // 滑动文本
      images: [], // 默认图片
      ready: function () {},
      success: function () {},
      fail: function () {},
    };
    this.options = $.extend({}, this.defaults, opt);
  };

  VerifyCode.prototype = {
    /* 初始化 */
    init: function () {
      const that = this;

      // 记录状态
      this.refresh = false; // 图片刷新
      this.sliderActive = false; // 按下滑块
      this.sliderSuccess = false; // 滑块成功
      this.sliderFail = false; // 滑块失败
      this.sliderLeft = 0; // 滑块移动的距离

      this.initDom();
      this.initImg();
      this.options.ready();
      this.$element.trigger('ready');

      // 点击刷新
      this.$element.find($('#refresh')).on('click', function () {
        if (that.sliderSuccess) return;
        that.reset();
      });

      // 拖拽
      this.$element
        .find($('.slide-verify-slider-mask-item'))
        .on('mousedown', function (event) {
          that.mousedown(event);
        });
    },

    /* 初始化DOM */
    initDom: function () {
      const panelHtml =
        '<div class="slide-verify" onselectstart="return false;"><div id="refresh" class="slide-verify-icon-refresh"></div><div id="mask" class="slider-verify-mask"></div><canvas id="canvas"></canvas><canvas id="block" class="slide-verify-block"></canvas><div class="slide-verify-slider"><div class="slide-verify-slider-mask"><div class="slide-verify-slider-mask-item"><i class="slide-verify-slider-mask-item-icon"></i></div></div><span class="slide-verify-slider-text">' +
        this.options.sliderText +
        '</span></div></div>';
      this.$element.append(panelHtml);
      this.$element.find('.slide-verify').css('width', this.options.width);
      this.$element
        .find('#canvas')
        .attr({ width: this.options.width, height: this.options.height });
      this.$element
        .find('#block')
        .attr({ width: this.options.width, height: this.options.height });

      this.block = $('#block')[0];
      this.canvasCtx = $('#canvas')[0].getContext('2d');
      this.blockCtx = this.block.getContext('2d');
    },

    /* 初始化图片 */
    initImg: function () {
      const that = this;

      this.refresh = true;
      this.$element.find($('#refresh')).addClass('animation');
      const img = this.createImg(function () {
        // img onload
        that.refresh = false;
        that.$element.find($('#refresh')).removeClass('animation');
        that.drawBlock();
        that.canvasCtx.drawImage(
          img,
          0,
          0,
          that.options.width,
          that.options.height
        );
        that.blockCtx.drawImage(
          img,
          0,
          0,
          that.options.width,
          that.options.height
        );

        // let { block_x: x, block_y: y } = that;
        let x = that.block_x;
        let y = that.block_y;
        let _y = y - r * 2 - 1;

        let ImageData = that.blockCtx.getImageData(x, _y, L, L);
        that.block.width = L; // 设置block canvas的宽度为拼接块的宽度

        that.blockCtx.putImageData(ImageData, 0, _y); // 将imagedata 放到block canvas上
      });
      this.img = img;
    },

    // 创建图片
    createImg: function (onload) {
      const that = this;

      const img = new Image();
      img.crossOrigin = 'Anonymous'; // IE11下会进入error
      img.onload = onload;
      img.onerror = function () {
        img.src = that.getRandomImg();
      };
      img.src = this.getRandomImg();
      return img;
    },

    // 随机生成img src
    getRandomImg: function () {
      const len = this.options.images.length; // 传入的image
      return len > 0
        ? this.options.images[getRandomNumberByRange(0, len)]
        : '//picsum.photos/310/155/?image=' +
            getRandomNumberByRange(0, 1084);
    },

    drawBlock: function () {
      // 生成随机位置
      this.block_x = getRandomNumberByRange(
        L + 10,
        this.options.width - (L + 10)
      );
      this.block_y = getRandomNumberByRange(
        10 + r * 2,
        this.options.height - (L + 10)
      );
      // 画拼图
      this.draw(this.canvasCtx, this.block_x, this.block_y, 'fill');
      this.draw(this.blockCtx, this.block_x, this.block_y, 'clip');
    },

    // 画图
    draw: function (ctx, x, y, operation) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x + l / 2, y - r + 2, r, 0.72 * PI, 2.26 * PI);
      ctx.lineTo(x + l, y);
      ctx.arc(x + l + r - 2, y + l / 2, r, 1.21 * PI, 2.78 * PI);
      ctx.lineTo(x + l, y + l);
      ctx.lineTo(x, y + l);
      ctx.arc(x + r - 2, y + l / 2, r + 0.4, 2.76 * PI, 1.24 * PI, true);
      ctx.lineTo(x, y);
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.stroke();
      ctx[operation]();
      // Bug Fixes 修复了火狐和ie显示问题
      ctx.globalCompositeOperation = 'destination-over';
    },

    // 拖拽
    mousedown: function (event) {
      if (
        this.isMouseDown ||
        this.sliderSuccess ||
        this.sliderFail ||
        this.refresh
      ) {
        return;
      }

      this.isMouseDown = true;
      this.sliderActive = true;
      this.timestamp = +new Date();
      this.moveStart(event);
    },

    // 开始拖拽
    moveStart: function (event) {
      this.originX = event.clientX;
      this.originY = event.clientY;

      this.handlerMove = this.handleMove.bind(this);
      this.handlerMoveEnd = this.handleMoveEnd.bind(this);
      window.addEventListener('mousemove', this.handlerMove, false);
      window.addEventListener('mouseup', this.handlerMoveEnd, false);
    },

    // 拖拽中
    handleMove: function (event) {
      if (!this.isMouseDown) return;

      const moveX = event.clientX - this.originX;

      if (moveX <= 0 || moveX >= this.options.width - 40 - r * 2) return;

      this.sliderLeft = moveX + 'px';
      this.block.style.left = moveX + 'px';

      this.$element.find($('.slide-verify-slider-text')).hide();
      this.$element.find($('.slide-verify-slider-mask-item'))[0].style.left =
        moveX + 'px';
      this.$element.find($('.slide-verify-slider-mask'))[0].style.width =
        moveX + 1 + 'px';
      this.setDragClass('slider-active');
    },

    // 结束拖拽
    handleMoveEnd: function () {
      const that = this;

      this.isMouseDown = false;
      this.sliderActive = false;
      this.timestamp = +new Date() - this.timestamp;

      if (this.verify()) {
        this.sliderSuccess = true;
        this.setDragClass('slider-success');
        this.options.success(this.timestamp);
        this.$element.trigger('success', this.timestamp);
      } else {
        this.sliderFail = true;
        this.setDragClass('slider-fail');
        that.options.fail();
        this.$element.trigger('fail');
        setTimeout(function () {
          that.reset();
        }, 500);
      }

      // 解绑
      window.removeEventListener('mousemove', this.handlerMove, false);
      window.removeEventListener('mouseup', this.handlerMoveEnd, false);
    },

    // 校验
    verify: function () {
      let flag = false;
      if (this.options.accuracy >= 0) {
        const blockX = parseInt(this.block_x);
        const moveX = parseInt(this.sliderLeft);
        const left = moveX - this.options.accuracy;
        const right = moveX + this.options.accuracy;
        flag = left <= blockX && right >= blockX;
      } else {
        // 如果精度为 -1 则不进行校验
        flag = true;
      }
      return flag;
    },

    // 设置样式
    setDragClass: function (classes) {
      this.$element.find($('.slide-verify-slider')).addClass(classes);
    },

    // 重置
    reset: function () {
      this.sliderActive = false;
      this.sliderSuccess = false;
      this.sliderFail = false;
      this.sliderLeft = 0;
      this.block.style.left = 0;

      // 重置画布
      this.canvasCtx.clearRect(0, 0, this.options.width, this.options.height);
      this.blockCtx.clearRect(0, 0, this.options.width, this.options.height);
      this.block.width = this.options.width;
      this.block.style.left = 0;
      this.$element.find($('.slide-verify-slider-text')).show();
      this.$element.find($('.slide-verify-slider-mask-item'))[0].style.left =
        0 + 'px';
      this.$element.find($('.slide-verify-slider-mask'))[0].style.width =
        0 + 'px';
      this.$element.find($('.slide-verify-slider'))[0].className =
        'slide-verify-slider';

      // 重置图片
      this.refresh = true;
      $('#refresh').addClass('animation');
      this.img.src = this.getRandomImg();
    },

    // 销毁
    destroy: function () {
      this.canvasCtx = null;
      this.blockCtx = null;
      this.block = null;
      this.refresh = false; // 图片刷新
      this.sliderActive = false; // 按下滑块
      this.sliderSuccess = false; // 滑块成功
      this.sliderFail = false; // 滑块失败
      this.sliderLeft = 0; // 滑块移动的距离
      this.$element.html(null);
    },
  };

  function getRandomNumberByRange(start, end) {
    return Math.round(Math.random() * (end - start) + start);
  }

  $.fn.VerifyCode = function (options, callbacks) {
    var verifyCode = new VerifyCode(this, options);
    verifyCode.init();
    return verifyCode;
  };

  window.VerifyCode = VerifyCode;
})(jQuery, window, document);
