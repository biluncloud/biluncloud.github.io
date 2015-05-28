---
layout: post
title:  如何处理iOS中的照片方向
description: 对于在iOS设备中拍得的照片，放置于Windows上打开时，经常会发现是横的或者颠倒的，需要旋转才能适合观看，而在Mac上面则完全不需要，本文解释了造成这一现象的原因并给出了解决方案。
tags:   iOS, UIImage，JPEG，EXIF，UIImagePickerController，orientation
image:  uibutton.png
---

使用过iPhone或者iPad的朋友在拍照时不知是否遇到过这样一个问题，将这些设备中的照片导出到Windows上时，经常发现导出的照片要么横了，要么颠倒了，常常需要旋转才能够适合观看。而如果直接在这些设备上观看时，图片始终显示正确的方向，在Mac上也是如此。同一张照片为什么在不同的设备上表现的不同？如何能够避免这种情况？本文将一一解开这些问题。

{{ more }}

### 目录
{:.no_toc}

* Table of Contents Placeholder
{:toc}

-----

## 照片的存储演变

一般相机拍摄出来的画面都是长方形，在拍摄的那一瞬间，它会将取景器中的场景存到对应的像素位置。相机本身并没有任何方向的概念，只是使用者想要拍摄的场景在他期望的照片中显示的方式与实际存在差异时，才有了相对的方向。如下图，对一个场景`F`进行拍摄，相机的方向可能会有这样四个常见的角度：

![摄像头取景](/img/posts/orientation-camera-view.png)

由于相机仅反应真实的场景，因此以相机的坐标系来说，实际拍摄出来的图像为：

![存储情况](/img/posts/orientation-encoded-jpeg.png)

最初的卡片机时代，所有的照片都由胶片洗出来，那时不存在照片的方向问题，因为不管我们以何种角度拍摄，最终洗出来的照片，它本身是非常容易旋转的，所以我们总可以通过简单的旋转来观看照片或者保存照片。

![照片墙](/img/posts/orientation-photo-wall.jpg)

可是到了数码时代，照片需要被存成一个图片文件，对于上面的拍摄角度，所以的场景仍然是以相机的坐标系来保存。于是这些照片以这种情况原封不动的保存了下来：

![存储情况](/img/posts/orientation-encoded-jpeg.png)

因为照片的保存方式，再加上电脑屏幕不像洗出来的照片那样容易旋转，所以它只能够以它原本的方向来展示。这便是为何照片传到电脑上之后，会出现横了，或者颠倒的情况，所以我们只有去旋转照片才能够正常观看。

为了克服这一情况，让照片可以真实的反应人们拍摄时看到的场景，现在很多相机中就加入了一个叫做方向传感器的玩意，它能够记录下拍摄时相机的方向，并将这一信息保存的照片中，然后用相机来浏览这些图片时，相机会可以根据图片中的这些信息，结合此时相机的方向，对图片进行旋转，从而适合人们观看。

在iOS的设备中包含了形形色色的传感器，自然也是包含了这样的方向传感器，如此一来，即使图片保存时仍然以相机的坐标系保存，它也可以根据图片中的方向信息来对照片进行旋转，从而转到适合人们观看的角度。

但是这一标准并没有被广泛的传播开来，或者说始终如一的贯彻，这也导致了本文所讨论的问题。

## EXIF

那么，到底是记录到图片的什么位置呢？答案是`EXIF`，[维基百科](http://zh.wikipedia.org/wiki/EXIF)上对其的解释如下：

> 可交换图像文件格式常被简称为Exif（Exchangeable image file format），是专门为数码相机的照片设定的，可以记录数码照片的属性信息和拍摄数据。... Exif可以附加于JPEG、TIFF、RIFF等文件之中

这其中有一个叫做`Orientation (rotation)`的标签，专门用于记录图片的方向，这便是相机写入方向信息的位置。它总共定义了八个值：

![Orientation的八种值](/img/posts/orientation-eight-values.png)

这个表格代表什么意义呢？我们来看第一行，值为1时，右边两列的值分别为：Row #0 is `Top`，Column #0 is `Left side`，其实很好理解，它表示图片的第一行位于顶端，而第一列位于左侧。前面我们提到过不管相机如何放置，它拍摄出来的结果始终以相机的坐标系保存，比如前面的四种拍摄角度对应的第一行和第一列的位置如下：

![第一行第一列](/img/posts/orientation-row0-column0.png)

注意看，第一行始终是相机的最上端，第一列是相机的最左边，这也说明了照片保存时始终取相机坐标系。

**注意**：对于上面的八种方向中，加了`*`的并不常见，因为它们代表的是镜像方向。

对比表格，我们可以推断出上面四种方式拍摄时，对应EXIF中Orientation的值如下所示：

![图片的方向](/img/posts/orientation-value.png)

### iPhone上的情况

再来看看iPhone的方向，它默认的照片方向并不是竖着拿手机时的情况，而是横向，即Home键在右侧，如下：

![iPhone正常方向](/img/posts/orientation-zero-degree.png)

如此一来，如果竖着拿手机拍摄时，就相当于对手机顺时针旋转了90度，也即上面相机图片中的最后一幅，那么它的方向为6。

![这里面一个图](/img/posts/orientation-.png)

### 实践

我们可以将照片导出到Mac系统上，(注意，不能够使用iPhoto或者Photos来导入，因为这样会被程序自动调整好方向，最终所有的照片都被旋转完毕)在这里我们像Windows中一样，直接将iPhone当成移动硬盘，直接访问其照片。在Mac上可以使用iTools这一神器。

然后通过`预览`程序查看其属性，在`预览-工具-显示检查器`，即可查看到图片中关于方向的详细信息，下面四张图分别展示了上面四种方向下拍得照片的Orientation值：

Home键位于右侧时，即相机的默认方向，值为1。
![Home键在右侧](/img/posts/orientation-home-right.png)

Home键位于上侧时，值为8。
![Home键在上侧](/img/posts/orientation-home-up.png)

Home键位于左侧时，值为3。
![Home键在左侧](/img/posts/orientation-home-left.png)

Home键位于下侧时，即正常手持手机的方向，值为6。
![Home键在下侧](/img/posts/orientation-home-down.png)

对着前面的分析，果然保持一致。

存储在手机中是不变的，实际上是读取之后做了旋转。

### Windows

前面提到过，被写在图片元数据中的方向信息并没有被全部支持，Windows的图片查看器便是其中之一，也是Windows上的用户最常使用的工具。因为没有自动去读取方向信息，所以图片被读入之后，便全部是其保存的图片本身，这样便出现了横向，或者颠倒。

## 解决办法

既然不是所有的工具都支持这一方向属性，而且具有最多用户群体的Windows用户，那么有没有什么办法可以避免这一情况呢？对于iOS开发者，我们可以在图片保存之前对其进行旋转。

当我们得到一个图片`UIImage`对对象时，它有一个属性叫：`imageOrientation`，这里面便保存了该图片的方向信息：

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

那么我们便可以根据这一属性对图像进行相应的旋转，从而将图片的原始数据旋转至正确的方向，从而无需方向信息就可以正常的显示。

StackOverflow上给出了很好的答案，比如[这个](http://stackoverflow.com/a/5427890/973315)：

为UIImage创建一个category：

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

这里面涉及到图片矩阵变换的操作，理解起来可能稍稍有些困难，在接下来，我会有另外一篇文章专门来介绍图像变换。在这里，下面两点可以帮助理解：

- 图片的原点在左下角
- 矩阵变换时，后面的矩阵先作用，最前面的矩阵最后作用

以UIImageOrientationDown方向为例，![UIImageOrientationDown](/img/posts/orientation-UIImageOrientationDown.png)，对它的旋转需要两步，第一步是以左下方为原点旋转180度，于是便有了：

{% highlight objc linenos %}
transform = CGAffineTransformRotate(transform, M_PI);
{% endhighlight %}

因为是以左下方为原点旋转的，所以整幅图被移到了第三象限，第二步需要向右上方进行平移，所以有了：

{% highlight objc linenos %}
transform = CGAffineTransformTranslate(transform, self.size.width, self.size.height);
{% endhighlight %}

再加上我们前面所说的第二点，矩阵变换时，后面的矩阵先作用，前面的矩阵后作用，那么只需要将上面两步颠倒即可：

{% highlight objc linenos %}
transform = CGAffineTransformTranslate(transform, self.size.width, self.size.height);
transform = CGAffineTransformRotate(transform, M_PI);
{% endhighlight %}

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


## 结尾


(全文完)

feihu<br>
2015.05.28 于 Shenzhen

