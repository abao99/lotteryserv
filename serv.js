var http =  require('http');
var io = require('socket.io'); // 加入 Socket.IO
var querystring = require('querystring');


//建立伺服器
var server = http.createServer(function(request, response) {
  console.log('Connection listen*8001');
});
server.listen(8001);  //指定port

//連線資料
var mysql = require('mysql');
var con = mysql.createConnection({
  host     : 'localhost',
  user     : 'admin',
  password : '123456',
  database : 'lottery'
});

//連線資料庫
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  }); 

var serv_io = io.listen(server);  // 開啟 Socket.IO 的 listener

serv_io.on('connection',function(socket){
  
    qry(socket);

    socket.on('submit',function(data){
      var result = querystring.parse(data);
      console.log(result.dateStart);
      Submit(result,socket);
    });
    
    socket.on('alz',function(data){
      alz(data,socket);
    });
  
});    

function alz(data,socket){
  
  var request = require('request');
  var url = "http://www.kufa88.com/Promotion/jingcai"; 
  
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //console.log(body) // 打印網頁資訊
      body=body.replace(/\r\n|\n|\r/g,"");
      
      catech(body);
    } 
  }) 
}

function catech(body){
  var regex = /<tbody>(.*)<\/tbody>/;
  var tbody = regex.exec(body);
  
  var resuldate = [];
  var date = [];
  regex = /<td colspan="6"><span class="moreIcon"><\/span>(.*?) 每次竞猜选择一个选项下注/g;
  console.log(regex);
  while(date = regex.exec(tbody[1])){
    
    resuldate.push(date[1]);//date 日期
  } 
  console.log(resuldate[0]);
  
  //抓一天賽事
  var resulday = [];
  var tr = [];
  var moreindex ;
  for(var i=0; i<resuldate.length ; i++) {
    moreindex = i+1;
    regex = new RegExp('<tr class="moreContent more'+moreindex+'" style="display: table-row">(.*?)<\/tr>','g');
    //<tr class="moreContent 
    //regex = /<tr class="moreContent more1" style="display: table-row">(.*?)<\/tr>/g;
    console.log(regex);
    while(tr = regex.exec(tbody[1]) ){
      //console.log(tr[1]);
      resulday.push(tr[1]);
    } 
    
    for(var j =0 ;j<resulday.length;j++ ){
      //console.log(resulday.length);
      //賽事
      var resulrace = [];
      var race = [];
      var race1 = [];
      var regex1 =/color: #FFFFFF\'>(.*?)<\/span><\/td>/g;
      regex = /color: #ffffff\'>(.*?)<\/span><\/td>/g;
      while(race1 = regex1.exec(resulday[j])){
        console.log(race1[1].length);
        
        if(regex1.exec(resulday[j]) != null){
          console.log(race1[1]);
          resulrace.push(race1[1]);
        }
        else{
          //console.log(regex.exec(resulday[j]));
          race = regex.exec(resulday[j]);
          //console.log(race[1]);
          //resulrace.push(race[1]);
        }
      } 
      //console.log(resulrace[0]);
    
      //抓主隊
      var resulhost = [];
      var host = [];
      regex = /<span class="ht">(.*)<\/span>vs/g;
      //console.log(regex);
      while(host = regex.exec(resulday[j])){
        
        resulhost.push(host[1]);//date 日期
      } 
      //console.log(resulhost[0]);

      //抓客隊
      var resulvisite = [];
      var visite = [];
      regex = /<span class="at">(.*?)<\/span>/g;
      //console.log(regex);
      while(visite = regex.exec(resulday[j])){
        
        resulvisite.push(visite[1]);//date 日期
      } 
      //console.log(resulvisite[0]);

      //抓時間
      var resultime = [];
      var time = [];
      regex = /<td class="time">(.*?)<\/td>/g;
      //console.log(regex);
      while(time = regex.exec(resulday[j])){
        
        resultime.push(time[1]);//date 日期
      } 
      //console.log(resultime[0]);

      //抓讓球
      var resulconcede = [];
      var concede = [];
      regex = /<span class="rq2".*?>(.*?)<\/span>/g;
      //console.log(regex);
      while(concede = regex.exec(resulday[j])){
        
        resulconcede.push(concede[1]);//date 日期
      } 
      //console.log(resulconcede[0]);

      //抓人數
      var resulnum = [];
      var num = [];
      regex = /<td class="num">(.*?)人竞猜<\/td>/g;
      //console.log(regex);
      while(num = regex.exec(resulday[j])){
        
        resulnum.push(num[1]);//date 日期
      } 
      // console.log(resulnum[0]);

      //抓勝
      var resulvictory = [];
      var victory = [];
      regex = /<span>胜(.*?)<input/g;
      //console.log(regex);
      while(victory = regex.exec(resulday[j])){
        
        resulvictory.push(victory[1]);//victory[1] victory[2]
      } 
      //console.log(resulvictory[1]);

      //抓平
      var resuldraw = [];
      var draw = [];
      regex = /<span>平 (.*?)<input/g;
      //console.log(regex);
      while(draw = regex.exec(resulday[j])){
        
        resuldraw.push(draw[1]);//draw[1] draw[2]
      } 
      //console.log(resuldraw[1]);

      //抓負
      var resuldefeat = [];
      var defeat = [];
      regex = /<span>平 (.*?)<input/g;
      //console.log(regex);
      while(defeat = regex.exec(resulday[j])){
        
        resuldefeat.push(defeat[1]);//defeat[1] defeat[2]
      } 
      //console.log(resuldefeat[1]);
    }
  }
  
      
}

function Submit(search,socket){
  console.log(search.dateStart);
  var sql = "";
  var row = {};
      sql = "SELECT "+
               "* "+ 
            "FROM "+
               "game "+
            "where ";

            if(search.dateStart != "" && search.dateEnd == ""){
              sql+=" date = '"+search.dateStart+"' and";
            } 
            else if(search.dateStart== "" && search.dateEnd != ""){
              sql+=" date = '"+search.dateEnd+"' and";
            }
            else if(search.dateStart != "" && search.dateEnd != ""){
              sql+=" date >= '"+search.dateStart+"' and"+
                    "  date <= '"+search.dateEnd+"' and";
            }
            if(search.race !=""){
              sql+=" race = '"+search.race+"' and";
            }
            if(search.host !=""){
              sql+=" host = '"+search.host+"' and";
            }
            if(search.visite != ""){
              sql+=" visite = '"+search.visite+"' and";
            }
       sql = sql.substring(0,sql.length-3);
       sql+= " ORDER BY "+
               "date , time;";
          
  con.query(sql, function (err, result) {
      if (err) throw err;
      
    for(i = 0; i <result.length ; i++){
      row[i] = result[i]; 
    };

    console.log(row[0]["id"]);
    socket.emit('search',row);
  });          
}
 
function qry(socket){
  //計算今天日期
  var today ="";
  var d = new Date();
  var day = d.getMonth()+1;
  today = d.getFullYear()+"-"+"0"+day+"-"+d.getDate();
    
  //搜尋資料
  var sql = "";
  var row = {};
      sql = "SELECT "+
               "* "+ 
            "FROM "+
               "game "+
            "where "+
               "date >='"+today+"'"+
            " ORDER BY "+
               "date , time;";
                
  con.query(sql, function (err, result) {
      if (err) throw err;
      
    for(i = 0; i <result.length ; i++){
      row[i] = result[i]; 
    } 

    socket.emit('qry',row);
  });        
} 
