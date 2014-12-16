---
layout: post
title:  回车换行的故事
description: 本文介绍了回车换行的故事，分析了其在各平台上的不同，并比较了C语言文件操作的文本模式和二进制模式的区别。
tags:   CR, LF, EOL, carriage return, line feed, 回车，换行，fopen, \r\n, text mode, binary mode
image:  end-of-line.png
---

不知各位有没有过这样的经历：

- Linux上创建的文件在Windows上打开时，结果所有内容会挤成一行。而Windows上创建的文件在Linux上打开时，每一行的结尾又多了一个奇怪字符`^M`。
- 在安装Windows版的git时，安装向导在某一步会提示你选择"Configuring the line ending conversions"，里面提到了Windows-style和unix-style的line endings，为什么会有这些呢？
- 调用C语言的API `fopen`时，会有text mode和binary mode，这两者有什么区别？

其实这一切都和我们常说的回车换行有关，但你有没有很奇怪，什么是回车？直接用换行不就好了，为什么要分开两个词？我们使用的键盘上的键明明起得是换行的作用，为什么叫回车？千万别被绕晕了，本文将和大家讨论有关回车换行的一段有趣的历史。

{{ more }}

### 目录
{:.no_toc}

* Table of Contents Placeholder
{:toc}

-----

## 历史

我们通常所说的回车换行其实只相当于一个概念，即一行结束，开始下一行，英文叫做`End-of-Line`，简写为`EOL`。你也可以将这理解为一个**逻辑上的**换行，但为了与回车换行中的换行区分开来，我们后面还是称呼它为`EOL`。

### 打字机

回车换行严格说起来是两个独立的概念，回车和换行，它们的出现要追溯到计算机出现之前，那时有一种电传打字机：Teletype Model 33 ASR，如下图：

![Teletype Model 33 ASR](http://bytecollector.com/images/asr-33_vcf_02.jpg)

在打字机上，有一个部件叫`Carriage`，它是打字头，相当于打字机的光标。每输入一个字符，`Carriage`就前进一格。当输满一行后，想要切换到下一行时，需要`Carriage`在两个方向上的运动：水平和竖直。水平方向上需要将`Carriage`移到一行的起始位置，竖直方向上需要纸张向上移动一行，此时也就是相当于`Carriage`下移了一行。（这在很多影视作品里面可以看到，打字者们打完一行之后，通常会用手拨动一个滑块，然后听到“咔”的一声，接着输入下一行。只是在这款打字机中不再需要人为的去拨动。）而这两个动作分别对应着：

- Carriage Return(CR)，也即回车，它在ASCII表中的值为0x0D，可以用转义符`\r`表示
- Line Feed(LF)，也即换行，它在ASCII表中的值为0x0A，可以用转义符`\n`表示

因为打字机是机械的结构，所以虽然从逻辑上只表示为`EOF`，但从设计上它需要分为两个独立的操作，这也正是我们习惯连起来说回车换行的原因。可以参照下图看看其键盘的布局：

![键盘布局](http://upload.wikimedia.org/wikipedia/commons/e/ea/Mappa_Teletype_ASR-33.jpg)

键盘的右方有一个`Line Feed`和`Return`，这分别对应着前面提到的两个操作。所以`EOL = CR + LF`。然而，通常一个回车操作不能够在一个字符打印的时间内完成，所以你可以想象，如果在在其移动的过程中按下了其它的键，打印的内容将变得十分混乱。所以在`Carriage Return`和`Line Feed`之后，有时会有1~3个NUL字符(即相当于汇编语言中的空指令，仅起占位作用)，以等待前两个操作的完成。

### 分歧出现

等到早期的计算机发明时，很自然的这两个概念被拿了过来。但是由于那时的存储设备非常昂贵，一些人认为在每行的结尾加两个字符用于换行，实在是极大的浪费，于是各个厂商在这一点上便出现了分歧。

由于一些早期的微型计算机还没有用于隐藏底层硬件细节的设备驱动，所以它们直接沿用了打字机的惯例，使用不带NUL的`CRLF`作为一个`EOL`。而CP/M为了和这些微型计算机使用同一个终端，也采用了这种设计。所以它的克隆MS-DOS也同样使用`CRLF`，由于Windows又是基于MS-DOS，为保持兼容性，所以就导致了如今的Windows是采用`CRLF`作为`EOL`，即`\r\n`。

而Multics在被设计之时就非常认真的考虑了这一问题，设计者们觉得只需一个字符便完全足够来表示`EOL`，这样更加合理。那么选择`CR`还是`LF`呢？本来由于那时的键盘上都有一个Return键，所以可能更好的选择是`CR`。但当时考虑到`CR`可以用来重写一行，以完成如**粗体**和<s>删除线</s>等效果，所以他们选择了稍稍难以理解的`LF`。然后自己设计了一个设备驱动程序来将`LF`转换为各种打字机所需要的`EOL`，这个方案非常完美，当然除了`LF`稍微奇怪一些。随后一脉相承的Unix和Linux们都继承了这个选择，于是你在这些操作系统上可以发现每一行的结尾是一个`LF`，即`\n`。

Mac系统的选择就更加复杂一些。Apple在设计Mac OS时，他们采用了一个最容易理解的选择：`CR`，即`\r`。但这只维持到Mac OS 9，后一个版本的Mac OSX基于Mach-BSD内核，所以此后版本的Mac OSX在每行的结尾存储了与Linux一样的`LF`，`\n`。

### 混乱的状况

还有很多其它的操作系统[采用更加不同的方案](http://en.wikipedia.org/wiki/Newline#Representations)，这也导致了混乱的产生。对于文章开始提出的问题，因为Linux和Mac OSX上使用的是`LF`，而Windows上使用的是`CRLF`，那么Linux和Mac OSX上创建的文件在Windows上打开时，由于每一行的结尾只有一个`LF`，但Windows只认识`CRLF`，所以便不会有逻辑上的换行处理，故所有的文字被挤到了一行。反过来，如果Windows上的文件在Linux和Mac OSX上打开时，仅需`LF`便可换行，那么每一行的结尾便多了一个`CR`，它相当于键盘上的Enter键，即`^M`。

而git的安装向导会特意有一个这样的提醒页面也出于此，因为一个项目可能有多个开发者，每个开发者可能使用的是不同的系统，那么开发者checkout代码时，如果不作换行符的转换，有可能就会出现只有一行或者行尾多了`^M`的情况。当然，如果你有一个可以识别多种`EOL`的现代文本编辑器，那么不做转换也无妨(notepad不行)。

如果出现了上面的转换问题时，可以[对文件进行转换](http://en.wikipedia.org/wiki/Newline#Conversion_utilities)。但这只是治标不治本，如何才能从根本上避免这样情况？像隐藏硬件细节的驱动程序一样，我们只有寄希望于高级语言。

## 统一

为了避免在这些不同的实现中挣扎，高级语言给我们带来了福音，它们各自使用了[统一](http://en.wikipedia.org/wiki/Newline#In_programming_languages)的方式来处理`EOL`。在C语言中，你一定知道在字符串中如果要增加一个换行符的话，直接用`\n`即可，比如：

{% highlight cpp linenos %}
printf("This is the first line! \nThis is a new line!");
{% endhighlight %}

上面的输出将是：

    This is the first line!
    This is a new line!

为什么C语言选择了`\n`而不是`\r`？这绝非偶然。熟悉C语言历史的朋友可能知道当初C语言是Dennis Ritchie为开发Unix而设计，所以它沿用了Unix上`EOL`的惯例便很容易理解了。而我们知道Linux使用的`LF`的ASCII码为`0x0A`，转义符为`\n`，因此C语言中也使用`\n`作为换行。

### Text Mode VS Binary Mode

但是，千万别简单的认为上面的`\n`最终写到文件中就一定是其ASCII码`0x0A`，或者文件中的`0x0A`被读到内存中就是其转义符`\n`。这取决于C语言打开文件的方式。在C语言中，在对文件进行读取操作之前，都需要先打开文件，可以使用下面的函数：

{% highlight cpp linenos %}
#inlcude <stdio.h>
FILE *fopen(const char *path, const char *mode);
{% endhighlight %}

注意看第二个参数`mode`，通常可以为读(r)，写(w)，追加(a)或者读写(r+, w+, a+)，仅指定这些参数时，文件将被当成是文本文件来操作，即`Text Mode`，而如果在这些参数之外再指定一个额外的`b`时，文件便会被当成是二进制文件，即`Binary Mode`。这两种模式的区别在哪里呢？这里稍稍有些复杂，因为它们在不同的平台上表现不同。

#### Windows平台

对于Windows平台，因为其使用`CRLF`来表示`EOL`，故对于`Text Mode`需要做一定的转换才能够与C语言保持一致。接下来的两个图可以给出最为直观的描述。

先看二者对于读操作的区别：

![读操作](/img/posts/eol-read.png)

`Text Mode`下，C语言会尝试去"理解"这些回车与换行，它会知道`LF`和`CRLF`都可能是`EOL`，所以不管文件中是`LF`还是`CRLF`，被读进内存时都会变成`LF`。而二进制模式下，C语言不会做任何的"理解"，所以这些字符在文件中什么样，读到内存中依然那样。

接下来是写操作的区别：

![写操作](/img/posts/eol-write.png)

文本模式下，内存中的每一个`LF`写入文件中时都会变为`CRLF`，当然，如果不幸内存中为`CRLF`，以此种模式写入到文件中时就会变成`CRCRLF`（**注意**：这里不是`CRLF`）。而二进制模式下，内存中的内容会被原封不动的写到文件中。

所以为了保证一致性，一定需要注意配套使用读和写，即**读和写采用同一种模式打开文件**。

#### Linux和Mac OSX平台

因为Linux和Mac OSX平台与C语言对待`EOL`的方式完全一致，所以`Text Mode`和`Binary Mode`在这些平台下没有任何区别，可以参考`fopen`的[man page](http://man7.org/linux/man-pages/man3/fopen.3.html)。其际上，所有遵循POSIX的平台都忽略了`b`这个参数。

虽说在这些平台上处理`EOL`非常简单，但是如果你的程序需要移植到其它非POSIX平台上时，请务必正确对待`b`参数。

## 更多资料

如果你还有兴趣，可以看看下面这些有趣的资料：

- 阮一峰的[《回车与换行》](http://www.ruanyifeng.com/blog/2006/04/post_213.html)
- [The End of Line Puzzle](http://www.oualline.com/practical.programmer/eol.html)，也即上面那篇文章的出处
- 关于[What is the ASCII code for newline character?](http://www.quora.com/What-is-the-ASCII-code-for-newline-character)的一个回答
- 维基百科上关于[换行](http://en.wikipedia.org/wiki/Newline)的解释
- 从网络的角度讲述了[End-of-Line的故事](http://www.rfc-editor.org/EOLstory.txt)
- 打字机的一段[视频](https://www.youtube.com/watch?v=LJvGiU_UyEQ)，需梯子

## 结尾

2014年即将过去，自从[libFeihu](http://feihu.me)创建以来，这已是第十篇文章，也会是2014年的最后一篇。速度不快，产量不高，差不多一个月左右一篇，但我非常满足，这达到了年初给自己定下的目标。现在随手转载，几乎不费吹灰之力，于是网络上充斥着大量未经调查考证，未经授权，未经版面调整的内容。我不想做网络上的拿来主义者。希望能够保证每一篇文章的质量，保证每一篇文章都花了大量的时间来进行调查，并以一种最为通俗的，深入浅出的方式表达出来。这对自己的知识是一个非常好的总结，通过调查也会让自己避免浮于问题表面，能够更加深入的剖析遇到的问题，同时也使表达能力得到锻炼。坚持写下去。

(全文完)

feihu

2014.12.16 于 Shenzhen

