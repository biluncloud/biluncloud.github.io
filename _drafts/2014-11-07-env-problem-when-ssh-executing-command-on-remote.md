---
layout: post
title:  ssh连接远程主机执行脚本的环境变量问题
description: ssh连接远程主机直接执行脚本时，会出现脚本中的命令找不到的问题，本文深入分析了问题的根源，并详细讲解了bash的四种工作模式，以及在这几种模式下bash以什么顺序加载配置文件
tags:   Linux，ssh, bash, sh, login, interactive, /etc/profile, ~/.bash_profile, ~/.bash_login, ~/.profile, /etc/bash.bashrc, ~/.bashrc
image:  vim-sudo.png
---

近日在使用ssh命令`ssh user@remote ~/myscript.sh`登陆到远程机器remote上执行命令时，遇到一个奇怪的问题：

    ~/myscript.sh: line n: app: command not found

app是一个新安装的程序，安装路径明明已通过/etc/profile配置文件被加到环境变量中，为何会找不到？如果直接登陆机器remote并执行`~/myscript.sh`时，app程序可以找到并顺利完成。但为什么使用了ssh远程执行同样的脚本就出错了呢？两种方式执行脚本到底有何不同？请跟随我一起来揭开谜底。

{{ more }}

### 目录
{:.no_toc}

* Table of Contents Placeholder
{:toc}

-----

__说明__，本文所使用的机器是：SUSE Linux Enterprise。

## 问题定位

这看起来像是环境变量引起的问题。于是我在这条命令之前加了一句：`which app`，查看app的安装路径。在remote本机上执行脚本时，它会得到app正确的安装路径。但再次用ssh来执行时，却遇到下面的问题：

    which: no app in (/usr/bin:/bin:/usr/sbin:/sbin)

这很奇怪，怎么括号中的环境变量没有了`app`程序的安装路径？再次在脚本中加入`echo $PATH`并以ssh执行，这才发现，环境变量是系统初始化时的结果：

    /usr/bin:/bin:/usr/sbin:/sbin

这证明/etc/profile根本没有被调用。为什么？是ssh命令的问题么？

我又尝试了将上面的ssh分解成下面两步：

    user@local > ssh user@remote    # 先远程登陆到remote上
    user@remote> ~/myscript.sh      # 然后执行脚本

结果竟然成功了。那么ssh的这两种方式执行的命令有何不同？带着这个问题去查询了`man ssh`，可以得到：

> If command is specified, it is executed on the remote host instead of a login shell.

这说明指定command的情况下命令会在远程主机上执行，返回结果后退出。而未指定时，会直接返回一个登陆的shell。但到这里还是无法理解，直接在远程主机上执行和返回一个登陆的shell再执行有什么区别？即使在远程主机上执行不也是通过shell来执行的么？难道是这两种方式使用的shell有什么不同？

因为我们通常使用的是`bash`，所以我又去查询了`man bash`，才得到了答案。

## bash的四种模式

在man page的__INVOCATION__一节讲述了`bash`的四种模式，`bash`会依据这四种模式而选择加载不同的配置文件，而且加载的顺序也有所不同。ssh问题的答案就在这几种模式当中，所以在我们揭开谜底之前先来介绍这些模式。

### interactive, login shell

第一种模式是交互式的登陆shell，这里面有两个概念需要解释：interactive和login。我们先来介绍什么是login：

login故名思义，即登陆，所以login shell是指用户以非图形化界面或者以ssh登陆到机器上时获得的shell，简单些说就是需要输入用户名和密码的shell。因此一般来说，启动机器后用户获得的第一个shell就是login shell。

interactive意为交互式，这也很好理解，interactive shell会有一个提示符，并且它的标准输入，输出和错误输出都会显示在控制台上。所以一般来说只要是需要用户交互的，即一个命令一个命令的输入的shell都是交互式的shell，而如果无须用户交互，通常来说`bash script.sh`此类就是非交互式的shell，因为执行完命令它便退出，不再需要与用户进行交互。

那么这第一种模式最简单的两个例子便是：

1. 用户登陆到机器获得的第一个shell
2. 用户使用`ssh user@remote`获得的shell

#### 加载配置文件

这种模式下，shell首先加载/etc/profile，然后再尝试依次去加载下列三个配置文件之一，一旦找到其中一个便不再接着寻找：

1. ~/.bash_profile
2. ~/.bash_login
3. ~/.profile

所以这个查找的伪代码看起来像这样：

    execute /etc/profile
    IF ~/.bash_profile exists THEN
        execute ~/.bash_profile
    ELSE
        IF ~/.bash_login exist THEN
            execute ~/.bash_login
        ELSE
            IF ~/.profile exist THEN
                execute ~/.profile
            END IF
        END IF
    END IF

#### 配置文件存在的意义

/etc/profile很好理解，它是一个全局的配置文件。后面三个位于用户主目录中的配置文件都针对用户个人，也许你会问为什么要有这么多，只用一个~/.profile不好么？究竟每个文件有什么意义呢？这是个好问题。

Cameron Newham和Bill Rosenblatt的大作《[Learning the bash Shell, 2nd Edition](http://book.douban.com/subject/3296982/)》在59页解释了原因：

>     bash allows two synonyms for .bash_profile: .bash_login, derived from the C shell's file named .login, and .profile, derived from the Bourne shell and Korn shell files named .profile. Only one of these three is read when you log in. If .bash_profile doesn't exist in your home directory, then bash will look for .bash_login. If that doesn't exist it will look for .profile.
> 
>     One advantage of bash's ability to look for either synonym is that you can retain your .profile if you have been using the Bourne shell. If you need to add bash-specific commands, you can put them in .bash_profile followed by the command source .profile. When you log in, all the bash-specific commands will be executed and bash will source .profile, executing the remaining commands. If you decide to switch to using the Bourne shell you don't have to modify your existing files. A similar approach was intended for .bash_login and the C shell .login, but due to differences in the basic syntax of the shells, this is not a good idea.

原来一切都是为了兼容，这么设计是为了更好的应付在不同shell之间切换的场景。因为bash完全兼容Bourne shell，所以.bash_profile和.profile可以很好的处理bash和Bourne shell之间的切换。但是由于C shell和bash之间的基本语法存在着差异，作者认为引入.bash_login并不是个好主意。所以我们可以得出这样的最佳实践：

#TODO
1. 应该尽量杜绝使用.bash_login，如果已经创建，那么需要创建.bash_profile来屏蔽它被调用
2. .bash_profile适合放置bash的专属命令，可以在其最后读取.profile，如此一来，login shell就可以同时读取两个文件的内容了

#### 测试

为验证这个理论，我们来做一些测试。首先设计每个配置文件的内容如下：

{% highlight bash linenos %}
user@remote > cat /etc/profile
echo @ /etc/profile
user@remote > cat ~/.bash_profile
echo @ ~/.bash_profile
user@remote > cat ~/.bash_login
echo @ ~/.bash_login
user@remote > cat ~/.profile
echo @ ~/.profile
{% endhighlight %}

然后打开一个login shell，注意，这里可以使用`bash -l`命令，这是打开一个login shell的快捷方式，在man page中可以看到此参数的解释：

 -l        Make bash act as if it had been invoked as a login shell 

进入这个新的login shell，便会得到以下输出：

    @ /etc/profile
    @ /home/user/.bash_profile

果然如猜想的一样，首先会加载全局的配置文件/etc/profile，然后去查找~/.bash_profile。接下来移除~/.bash_profile，得到结果如下：

    @ /etc/profile
    @ /home/user/.bash_login

~/.bash_login被加载。再次移除~/.bash_login，结果为：

    @ /etc/profile
    @ /home/user/.profile

~/.profile被加载。通过以上三个实验可以验证前面的结论，除去/etc/profile首先被加载外，其余三个文件的加载顺序为：~/.bash_profile > ~/.bash_login > ~/.profile，只要找到一个便终止查找。

前面说过，使用ssh也会得到一个login shell，所以如果在另外一台机器上运行`ssh user@remote`时，也会得到上面一样的结论。

### non-interactive, login shell

第二种模式的shell为non-interactive login shell，即非交互式的登陆shell，这种是不太常见的情况。一种创建此shell的方法为：`bash -l script.sh`，前面提到过-l参数是将shell作为一个login shell。

对于这种类型的shell，配置文件的加载顺序与第一种完全一样。

### interactive, non-login shell

第三种模式为交互式的非登陆shell，这种模式最常见的情况为在一个已有shell中运行`bash`，此时会打开一个交互式的shell，而因为不再需要登陆，因此属于此种模式的shell。

#### 加载配置文件

对于此种情况，启动shell时会去查找并加载/etc/bash.bashrc和~/.bashrc文件。

#### 为什么又多了一种配置文件

从这两个文件的存放路径可以很容易的判断，第一个文件是全局性的，第二个文件是当前用户的。在前面的模式当中，已经出现了几种配置文件，多数是以profile命名的，那么为什么这里又增加两个配置呢？这样不会增加复杂度么？我们来看看此处的文件和前面模式中的文件的区别。

首先看第一种模式中的profile文件，它是某个用户唯一的用来设置全局环境变量的地方, 因为用户可以有多个shell比如bash, sh, zsh之类的, 但像环境变量这种其实只需要在统一的一个地方初始化就可以了, 而这个地方就是profile，所以启动一个login shell会加载此文件，后面由此shell中启动的shell如bash，sh，zsh等都可以由login shell中继承环境变量等。

接下来看bashrc，其后缀`rc`的意思为[Run Commands](http://en.wikipedia.org/wiki/Run_commands)，由名字可以推断出，是存放bash需要运行的命令，但一般只用于交互式的shell。通常在这里会设置交互所需要的初始化信息，比如bash的补全、alias、颜色、提示符等等。

#### 验证

为了验证，与第一种模式一样，设计各配置文件内容如下：

{% highlight bash linenos %}
user@remote > cat /etc/bash.bashrc
echo @ /etc/bash.bashrc
user@remote > cat ~/.bashrc
echo @ ~/.bashrc
{% endhighlight %}

然后我们启动一个交互式的非登陆shell：`bash`，可以得到以下结果：

    @ /etc/bash.bashrc
    @ ~/.bashrc

由此验证了前面的结论。

### non-interactive, non-login shell

最后一种模式为非交互非登陆的shell，典型有两种方式：

1. bash script.sh
2. ssh user@remote command

这两种都是启动一个shell，执行完命令之后便退出，不再需要与用户交互。

#### 加载配置文件

对于这种模式而言，它会去寻找环境变量`BASH_ENV`，将变量的值作为文件名查找，如果找到便加载它。

#### 验证

首先，我们测试没有该环境变量情况下的加载情况。先需要一个测试脚本：

{% highlight bash linenos %}
user@remote > cat ~/script.sh
echo Hello World
{% endhighlight %}

然后运行`bash script.sh`，将得到以下结果：

    Hello World

并没有加载前面提到的所有配置文件。接下来设置环境变理`BASH_ENV`：

{% highlight bash linenos %}
user@remote > export BASH_ENV=~/.bashrc
{% endhighlight %}

再次执行`bash script.sh`，结果为：

    @ ~/.bashrc
    Hello World

果然，~/.bashrc被加载，而它是由环境变量`BASH_ENV`设定的。

### 用图来总结

至此，四种模式下配置文件如何加载已经介绍完，因为涉及的配置文件有些多，我们再以两个图来更为直接的进行描述：

借用这篇文章中的[图](http://shreevatsa.wordpress.com/2008/03/30/zshbash-startup-files-loading-order-bashrc-zshrc-etc/)，对于bash而言，它会读取其所在列的内容，首先执行A，然后是B，C。而B1，B2和B3表示bash只会执行第一个存在的文件。

+----------------+-----------+-----------+------+
|                |Interactive|Interactive|Script|
|                |login      |non-login  |      |
+----------------+-----------+-----------+------+
|/etc/profile    |   A       |           |      |
+----------------+-----------+-----------+------+
|/etc/bash.bashrc|           |    A      |      |
+----------------+-----------+-----------+------+
|~/.bashrc       |           |    B      |      |
+----------------+-----------+-----------+------+
|~/.bash_profile |   B1      |           |      |
+----------------+-----------+-----------+------+
|~/.bash_login   |   B2      |           |      |
+----------------+-----------+-----------+------+
|~/.profile      |   B3      |           |      |
+----------------+-----------+-----------+------+
|BASH_ENV        |           |           |  A   |
+----------------+-----------+-----------+------+

[这篇文章](http://www.solipsys.co.uk/new/BashInitialisationFiles.html)给出了一个更直观的图：

![Bash加载文件顺序](http://www.solipsys.co.uk/images/BashStartupFiles1.png)

在上图中，情况稍稍复杂一些，因为它使用了几个关于配置文件的参数。不过总体来说，和我们前面的讨论无异。

### 典型模式总结

为了更好的理清前面几种模式，下面我们总结一下一些典型的启动方式各属于什么模式：

- 通过ssh登陆到远程主机：login + interactive
- 远程执行脚本，如`ssh user@remote script.sh`：non-login + non-interactive
- 远程执行脚本，同时请求控制台，如`ssh user@remote -t 'echo $PWD'`：non-login + interactive
- 新启动一个shell进程，如运行`bash`：non-login + interactive
- 执行脚本，如`bash script.sh`：non-login + non-interactive
- 运行头部有`#!/usr/bin/env bash`的可执行文件，如`./executable`：non-login + non-interactive
- 在图形化界面中打开terminal：
 - Linux上: non-login + interactive
 - Mac OS X上: login + interactive

理解了login和interactive的含义之后，应该会很容易区分开。

### 实践建议

## 再次尝试

在理解bash的这些模式之后，我们再回头来看文章开头的问题，`ssh user@remote ~/myscript.sh`属于哪一种模式？也许你可以非常容易的回答出来：non-login + non-interactive模式。对于这种模式，bash会选择加载`$BASH_ENV`的值所对应的文件，于是我们设定：

{% highlight bash linenos %}
user@local > export BASH_ENV=/etc/profile
{% endhighlight %}

然后执行上面的命令，发现错误依旧。这是怎么回事？仔细查看之后才发现在脚本`myscript.sh`的第一行有一句`#!/usr/bin/env sh`，注意看，它和前面提到的`#!/usr/bin/env bash`不一样，我们先尝试把它改成`#!/usr/bin/env bash`，再次执行，发现错误消失了。这与我们前面的分析一致。

现在撤消刚才的修改，第一行的这个语句有什么用？同样查看`man bash`：

> If the program is a file beginning with #!, the remainder of the first line specifies an interpreter for the program.

它表示这个文件的解释器，即用什么程序来打开此文件。而这里不是`bash`，而是`sh`，那么我们前面讨论的都不复有效了，真糟糕。但是请耐心，我们来看看这个`sh`的路径，运行`which sh`：

{% highlight bash linenos %}
user@remote > ll `which sh`
lrwxrwxrwx 1 root root 9 Apr 25  2014 /usr/bin/sh -> /bin/bash
{% endhighlight %}

原来`sh`只是`bash`的一个软链接，既然如此，`BASH_ENV`应该是有效的啊？为何此处无效？带着疑问我们再次查看`man bash`，同样在__INVOCATION__一节的下部看到了这样的说明：

>       If  bash is invoked with the name sh, it tries to mimic the startup behavior of historical versions of sh
>       as closely as possible, while conforming to the POSIX standard as well.  When invoked as  an  interactive
>       login  shell,  or  a non-interactive shell with the --login option, it first attempts to read and execute
>       commands from /etc/profile and ~/.profile, in that order.  The --noprofile option may be used to  inhibit
>       this  behavior.   When invoked as an interactive shell with the name sh, bash looks for the variable ENV,
>       expands its value if it is defined, and uses the expanded value as the name of a file to  read  and  exe-
>       cute.   Since  a shell invoked as sh does not attempt to read and execute commands from any other startup
>       files, the --rcfile option has no effect.  A non-interactive shell invoked with  the  name  sh  does  not
>       attempt  to  read  any other startup files.  When invoked as sh, bash enters posix mode after the startup
>       files are read.

简而言之，当bash以是`sh`命启动时，即我们此处的情况，`bash`会尽可能的模仿`sh`，所以配置文件的加载变成了下面这样：

- interactive + login: 读取/etc/profile和~/.profile
- non-interactive + login: 同上
- interactive + non-login: 读取`ENV`环境变量对应的文件
- non-interactive + non-login: 不读取任何文件

这样便可以解释为什么出错了，因为我们属于non-interactive + non-login，所以不会读取任何文件，故而即使设置了`BASH_ENV`也不会起作用了。

我们还可以将参数加到第一行中，如`#!/bin/bash --login`，如此一来，`bash`便会强制为login shell。

## 配置文件建议

我们再次来总结一下前面提到的所有配置文件，总共有以下几种：

- /etc/profile
- ~/.bash_profile
- ~/.bash_login
- ~/.profile
- /etc/bash.bashrc
- ~/.bashrc
- $BASH_ENV
- $ENV

会不会有点晕，为什么会有这么多的配置文件？究竟每个文件里面应该包含什么配置，`PATH`应该在哪？提示符应该在哪配置？等等。下面是一些常见的建议。（这里只讨论属于用户个人的配置文件）

- ~/.bash_profile：应该尽可能的简单，通常只在这里加载.profile和.bashrc(注意顺序)
- ~/.bash_login：在前面讨论过，尽量别用它
- ~/.profile：此文件用于login shell，所有你想在整个用户会话期间都有效的内容都应该放置于此，比如启动进程，环境变量等
- ~/.bashrc：只放置与bash有关的命令，所有与交互有关的命令都应该出现在此，比如bash的补全、alias、颜色、提示符等等。特别注意：别在这里输出任何内容（我们前面只是为了演示）

## 写在结尾

至此，我们详细的讨论完了bash的几种工作模式，并且给出了配置文件内容的建议。通过这些模式的介绍，本文开始遇到的问题也很容易的得到了解决。以前虽然一直把完bash，但真的不清楚里面包含了如此多的内容，同时感受到Linux的文档的确做得非常细致，完全在不需要其它的安装包的情况下，你就可以得到一个非常完善的开发环境，这也曾是Eric S. Raymond在其著作《UNIX编程艺术》中提到的UNIX天生是一个非常完善的开发机器。本文几乎所有的内容你都可以通过阅读man page得到，不可不为之叹服。

(全文完)

feihu

2014.11.10 于 Shenzhen

