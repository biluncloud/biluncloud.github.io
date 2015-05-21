---
layout: post
title:  跳出手掌心——如何立即触发UIButton边界事件
description: 当监听UIControlEventTouchDragExit/DragEnter这类事件时，很奇怪的是手指离开Button时并不会立刻触发事件，本文找到了原因并给出了解决方案。
tags:   iOS, UIButton, UIControl, UIControlEventTouchDragExit, UIControlEventTouchDragEnter
image:  uibutton.png
---

最近在使用`UIButton`的过程中遇到一个问题，我想要获得手指拖动button并离开button边界时的回调，于是监听`UIControlEventTouchDragExit`事件，如文档所述：

> An event where a finger is dragged from within a control to outside its bounds.

这个事件正是我所需要的，可是最后却发现当手指离开button边界时，事件并没有触发，而是到了远离button近**70**个像素时才收到回调。

{{ more }}

### 目录
{:.no_toc}

* Table of Contents Placeholder
{:toc}

-----

为了更好的说明问题，我做了一个示例，见下图。所期待的行为是：当手指离开button边界时会将button的内容改为`离开`，进入时改为`进入`。另外在手指的位置给出手指距离button最上端的像素差。

![问题展示](/img/posts/uibutton-problem.gif)

但是，当手指离开button边界时，button的内容并没有改变。而当手指距离button顶端`70`像素时才变为`离开`。由此可以看出，`UIControlEventTouchDragExit`事件并不是在离开button边界时立刻触发，而是在距button顶端`70`像素时才会。

在这里我只是演示了手指向上移动的情况，其实向另外三个方向移动时，也会有一样的效果，有兴趣的同学可以自己尝试一番。

而且并不仅仅是`UIControlEventTouchDragExit`这一个事件，所有与边界有关的事件都有这一问题：

- `UIControlEventTouchDragInside`
- `UIControlEventTouchDragOutside`
- `UIControlEventTouchDragEnter`
- `UIControlEventTouchDragExit`
- `UIControlEventTouchUpInside`
- `UIControlEventTouchUpOutside`

不知道苹果为什么要这样设定，一直没有查到相关的资料。猜测可能是苹果觉得人的手指比较粗，和屏幕的接触面积比较大，定位也不需要那么精准，所以设定了一个这么大的外部区域吧。

但是很多情况下，如果我们需要更为精确的控制时，这70个像素的扩张就不行了。那么有没有办法能够更快的跳出button的手掌心呢？

## 来自StackOverflow的答案

经过一番查找，在[StackOverflow](http://stackoverflow.com/a/14400040/973315)上面找到了一个答案，它是通过覆盖`UIControl`的`continueTrackingWithTouch:withEvent`方法，由于`UIButton`是派生自`UIControl`，因此也继承了此方法。先来看看它的声明：

{% highlight objc linenos %}
- (BOOL)continueTrackingWithTouch:(UITouch *)touch withEvent:(UIEvent *)event
/*
Description	
  Sent continuously to the control as it tracks a touch related to the given event within the control’s bounds.
Parameters	
  touch
    A UITouch object that represents a touch on the receiving control during tracking.
  event
    An event object encapsulating the information specific to the user event
Returns	
  YES if touch tracking should continue; otherwise NO.
*/
{% endhighlight %}

这个方法判断是否保持追踪当前的触摸事件。这里根据得到的位置来判断是否正处于button的范围内，进而发送对应的事件。相应的代码为：

{% highlight objc linenos %}
- (BOOL)continueTrackingWithTouch:(UITouch *)touch withEvent:(UIEvent *)event
{
    CGFloat boundsExtension = 25.0f;
    CGRect outerBounds = CGRectInset(self.bounds, -1 * boundsExtension, -1 * boundsExtension);

    BOOL touchOutside = !CGRectContainsPoint(outerBounds, [touch locationInView:self]);
    if(touchOutside) {
        BOOL previousTouchInside = CGRectContainsPoint(outerBounds, [touch previousLocationInView:self]);
        if(previousTouchInside) {
            NSLog(@"Sending UIControlEventTouchDragExit");
            [self sendActionsForControlEvents:UIControlEventTouchDragExit];
        }
        else
        {
            NSLog(@"Sending UIControlEventTouchDragOutside");
            [self sendActionsForControlEvents:UIControlEventTouchDragOutside];
        }
    }
    return [super continueTrackingWithTouch:touch withEvent:event];
}
{% endhighlight %}

在代码中，`boundsExtension`设置为`25`，它便是对应着前面所讨论的`70`，即button“手掌心”的范围。当然我们可以将它设置为其它任何值。

### 检验结果

这个方法看起来非常好，也被[原问题](http://stackoverflow.com/a/14400040/973315)采纳为正确答案。但在尝试之后，我发现它有两个严重的问题：

- `UIControlEventTouchDragExit`会响应两次，分别为：
  - 手指离开button边界`25`个像素时触发
  - 第二次依然是`70`个像素时触发，这是`UIButton`的默认行为
- 第二个问题是在事件的回调函数：<br>`- (void)callback:(UIButton *)sender withEvent:(UIEvent *)event`<br>中，由`UIEvent`参数计算得到的位置始终是`(0, 0)`，它并未正确的初始化

仔细一想便能理解，在覆盖的函数中我们进行判断之后触发了对应的事件，但这并没有取消原来`UIControl`本应该触发的事件，这便导致了两次响应；并且在我们的处理中，仅仅只是触发了事件，这里并没有涉及到`UIEvent`的初始化工作，因此最后得到的位置肯定不对了。

对于重复响应的问题，有人可能会猜，会不会上面最后一行调用父类方法有影响：
{% highlight objc linenos %}
    return [super continueTrackingWithTouch:touch withEvent:event];
{% endhighlight %}

我后来也尝试过，直接在结尾返回`YES`，上面的问题仍然存在，可见并不是它的缘故。

## 换个思路

由于上面两个问题的缘故，这个答案不可取。那还有别的办法么？

我们来仔细观察前面的方法，用前半部分的代码，可以很容易的判断出当前位置是否位于button之内。那么我们是否可以不在底层处理，而是在上层的回调函数中去判断？基于这一思路，我又做了这样的尝试：

### 注册回调

{% highlight objc linenos %}
// to get the drag event
[btn addTarget:self action:@selector(btnDragged:withEvent:) forControlEvents:UIControlEventTouchDragInside];
[btn addTarget:self action:@selector(btnDragged:withEvent:) forControlEvents:UIControlEventTouchDragOutside];
{% endhighlight %}

第一步仍然是注册回调函数，但是注意看，这里两个事件注册的是同一个回调函数`btnDragged:withEvent:`。而且并没有注册`UIControlEventTouchDragExit`和`UIControlEventTouchDragEnter`，取而代之的是`UIControlEventTouchDragInside`和`UIControlEventTouchDragOutside`，为什么？请接着向下看。

### 回调函数

回调函数里面采用了前面答案中的判断方法，可以根据当前和之前的位置判断出是否在button内部。然后就可以判断出此时到底属于哪一个事件，如下面的注释所示。至此，我们便可以在每一个分支中做对应的处理了。

{% highlight objc linenos %}
- (void)btnDragged:(UIButton *)sender withEvent:(UIEvent *)event {
    UITouch *touch = [[event allTouches] anyObject];
    CGFloat boundsExtension = 25.0f;
    CGRect outerBounds = CGRectInset(sender.bounds, -1 * boundsExtension, -1 * boundsExtension);
    BOOL touchOutside = !CGRectContainsPoint(outerBounds, [touch locationInView:sender]);
    if (touchOutside) {
        BOOL previewTouchInside = CGRectContainsPoint(outerBounds, [touch previousLocationInView:sender]);
        if (previewTouchInside) {
            // UIControlEventTouchDragExit
        } else {
            // UIControlEventTouchDragOutside
        }
    } else {
        BOOL previewTouchOutside = !CGRectContainsPoint(outerBounds, [touch previousLocationInView:sender]);
        if (previewTouchOutside) {
            // UIControlEventTouchDragEnter
        } else {
            // UIControlEventTouchDragInside
        }
    }    
}
{% endhighlight %}

注意看，这里我们仅仅通过注册两个事件，却达到了相当于四个事件的效果。最后的效果如下，这里依然是设置了`boundsExtension`为`25`，当然你可以设置成任意你想要的值。

![问题展示](/img/posts/uibutton-correct.gif)

### 处理TouchUp事件

在本文开头我们提到过，所有需要判断是否在button内部的事件都有这个问题，如`UIControlEventTouchUpInside`和`UIControlEventTouchUpOutside`，当然也可以使用同样的办法来处理：

先为两个事件注册同一个回调函数：

{% highlight objc linenos %}
// to get the touch up event
[btn addTarget:self action:@selector(btnTouchUp:withEvent:) forControlEvents:UIControlEventTouchUpInside];
[btn addTarget:self action:@selector(btnTouchUp:withEvent:) forControlEvents:UIControlEventTouchUpOutside];
{% endhighlight %}

然后处理回调函数：

{% highlight objc linenos %}
- (void)btnTouchUp:(UIButton *)sender withEvent:(UIEvent *)event {
    UITouch *touch = [[event allTouches] anyObject];
    CGFloat boundsExtension = 25.0f;
    CGRect outerBounds = CGRectInset(sender.bounds, -1 * boundsExtension, -1 * boundsExtension);
    BOOL touchOutside = !CGRectContainsPoint(outerBounds, [touch locationInView:sender]);
    if (touchOutside) {
        // UIControlEventTouchUpOutside
    } else {
        // UIControlEventTouchUpInside
    }
}
{% endhighlight %}

## 结尾

因为`UIButton`的`addTarget:action:forControlEvents`方法是继承自`UIControl`，因此上面的办法对于所有`UIControl`的子类都同样适用，比如`UISwitch`，`UISlider`等等。

我也在StackOverflow原来的问题上作了[补充](http://stackoverflow.com/a/30320206/973315)。如果你有更好的办法，或者知道为何苹果如此处理，请给我留言或者在原问题上回答。

(全文完)

feihu<br>
2015.05.21 于 Shenzhen

