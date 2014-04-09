---
layout: post
title:  深入理解log机制
description: 在开源log4cpp的基础上又增加上一些控制，本文深入的分析了log机制的方方面面
tags:   log, log4cpp, tracing，debug
image:  version-ctrl.png
---

前段时间在部门内部做了一个关于log的知识分享，从无到有，非常深入的探讨了log中各种概念的来源，log库的用法，log内部处理流程，以及如何在一个涉及多台主机的系统中部署log等问题。本文将一一详细的介绍这些问题。

{{ more }}

## Table of Contents

* Table of Contents Placeholder
{:toc}

-----

## 写在前面

log如今已经成为了我们日常开发时所必不可少的工具，同debug一起，它们成为了开发者手中分析问题最有力的两个武器。两者各有优劣，但相比于debug，log在很大程度上可以更方便，更迅速的让开发者分析程序的问题，尤其是对于非常庞大的系统，或者已经发布的程序，又或者一些非必现的问题，当我们无法方便的debug问题程序时，log文件可以提供非常多有用的信息，大多数情况下根据log就分析出问题所在。因此，log的在问题分析中的地位也越来越高。

记得刚刚开始学习编程时，第一次听到这样一个观点时那种难以接受心情，怎么可能还有比debug更加容易分析程序问题的方法？好一个无知无畏。当然这一切都是源于当时写的程序规模都比较小吧，实际上当时已经或多或少使用了简单的log，只是还不自知罢了，那一条条控制台的cout与printf就是最好的证明。后来随着程序规模越来越大，才明白debug的局限性，逐渐的喜欢上了log。

## 勿在浮沙筑高台

现如今对于每一种开发语言都有非常多的库来帮我们处理log，比如：log4j(log for Java)，log4cpp(log for C++)，log4net(log for .NET)等等。最早处理log的库是[Log4j](http://logging.apache.org/log4j/)，它是Apache为Java发布的一个开源log库，后来基于这个库衍生了很多具有相似API的库。我们这里介绍的库是基于[log4cpp](http://log4cpp.sourceforge.net/)发展而来。

_后面就用`log4me`作为我们使用的库的名称_

让我们先从无到有，用一个简单的使用场景一步一步分析log库中各种概念如何发展而来。

### 初始封装

代码中经常会需要打印一些提示信息，这就是所谓的log，就像船员的航海日志一样。在C/C++中最简单的方法是用`printf`或者`std::cout`：

{% highlight cpp linenos %}
    // I want to print a log:
    printf("I'm a message\n");
{% endhighlight %}

试想，如果在一个log文件中你看到满屏幕的这种信息，但是却无法知道是谁，在什么时候，什么位置输出这条信息，那这种log的价值便大大折扣。于是，你想要在每条log中增加一些有用的信息：

{% highlight cpp linenos %}
    // I want to add more information:
    printf("%s %s %s: I'm a message\n", time, __FILE__, __LINE__);
{% endhighlight %}

这样，每条log就有了时间，文件和行号这些额外有用的信息。

但是，这样会不会太麻烦？每次在写代码时，打印一条简单的log我需要写这么多无关的内容，这简直无法接受。我想要把所有的注意力都放在log本身上，不想关注其它的细技末节，怎么办？注意看，上面的函数调用中，后三个参数都是固定的，于是你可能会想到这样简单封装一下：

{% highlight cpp linenos %}
    // Too complicated:
    void printf0(const char *message) {
        printf("%s %s %s %s", time, __FILE__, __LINE__, message);
    }
    printf0("I'm a message\n");
{% endhighlight %}

还是一样简单的调用，不需要你再去输入一些无关的内容，因为这个封装的函数已经替你做好了。

### TraceLevel

log信息并不是千篇一律只起一种作用，有的是纪录程序的流程，有的是错误信息，还有的是一些警告信息。为了让log更有可读性，你可能想要把不同的信息区分开来，比如这样：

{% highlight cpp linenos %}
    // I want to distinguish different kinds of message:
    printf0("Normal: I'm a normal message\n");
    printf0("Warning: I'm a warning message\n");
    printf0("Error: I'm an error message\n");
{% endhighlight %}

那么，你就可以通过在log文件中搜索Normal、Warning或者Error这些关键字就能够找到特定的log了。

但是，这些Normal、Warning或者Error关键字混在了我们要输出的log中，同前面一样，我想log与其它的信息独立开来。你可以这样做：

{% highlight cpp linenos %}
    // It's too complicated, I want something like this:
    enum TraceLevel {
        Normal,
        Warning,
        Error
    };
    void printf1(TraceLevel level, const char *message) {
        char *levelString[] = {
            "Normal: ",
            "Warning: ",
            "Error: "
        }
        printf0("%sI'm a normal message\n", levelString[level]);
    }
    printf1(Normal, "I'm a normal message\n");
    printf1(Warning, "I'm a warning message\n");
    printf1(Error, "I'm an error message\n");
{% endhighlight %}

现在你只需要指定一种类型，就可以全心全意的处理log信息本身了。我们把上面的Normal, Warning和Error叫做`TraceLevel`。

可以再简化一下上面的函数：

{% highlight cpp linenos %}
    // To be more convenient:
    void printf_out(const char *message) {
        printf1(Normal, message);
    }
    void printf_warn(const char *message) {
        printf1(Warning, message);
    }
    void printf_error(const char *message) {
        printf1(Error, message);
    }
    printf_out("I'm a normal message\n");
    printf_warn("I'm a warning message\n");
    printf_error("I'm an error message\n");
{% endhighlight %}

在代码中，通常最多的log是Normal类型，即显示程序流程。如果将这些信息全部输出的话，有的时候，log文件中会有太多的干扰信息，log文件也会变得很大。于是，你可能会想，如果我可以动态的选择哪些信息要输出，那么log文件就变得像是根据我的需求定制一般。

那么代码可以这样改变：

{% highlight cpp linenos %}
    // I want add a control which level should be printed:
    TraceLevel getLevel1();
    void printf2(TraceLevel level, const char *message) {
        if (level >= getLevel1())
            printf1(level, message);
    }
    printf2(Normal, "I'm a normal message\n");
    printf2(Warning, "I'm a warning message\n");
    printf2(Error, "I'm an error message\n");
{% endhighlight %}

`getLevel1()`就从配置文件中读取当前的Level，代码中只有高于当前Level的log才会被输出。

### Marker

再来考虑这样一种情况，如果你的文件非常大，中间要打印的Normal log非常多，是分为不同层次的，如：粗略的流程，详细一些的，十分详细的。因为都是Normal类型的log，所以不能够用前面的TraceLevel来控制，这时需要引入另外一层控制：

{% highlight cpp linenos %}
    // My class is too big, I want a filter to determine which
    // logs should be generated
    const int SUB     = 0;
    const int TRACE_1 = 1 << 0;
    const int TRACE_2 = 1 << 1;
    const int TRACE_3 = 1 << 2;
    int getMarker1();
    void printf3(int marker, TraceLevel level, const char *message) {
        if (marker == 0 || marker & getMarker1() != 0)
            printf2(level, message);
    }
    printf3(SUB, Normal, "I'm a normal message\n");
    printf3(TRACE_1, Normal, "I'm a normal message\n");
    printf3(TRACE_2, Normal, "I'm a normal message\n");
{% endhighlight %}

这里提供了四级的控制，和前面的`TraceLevel`一样，它可以配置。假设现在配置的是`TRACE_1`，那么代码中想要打印的三条信息中，只有前两条能够输出。这层控制我们称之为`Marker`。

### Appender

到目前为止，所有的信息都是写到控制台的。如果有时程序不是控制台程序，比如，Win32或者MFC程序，log该写到哪里去？有时我想要log写到控制台，有时想要写到文件中，但不想这些是写死在代码中的，而是可以配置的：

{% highlight cpp linenos %}
    // I want my logs go to files, console, eventlog, remote
    class Appender {
        void printf(TraceLevel level, const char *message);
    };
    class ConsoleAppener: public Appender {};
    class FileAppener: public Appender {};
    class EventLogAppener: public Appender {};

    std::vector<Appender *> &getAppenders();
    void printf4(int marker, TraceLevel level, const char *message) {
        if (marker == 0 || marker & getMarker1() != 0) {
            if (level >= getLevel1()) {
                std::vector<Appender *>::iterator it = getAppenders.begin();
                for (; it != getAppenders.end(); it++)
                    (*it)->printf(level, message);
        }
    }
    printf4(SUB, Normal, "I'm a normal message\n");
    printf4(TRACE_1, Normal, "I'm a normal message\n");
    printf4(TRACE_2, Normal, "I'm a normal message\n");
{% endhighlight %}

定义了三种输出的目的地，控制台、文件和Windows的EventLog，每种目的地知道自身该如何处理log。这样，如果我们配置了不同的目的地，简单的log就可以根据配置流向各处，从而无须在代码中写死。这每一种目的地我们称之为`Appender`。

### Category

现在我们的log机制已经足够的完善。但是，随着程序规模越来越大，一个程序所包含的组件越来越多，有时我并不想要一个全局的配置，我需要每一个组件可以独立的进行配置。

{% highlight cpp linenos %}
    // There are too many component, I want different component
    // could be configured separately
    TraceLevel getLevel2(const char *cat);
    int getMarker2(const char *cat);
    std::vector<Appender *> &getAppenders2(const char *cat);
    void printf5(const char *cat, int marder, TraceLevel level,
        const char *message) {
        if (marker == 0 || marker & getMarker2(cat) != 0) {
            if (level >= getLevel2(cat)) {
                std::vector<Appender *>::iterator it = getAppenders(cat).begin();
                for (; it != getAppenders.end(cat); it++)
                    (*it)->printf(level, message);
        }
    }
    printf5("Library1", SUB, Normal, "I'm a normal message\n");
    printf5("Library1", TRACE_1, Normal, "I'm a normal message\n");
    printf5("Library1", TRACE_2, Normal, "I'm a normal message\n");
{% endhighlight %}

除了增加一个参数`const char *cat`以外，其它和前一节介绍的完全一样。正是这个参数的出现，才让每一个组件可以独立的配置。这个参数我们称为`Category`。

### 配置

前面提到过很多次**配置**，为了达到可以灵活配置的目的，通常会将这些配置保存成一个文件，比如`logConfig`：

    Category: "Library1"        -> for Library1 category
        TraceLevel : "Warning"  -> only Warning and Error messages are allowed
        Markers    : TRACE_1    -> only TRACE_1 is allowed
        Appenders  :
            "ConsoleAppender"   -> write to console
            "FileAppender":     -> write to file
                filePath: C:\temp\log\trace_lib1.log

    Category: "Library2"        -> for Library2 category
    ...

那么在什么时机读取配置文件？一般可以分为这样三种时机：

- 程序刚启动时载入该配置信息，如果配置改变的不多时可以采用这种方式，最为简单
- 新开一个线程，间隔一段时间检查一下`logConfig`是否已经改变，如果改变则重新读取
- 处理每一个log之前先检测`logConfig`，如果有改变则重新读取

至此，一个简单灵活的log原形建立了，虽然它非常简陋，但已经包含了现代log的雏形，包含了其中重要的几个概念。下面我将以我们所使用的log4me库进行分析。

## 常见用法

前面介绍的log雏形完全是小儿科式的代码，如本文开始所介绍的，已经有非常多专业的库来处理log，这些库以最简单的接口提供了最大化的log信息，我们这里采用的log4me库有这样几个优点：

- 更细的粒度来控制log
- 跨平台，在Windows和Linux上有着完全一样的接口与行为
- 线程安全
- 性能好

我们定义了下面几个宏，专门用于Library1下的log输出，这里会取配置中Library1这个Category的配置，分别输出不同TraceLevel的log。

{% highlight cpp linenos %}
    #define LIB1_OUT(MESSAGE)            LOG_OUT  (Library1, DLL, Notice) << MESSAGE
    #define LIB1_WARN(MESSAGE)           LOG_OUT  (Library1, DLL, Warn)   << MESSAGE
    #define LIB1_ERR(MESSAGE)            LOG_OUT  (Library1, DLL, Error)  << MESSAGE
{% endhighlight %}

使用时可以像这样：

{% highlight cpp linenos %}
    LIB1_OUT("I'm a message.");
    LIB1_WARN("I'm a message, ID = " << 1234);
    LIB1_ERR("I'm a message.");
{% endhighlight %}

这里所有的配置都通过配置文件完成，还有一种动态的在代码中创建log的方法，log4cpp的官方网站中有[例子](http://log4cpp.sourceforge.net/#simpleexample)，我们这里就不介绍了。

## 配置

在我们前面的演示代码中，提供了一种非常简单的配置文件，常见的存储配置文件的格式有xml，Windows的ini。log4me中使用的是前者，并且开发了专门的工具来简化其操作。

### Appender

前面介绍过Appender这个概念，它的作用就是处理log，定义log的目的地，log4me提供了这些:

![Appenders](/img/posts/log-appenders.png)

注意：最后一个Appender是`TraceSrv`，它写到memfile中。什么是memfile？这是Linux上的一种将文件映射到内存，从而达到达效的读写文件的方式，可以参考这里：[Linux内存管理之mmap详解](http://blog.chinaunix.net/uid-26669729-id-3077015.html)。

在Appender中有一些常用的属性可以配置：

- CreateNewFile: 表明log库启动时是否创建新文件。
- FileCount & FileSize: 用于文件回卷，比如一个log文件lib.log过大时，可以将它重命名为lib.1.log，然后再重新创建lib.log，可以创建多个文件，而这两个参数就用于控制文件数目和单个文件大小。
- CategoryFilter: 表明该Appender只处理这个filter列举的Category。
- ProcessFilter: 与上面类似，只处理filter列举的进程。

### Formatter

这个概念在前面没有介绍过，但它也非常容易理解：每个Appender都可以包含一个formatter，它用来格式化log信息。因为一条log信息可能包含时间，文件名，行号，TraceLevel，进程ID，正文等信息，有时为了简化log输出，对所有的这些分类作一个取舍，从而达到格式化的目的。这很像C语言中的`printf`。

如果一个formatter设置的是：

    %TIME%|%PID%|%LEVEL%|%MARKER%|%CAT%|%FILE%|%LINE%|%FUNC%|%USERTEXT%|

一条log的输出像这样：

    2014/04/07-16:03:35.251560|5560|Notice|SUB|COMP1|main.cpp|78|test|I'm a message

每一段都和前面的formatter一一对应。

### Category

现代的log库一般都将Category组织成树型结构，每一个节点都和前后组成父子关系，根据设置，子节点的Category完全可以继承父节点的配置。所有的Category的根节点是root。这是一个典型的结构：

![Category结构](/img/posts/log-category-structure.png)

一个Category可以包含下面这几个内容：

![Category组成](/img/posts/log-category-components.png)

注意：一个Category可以有多个Appender。

Name, TraceLevel, Marker和Appender这里就不再赘述。注意上图中有一个Flag，这是什么？它的存在是和前面的树型结构息息相关。前面讲到，因为Category被组织成了树型关系，子节点可以继承父节点的配置，那么何时可以继承，如何继承？这就是Flag的作用了，它包含了两个选项：

- Process Parent: 如果勾选这一项，就表示一个子节点的log可以传给它的父节点处理。这也是为什么很多情况下只需要配置Root节点，其它的子节点都设置这个Flag即可。
- Use All Parent Appenders: 如果只有上面的Flag，那么每次传到父节点时，父节点都必须根据自身的TraceLevel及Marker进行匹配，只有匹配时才会处理。而如果此Flag打开，那么在传输过程中，只有一个节点匹配，再向上传的所有节点都不再匹配而直接处理。

## 处理流程

接下来来看下log库内部对log的处理流程，这里分为两步，第一步是一个过滤步骤，它在调用log的线程中发生。有些线程可能会对实时性有一定的要求，那么log就不能够在这种线程中去执行，而是将创建的log对象加入到队列中，由专门的Log Working线程处理，这样就完全不会阻塞住主线程。

![处理流程1](/img/posts/log-workflow-step1.png)

流程的第二步是处理消息，筛选过Category之后会将消息发给每一个合适的Appender，由Appender进一步的筛选及格式化输出。注意在这一步的刚开始有一个`Check Config`步骤，这和我们前面讲的加载配置文件的时机有关，很明显，这里用的是最后一种读取配置的方案。

![处理流程2](/img/posts/log-workflow-step2.png)

## log在系统中的部署

也许你会想，一个简单的库有什么好部署的，直接拿来用不就得了。可有时因为性能，或者系统过于庞大，配置起来会相当复杂，如果不好好组织log的话，你就会见到log文件满天飞，散落各处的情况。有时你可能会需要一个总的log文件包含所有的log，一些特定目的的log还要存于不同的文件中。如果保证不同进程，甚至不同的机器上的不同进程能够写到同一个log文件中呢？假设一个系统包含一台Windows机器，一台Linux，如何收集散落各个机器的log？如果方便的在Windows上查看本应出现在Linux上的log？如果你有疑问，那么恭喜你，请看下面的解决方案：

# TODO: 这里需要一个gif图

![部署log](/img/posts/log-deployment.png)

这个系统足够庞大，包含了两台机器，左边是Windows，右边是Linux。通过以Windows上的TraceSrv这个Service的中轴作用，所有机器上的log都最终交给它来处理，最终会有一份完整的log存在于TraceSrv.log中，还有各种不同组件的log文件。同时，还能够通过远程调用TraceOnlReader来从TraceSrv中读取log信息。

这样，开发者就可以通过配置一次，便可以非常方便的组织好所有的log信息，调用端完全剔除了这些复杂的细节，只需要关注log本身。

另外注意到，在Windows和Linux端各有一个memfile，它们各自存有机器上的所有log，由于是运用了前面所说的mmap机制，程序直接以操作内存的方式来操作文件，性能非常高。

## 写在结尾

# TODO: 把目录显示在文章的左侧，参考其它的blog


(全文完)

feihu

2014.04.09 于 Shenzhen
