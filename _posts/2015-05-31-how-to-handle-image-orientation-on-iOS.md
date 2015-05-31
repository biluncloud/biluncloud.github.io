---
layout: post
title:  如何处理iOS中照片的方向
description: 对于在iOS设备中拍得的照片，导出到Windows上打开时，经常会发现照片是横的或者颠倒的，需要旋转才适合观看。而在Mac上则完全不需要，本文解释了造成这一现象的原因并给出了开发过程中的解决方案。
tags:   iOS, UIImage，JPEG，EXIF，UIImagePickerController，orientation
image:  orientation.png
---

使用过iPhone或者iPad的朋友在拍照时不知是否遇到过这样的问题，将设备中的照片导出到Windows上时，经常发现导出的照片方向会有问题，要么横着，要么颠倒着，需要旋转才适合观看。而如果直接在这些设备上浏览时，照片会始终显示正确的方向，在Mac上也能正确显示。最近在iOS的开发中也遇到了同样的问题，将拍摄的照片上传到服务器后，再由Windows端下载该照片，发现手机上完全正常的照片到了这里显示的横七竖八。同一张照片为什么在不同的设备上表现的不同？如何能够避免这种情况？本文将和大家一一解开这些问题。

{{ more }}

### 目录
{:.no_toc}

* Table of Contents Placeholder
{:toc}

-----

## 照片的存储演变

一切都得从相机的发展开始说起。

### 胶片时代

一般相机拍摄出来的画面都是长方形，在拍摄的那一瞬间，它会将取景器中的场景对应的颜色值存到对应的像素位置。相机本身并没有任何方向的概念，只是使用者想要拍摄的场景在他期望的照片中显示的方式与实际存在差异时，才有了方向一说。如下图，对一个场景`F`进行拍摄，相机的方向可能会有这样四个常见的角度：

![摄像头取景](/img/posts/orientation-camera-view.png)

相机是“自私”的，由于相机仅反应真实的场景，它不理解拍摄的内容，因此照片都以相机的坐标系保存，于是上面四种情形实际拍摄出来的照片会像这样：

![存储情况](/img/posts/orientation-encoded-jpeg.png)

最初的卡片机时代，照片都会经由底片洗出来。那时不存在照片的方向问题，因为不管我们以何种角度拍摄，最终洗出来的照片，它本身非常容易旋转，所以我们总可以通过简单的旋转来观看照片或者保存照片。比如这张照片墙中的照片，你能否说哪些照片是横着？哪些颠倒着？你甚至都无法判断每张照片相机是以何种角度拍摄的，因为每张都已经旋转至适合观看的角度。

![照片墙](/img/posts/orientation-photo-wall.jpg)

### 数码时代

可是到了数码时代，不再需要底片，照片需要被存成一个图像文件。对于上面的拍摄角度，存储方式并没有变化，所有的场景仍然是以相机的坐标系来保存。于是这些照片仍像上面一样，原封不动的保存了下来：

![存储情况](/img/posts/orientation-encoded-jpeg.png)

虽然存储方式不变，和卡机机时代的实体相片不同的是，由于电脑屏幕可没洗出来的照片那么容易旋转，所以照片只能够以它存储于磁盘中的方向来展示。这便是为何照片传到电脑上之后，会出现横了，或者颠倒的情况。正因为这样，我们只有利用工具来旋转照片才能够正常观看。

### 方向传感器

为了克服这一情况，让照片可以真实的反应人们拍摄时看到的场景，现在很多相机中就加入了方向传感器，它能够记录下拍摄时相机的方向，并将这一信息保存在照片中。照片的存储方式还是没有任何改变，它仍然是以相机的坐标系来保存，只是当相机来浏览这些照片时，相机可以根据照片中的方向信息，结合此时相机的方向，对照片进行旋转，从而转到适合人们观看的角度。

但是很遗憾，这一标准并没有被广泛的传播开来，或者说始终如一的贯彻，这也导致了本文所讨论的问题。

## EXIF(Exchangeable Image File Format)

那么，方向信息到底是记录在照片的什么位置？

了解图像格式的朋友可能会知道，图像一般都由两大部分组成，一部分是数据本身，它记录了每个像素的颜色值，另外一部分是文件头，这里面记录着形如图像的宽度，高度等信息。我们所讨论的方向信息便是被存储于文件头中。更为具体一些：`EXIF`中，[维基百科](http://zh.wikipedia.org/wiki/EXIF)上对其的解释为：

> 可交换图像文件格式常被简称为Exif（Exchangeable image file format），是专门为数码相机的照片设定的，可以记录数码照片的属性信息和拍摄数据... Exif可以附加于JPEG、TIFF、RIFF等文件之中

**注意**：PNG格式的图像中不包含。

### Orientation

在`EXIF`涵盖的各种信息之中，其中有一个叫做`Orientation (rotation)`的标签，用于记录图像的方向，这便是相机写入方向信息的最终位置。它总共定义了八个值：

![Orientation的八个值](/img/posts/orientation-eight-values.png)

**注意**：对于上面的八种方向中，加了`*`的并不常见，因为它们代表的是镜像方向，如果不做任何的处理，不管相机以任何角度拍摄，都无法出现镜像的情况。

这个表格代表什么意义？我们来看第一行，值为1时，右边两列的值分别为：Row #0 is `Top`，Column #0 is `Left side`，其实很好理解，它表示照片的第一行位于顶端，而第一列位于左侧，那么这张照片自然就是以正常角度拍摄的。

对着前面的四种拍摄角度，由于相机都是以其自身的坐标系来保存照片，因此每张照片对应的第一行和第一列的位置始终如下：

![第一行第一列](/img/posts/orientation-row0-column0.png)

我们来看第二张照片，这张照片需要逆时针旋转90度才能够正常观看。旋转之后，它的第一行位于左侧，而第一列位于下侧。如此一来，对比表格，它的`Orientation`值为8。所以说，**这个`Orientation`值提供了想要正常观看图像时应该旋转的方式。**

以同样的方法，我们可以推断出上面四种方式拍摄时，对应`EXIF`中`Orientation`的值如下所示：

![图片的方向](/img/posts/orientation-value.png)

由于相机加上了方向传感器的缘故，可以非常容易的检测出以上几种拍摄角度，并将角度对应的`Orientation`值保存至图像中。查看图像时，相机检测到其`EXIF`中的`Orientation`信息，并将图像旋转相应的角度显示给用户，这样便达到了智能显示的目的。

### iPhone上的情况

作为智能手机的重要组成部分，形形色色的传感器自然必不可少。在iOS的设备中也是包含了这样的方向传感器，它也采用了同样的方式来保存照片的方向信息到`EXIF`中。但是它默认的照片方向并不是竖着拿手机时的情况，而是横向，即Home键在右侧，如下：

![iPhone正常方向](/img/posts/orientation-zero-degree.png)

如此一来，如果竖着拿手机拍摄时，就相当于对手机顺时针旋转了90度，也即上面相机图片中的最后一幅，那么它的`Orientation`值为6。

![iPhone竖向](/img/posts/orientation-iphone-portrait.png)

## 验证EXIF

在经过上面的分析之后，我们来看看实际情况如何。我们分别在Mac和Windows平台上对前面的论述做一个验证。

### Mac平台

可以将照片从iOS设备中导出到Mac系统上，(注意，不能够使用iPhoto或者Photos来导入，因为这样照片在导入之前会被自动调整好方向)在这里我们像Windows中一样，将iPhone当成移动硬盘，直接访问其照片。在Mac上可以使用[iTools](http://pro.itools.cn/mac/english)这一神器。

然后用Mac上的`预览`程序查看其`EXIF`属性，通过`预览-工具-显示检查器`打开对话框，即可查看到照片中关于方向的详细信息。下面四张图分别展示了上面四种方向下拍得照片的`Orientation`值：

- Home键位于右侧时，即相机的默认方向，值为1。
 ![Home键在右侧](/img/posts/orientation-home-right.jpg)

- Home键位于上侧时，值为8。
 ![Home键在上侧](/img/posts/orientation-home-up.jpg)

- Home键位于左侧时，值为3。
 ![Home键在左侧](/img/posts/orientation-home-left.jpg)

- Home键位于下侧时，即正常手持手机的方向，值为6。
 ![Home键在下侧](/img/posts/orientation-home-bottom.jpg)

对照前面的分析，完全一致。而且照片显示正常，说明在Mac上默认的`预览`程序会自动的处理`EXIF`中的`Orientation`信息。

再次提醒：照片存储在手机中始终是以相机坐标系保存的，只是浏览工作在读取方向信息之后做了旋转。

### Windows平台

前面提到过，被写在图像文件头中的方向信息并没有被全部支持，Windows的照片查看器便是其中之一，这也是Windows用户最常使用的照片浏览工具。因为没有读取方向信息，照片被读入之后，完全按照其存储方式来显示，这样便出现了横向，或者颠倒的情况。下面四张图便分别是上一节中拍得的照片在Windows上的显示效果，注意看方向。

![Windows上的情况](/img/posts/orientation-windows.jpg)

## 开发时如何避免

既然不是所有的工具都支持方向属性，这其中甚至包含了具有最多用户群体的Windows，那么我们在开发照片相关的应用时，有没有什么应对之策？

当然有！因为可以非常容易的得到照片的方向信息，那么只需要在保存之前将照片旋转至正常观看的方向即可，然后直接将最终具有正确方向的照片保存下来，搞定。

当我们得到一个`UIImage`对象时，它有一个属性叫：`imageOrientation`，这里面便保存了方向信息：

> Property<br>
> The orientation of the receiver’s image. (read-only)<br>
> Discussion<br>
> Image orientation affects the way the image data is displayed when drawn. By default, images are displayed in the “up” orientation. If the image has associated metadata (such as EXIF information), however, this property contains the orientation indicated by that metadata. For a list of possible values for this property, see UIImageOrientation.

它刚好也可能为下面八种值，这些值可以和`EXIF`中`Orientation`的定义一一对应：

- ![Up](/img/posts/orientation-UIImageOrientationUp.png) UIImageOrientationUp
- ![Down](/img/posts/orientation-UIImageOrientationDown.png) UIImageOrientationDown
- ![Left](/img/posts/orientation-UIImageOrientationLeft.png) UIImageOrientationLeft
- ![Right](/img/posts/orientation-UIImageOrientationRight.png) UIImageOrientationRight
- ![UpMirror](/img/posts/orientation-UIImageOrientationUpMirrored.png) UIImageOrientationUpMirrored
- ![DownMirror](/img/posts/orientation-UIImageOrientationDownMirrored.png) UIImageOrientationDownMirrored
- ![LeftMirror](/img/posts/orientation-UIImageOrientationLeftMirrored.png) UIImageOrientationLeftMirrored
- ![RightMirror](/img/posts/orientation-UIImageOrientationRightMirrored.png) UIImageOrientationRightMirrored

那么我们便可以根据这一属性对图像进行相应的旋转，从而将图像的原始数据旋转至正确的方向，在浏览照片时无需方向信息便可正常浏览。

关于如何旋转图像，StackOverflow上给出了很好的答案，比如[这个](http://stackoverflow.com/a/5427890/973315)。我们简单做一个介绍：

### 直观的解决方案

首先，为`UIImage`创建一个category，其中包含`fixOrientation`方法：

UIImage+fixOrientation.h
{% highlight objc linenos %}
@interface UIImage (fixOrientation)

- (UIImage *)fixOrientation;

@end
{% endhighlight %}

UIImage+fixOrientation.m
{% highlight objc linenos %}
@implementation UIImage (fixOrientation)

- (UIImage *)fixOrientation {

    // No-op if the orientation is already correct
    if (self.imageOrientation == UIImageOrientationUp) return self;

    // We need to calculate the proper transformation to make the image upright.
    // We do it in 2 steps: Rotate if Left/Right/Down, and then flip if Mirrored.
    CGAffineTransform transform = CGAffineTransformIdentity;

    switch (self.imageOrientation) {
        case UIImageOrientationDown:
        case UIImageOrientationDownMirrored:
            transform = CGAffineTransformTranslate(transform, self.size.width, self.size.height);
            transform = CGAffineTransformRotate(transform, M_PI);
            break;

        case UIImageOrientationLeft:
        case UIImageOrientationLeftMirrored:
            transform = CGAffineTransformTranslate(transform, self.size.width, 0);
            transform = CGAffineTransformRotate(transform, M_PI_2);
            break;

        case UIImageOrientationRight:
        case UIImageOrientationRightMirrored:
            transform = CGAffineTransformTranslate(transform, 0, self.size.height);
            transform = CGAffineTransformRotate(transform, -M_PI_2);
            break;
        case UIImageOrientationUp:
        case UIImageOrientationUpMirrored:
            break;
    }

    switch (self.imageOrientation) {
        case UIImageOrientationUpMirrored:
        case UIImageOrientationDownMirrored:
            transform = CGAffineTransformTranslate(transform, self.size.width, 0);
            transform = CGAffineTransformScale(transform, -1, 1);
            break;

        case UIImageOrientationLeftMirrored:
        case UIImageOrientationRightMirrored:
            transform = CGAffineTransformTranslate(transform, self.size.height, 0);
            transform = CGAffineTransformScale(transform, -1, 1);
            break;
        case UIImageOrientationUp:
        case UIImageOrientationDown:
        case UIImageOrientationLeft:
        case UIImageOrientationRight:
            break;
    }

    // Now we draw the underlying CGImage into a new context, applying the transform
    // calculated above.
    CGContextRef ctx = CGBitmapContextCreate(NULL, self.size.width, self.size.height,
                                             CGImageGetBitsPerComponent(self.CGImage), 0,
                                             CGImageGetColorSpace(self.CGImage),
                                             CGImageGetBitmapInfo(self.CGImage));
    CGContextConcatCTM(ctx, transform);
    switch (self.imageOrientation) {
        case UIImageOrientationLeft:
        case UIImageOrientationLeftMirrored:
        case UIImageOrientationRight:
        case UIImageOrientationRightMirrored:
            // Grr...
            CGContextDrawImage(ctx, CGRectMake(0,0,self.size.height,self.size.width), self.CGImage);
            break;

        default:
            CGContextDrawImage(ctx, CGRectMake(0,0,self.size.width,self.size.height), self.CGImage);
            break;
    }

    // And now we just create a new UIImage from the drawing context
    CGImageRef cgimg = CGBitmapContextCreateImage(ctx);
    UIImage *img = [UIImage imageWithCGImage:cgimg];
    CGContextRelease(ctx);
    CGImageRelease(cgimg);
    return img;
}

@end
{% endhighlight %}

代码有些长，不过却非常直观。这里面涉及到图像矩阵变换的操作，理解起来可能稍稍有些困难，接下来，我会有另外一篇文章专门来介绍图像变换。现在，记住下面两点便能够很好的帮助理解：

1. 图像的原点在左下角
2. 矩阵变换时，后面的矩阵先作用，前面的矩阵后作用

以`UIImageOrientationDown`方向为例，![UIImageOrientationDown](/img/posts/orientation-UIImageOrientationDown.png)，很明显它翻转了180度。那么对它的旋转需要两步，第一步是以左下方为原点旋转180度，(此时顺时针还是逆时针旋转效果一样)旋转后上图变为：![旋转180度后](/img/posts/orientation-transform-rotate.png) 。用代码表示为：

{% highlight objc linenos %}
transform = CGAffineTransformRotate(transform, M_PI);
{% endhighlight %}

因为是以左下方为原点旋转的，所以整幅图被移到了第三象限。第二步需要将其平移至第一象限，向右上方进行平移即可。x方向上移动距离为图像的宽度，y方向上移动距离为图像的高度，所以平移后图像变为：![平移后](/img/posts/orientation-transform-transition.png)。代码为：

{% highlight objc linenos %}
transform = CGAffineTransformTranslate(transform, self.size.width, self.size.height);
{% endhighlight %}

再加上我们前面所说的第二点，矩阵变换时，后面的矩阵先作用，前面的矩阵后作用，那么只需要将上面两步颠倒即可：

{% highlight objc linenos %}
transform = CGAffineTransformTranslate(transform, self.size.width, self.size.height);
transform = CGAffineTransformRotate(transform, M_PI);
{% endhighlight %}

其它的方向可以用完全一样的方法来分析，这里不再一一赘述。

### 第二种简单的方法

第二种方法同样也是StackOverflow上的[答案](http://stackoverflow.com/a/10611036/973315)，没那么直观，但非常简单：

{% highlight objc linenos %}
- (UIImage *)normalizedImage {
    if (self.imageOrientation == UIImageOrientationUp) return self; 

    UIGraphicsBeginImageContextWithOptions(self.size, NO, self.scale);
    [self drawInRect:(CGRect){0, 0, self.size}];
    UIImage *normalizedImage = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    return normalizedImage;
}
{% endhighlight %}

这里是利用了`UIImage`中的`drawInRect`方法，它会将图像绘制到画布上，并且已经考虑好了图像的方向，开发文档这样解释：

> -drawInRect:<br>
> Draws the entire image in the specified rectangle, scaling it as needed to fit.<br>
> 
> Discussion<br>
> This method draws the entire image in the current graphics context, respecting the image’s orientation setting. In the default coordinate system, images are situated down and to the right of the origin of the specified rectangle. This method respects any transforms applied to the current graphics context, however.

## 结尾

关于照片方向的处理就介绍到这里，相信看完本文你已经知悉为何以及如何处理这个问题。

关于`EXIF`，这里面包含了很多有趣的内容，比如iPhone拍摄后，可以记录当时的GPS位置，这样在查看照片的时候就可以很神奇的知道照片的拍摄地。如果感兴趣可以去一探究竟。

另外，除去专门的照片浏览工具，所有的现代浏览器也天生具备查看图片的功能。而且有很多浏览器也已经支持`EXIF`中的`Orientation`，比如Firefox, Chrome, Safari。但同样很可惜，IE并不支持(一直到IE9.0尚不支持)。也许和Win7设计时并没有这些具有方向传感器的手机有关，我从网上了解到，在当初2012年收集building Windows8意见时，就有人提到过这一问题，希望能够考虑图片的方向信息，微软也给出了[回应](http://blogs.msdn.com/b/b8/archive/2012/01/30/acting-on-file-management-feedback.aspx)：

> (In Windows8)Explorer now respects EXIF orientation information for JPEG images. If your camera sets this value accurately, you will rarely need to correct orientation. 

但我一直没有用过Windows8，如果有使用过的，希望可以帮我验证一下是否微软已经修复这个问题。

(全文完)

feihu<br>
2015.05.31 于 Shenzhen

