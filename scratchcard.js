function ScratchCard(config) {
    // 默认配置
    this.config = {
        // canvas元素
        canvas: null,
        // 直接全部刮开的百分比
        showAllPercent: 65,
        // 图片图层
        coverImg: null,
        // 纯色图层，如果图片图层值不为null，则纯色图层无效
        coverColor: null,
        // 全部刮开回调
        doneCallback: null,
        // 擦除半径
        radius: 20,
        // 屏幕倍数
        pixelRatio: 1,
        // 展现全部的淡出效果时间（ms）
        fadeOut: 2000
    }
    Object.assign(this.config, config);
    this.canvas = this.config.canvas;
    this.ctx = null;
    this.offsetX = null;
    this.offsexY = null;
    //是否在画布上处于按下状态
    this.isDown = false;
    //是否已完成刮刮卡
    this.down = false;
    this._init();
}
ScratchCard.prototype = {
    constructor: ScratchCard,
    _init: function () {
        let that = this;
        this.ctx = this.canvas.getContext('2d');
        this.offsetX = this.canvas.offsetLeft;
        this.offsetY = this.canvas.offsetTop;
        this._addEvent();
        if (this.config.coverImg) {
            //如果设置图片涂层
            let coverImg = new Image();
            coverImg.src = this.config.coverImg;
            //读取图像
            coverImg.onload = function () {
                //绘制图像
                that.ctx.drawImage(coverImg, 0, 0);
                that.ctx.globalCompositeOperation = 'destination-out';
            }
        } else {
            //如果没有图片涂层
            this.ctx.fillStyle = this.config.coverColor;
            this.ctx.fullRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalCompositeOperation = 'destination-out';
        }
    },
    //添加事件
    _addEvent: function () {
        this.canvas.addEventListener('touchstart', this._eventDown.bind(this), {
            passive: false
        });
        this.canvas.addEventListener('touchend', this._eventUp.bind(this), {
            passive: false
        });
        this.canvas.addEventListener('touchmove', this._scratch.bind(this), {
            passive: false
        });
        this.canvas.addEventListener('mousedown', this._eventDown.bind(this), {
            passive: false
        });
        this.canvas.addEventListener('mouseup', this._eventUp.bind(this), {
            passive: false
        });
        this.canvas.addEventListener('mousemove', this._scratch.bind(this), {
            passive: false
        });

        // el.addEventListener(type, listener, {
        //     capture: false, // useCapture
        //     once: false,    // 是否设置单次监听
        //     passive: false  // 是否让阻止默认行为preventDefault()失效
        // })
    },
    _eventDown: function (e) {
        e.preventDefault();
        this.isDown = true;
    },
    _eventUp: function (e) {
        e.preventDefault();
        this.isDown = false;
    },
    //刮涂层
    _scratch: function (e) {
        e.preventDefault();
        let that = this;
        if (!this.done && this.isDown) {
            if (e.changedTouches) {
                e = e.changedTouches[e.changedTouches.length - 1];
            }
            let x = (e.clientX + document.body.scrollLeft || e.pageX) - this.offsetX || 0,
                y = (e.clientY + document.body.scrollTop || e.pageY) - this.offsetY || 0;
            with(this.ctx) {
                beginPath()
                arc(x * that.config.pixelRatio, y * that.config.pixelRatio, that.config.radius * that.config.pixelRatio, 0, Math.PI * 2);
                fill();
            }
            if (this._getFilledPercentage() > this.config.showAllPercent) {
                this._scratchAll()
            }
        }

    },
    // 刮开全部涂层
    _scratchAll() {
        let that = this;
        this.done = true;

        if (this.config.fadeOut > 0) {
            // 先使用CSS opacity清除，再使用canvas清除
            this.canvas.style.transition = 'all ' + this.config.fadeOut / 1000 + 's linear';
            this.canvas.style.opacity = '0';
            setTimeout(function () {
                that._clear();
            }, this.config.fadeOut)
        } else {
            // 直接使用canvas清除
            that._clear();
        }
        // 执行回调函数
        this.config.doneCallback && this.config.doneCallback();
    },
    // 清除全部涂层
    _clear() {
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    // 获取刮开区域百分比
    _getFilledPercentage: function () {
        let imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        // 存储当前cavnas画布的全部像素点信息
        let pixels = imgData.data;
        // 存储当前canvas画布的透明像素信息
        let transPixels = [];
        // 遍历全部像素点信息
        for (let i = 0; i < pixels.length; i += 4) {
            // 把透明的像素点添加到transPixels里
            if (pixels[i + 3] < 128) {
                transPixels.push(pixels[i + 3]);
            }
        }
        // 计算透明像素点的占比
        return (transPixels.length / (pixels.length / 4) * 100).toFixed(2)
    }
}
