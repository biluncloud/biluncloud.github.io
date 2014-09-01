//创建和初始化地图函数：
function initMap(){
    window.shuidong = createMap("shuidong", 119.088002, 31.424594, 8);//创建地图
    setMapEvent(shuidong);//设置地图事件
    addMapControl(shuidong);//向地图添加控件
    //标注点数组
    var markerArr = [
        {
            title:"水东镇",
            content:"安徽省宣城市水东镇",
            point:"118.969299|30.800684",
            isOpen:0,
            icon:{w:23,h:25,l:46,t:21,x:9,lb:12}
        }
     ];
    addMarker(shuidong, markerArr);//向地图中添加marker

    window.chidong = createMap("chidong", 115.450374,30.158574, 10);//创建地图
    setMapEvent(chidong);//设置地图事件
    addMapControl(chidong);//向地图添加控件
    //标注点数组
    markerArr = [
        {
            title:"赤东镇",
            content:"湖北省黄冈市蕲春县赤东镇",
            point:"115.488247|30.150454",
            isOpen:0,
            icon:{w:23,h:25,l:46,t:21,x:9,lb:12}
        }
     ];
    addMarker(chidong, markerArr);//向地图中添加marker
}

//创建地图函数：
function createMap(name, x, y, zoom){
    var map = new BMap.Map(name);//在百度地图容器中创建一个地图
    var point = new BMap.Point(x, y);//定义一个中心点坐标
    map.centerAndZoom(point,zoom);//设定地图的中心点和坐标并将地图显示在地图容器中
    return map;
}

//地图事件设置函数：
function setMapEvent(map){
    map.enableDragging();//启用地图拖拽事件，默认启用(可不写)
    map.enableScrollWheelZoom();//启用地图滚轮放大缩小
    map.enableDoubleClickZoom();//启用鼠标双击放大，默认启用(可不写)
    map.disableKeyboard();//禁用键盘上下左右键移动地图，默认禁用(可不写)
}

//地图控件添加函数：
function addMapControl(map){
    //向地图中添加缩放控件
    var ctrl_nav = new BMap.NavigationControl({anchor:BMAP_ANCHOR_TOP_LEFT,type:BMAP_NAVIGATION_CONTROL_LARGE});
    map.addControl(ctrl_nav);
    //向地图中添加缩略图控件
    var ctrl_ove = new BMap.OverviewMapControl({anchor:BMAP_ANCHOR_BOTTOM_RIGHT,isOpen:1});
    map.addControl(ctrl_ove);
    //向地图中添加比例尺控件
    var ctrl_sca = new BMap.ScaleControl({anchor:BMAP_ANCHOR_BOTTOM_LEFT});
    map.addControl(ctrl_sca);
}

//创建marker
function addMarker(map, markerArr){
    for(var i=0;i<markerArr.length;i++){
        var json = markerArr[i];
        var p0 = json.point.split("|")[0];
        var p1 = json.point.split("|")[1];
        var point = new BMap.Point(p0,p1);
        var iconImg = createIcon(json.icon);
        var marker = new BMap.Marker(point,{icon:iconImg});
        var iw = createInfoWindow(markerArr, i);
        var label = new BMap.Label(json.title,{"offset":new BMap.Size(json.icon.lb-json.icon.x+10,-20)});
        marker.setLabel(label);
        map.addOverlay(marker);
        label.setStyle({
                    borderColor:"#808080",
                    color:"#333",
                    cursor:"pointer"
        });

        (function(){
            var index = i;
            var _iw = createInfoWindow(markerArr, i);
            var _marker = marker;
            _marker.addEventListener("click",function(){
                this.openInfoWindow(_iw);
            });
            _iw.addEventListener("open",function(){
                _marker.getLabel().hide();
            })
            _iw.addEventListener("close",function(){
                _marker.getLabel().show();
            })
            label.addEventListener("click",function(){
                _marker.openInfoWindow(_iw);
            })
            if(!!json.isOpen){
                label.hide();
                _marker.openInfoWindow(_iw);
            }
        })()
    }
}
//创建InfoWindow
function createInfoWindow(markerArr, i){
    var json = markerArr[i];
    var iw = new BMap.InfoWindow("<b class='iw_poi_title' title='" + json.title + "'>" + json.title + "</b><div class='iw_poi_content'>"+json.content+"</div>");
    return iw;
}
//创建一个Icon
function createIcon(json){
    var icon = new BMap.Icon("http://app.baidu.com/map/images/us_mk_icon.png", new BMap.Size(json.w,json.h),{imageOffset: new BMap.Size(-json.l,-json.t),infoWindowOffset:new BMap.Size(json.lb+5,1),offset:new BMap.Size(json.x,json.h)})
    return icon;
}

