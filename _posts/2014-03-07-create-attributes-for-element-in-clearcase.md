---
layout: post
title:  记一次当前工作目录问题的排查经历
description: 一个由当前工作目录引起的问题，问题最终很简单，但是却困扰大家很久
tags:   ClearCase，clearvtree，sendto，git，gitk，当前工作目录，脚本，batch，debug，快捷方式
image:  version-ctrl.png
---

最近在使用ClearCase的时候遇到一个问题，当从命令行里启动版本树，并想给一个节点打上review属性时，经常会出现一个命令窗口一闪而过，刷新版本树之后却没能找到想要打的review属性，只有再次尝试才会正确打上。大家忍受了这个问题很久，但一直都没时间去深入分析它。在连续几次遇到这情况之后，我觉得忍无可忍，下定决心解决它，最终找到了问题的根源并给出了解决方案，在这里详细记录一下这次排查的经历。

{{ more }}

### 目录
{:.no_toc}

* Table of Contents Placeholder
{:toc}

## 故事背景

我们使用的版本管理工具是[ClearCase](http://www-03.ibm.com/software/products/zh/clearcase/)，一个集中式(相对于分布式的Git)的商业化配置管理工具，类似于SVN，CVS等工具，但功能强大的多，有很强的扩展性，可以根据自己的需要进行一些订制与扩展，比如增加一些提交代码时的trigger，checkout代码时hook等等。当然，[价格也不菲](http://product.yesky.com/product/177/177141/price.shtml)。

[clearvtree](https://publib.boulder.ibm.com/infocenter/cchelp/v7r0m1/index.jsp?topic=/com.ibm.rational.clearcase.doc/topics/u_ccvtree.htm)是用来查看一个文件版本树的工具，类似于`git`中的`gitk -- aFile`，可以非常方便的查看单个文件的修改历史。它可以用下面两种方式打开：

- ClearCase资源管理器，和Windows资源管理器很相似
- 命令行，直接输入`clearvtree file_path`

因为流程方面的要求，在每次提交一份代码后，必须经过相应的单元测试，由提交者打上`unittested`属性，然后交给他人review，如果没问题，他会打上`reviewed`属性，否则提交者需要再重复这一过程只到问题解决为止。只有在这两份属性共同存在的情况下，新版本才能被允许进入build中，这从很大程度上保证了代码的质量。

### 创建unittested/reviewed属性

使用[cleartool mkattr](http://www.ipnom.com/ClearCase-Commands/mkattr.html)命令可以创建这些属性，但由于这两个属性必须带上一些有用的信息，比如时间，执行者，所以为了方便起见，我们通常不直接调用，而是采用一个脚本`reviewed_by_me.bat`(这里只讨论review，unittest的处理完全一样)去得到执行者与当前时间的信息，这个脚本里面的内容大致如下：

{% highlight bat linenos %}
    set element="%1"
    rem get time for var %time%
    ...
    rem get user for var %user%
    ...
    call cleartool mkattr reviewed_by_%user% \"%time%\" %element%
    ...
{% endhighlight %}

然后在Windows的`SendTo`目录下创建一个快捷方式`reviewed`，指向这个脚本。于是，要给一个文件创建属性时，只需：

1. 用前面介绍的任一种方式启动版本树
2. 在版本树中对目标节点点击右键，然后在`SendTo`菜单下选择创建的`reviewed`选项

### 问题浮现

一切都显得很正确，但用了一段时间之后，很多人发现一个现象，打开版本树后，经常点了`reviewed`选项，发现一个命令窗口一闪而过，刷新却看不到刚创建的属性，然后只有再试一次才能成功，更为奇怪的是这个问题并不总是出现。

## 分析过程

要解决这个问题，这里有三点需要解答：

1. 为什么问题不是每次都出现？
2. 为什么第一次没有成功，出了什么错误？
3. 为什么刷新一次之后就可以了？

这里首先看看第一次到底出了什么错误。由于命令窗口一闪而过，无从知道发生了什么，所以要么重定向脚本，要么让脚本执行完之后停下，而不是关闭退出，这样才能够得到错误信息，这里采用了简单的暂停脚本方案。找到脚本文件，在最后加上`pause`，再试一次创建属性，得到了错误信息(注：这里假设文件是：`Q:\project\src\test.cpp`，版本是`main\7`，所以在ClearCase里面整个文件的路径为`Q:\project\src\test.cpp@@\main\7`)：

    cleartool: Error: Unable to access "project\src\test.cpp@@\main\7": No such file or directory.

找不到文件？在命令行中运行：

    Q:\> ls project\src\test.cpp
    project\src\test.cpp

明明文件存在，怎么会显示找不到这个文件呢？

### 猜测一

想到之前出现过在ClearCase中无法找到文件的情况：访问大量文件时偶尔会出现无法找到个别文件的情况，那是由于网络的问题。因为ClearCase采用的是集中式的版本控制，我们创建view的方式是`Dynamic`，而不是`Snapshot`，所以所有的数据实际上存在于ClearCase服务器上，客户端想要访问一个文件时，会通过网络协议去服务器获取，取回本地之后才能够访问。如果出现大量的文件访问，网络又不是特别好的情况下，就可能会出现传输失败，从而无法访问文件的情况。

于是用`ccadminconsole.msc`命令去查找ClearCase所有的Log，结果真在`ClearCase\My Host\Server Logs\view`下找到了一些可疑的Log：

    Reloading view cache; expect temporary delays accessing objects in VOB XXX

难道是这个原因？去网上搜索一阵也无法得到有用的信息。

但是转眼又想，既然刚刚是由于这个文件还没有取回本地导致的，如果我再次打开版本树，并尝试创建`review`属性，是否就应该没问题了？抱着这种想法又试了一次，结果还是和刚才情况一样，无法找到文件，于是否定了这个猜测。

### 猜测二

放弃了上面的猜测之后，又进行另一种猜测，会不会是`SendTo`的机制有些没弄明白的地方？如果不用`SendTo`的这种方式，而直接用前面介绍的命令，会有一样的结果么？于是在命令行中调用：

    Q:\> cleartool mkattr reviewed_by_xxuser \"20140306_0952\" project\src\test.cpp@@\main\7
    Created attribute "reviewed_by_xxuser" on "project\src\test.cpp@@\main\7".

竟然成功执行，那么问题可能就出现在`SendTo`上。接着猜想，难道是由于`SendTo`的实现机制有问题？如果不用`SendTo`，而是直接在命令行里调用这个脚本可以么？于是把上面的命令保存成一个脚本，放在`C:\test\reviewed_by_me.bat`，再调用一次：

    Q:\> C:\test\reviewed_by_me.bat
    Created attribute "reviewed_by_xxuser" on "project\src\test.cpp@@\main\7".

仍然成功。

等等，这和`SendTo`的方式还有一点区别，`SendTo`是的确是调用了这个脚本，但是它是通过一个快捷方式来调用的，而不是直接运行脚本。为了达到一样的实验条件，我也创建一个快捷方式：`reviewed`，指向上述脚本。双击之后，发现果然出错了，一样的无法找到文件！

现在的问题就变成了双击以快捷方式打开的脚本和直接从命令行里启动的脚本有什么区别？也许大家看到这里就能猜到原因了，但是当时我还没有立刻意识到，而是同时思考了另外一个问题，为什么把版本树刷新一次又可以了呢？刷新前后都调用的是同样的`SendTo`，这次刷新前后有些什么区别？

### 猜测三

为了得到更多的信息，将`reviewed_by_me.bat`中的命令执行前都打印输出，执行两次之后注意到了问题所在。这是第一次失败时的结果：

    call cleartool mkattr reviewed_by_xxuser \"20140306_1002\" project\src\test.cpp@@\main\7
    cleartool: Error: Unable to access "project\src\test.cpp@@\main\7": No such file or directory.

这是刷新之后成功执行的结果：

    call cleartool mkattr reviewed_by_xxuser \"20140306_1003\" **Q:\\**project\src\test.cpp@@\main\7
    Created attribute "reviewed_by_xxuser" on "**Q:\\**project\src\test.cpp@@\main\7".

细心的你可能已经发现了这个区别，成功的那一次多了一个**Q:\\**，是一个**绝对路径**，失败的是**相对路径**，难道问题就出在这里？那为什么前面直接在命令行中用这个相对路径也能正确执行呢？

这个路径是怎样来的？

在前面调用`clearvtree`时用的是：

    Q:\> clearvtree project\src\test.cpp

难道是这个原因？于是我试了一次输入绝对路径给`clearvtree`：

    Q:\> clearvtree Q:\project\src\test.cpp

然后再创建一次`review`属性，真的成功了！

### 看到曙光

通过前面的猜测，现在的问题就定位在**相对路径**与**绝对路径**上，文章刚开始的三个问题变成：

1. 为什么相对路径会出错？
2. 为什么同样是相对路径，在命令中的调用不出错，而通过`SendTo`就出错了？
3. 为什么刷新之后相对路径变绝对路径了？

我们知道任意一个进程在处理一个相对路径时，为了正确的访问文件，都需要另一个重要的参数：`当前工作目录`，进程，更准确的说是操作系统会将相对路径扩展成一个绝对路径再进行处理：

    绝对路径 = 当前工作目录 + 相对路径

### 拔开云雾

前面都是我们的推测，到了该印证推测的时候了。

从命令行中的调用和`SendTo`的方式结果不一致入手。 由于它们的相对路径一样，那么问题一定是出在`当前工作目录`上，先来看命令行的方式，从头到尾我只开了一个命令行窗口，它的工作路径是：`Q:\`，因此，在这里面调用的子进程默认都会继承同样的`当前工作目录`，所以传给它们的相对路径最终都会扩展成为正确的路径：

    path = Q:\ + project\src\test.cpp = Q:\project\src\test.cpp

再来看`SendTo`，因为这里调用的是一个`快捷方式`，它有一个特点，可以指定自己的`Start in`参数，下图是`SendTo`中`reviewed`快捷方式的属性：

![review快捷方式属性](/img/posts/properties-of-reviewed.gif)

这里的`Start in`属性指定的就是调用命令时的`当前工作目录`，它的值是`M:\admin\tools\review`，因此一个相对路径扩展之后变成：

    M:\admin\tools\review\project\src\test.cpp

这个路径当然是错误的，这就可以解释为何`SendTo`的方式会出错了。

### 其它问题

前面介绍过打开版本树通常有两种方式，除了刚刚讨论的命令行，还可以从`ClearCase资源管理器`中打开，这种情况不存在我们讨论的问题，因为点击打开版本树选项之后，资源管理器直接将完整的路径传给了`clearvtree`进程，因此不管它的当前工作目录位于何处，都可以正确的处理。这也可以解释文章最开始提出的问题：为什么这个问题有时出现，有时不出现？

对于问题3，没有找到相关的资料，推测可能是由于刷新之后，`clearvtree`进程内部将路径扩展，这是程序内部实现的问题，在这里不作讨论。

## 解决方案

找到问题之后，应该如何解决呢？想到两种解决思路：

1. 把`当前工作目录`设置成与`clearvtree`一样
2. 在`reviewed_by_me.bat`脚本中将相对路径扩展成绝对路径

对于方案二，打算扫描每个view，然后去匹配路径，但这样速度一定很慢，而且还无法保证正确性，放弃。

那么只有采用方案一，现在的问题变成，如何获得`clearvtree`的当前路径？在`reviewed`调用脚本的时候，只能从`clearvtree`那里获得文件的相对路径，存储在`%1`中。工作目录从哪里获取到呢？

在前面讨论中，一个进程调用子进程时，默认情况下子进程的`当前工作目录`会与父进程一样，什么是默认情况？其实就是子进程没有明确指定自己`当前工作目录`的情况，而这里的`reviewed`快捷方式是设置了`Start in`，这样就意味着如果将它清空，脚本便会从`clearvtree`中获得正确的`当前工作目录`，根据这个分析开始验证：

1. 清空`reviewed`快捷方式的`Start in`
2. 在`reviewed_by_me.bat`脚本中输出`当前工作目录`：

    `for /f %%i in ('CD') do echo %%i`

### 一波三折

本来期盼着得到：`Q:\`，结果却出乎意料，输出的是：

    Q:\project\src\test.cpp@@\main

这根本不是一个目录，不知为何`clearvtree`将脚本的工作路径设置成了这样一个奇怪的"目录"。但是不管怎么样，起码我们可以得到一个大概的路径，知道它在`Q:\`盘下，现在的相对路径是：

    project\src\test.cpp@@\main\7

可以从前面的`当前工作目录`中得到盘符，然后去猜测相对路径，或者拿相对路径与`当前工作路径`去匹配，计算得到一个正确的路径……

这种方法可以得到正确的结果，但是有些复杂，最终没有采用，因为发现了一种更为简单的`workaround`。

### Workaround

上面的奇怪"目录"是怎么来的，注意看该节点完整的路径：

    Q:\project\src\test.cpp@@\main\7

对比可以发现，其实是由于操作系统不知道`ClearCase`采用的文件命名方式：

    绝对路径 + @@ + \分支\ + 版本号

操作系统将上面`ClearCase`内部路径当成了一个普通的文件路径，`版本号7`被当成了文件名，而从右边开始的第一个`版本号分隔符\`被当成了`路径分隔符`，操作系统去除"文件名"，所以才出现了这种奇怪的"目录"。

为了印证这一点，我又对另外一个节点创建`reviewed`属性：

    project\src\test.cpp@@\main\test\1

这是在`main`上的一个`test`分支，再次选择`SendTo`下的`reviewed`快捷方式，得到下面的`当前工作目录`：

    Q:\project\src\test.cpp@@\main\test

看到这里想必大家都明白我要做什么了，没错，这个奇怪的"目录"其实就差一个`版本号`就可以构成一个完整的节点路径，而`clearvtree`传过来的`%1`参数就包含了这个`版本号`，截取之后拼在上面的目录后就可以得到完整的路径，这里是最终的`reviewed_by_me.bat`代码：

{% highlight bat linenos %}
    set element="%1"
    rem get time for var %time%
    ...
    rem get user for var %user%
    ...
    rem Get the version number
    for /f %%i in ("%element%") do set version_num=%%~ni
    rem Assemble the real path
    for /f %%i in ('CD') do set element_path=%%i\%version_num%
    call cleartool mkattr reviewed_by_%user% \"%time%\" %element_path%
    ...
{% endhighlight %}

## 测试

最后对下面几种方式启动的版本树进行了测试，所有的情况都成功的运行：

    Q:\> clearvtree project\src\test.cpp
    Q:\project> clearvtree src\test.cpp
    Q:\project> clearvtree ..\project\src\test.cpp
    Q:\project> clearvtree \project\src\test.cpp
    Q:\project\src> clearvtree test.cpp
    C:\> clearvtree Q:\project\src\test.cpp

至此，该问题成功解决。

## 写在结尾

这是一次平常众多工作中遇到的一个细小的问题，通过一点点的排除，顺藤摸瓜，最终找到了问题的根源。这篇文章非常详尽(啰嗦似乎更合适)的通过自问自答的方式，记录了整个分析过程。对我来说，重要的不是解决了这个问题，而是训练自己遇到事情不去忍受，想办法解决的意识。

记得刚刚参加工作时，由于要分析程序崩溃的原因，用一个命令每次一行的分析backtrace文件，通过内存地址去得到堆栈的确切位置。每次都需要拷贝地址，修改命令参数，执行，通常要执行五六次以上才能够找到有用的信息。但当时好像每个人都认同这种方式，不就是简单的几步操作么，没觉得有多麻烦啊，我也一样。后来一个哥们写了一个简单的shell脚本，输入为backtrace文件，一次把所有的内存地址转换成文件的确切位置，看到这个脚本时立刻被震撼到了，不是这个脚本有多复杂，而是除了他，没有任何人想到这点，所有人都在忍受，甚至连忍受都感受不到，麻木的接受一切。

其实每一份忍受都源自于对现状的不满足，各行各业存在的目的不就是为了解决人们各种各样的不满足么，一个公司能否持续发展不也是看它能否不断发现并满足人们的不满足么？换种说法，这种不满足也就是需求。面对需求我们应该做些什么？发现并抓住它，有可能就成为机遇；忽略它，可能就变成了抱怨。人的追求是无止尽的，现状永远都满足不了人，所以我一直认为，只要存在不满足的地方，就一定存在着机遇，问题在于我们怎样面对它们。我们领导经常说这样一句话：**别抱怨，提建议；别建议，解决它。**我很喜欢这句话，送给大家，与君共勉，做一个有心人。

(全文完)

feihu

2014.03.07 于 Shenzhen
