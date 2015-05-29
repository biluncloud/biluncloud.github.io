---
layout: post
title:  如何处理iOS中的照片方向
description: 对于在iOS设备中拍得的照片，导出到Windows上打开时，经常会发现照片是横的或者颠倒的，需要旋转才适合观看。而在Mac上则完全不需要，本文解释了造成这一现象的原因并给出了开发过程中的解决方案。
tags:   iOS, UIImage，JPEG，EXIF，UIImagePickerController，orientation
image:  uibutton.png
---

使用过iPhone或者iPad的朋友在拍照时不知是否遇到过这样的问题，将设备中的照片导出到Windows上时，经常发现导出的照片方向会有问题，要么横着，要么颠倒着，需要旋转才适合观看。而如果直接在这些设备上浏览时，照片会始终显示正确的方向，在Mac上也能正确显示。最近在iOS的开发中也遇到了同样的问题，将拍摄的照片上传到服务器后，再由Windows端下载该照片，发现手机上完全正常的照片到了这里也不正常了。同一张照片为什么在不同的设备上表现的不同？如何能够避免这种情况？本文将一一解开这些问题。

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

相机是“自私”的，由于相机仅反应真实的场景，它不理解拍摄的内容，因此以相机的坐标系来说，实际拍摄出来的图像会像这样存储：

![存储情况](/img/posts/orientation-encoded-jpeg.png)

最初的卡片机时代，照片都会经由底片洗出来。那时不存在照片的方向问题，因为不管我们以何种角度拍摄，最终洗出来的照片，它本身是非常容易旋转的，所以我们总可以通过简单的旋转来观看照片或者保存照片。比如这张照片墙中的照片，你能否说哪些照片是横着？不行，因为每张都旋转至适合观看的角度了。

![照片墙](/img/posts/orientation-photo-wall.jpg)

### 数码时代

可是到了数码时代，不再有底片，照片需要被存成一个图片文件，对于上面的拍摄角度，保存方式并没有变化，所有的场景仍然是以相机的坐标系来保存。于是这些照片仍像上面一样，原封不动的保存了下来：

![存储情况](/img/posts/orientation-encoded-jpeg.png)

和卡机机时代的实体相片不同，由于电脑屏幕可没那么容易旋转，所以照片只能够以它存储于磁盘中的方向来展示。这便是为何照片传到电脑上之后，会出现横了，或者颠倒的情况。正因为这样，我们只有利用工具旋转照片才能够正常观看。

### 方向传感器

为了克服这一情况，让照片可以真实的反应人们拍摄时看到的场景，现在很多相机中就加入了方向传感器，它能够记录下拍摄时相机的方向，并将这一信息保存在照片中。照片的保存方式还是没有任何改变，它仍然是以相机的坐标系来保存，只是用相机来浏览这些照片时，相机可以根据照片中的方向信息，结合此时相机的方向，对照片进行旋转，从而转到适合人们观看的角度。

但是很遗憾，这一标准并没有被广泛的传播开来，或者说始终如一的贯彻，这也导致了本文所讨论的问题。

## EXIF(Exchangeable Image File Format)

那么，方向信息到底是记录在照片的什么位置？

了解图像格式的朋友可能会知道，图像一般都由两大部分组成，一部分是数据本身，它记录了每个像素的颜色值，另外一部分是文件头，这里面记录着形如数据开始的位置，图像的长度，宽度等信息。我们所讨论的方向信息便是被存储于文件头中的`EXIF`中，[维基百科](http://zh.wikipedia.org/wiki/EXIF)上对其的解释如下：

> 可交换图像文件格式常被简称为Exif（Exchangeable image file format），是专门为数码相机的照片设定的，可以记录数码照片的属性信息和拍摄数据。... Exif可以附加于JPEG、TIFF、RIFF等文件之中

### Orientation

在EXIF的各种信息之中，其中有一个叫做`Orientation (rotation)`的标签，用于记录图像的方向，这便是相机写入方向信息的最终位置。它总共定义了八个值：

![Orientation的八个值](/img/posts/orientation-eight-values.png)

**注意**：对于上面的八种方向中，加了`*`的并不常见，因为它们代表的是镜像方向，如果不做任何的处理，不管相机以任何角度拍摄，都无法出现镜像的情况。

这个表格代表什么意义？我们来看第一行，值为1时，右边两列的值分别为：Row #0 is `Top`，Column #0 is `Left side`，其实很好理解，它表示照片的第一行位于顶端，而第一列位于左侧，那么这张照片自然就是以正常角度拍摄的。

对着前面的四种拍摄角度，由于相机都是以其自身的坐标系来保存照片，因此每张照片对应的第一行和第一列的位置始终如下：

![第一行第一列](/img/posts/orientation-row0-column0.png)

我们来看第二张照片，这张照片需要逆时针旋转90度才能够正常观看。旋转之后，它的第一行位于左侧，而第一列位于下侧。如此一来，对比表格，它的Orientation值为8。

以同样的方法，我们可以推断出上面四种方式拍摄时，对应`EXIF`中Orientation的值如下所示：

![图片的方向](/img/posts/orientation-value.png)

由于相机加上了方向传感器的缘故，可以非常容易的检测出来以上几种拍摄角度，并将角度对应的Orientation值保存至图像中。查看图像时，相机检测到其EXIF中的Orientation信息，并将图像旋转相应的角度显示给用户，这样便达到了智能显示的目的。

### iPhone上的情况

作为智能手机的重要组成部分，形形色色的传感器自然必不可少。在iOS的设备中也是包含了这样的方向传感器，它也采用了同样的方式来保存照片的方向信息到EXIF中。但是它默认的照片方向并不是竖着拿手机时的情况，而是横向，即Home键在右侧，如下：

![iPhone正常方向](/img/posts/orientation-zero-degree.png)

如此一来，如果竖着拿手机拍摄时，就相当于对手机顺时针旋转了90度，也即上面相机图片中的最后一幅，那么它的Orientation值为6。

![iPhone竖向](/img/posts/orientation-iphone-portrait.png)

## 验证EXIF

在经过上面的分析之后，我们来看看实际情况如何。我们分别在Mac和Windows平台上对前面的论述做一个验证。

### Mac平台

可以将照片从iOS设备中导出到Mac系统上，(注意，不能够使用iPhoto或者Photos来导入，因为这样照片在导入之前会被自动调整好方向)在这里我们像Windows中一样，将iPhone当成移动硬盘，直接访问其照片。在Mac上可以使用[iTools](http://pro.itools.cn/mac/english)这一神器。

然后用Mac上的`预览`程序查看其`EXIF`属性，通过`预览-工具-显示检查器`打开对话框，即可查看到图片中关于方向的详细信息，下面四张图分别展示了上面四种方向下拍得照片的Orientation值：

- Home键位于右侧时，即相机的默认方向，值为1。
 ![Home键在右侧](/img/posts/orientation-home-right.png)

- Home键位于上侧时，值为8。
 ![Home键在上侧](/img/posts/orientation-home-up.png)

- Home键位于左侧时，值为3。
 ![Home键在左侧](/img/posts/orientation-home-left.png)

- Home键位于下侧时，即正常手持手机的方向，值为6。
 ![Home键在下侧](/img/posts/orientation-home-bottom.png)

对照前面的分析，果然保持一致。而且照片显示正常。

再次提醒：照片存储在手机中始终是以相机坐标系保存的，只是读取方向信息之后做了旋转。

### Windows

前面提到过，被写在图片元数据中的方向信息并没有被全部支持，Windows的图片查看器便是其中之一，也是Windows上的用户最常使用的工具。因为没有自动去读取方向信息，所以图片被读入之后，便全部是其保存的图片本身，这样便出现了横向，或者颠倒。

## 开发时如何避免

既然不是所有的工具都支持方向属性，而且包含了具有最多用户群体的Windows用户，那么我们在开发照片相关的应用时，有没有什么办法可以避免这一情况呢？

当然有！既然我们可以非常容易的得到照片的方向信息，那么只需要在保存之前对照片进行旋转即可，直接将最终具有正确方向的照片保存下来。

当我们得到一个图片`UIImage`对象时，它有一个属性叫：`imageOrientation`，这里面便保存了该图片的方向信息：

> Property
> The orientation of the receiver’s image. (read-only)
> Discussion
> Image orientation affects the way the image data is displayed when drawn. By default, images are displayed in the “up” orientation. If the image has associated metadata (such as EXIF information), however, this property contains the orientation indicated by that metadata. For a list of possible values for this property, see UIImageOrientation.

它的值可能为下面八种，这些值都可以和EXIF中Orientation的定义对应起来：

把方向也加进来。

{% highlight objc linenos %}
typedef enum {
   UIImageOrientationUp,
   UIImageOrientationDown ,   // 180 deg rotation 
   UIImageOrientationLeft ,   // 90 deg CW 
   UIImageOrientationRight ,   // 90 deg CCW 
   UIImageOrientationUpMirrored ,    // as above but image mirrored along 
   // other axis. horizontal flip 
   UIImageOrientationDownMirrored ,  // horizontal flip 
   UIImageOrientationLeftMirrored ,  // vertical flip 
   UIImageOrientationRightMirrored , // vertical flip 
} UIImageOrientation;
{% endhighlight %}

那么我们便可以根据这一属性对图像进行相应的旋转，从而将图片的原始数据旋转至正确的方向，在浏览照片时无需方向信息就可以。

StackOverflow上给出了很好的答案，比如[这个](http://stackoverflow.com/a/5427890/973315)。我们简单做一个介绍：

### 直观的解决方案

首先，为UIImage创建一个category，其中包含`fixOrientation`方法：

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

代码有些长，不过却非常直观。这里面涉及到图片矩阵变换的操作，理解起来可能稍稍有些困难，接下来，我会有另外一篇文章专门来介绍图像变换。现在，记住下面两点便能够很好的帮助理解：

- 图片的原点在左下角
- 矩阵变换时，后面的矩阵先作用，前面的矩阵后作用

以UIImageOrientationDown方向为例，苹果的开发文档中给出一张图片：![UIImageOrientationDown](/img/posts/orientation-UIImageOrientationDown.png)，对它的旋转需要两步，第一步是以左下方为原点旋转180度，

![旋转180度后](/img/posts/orientation-after-rotate.png)

于是便有了：

{% highlight objc linenos %}
transform = CGAffineTransformRotate(transform, M_PI);
{% endhighlight %}

因为是以左下方为原点旋转的，所以整幅图被移到了第三象限，第二步需要向右上方进行平移，即x方向上移动图片的宽度，y方向上移动图片的高度，所以有了：

![平移后](/img/posts/orientation-after-transition.png)

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

同样也是StackOverflow上的[答案](http://stackoverflow.com/a/10611036/973315)，非常简单，但是没有那么直观：

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

这里是利用了系统提供的UIImage中的`drawInRect`方法，它自动的考虑到了图片的方向，其文档如下：

{% highlight objc linenos %}
- drawInRect:
Draws the entire image in the specified rectangle, scaling it as needed to fit.

Discussion
This method draws the entire image in the current graphics context, respecting the image’s orientation setting. In the default coordinate system, images are situated down and to the right of the origin of the specified rectangle. This method respects any transforms applied to the current graphics context, however.
{% endhighlight %}

## 结尾

(全文完)

feihu<br>
2015.05.28 于 Shenzhen

