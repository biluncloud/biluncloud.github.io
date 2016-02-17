---
layout: post
title:  iOS中如何对具有复杂依赖的SDK在真机上进行单元测试
description: 本文介绍了在复杂的App中，如何对一个依赖其它库的SDK，在真机及App环境中进行单元测试
tags:   iOS, 单元测试，Unit Testing，framework，XCTest，CocoaPods，SDK，Application Test，Logic Test
image:  orientation.png
---

单元测试在软件开发中一直有着极其重要的地位，iOS的开发也不例外。随着App规模的不断膨胀，开发也逐渐的趋向模块化，开发者常常以静/动态库的形式封装功能，最后统一组成App。此时由于App结构变得复杂，各种库又可能存在着相互依赖的缘故，单元测试也随之变得复杂起来。我们可能面临着一系列问题，比如：单元测试如何处理这些依赖？如何在真机上运行测试？如何在App所在的环境中运行测试？本文将以一个模拟的开发环境来逐一讨论。

{{ more }}

### 目录
{:.no_toc}

* Table of Contents Placeholder
{:toc}

-----

在刚刚接触软件开发时，从未想过要写单元测试，总觉得自己写的代码质量很高，根本不需要测试，需要将宝贵的时间放到开发上，测试是测试人员的事情。后面才发现，经常因为一个小需求的增加，动了一处代码，结果后期其它地方出现重大问题。甚至到了后面，代码复杂度越来越高，每动一处都提心吊胆，生怕有其它情形未考虑到，如履薄冰。经历了很多次惨痛教训之后才醒悟过来，单元测试是保证代码质量的不二法则。在《代码重构》一书中，每进行一步重构，作者都会先运行一遍单元测试，然后再进行后面的重构，因为只有这样，才能够保证重构之后代码的正确性，如果连正确都无法保证，重构有何意义？

Apple在Xcode 5中开始，引入了XCTest，非常完美的将测试与开发环境集成在了一起。关于如何使用XCTest，网上也有了非常多的介绍，大家可以看看Apple的[官方文档](https://developer.apple.com/library/ios/documentation/DeveloperTools/Conceptual/testing_with_xcode/chapters/01-introduction.html#//apple_ref/doc/uid/TP40014132-CH1-SW1)，NSHipster也写过一篇[Unit Testing](http://nshipster.com/unit-testing/)，有兴趣的可以看看。

随着开发者越来越重视单元测试，有人提出了[TDD(测试驱动开发)](https://en.wikipedia.org/wiki/Test-driven_development)，并得到了很多开发者的推崇。这种思想会先根据需求或者接口来编写测试用例，然后才开始写业务代码，这样极大的保证了写出来的代码的正确性。关于在iOS上使用TDD，OneV写过一篇[TDD的iOS开发初步以及Kiwi使用入门](http://onevcat.com/2014/02/ios-test-with-kiwi/)。

本文集中注意力介绍特定场景中的单元测试。

## 问题

iOS开发现在多数都使用CocoaPods进行第三方库的依赖管理，这样开发者们可以集中注意力放在自己模块的开发上面。比如著名的网络库AFNetworking。它的开源代码中也包含了[单元测试](https://github.com/AFNetworking/AFNetworking/tree/master/Tests/Tests)，写得非常好，可以作为范例去学习。

但是由于AFNetworking本身的特点，决定了其单元测试环境其实是比较简单的，比如：

- AFNetworking并没有依赖其它的第三方库，算是一个独立的库
- 不依赖复杂的App环境
- 不依赖真机环境

很多时候，我们的开发环境非常复杂，比如：

- 依赖其它的第三方库，如何处理这些依赖的问题？
- 依赖的某些第三方库又必须运行在复杂的App环境中，如何让测试运行于App环境中？
- 某些方法必须在真机上才能运行，如何让测试运行于真机上？

这些问题AFNetworking的测试用例都没有，而且默认创建的测试target都无法运行在这些环境中。如何利用XCTest来对以上复杂情形下的SDK进行单元测试？我们从模拟环境开始。

## 搭建SDK开发环境

首先我们来搭建一个满足以上复杂条件但却典型的开发环境：创建三个工程，其中ECApp是最终应用，它依赖了我们正在开发的ECSDK，而后者又依赖了第三方库EC3rdFramework。整个目录结构为：

    .
    ├── EC3rdFramework
    │   ├── EC3rdFramework.podspec
    │   ├── EC3rdFramework.xcodeproj
    │   ├── Podfile
    │   ├── Sources
    │   │   ├── ECFoo.h
    │   │   └── ECFoo.m
    │   └── SupportingFiles
    ├── ECApp
    │   ├── ECApp
    │   │   ├── AppDelegate.h
    │   │   ├── AppDelegate.m
    │   │   ├── Assets.xcassets
    │   │   │   └── AppIcon.appiconset
    │   │   │       └── Contents.json
    │   │   ├── Base.lproj
    │   │   │   ├── LaunchScreen.storyboard
    │   │   │   └── Main.storyboard
    │   │   ├── Info.plist
    │   │   ├── ViewController.h
    │   │   ├── ViewController.m
    │   │   └── main.m
    │   ├── ECApp.xcodeproj
    │   └── Podfile
    └── ECSDK
        ├── ECSDK.podspec
        ├── ECSDK.xcodeproj
        ├── Podfile
        ├── Sources
        │   ├── ECUsingFoo.h
        │   └── ECUsingFoo.m
        └── SupportingFiles

### 第三方库：EC3rdFramework

EC3rdFramework是我们的ECSDK所依赖的第三方库，其中包含一个`ECFoo`类，含有三个方法，分别模拟三种场景：

{% highlight objc %}
// ECFoo.m
// 模拟不依赖任何环境
- (BOOL)methodDependsOnNothing {
    return YES;
}

// 模拟依赖应用的环境
- (BOOL)methodDependsOnAppEnv {
    NSNumber *appInitialized = [[NSUserDefaults standardUserDefaults] objectForKey:@"AppInitialized"];
    if (appInitialized) {
        NSLog(@"running in app env");
        return YES;
    } else {
        NSLog(@"NOT running in app env");
        return NO;
    }
}

// 模拟依赖真实设备
- (BOOL)methodMustBeRunningOnDevice {
#if TARGET_IPHONE_SIMULATOR
    NSLog(@"running on simulator");
    return NO;
#else
    NSLog(@"running on device");
    return YES;
#endif
}
{% endhighlight %}

三个方法非常简单的模拟了三种典型的场景，满足条件时才会返回YES。对于依赖应用环境的场景，是通过App设置的一个标志位来判断，后面ECApp部分会看到这个标志位的设置。

其podspec如下：

{% highlight ruby %}
Pod::Spec.new do |s|
  s.name                = "EC3rdFramework"
  s.version             = "1.0.0"
  s.requires_arc        = true
  s.source_files        = [ '**/Sources/**/*.h', '**/Sources/**/*.m']
  s.ios.deployment_target = '7.0'
end
{% endhighlight %}

### 开发中的SDK：ECSDK

ECSDK为我们所开发的SDK，它同EC3rdFramework一样，也是一个静态库，包含`ECUsingFoo`类，与前面的`ECFoo`类包含相同的方法，每个方法中直接调用`ECFoo`中的对应方法，这样做是为了模拟依赖第三方库的场景：

{% highlight objc %}
// ECUsingFoo.m
#import <EC3rdFramework/ECFoo.h>
// ...
- (BOOL)methodDependsOnNothing {
    ECFoo *foo = [ECFoo new];
    return [foo methodDependsOnNothing];
}

- (BOOL)methodDependsOnAppEnv {
    ECFoo *foo = [ECFoo new];
    return [foo methodDependsOnAppEnv];
}

- (BOOL)methodMustBeRunningOnDevice {
    ECFoo *foo = [ECFoo new];
    return [foo methodMustBeRunningOnDevice];
}
{% endhighlight %}

同前面类似，它的podspec如下，区别在于它多了对第三方库依赖：

{% highlight ruby %}
Pod::Spec.new do |s|
  s.name                = "ECSDK"
  s.version             = "1.0.0"
  s.requires_arc        = true
  s.source_files        = [ '**/Sources/**/*.h', '**/Sources/**/*.m']
  s.dependency          'EC3rdFramework'
  s.ios.deployment_target = '7.0'
end
{% endhighlight %}

也是因为这个依赖，还需要一个Podfile：

{% highlight ruby %}
target "ECSDK" do
  pod 'EC3rdFramework', :path => '../EC3rdFramework'
end
{% endhighlight %}

### 最终应用：ECApp

ECApp为使用ECSDK的App，在它启动之后立刻调用ECSDK中暴露的接口：

{% highlight objc %}
// AppDelegate.m
#import <ECSDK/ECUsingFoo.h>
// ...
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    // Override point for customization after application launch.

    [[NSUserDefaults standardUserDefaults] setObject:[NSNumber numberWithBool:YES] forKey:@"AppInitialized"];
    [[NSUserDefaults standardUserDefaults] synchronize];

    ECUsingFoo *foo = [ECUsingFoo new];
    [foo methodDependsOnNothing];
    [foo methodDependsOnAppEnv];
    [foo methodMustBeRunningOnDevice];
    return YES;
}
{% endhighlight %}

在调用之前，先设置了App环境的标识，前面`ECFoo`中便是依赖于此标识来判断是否处于App的环境中。

它的Podfile也很简单：

{% highlight ruby %}
target "ECApp" do
  pod 'EC3rdFramework', :path => '../EC3rdFramework'
  pod 'ECSDK', :path => '../ECSDK'
end
{% endhighlight %}

这里有一点需要注意的是，实际上ECApp不会直接去依赖EC3rdFramework，它是被ECSDK依赖，按理说不需要加到Podfile中，CocoaPods会帮我们处理这种依赖，但由于EC3rdFramework并非已经发布的第三方库，如果不加上这一句的话，在`pod install`时会出现下面的错误：

> [!] Unable to find a specification for `EC3rdFramework` depended upon by `ECSDK`

CocoaPods会去已经发布的库中去寻找，而不是本地。同时由于CocoaPods也不支持在podspec中像podspec中一样，通过`:path => ../EC3rdFramework`指定本地路径，StackOverflow这里有[讨论](http://stackoverflow.com/questions/16905112/cocoapods-dependency-in-pod-spec-not-working)，所以出此下策，但这并不影响我们演示。

在ECApp路径下执行`pod install`之后，然后编译运行，将会得到以下日志：

    2016-02-16 21:27:32.032 ECApp[30005:1064278] running in app env
    2016-02-16 21:27:32.032 ECApp[30005:1064278] running on simulator

表示库已经正常调用，运行于App环境中的模拟器上。

## 添加单元测试

环境搭好之后，接下来，为ECSDK添加单元测试。由于Xcode集成了XCTest，所以添加单元测试非常简单，依次选择菜单项：`New/Target/iOS/Test/iOS Unit Testing Bundle`，这里我们的测试target为`ECSDKTests`。完成后，在ECSDK工程中会生成对应的target和源文件，可以看到工程中有一个ECSDKTests.m文件，这是Xcode默认生成的测试用例。选中ECSDKTests这个Scheme，按下**⌘ U**(注意，这里是U，而不是平时所用的B和R)编译并运行测试，因为此时是默认的空测试用例，所以测试很顺利的完成：

![测试通过](/img/posts/ut-default-test-succeeded.png)

### 编写测试用例

为了测试ECSDK中提供的方法，我们需要为其添加新的测试用例。三种场景，只有返回YES时才算通过测试，由此表示测试可以运行于这些环境中：

{% highlight objc %}
// ECSDKTests.m
#import "ECUsingFoo.h"
// ...
- (void)testMethodDependsOnNothing {
    ECUsingFoo *foo = [ECUsingFoo new];
    XCTAssert([foo methodDependsOnNothing], @"The method must be running in ANY env");
}

- (void)testMethodDependsOnAppEnv {
    ECUsingFoo *foo = [ECUsingFoo new];
    XCTAssert([foo methodDependsOnAppEnv], @"The method must be running in app env");
}

- (void)testMethodMustBeRunningOnDevice {
    ECUsingFoo *foo = [ECUsingFoo new];
    XCTAssert([foo methodMustBeRunningOnDevice], @"The method must be running on device");
}
{% endhighlight %}

测试用例很简单，我们来看看是否可以运行。再次选中ECSDKTests这个Scheme，**⌘ U**编译运行，此时出现以下错误：

    Undefined symbols for architecture x86_64:
      "_OBJC_CLASS_$_ECUsingFoo", referenced from:
          objc-class-ref in ECSDKTests.o
    ld: symbol(s) not found for architecture x86_64
    clang: error: linker command failed with exit code 1 (use -v to see invocation)

错误信息显示链接时找不到`ECUsingFoo`方法，后者是定义在ECSDK工程中，表示测试target需要依赖ECSDK。处理依赖有多种方法：可以在Build Settings中添加framework及其对应路径。还有一种更好的办法，利用CocoaPods，在它的Podfile中增加一个target即可，这样可以保证ECSDKTests和ECSDK的依赖完全一致。新的Podfile像这样：

{% highlight ruby %}
def import_common_pods
    pod 'EC3rdFramework', :path => '../EC3rdFramework'
end

target "ECSDK", :exclusive => true do
    import_common_pods
end

target "ECSDKTests", :exclusive => true do
    import_common_pods
    pod 'ECSDK', :path => '.'
end
{% endhighlight %}

一目了然，因为依赖了共同的库，所以将这抽出来成为一个单独的方法，接着在两个target中调用。由于测试target是依赖于ECSDK，所以还需要加上：`pod 'ECSDK', :path => '.'`。重新`pod install`，**⌘ U**，编译问题解决，测试可以正常运行。

![两个用例失败](/img/posts/ut-appenv-device-test-failed.png)

但现在面临两个新的问题，因为现在测试只能运行于模拟器上，而且并非是App的环境，所以后面两个测试无法通过。

如果我们将Scheme选成真机上运行，一按**⌘ U**便会弹出以下错误提示：

    > Logic Testing on iOS devices is not supported. You can run logic tests on the Simulator.

### 让UT运行在App环境

我们先来看如何让测试运行于App环境中。Apple在[开发文档](https://developer.apple.com/legacy/library/documentation/DeveloperTools/Conceptual/UnitTesting/02-Setting_Up_Unit_Tests_in_a_Project/setting_up.html)中提过两个概念，一个叫Logic Tests，另外一个叫Application Tests，前者只能够运行在模拟器中，我们刚创建的测试target正是前面一种。这也是为何选择真机时，会弹出上面错误提示的原因：

但是很遗憾，因为这篇[文档](https://developer.apple.com/legacy/library/documentation/DeveloperTools/Conceptual/UnitTesting/02-Setting_Up_Unit_Tests_in_a_Project/setting_up.html)是针对OCTest框架，现在Xcode采用了新的XCTest框架，所以已经是"Retired"状态：

> Retired Document
> 
> Important: This version of Unit Testing Guide has been retired. The replacement document focuses on the new testing features and workflow provided by Xcode 5 and later revisions. For information covering the same subject area as this page, please see Testing with Xcode.

新的文档中也没有再提这两个概念。但由于XCTest的前身就是OCTest，是否配置的方法也是相通的？是否将测试target变成Application Tests之后，就可以运行在App环境中？抱着试一试的想法，按照废弃的文档中的方法来配置测试target。

在General配置页面，里面有一个Host Application，这个便表示测试是否可以运行于App中。但由于当前测试的是一个静态库，无法选择想要运行的App，此时需要用手动方法来指定。

去`ECSDKTests`的Build Settings中修改两处：

- Bundle Loader: Your/App/Path/ECApp.app/ECApp
- Test host: $(BUNDLE_LOADER)

再次运行，发现ECApp的应用先启动，随后测试用例开始执行。因为ECApp在启动之后便配置了App环境的标志位，所以环境依赖的测试用例可以正常通过，现在只剩下最后一个场景，如何让测试运行于真机上：

![App环境测试成功](/img/posts/ut-app-env-test-succeeded.png)

### 让测试运行在真机上

其实，在完成上一步的配置之后，测试已经从所谓的Logic Tests就转变成了Application Tests，而后者对运行的环境是没有限制的。直接将Scheme设置成真机，再运行一次，所有的测试都可以通过：

![设备测试成功](/img/posts/ut-device-test-succeeded.png)

### 特殊情况

**注意**：事情并不会总是这么顺利，有时候由于一个App过于庞大，各个库的podspec写得不是很规范，不是所有依赖的Libraries都写在了podspec中，有些被放在Build Phases里面，系统库尤为常见。这样就导致即使我们按照前面的都配置好了，还是无法让测试target编译通过，在链接时会出现各种各样的找不到符号错误，所以此时需要手动的去添加这些库到测试target的Build Phases中。至于需要添加哪些，只有根据编译时的错误逐一添加了。而且有一点需要注意：有时库的Status需要是Optional，否则最后链接的时候也会出错，下面是一个真实测试用例target在Build Phases中所依赖的对象：

![系统库](/img/posts/ut-system-libraries.png)

它依赖了41个系统库，每一个都是在编译出错时，查到缺少的符号所在的库来添加的，是件体力活。不过方法有了方法之后，添加起来还是非常顺利的。

## 结尾

至此，我们的测试用例便可以运行于上面描述的几种典型的复杂环境，其实最重要的步骤只有两步，一步是设置依赖，处理各种编译错误；第二步是设置Build Settings，让测试能够运行于App环境。也许我们搭建的环境和真实的环境相比起来，复杂度还存在一定的差距，在编译测试target时会出现各种各样奇怪的问题，本文无法一一例举，靠大家根据实际情况处理了。

如果想对Xcode的测试有一个系统的了解，强烈建议大家去阅读文档[Testing with Xcode](https://developer.apple.com/library/ios/documentation/DeveloperTools/Conceptual/testing_with_xcode/chapters/01-introduction.html#//apple_ref/doc/uid/TP40014132-CH1-SW1)，非常详细的介绍了用Xcode进行测试的方方面面。

新的一年，以这篇简单的文章作为开头，祝大家新年快乐！

(全文完)

feihu<br>
2016.02.17 于 Shenzhen

