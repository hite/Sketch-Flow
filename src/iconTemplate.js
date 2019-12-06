// documentation: https://developer.sketchapp.com/reference/api/
import dom from 'sketch/dom'
import UI from 'sketch/ui'

const kTemplateNames = [{
        template: '位置',
        desc: '一些公共的图标'
    },

    {
        name: 'nav',
        desc: '所有导航栏'
    },
    {
        name: 'tab',
        desc: '一些底栏相关的图标'
    },
    {
        template: '频道',
        desc: '一些频道或页面的图标'
    },

    {
        name: 'homepage',
        desc: '一些首页相关的图标'
    },
    {
        name: 'category',
        desc: '一些分类相关的图标'
    },
    {
        name: 'topic',
        desc: '值得买相关的图标'
    },
    {
        name: 'cart',
        desc: '购物车相关的图标'
    },
    {
        name: 'profile',
        desc: '个人相关的图标'
    },
    {
        name: 'login',
        desc: '登录页相关的图标'
    },
    {
        name: 'splash',
        desc: '启动页相关的图标'
    },
    {
        name: 'detail',
        desc: '详情页相关的图标'
    },
    {
        name: 'order',
        desc: '组单页相关的图标'
    },
    {
        name: 'comment',
        desc: '评论相关的图标'
    },
    {
        name: 'aftersale',
        desc: '售后相关的图标'
    },
    {
        name: 'pay',
        desc: '支付页相关的图标'
    },
    {
        name: 'messages',
        desc: '消息中心相关的图标'
    },
    {
        name: 'member',
        desc: '会员相关的图标'
    },
    {
        name: 'supermember',
        desc: '超级会员相关的图标'
    },
    {
        template: '功能',
        desc: '一些功能性图标'
    },
    {
        name: 'share',
        desc: '分享相关图标'
    },
    {
        name: 'video',
        desc: '视频相关的图标'
    },
    {
        name: 'coupon',
        desc: '优惠券相关的图标'
    },
    {
        name: '3dtouch',
        desc: '3dtouch相关的图标'
    },
    {
        name: 'empty',
        desc: '页面为空相关图标'
    },
    {
        name: 'loading',
        desc: '下拉刷新相关图标'
    },
    {
        name: 'loading',
        desc: '下拉刷新相关图标'
    },
    {
        template: '组件',
        desc: '一些组件图标'
    },
    {
        name: 'button',
        desc: '按钮相关图标'
    },
    {
        name: 'dropmenu',
        desc: '下拉菜单的图标'
    },
    {
        name: 'floatwindow',
        desc: '悬浮窗相关的图标'
    },
    {
        name: 'checkbox',
        desc: '勾选框相关图标'
    }
]

export function importArtBoard() {
    UI.getInputFromUser('Choose the icon template in which your want to put icons', {
        type: UI.INPUT_TYPE.selection,
        possibleValues: kTemplateNames.map((item) => {
            if (item.template) {
                return item.template + ' / ' + item.desc
            } else {
                return '        ' + item.name + ' - ' + item.desc
            }
        })
    }, (err, value) => {
        if (err) {
            // most likely the user canceled the input
            return
        }
        if (value.includes(' / ')) {
            UI.message('不能选择目录，请重新选择')
            return
        }
        // 获取位置
        var document = context.document
        var page = document.currentPage()
        var artboard = page.currentArtboard()

        var newFrame = new dom.Rectangle(0, 0, 200, 400)
        if (artboard !== null) {
            var sketch = require('sketch/dom')
            var artboardObj = sketch.fromNative(artboard)
            var frame = artboardObj.frame
            newFrame = new dom.Rectangle(frame.x + frame.width + 20, frame.y, 200, 400)
        }
        var templateName = value
        var nameParts = value.split(' - ')
        if (nameParts.length === 2) {
            templateName = nameParts[0].trim()
        }

        var ab1 = new dom.Artboard({
            name: templateName,
            frame: newFrame
        })
        ab1.parent = page
        // https://github.com/turbobabr/Sketch-Plugins-Cookbook
        //  The following example centers viewport by x:200,y:200 point:

        // var canvasView = context.document.contentDrawView(); // Getting canvas view
        // canvasView.centerRect_animated(CGRectMake(200,200,1,1),true);
        // The example below shows how to center on the first selected layer using the same method without animation:

        // var layer = context.selection.firstObject()
        // if(layer) {
        //     var view = context.document.contentDrawView();
        //     view.centerRect_animated(layer.absoluteRect().rect(),false);
        // }
    })
}