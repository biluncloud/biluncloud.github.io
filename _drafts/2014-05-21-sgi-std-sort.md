---
layout: post
title:  std::sort中\_\_final\_insertion\_sort函数分析
description: SGI版本的STL中，sort算法分为两部分，前半部分用了introsort，后半部分调用了\_\_final\_insertion\_sort，本文解释了后半部分为何如此实现
tags:   C++, 模板, STL，std::sort，快速排序，堆排序，插入排序
image:  typename.png
---

从事程序设计行业的朋友一定对排序不陌生，它从我们初始接触数据结构课程时便伴随左右，是我们要掌握的重要技能。任何一本数据结构的教科书一定会给出各种各样的排序算法，比如最简单的冒泡排序，到插入排序、希尔排序、堆排序等。在现已知的所有排序算法之中，快速排序名如其名，以快速著称，它的平均复杂度可以达到O(N logN)，是已知的最快排序算法之一。

{{ more }}

## 目录

* Table of Contents Placeholder
{:toc}

-----

## 背景

在学校期间，为了掌握这些排序算法，我们不得不经常手动来实现它们。这些算法实在是太常用了，因此在C语言的标准库中，`stdlib.h`头文件就包含了`qsort`算法，它正是最快排序算法————快速排序的标准实现，这给我们提供了很大的方便。

然而，快速排序虽然平均复杂度为O(N logN)，但可能由于不当的pivot选择，导致其在最坏情况下复杂度恶化为O(N<sup>2</sup>)。另外，由于快速排序一般是用递归实现，我们知道递归是一种函数调用，它会有一些额外的开销，比如返回指针、参数压栈、出栈等，在分段很小的情况下，过度的递归会带来过大的额外负荷，从而拉缓排序的速度。

## Introspective Sort

### 前提知识

堆排序经常是作为快速排序最有力的竞争者出现，它们的复杂度都是O(N logN)，但是就平均表现而言，它却比快速排序慢了2~5倍，知乎上有一个[讨论：堆排序缺点何在？](http://www.zhihu.com/question/20842649)，另外还可以参考[Comparing Quick and Heap Sorts](https://www.cs.auckland.ac.nz/~jmor159/PLDS210/qsort3.html)，还有[Basic Comparison of Heap-Sort and Quick-Sort Algorithms](http://www.student.montefiore.ulg.ac.be/~merciadri/docs/papers/heap-quick-comparison.pdf)。但是有一点它比快速排序要好，在上述最坏的情况下仍然会保持O(N logN)。

插入排序在数据大致有序的情况表现非常好，可以达到接近O(N)，可以参考这个讨论[Which sort algorithm works best on mostly sorted data?](http://stackoverflow.com/questions/220044/which-sort-algorithm-works-best-on-mostly-sorted-data)

### 横空出世

基于以上两个事实，Musser在1996年发达了一遍论文，提出了[Introspective Sorting](http://www.cs.rpi.edu/~musser/gp/index_1.html)(内省式排序)，这里可以找到[PDF版本](http://www.researchgate.net/profile/David_Musser/publication/2476873_Introspective_Sorting_and_Selection_Algorithms/file/3deec518194fb4a32f.pdf)。它是一种混合式的排序算法，在数据量很大时采用正常的快速排序，一旦分段后的数据量小于某个阈值，就改用插入排序，因为此时这个分段是基本有序的，这时效率可达O(N)。如果递归层次过深，分割行为有恶化倾向时，它能够自动侦测出来，使用堆排序来处理，在此情况下，使其效率维持在堆排序的O(N logN)，但这又比一开始使用堆排序好。由此可知，它乃综合各家之长的算法。

也正因为如此，C++的标准库就采用其作为std::sort的标准实现。

### std::sort的实现

SGI版本的STL一直是评价最高的一个STL实现，在技术层次、源代码组织、源代码可读性上，均有卓越表现。所以它被纳为GNU C++标准程序库。这里选择了侯捷的《STL源码剖析》一书中分析的GNU C++ 2.91版本，此版本稳定且易读。

我来简要介绍一下std::sort的实现，更多的分析请参考《STL源码剖析》或者Musser的[论文](http://www.researchgate.net/profile/David_Musser/publication/2476873_Introspective_Sorting_and_Selection_Algorithms/file/3deec518194fb4a32f.pdf)。

std::sort的代码如下：

{% highlight cpp linenos %}
    template <class RandomAccessIterator>
    inline void sort(RandomAccessIterator first, RandomAccessIterator last) {
        if (first != last) {
            __introsort_loop(first, last, value_type(first), __lg(last - first) * 2);
            __final_insertion_sort(first, last);
        }
    }
{% endhighlight %}

它是一个模板函数，只接受随机访问迭代器。我们来看函数内部，注意if语句内部第一行即是调用了`__introsort_loop`，它便是STL的Introspective Sort实现：

{% highlight cpp linenos %}
    template <class RandomAccessIterator, class T, class Size>
    void __introsort_loop(RandomAccessIterator first,
                          RandomAccessIterator last, T*,
                          Size depth_limit) {
        while (last - first > __stl_threshold) {
            if (depth_limit == 0) {
                partial_sort(first, last, last);
                return;
            }
            --depth_limit;
            RandomAccessIterator cut = __unguarded_partition
              (first, last, T(__median(*first, *(first + (last - first)/2),
                                       *(last - 1))));
            __introsort_loop(cut, last, value_type(first), depth_limit);
            last = cut;
        }
    }
{% endhighlight %}

#### 三点中值法

暂且先不考虑循环和if语句，先看其中的主体部分，其中有一个`__median`，它的作用是取三个数的中值作为pivot，和我们之前看到的不同，之前是选择首尾或者中间位置的元素值作为pivot。现在这里采用的中值法可以在绝大部分情况下优于原来的选择。

#### 分割算法

主体中另外一个函数是`__unguarded_partition`，这其实就是我们平常所使用的快速排序主体部分，其源码如下：

{% highlight cpp linenos %}
    template <class RandomAccessIterator, class T>
    RandomAccessIterator __unguarded_partition(RandomAccessIterator first, 
                                               RandomAccessIterator last, 
                                               T pivot) {
        while (true) {
            while (*first < pivot) ++first;
            --last;
            while (pivot < *last) --last;
            if (!(first < last)) return first;
            iter_swap(first, last);
            ++first;
        }
    } 
{% endhighlight %}

这个函数没有去检查边界，而是以两个指针交错作为中止条件，节约了比较的开支。可以这么做的理由是选择是首尾中间位置三个值的中间值作为pivot，因此一定会在超出此区域之前中止指针的移动。

该函数返回的是右端的第一个值，《STL源码剖析》给出了两个非常直观的示意图：

![分割示例一](/img/posts/stl-unguarded-partition-sample1.png)
![分割示例二](/img/posts/stl-unguarded-partition-sample2.png)

相信这两个图可以让你非常容易明白这个分割算法。

#### 递归深度阈值

它的最后一个参数即是前面所提到的判断分割行为是否有恶化倾向的阈值，即允许递归的深度，这里传的是`2logN`。注意看if语句，当递归次数超过阈值时，函数调用`partial_sort`，它其实便是堆排序:

{% highlight cpp linenos %}
    template <class RandomAccessIterator, class T, class Compare>
    void __partial_sort(RandomAccessIterator first, RandomAccessIterator middle,
                        RandomAccessIterator last, T*, Compare comp) {
        make_heap(first, middle, comp);
        for (RandomAccessIterator i = middle; i < last; ++i)
            if (comp(*i, *first))
                __pop_heap(first, middle, i, T(*i), comp, distance_type(first));
        sort_heap(first, middle, comp);
    }

    template <class RandomAccessIterator, class Compare>
    inline void partial_sort(RandomAccessIterator first,
                             RandomAccessIterator middle,
                             RandomAccessIterator last, Compare comp) {
        __partial_sort(first, middle, last, value_type(first), comp);
    }
{% endhighlight %}

如前所述，此时采用堆排序可以将快速排序的效率从O(N<sup>2</sup>)提升到O(N logN)。堆排序结束之后直接结束循环。

#### 最小分段阈值

除了这个阈值以外，Introspective Sort还用到另外一个阈值。注意看`__introsort_loop`中的while语句，其中有一个变量`__stl_threshold`，定义为：

{% highlight cpp linenos %}
    const int __stl_threshold = 16;
{% endhighlight %}

它即就是我们前面所说的最小分段阈值。当数据长度小于该阈值时，再使用递归来排序显然是不划算的，递归的开销相对来说太大。而此时整个区间内部有多个元素个数少于16的子序列，每个子序列都有相当程序的排序，但又尚未完全排序，过多的递归调用显然是不可取的，而这种情况刚好是插入排序最拿手的，它的效率能够达到O(N)。因此这里中止快速排序，sort会接着调用外边的`__final_insertion_sort`，即插入排序。

到目前为止一切都很好理解。

## 为何`__final_insertion_sort`如此实现

现在终于来到std::sort的最后一步——插入排序。我将它提为单独的一章是因为它使用了优化技巧，让人难以理解，我花了些时间才弄懂它，这也正是为何会有博文。我们先来看看其定义：

{% highlight cpp linenos %}
    template <class RandomAccessIterator>
    void __final_insertion_sort(RandomAccessIterator first, 
                                RandomAccessIterator last) {
        if (last - first > __stl_threshold) {
            __insertion_sort(first, first + __stl_threshold);
            __unguarded_insertion_sort(first + __stl_threshold, last);
        }
        else
            __insertion_sort(first, last);
    }
{% endhighlight %}

它被分成了两个分支，前一个分支是处理大于分段阈值的情况，后一个分支处理小于等于分段阈值。第一个问题：为什么要这么划分？

再看，第一个分支中又将区间分成了两段，前16个和后16个，然后分别调用两个排序。于是第二个问题来了，为什么要这么分？

最后一个问题，`__insertion_sort`和`__unguarded_insertion_sort`有何区别？

这此问题便是我看到这个实现的反应，《STL源码剖析》也没有讲得很清楚，网上也有类似的[讨论](http://bytes.com/topic/c/answers/819473-questions-about-stl-sort)，都说是为了优化，但为何这样便能优化，还是没有答案。又经过一番折腾之后才完全理解了这么做的意图，于是有了这篇博文。

### 各种插入排序算法的实现

我们这里先来看最后一个问题，这两种插入排序有何区别？要解释这个问题，需要先介绍它们各自的实现，从标准插入排序算法开始。

### 标准插入排序实现

我们先来看看一般的插入排序如何实现，这里是摘自[维基百科](http://en.wikipedia.org/wiki/Insertion_sort)的一段伪代码：

{% highlight cpp linenos %}
    for i ← 1 to length(A)
        j ← i
        while j > 0 and A[j-1] > A[j]
            swap A[j] and A[j-1]
            j ← j - 1
{% endhighlight %}

从第二个值开始循环，首先判断是否有越界，然后判断是否需要调换。

### `__insertion_sort`实现

我们首先来看第三个问题，这两个排序有什么区别，同样都是插入排序，为什么有的叫unguarded？接下来看看STL的实现：（注：这里取得都是采用默认比较函数的版本）：

{% highlight cpp linenos %}
    template <class RandomAccessIterator, class T>
    void __unguarded_linear_insert(RandomAccessIterator last, T value) {
        RandomAccessIterator next = last;
        --next;
        while (value < *next) {
            *last = *next;
            last = next;
            --next;
        }
        *last = value;
    }

    template <class RandomAccessIterator, class T>
    inline void __linear_insert(RandomAccessIterator first, 
                                RandomAccessIterator last, T*) {
        T value = *last;
        if (value < *first) {
            copy_backward(first, last, last + 1);
            *first = value;
        }
        else
            __unguarded_linear_insert(last, value);
    }

    template <class RandomAccessIterator>
    void __insertion_sort(RandomAccessIterator first, RandomAccessIterator last) {
        if (first == last) return; 
        for (RandomAccessIterator i = first + 1; i != last; ++i)
            __linear_insert(first, i, value_type(first));
    }
{% endhighlight %}

最下面的函数，它是从第二个元素开始对每个元素依次调用了`__linear_insert`。后者和前面提到的标准插入排序有一点点不同，它会先将该值和第一个元素进行比较，如果比第一个元素还小，那么就直接将前面已经排列好的数据整体向后移动一格，然后将该元素放在起始位置。对于这种情况，和标准插入排序相比，它将`last - first - 1`次的比较与调换操作变成了一次`copy_backward`操作，节省了每次移动前的比较操作。

但这还不是最主要的，如果不是上述情况，它会调用另外一个函数`__unguarded_linear_insert`，这里仅仅挨个判断是否需要调换，找到位置之后就将其插入到适当位置。注意看，这里没有检查是否有越界，为什么可以这样？因为在`__linear_insert`的if语句中，已经可以确保第一个值在最左边了，那么，`__unguarded_linear_insert`便可以毫无顾忌的省略掉是否有越界的检查。当然，因为少了很多次的比较操作，效率肯定便有了提升。后面我们会就此作一个详细的分析。

注意：使用`__unguarded_linear_insert`时，__一定得确保这个区间的左边有效范围内已经有了最小值，否则没有越界检查将带来非常严重的后果__。这种unguarded命名的函数在前面`__introsort_loop`里面也有一个：`__unguarded_partition`，这也是同样不考虑边界的情况，我在这里就不介绍了，有兴趣的可以去查看GNU C++ STL的源代码，在`std_algo.h`中定义。

### `__unguarded_insertion_sort`实现

来看看其在STL中的实现，同样这里只是STL的默认比较函数版本：

{% highlight cpp linenos %}
    template <class RandomAccessIterator, class T>
    void __unguarded_insertion_sort_aux(RandomAccessIterator first, 
                                        RandomAccessIterator last, T*) {
        for (RandomAccessIterator i = first; i != last; ++i)
            __unguarded_linear_insert(i, T(*i));
    }

    template <class RandomAccessIterator>
    inline void __unguarded_insertion_sort(RandomAccessIterator first, 
                                    RandomAccessIterator last) {
        __unguarded_insertion_sort_aux(first, last, value_type(first));
    }
{% endhighlight %}

这里直接对每个元素都调用`__unguarded_linear_insert`，这个函数我们在上节已经分析过，它不是检查是否有越界的。正因为如此，它一定比前面的`__insertion_sort`要快。

但是有一点需要再次强调一遍：和前面的`__unguarded_linear_insert`一样，__一定得确保这个区间的左边有效范围内已经有了最小值，否则没有越界检查将带来非常严重的后果__。所以该函数很少单独使用。

### 各种实现的性能分析

接下来我们来分析一下以上三种实现的性能，这里仅以第i个元素的运算次数作为比较，并不考虑编译器优化，作一个大致上的性能分析。此时前i-1个元素已经排好，假设该第i个元素应该插入的位置离i的平均距离为N。
## TODO：插入一个图

#### 标准插入排序性能分析

对于标准插入排序，它需要的操作次数为：

{% highlight cpp linenos %}
    // 标准插入排序伪代码
    while j > 0 and A[j-1] > A[j]   // 2N次比较运算，N次减法运算
        swap A[j] and A[j-1]        // N次交换运算（通常理解为3N次赋值运算)
        j ← j - 1                   // N次自减运算
{% endhighlight %}

总共为2N次比较，3N次赋值，N次减法，N次自减。

#### `__insertion_sort`性能分析

再来看`__insertion_sort`，因为这里出现了分支，因此需要分开来对待。我们取两种极端情况，先假设每次都是取第一个分支，即`value < *first`，那么此时`N=i`：

{% highlight cpp linenos %}
    // __linear_insert函数
    if (value < *first) {           // 1次比较运算
        copy_backward(first, last, last + 1);   
                                    // 1次copy
        *first = value;             // 1次赋值运算
    }
{% endhighlight %}

因为`copy_backward`最后调用的是`memmove`，此种情形下的C标准库实现为：

{% highlight cpp linenos %}
    // memmove函数
    for (; 0 < n; --n)              // N次比较运算，N次自减运算
        *sc1++ = *sc2++;            // 2N次自增运算，N次赋值运算
{% endhighlight %}

这里认为自增自减一样，因此总共需要N+1次比较，N+1次赋值，3N次自减。

如果假设每次`__insertion_sort`都不取第一个分支，即首位的元素已经是最小值，此时：

{% highlight cpp linenos %}
        // __linear_insert函数
        if (value < *first) {       // 1次比较
            // ...
        }
        else
            __unguarded_linear_insert(last, value);
                                    // 见下面

        // __unguarded_linear_insert函数
        while (value < *next) {     // N次比较
            *last = *next;          // N次赋值
            last = next;            // N次赋值
            --next;                 // N次自减
        }
{% endhighlight %}

因此总共需要N+1次比较，2N次赋值和N次自减。

再假设两个分支有相同的概率，那么平均所需的操作为：N+0.5次比较，1.5N+0.5次赋值，2N次自减。

#### `__unguarded_insertion_sort`性能分析

由于其直接调用了`__unguarded_linear_insert`，因而和上述第二个分支类似，但没有了分支，所需操作为：N次比较，2N次赋值和N次自减。

#### 比较结果

在上述基础上再作一点假设，假设每种运算占用CPU的时间一样，那么此时三种算法的结果分别为：

- 7N
- 4.5N+1
- 4N

假设总共为M个元素，那么平均执行次数为：

- 7N * M
- 4.5N * M + M
- 4N * M

可以很明显的看到，后两种的执行次数大大低于第一种，接近一半。而最后一种因为少了越界检查，乍看之下似乎无足轻重，但在M非常庞大的情况下，影响相当可观，毕竟这是一个非常根本的算法核心。这也是一直没有省略1的原因。

### 离真相更进一步

让我们再回到`__final_insertion_sort`函数，为了唤醒你的记忆，再贴一次它的源代码：

{% highlight cpp linenos %}
    template <class RandomAccessIterator>
    void __final_insertion_sort(RandomAccessIterator first, 
                                RandomAccessIterator last) {
        if (last - first > __stl_threshold) {
            __insertion_sort(first, first + __stl_threshold);
            __unguarded_insertion_sort(first + __stl_threshold, last);
        }
        else
            __insertion_sort(first, last);
    }
{% endhighlight %}

此时关于前面提的最后一个问题：两种插入算法有何区别已经得到答案了：`__unguarded_insertion_sort`更快。

但是这个算法的使用有一个前提，那便是需要确保最小值已经存在于有效区间的最左边。于是，你可能会想，如果此时可以确定最小值已经位于最左边，那么后面所有的区间内便可以使用最快的`__unguarded_insertion_sort`算法。没错，STL的设计者也是这么想的。

可是，如何可以确定最小值已经在最左边了呢？或者在一个小的区间内？绝大部分情况下无法确定这样的情况。但正是由于快速排序的特殊性，可以保证最小值存在于一个小的区域中，接下来我们会证明这一点。

所以他们想到将经过`__introsort_loop`排序的数据分成两段，假设第一段里面包含了最小值，那么将第一段使用`__insertion_sort`排序，后一段使用`__unguarded_insertion_sort`便可以达到效率的最大化。对，STL的设计者们珍爱效率如生命。

到这里，你可以回答第一个问题了：为什么有这样的分支处理？是因为如果数据量足够小，没有必要进行如此复杂的划分，直接一个插入排序便可以搞定。只数据量比较大的情况下，将数据分成两段，前一段使用带边界检查的插入排序，后一段使用不带边界检查的插入排序。

现在最为关键的一个问题来了，如何可以确保前16个元素中一定有最小值？

### 论证最小值存在于前16个元素之中

##这一段移到别处
我们先看一下维基百科上快速排序的动画，非常直观：

[![快速排序](/img/posts/stl-quicksort.gif)](http://upload.wikimedia.org/wikipedia/commons/6/6a/Sorting_quicksort_anim.gif)

从图中可以看出，无论经过几次递归调用，对于所有划分的区域，左边区间所有的数据一定比右边的小。
##



## 证明前16个元素中一定有最小值
## 前面还有一个unguarded

qsort和sort, 除了模板，有无其它区别

最坏情况下O(N2)
sort的introsort算法，参考论文
以一个例子来介绍unguarded，或者直接分析__unguarded_linear_insert和__linear_insert有何不同，学习书上的风格画一个图
introsort之后的数据是什么情况
为何分两步？
为何选择insertion sort
sort适合哪些容器

为什么__final_insertion_sort要这样设计？
看来得去找introsort这篇论文了，里面没有介绍关于insertion_sort的问题，重点放在了introsort上面
我想我弄明白了，因为经过前面的introsort之后，最小值一定会在最前面的16个当中。只考虑last - first > 16的情况，如果只用insertion_sort的话，那么每个元素插入都需要两个判断，一是它是否比最左边的小，如果是的话，则需要整体右移，否则挨个比较。
但是由于最小值在已经在前16个当中了，那么对于16个元素之后的其它元素而言，这次比较显然是个浪费。而如果先用一次插入比较对前16个排序完之后，再对所有16之后的元素用unguarded插入排序的话，那么效率肯定会高得多，至少这次比较操作是省了下来，如果元素数量很多时，这将省下来相当多的时间。
这个也可以去写一篇短的blog

这篇文章会比较短，但是我想很多人看到这里时一定会象我一样觉得充满疑问，为何要分成两段，网上没有查到有详细的分析，因此打算在这里写下这篇文章
设计一段程序来统计这一比较次数，这样比较直观。
将16变小一点，可以画图来演示
这里有一段讨论：http://bytes.com/topic/c/answers/819473-questions-about-stl-sort
这里是introsort: http://www.cs.rpi.edu/~musser/gp/index_1.html
这里是pdf版本：http://www.researchgate.net/profile/David_Musser/publication/2476873_Introspective_Sorting_and_Selection_Algorithms/file/3deec518194fb4a32f.pdf
sort适用哪些容器，当然会包括我们常用的数组
看看VC里面的sort如何实现 
各种排序算法适用的场景，为何这里选择insertion sort

(全文完)

feihu

2014.05.21 于 Shenzhen
