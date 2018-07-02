---
layout: post
title:  移动端顺序无关的半透明渲染：Order-Independent Transparency
description: SGI版本的STL中，sort算法采用了Introspective Sort，本文详细分析了该算法的实现。算法后半部分使用了插入排序，本文对几种插入排序作了性能对比，并重点分析了__final_insertion_sort为何如此实现
tags:   OIT, Blending, Order-Indendent Transparency, OpenGL, OpenGL ES 2.0, OpenGL ES 3.0, Weighted Blended Order-Independent Transparency
image:  std-sort.png
---

为了在计算中表示物体的颜色，除了RGB以外，会增加alpha通道来表示透明度，alpha范围从0~1.0，0表示完全不可见(能够使颜色完全穿透)，即全透明，例如一个纯透明的玻璃可以毫无遮挡的穿透后面物体的颜色。1.0表示完全不透明(完全显示自身的颜色)，当alpha为其它值时，表示同时显示穿透的颜色与自身颜色。

{{ more }}

### 目录
{:.no_toc}

* Table of Contents Placeholder
{:toc}

-----

## 背景

在OpenGL中，透明物体的渲染会使用混合技术(Blending)，

## 混合

### discard fragment
介绍discard片段
### 混合

![opengl-blending](/img/posts/oit-opengl-process.png)

参考learn opengl
OVER操作符是不可逆的->公式证明->图像举例

![red-green](/img/posts/oit-red-green.png)

![green-red](/img/posts/oit-green-over-red.png)

![red-green](/img/posts/oit-red-over-green.png)

混合的问题
背景，讲述半透明渲染存在的问题
### 排序可以解决
交叉面
球面

## OIT

### OIT分类

可以从论文中分析
知乎(https://www.zhihu.com/question/40274034)

### 为何选择Weighted 这种
最简单的blended oit，有什么缺点
方案选择：Linked List的方法是用到了imageStore，这个OpenGL ES 3.1才支持

## 实现

### 公式推导
介绍算法原理
premultiplied alpha
看ppt
权重也看ppt

### 算法离实现的距离

### 如何将其转化成OpenGL
OpenGL alpha blend function的作用
Depth test的作用
解释算法每一行与公式如何对应的

### 步骤
- 不透明
- 半透明
- 最终渲染

### 与普通的对比，多了哪些

### 问题解决

在我们的场景下公式存在问题，需要交换alpha
刚开始因为与公式一样，所以渲染出来的结果太亮了
gl_FragColor的意义

#### 交换alpha

#### 兼容性
- 先是3.0版本的实现->问题
Android不行，切到3.0，改shader
还是不行，为啥要切到2.0
2.0里面精度的问题，要用float_extension
Float texture原生不支持：链接
解释color-renderable format
android扩展的问题，三种方式来处理

#### FBO
Depth buffer如何绑定->假的FBO
解决FBO的问题，说明fbo0与其它的fbo无法共用，也就是on-screen与off-screen的问题

### 结果
maya、preview与我们前后的对比


## 写在最后

(全文完)

feihu

2018.05.28 于 Shenzhen
