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
  user     : 'root',
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
  var url = "http://localhost/source4.html"; 
  var resule = [];
  var alzcount = [];
  
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //console.log(body) // 打印網頁資訊
      body=body.replace(/\r\n|\n|\r/g,"");
      
      resule = catech(body); //resule[第幾筆資料]["race"]
      //console.log(resule[39]["race"]);
      
      //判斷更新或新增
      
      if(resule.length !=0){
        console.log("第一筆資料");
        update(resule,0,function(alz){  //resule 抓到的資料 alz:紀錄更新或新增幾筆資料
          //alzcount = alz;
        });
      }
    } 
  }) 
}

function update(resule,n,callback){
  var sql_insert = "INSERT INTO game (date, race, host, visite, time, concede, victory, victory1, draw, draw1, defeat, defeat1, num)"+ 
                 "VALUES ";
    
  var flag = 0; //判斷資料有沒有新增
  var count =0;  // 新增幾筆資料
  var alz = []; //紀錄更新資料的id & 新增幾筆資料

      var sql = "select "+      //查詢 判斷資料存不存在
                  "*"+ 
                "from "+
                  "game "+ 
                "where "+ 
                  "date = '"+resule[n]["date"]+"' and "+      
                  "race = '"+resule[n]["race"]+"' and "+
                  "host ='"+resule[n]["host"]+"' and "+
                  "visite ='"+resule[n]["visite"]+"';";
     
      con.query(sql, function (err,row) {  //查詢 判斷資料存不存在
      
        if (row.length == 0){     //資料不存在，新增
          console.log("新增資料");
          sql_insert += "('"+resule[n]["date"]+"' , "+ //sql 新增資料字串
                         +"'"+resule[n]["race"]+"' , "+
                         +"'"+resule[n]["host"]+"' , "+
                         +"'"+resule[n]["visite"]+"' , "+
                         +"'"+resule[n]["time"]+"' , "+
                         +"'"+resule[n]["concede"]+"' , "+
                         +"'"+resule[n]["victory"]+"' , "+
                         +"'"+resule[n]["victory1"]+"' , "+
                         +"'"+resule[n]["draw"]+"' , "+
                         +"'"+resule[n]["draw1"]+"' , "+
                         +"'"+resule[n]["defeat"]+"' , "+
                         +"'"+resule[n]["defeat1"]+"' , "+
                         +"'"+resule[n]["num"]+"'"+
                         +") , ";
          if(n+1 < resule.length){ //還有資料
            update(resule,n+1);    //處理下一筆
          }
          else{
            
            sql_insert = sql_insert.substring(0,sql_insert.length -1); //刪掉,  
            
            con.query(sql_insert, function (error, insertrow) {
              if (error) throw error;
              
                console.log("新增幾筆資料"+count);
                alz.push({"insertNumber":count});//記錄新增幾筆資料
              
              callback(alz);   //資料處理完
            }); //新增資料
          }   
        }        
        else{   //資料存在，更新
          
          if(row["num"] != resule[n]["num"]){    //更新競猜人數
            var sql_update ="UPDATE "+ 
                              "game "+ 
                            "SET "+ 
                              "num='"+resule[n]['num']+" ' "+ 
                            "WHERE "+ 
                            "id='"+row['id']+" ' "; 
               
          } 
            con.query(sql_update, function (error, updaterow) {   //更新資料
             console.log("更新資料");
              if (error) throw error;
              
              alz.push({"updateId":updaterow["id"]});//紀錄更新資料的id
              
              if(n+1 < resule.length){ //還有資料
                update(resule,n+1); //處理下一筆
              }
              else{
                callback(alz);   //資料處理完
              }
            });
          
        }  
      });
  //return alz; //回傳更新資料的id & 新增幾筆資料
}

function catech(body){
  var regex = /<tbody>(.*)<\/tbody>/;
  var tbody = regex.exec(body);
  
  var resuldate = [];
  var date = [];
  var data = [];
  var resule = [];
  regex = /<td colspan="6"><span class="moreIcon"><\/span>(.*?) 每次竞猜选择一个选项下注/g;
 // console.log(regex);
  while(date = regex.exec(tbody[1])){
    
    resuldate.push(date[1]);//date 日期
  } 
  //console.log(resuldate[1]);
  
  //抓一天賽事
  
  var tr = [];
  var moreindex ;
  
  for(var i=0; i<resuldate.length ; i++) {
    
    moreindex = i+1;
    regex = new RegExp('<tr class="moreContent more'+moreindex+'" style="display: table-row">(.*?)<\/tr>','g');

    //console.log(regex);
    var resulday = [];
    while(tr = regex.exec(tbody[1]) ){

      resulday.push(tr[1]);
      //console.log(tr[1]);
    } 
    for(var j = 0; j < resulday.length; j++){
      
      //抓主隊
      var host = [];
      regex = /<span class="ht">(.*)<\/span>vs/g;
      //console.log(regex);
      host = regex.exec(resulday[j]);
     // console.log(host[1]);
      
      //抓客隊
      var visite = [];
      regex = /<span class="at">(.*?)<\/span>/g;
      //console.log(regex);
      visite = regex.exec(resulday[j]);
      //console.log(visite[1]);
      
      //抓時間
      var time = [];
      regex = /<td class="time">(.*?)<\/td>/g;
      //console.log(regex);
      time = regex.exec(resulday[j]);
      //resultime.push(time[1]);
     // console.log(time[1]);
      
      //抓讓球
      var concede = [];
      regex = /<span class="rq2".*?>(.*?)<\/span>/g;
      //console.log(regex);
      concede = regex.exec(resulday[j]);
      //resulconcede.push(concede[1]);
      //console.log(concede[1]);
      
      //抓人數
      var num = [];
      regex = /<td class="num">(.*?)人竞猜<\/td>/g;
      //console.log(regex);
      num = regex.exec(resulday[j]);
      //resulnum.push(num[1]);
     // console.log(num[1]);
      
      //抓勝
      var resulvictory = [];
      var victory = [];
      regex = /<span>胜(.*?)<input/g;
      //console.log(regex);
      while(victory = regex.exec(resulday[j])){
        
        resulvictory.push(victory[1]);//victory[1] victory[2]
      } 
     // console.log(resulvictory[0]);
     // console.log(resulvictory[1]);
      
      //抓平
      var resuldraw = [];
      var draw = [];
      regex = /<span>平 (.*?)<input/g;
      //console.log(regex);
      while(draw = regex.exec(resulday[j])){
        
        resuldraw.push(draw[1]);//draw[1] draw[2]
      } 
     // console.log(resuldraw[0]);
     // console.log(resuldraw[1]);
      
      //抓負
      var resuldefeat = [];
      var defeat = [];
      regex = /<span>平 (.*?)<input/g;
      //console.log(regex);
      while(defeat = regex.exec(resulday[j])){
        
        resuldefeat.push(defeat[1]);//defeat[1] defeat[2]
      } 
     // console.log(resuldefeat[0]);
     // console.log(resuldefeat[0]);
      
      //賽事
      var race = [];
      regex = /class="leagueName".*?>(.*?)<\/span><\/td>/g; 
      race = regex.exec(resulday[j]);
     // console.log(race[1]);
    
      data.push({
        "date":resuldate[i],
        "race":race[1],
        "host":host[1],
        "visite":visite[1],
        "time":time[1],
        "concede":concede[1],
        "num":num[1],
        "victory":resulvictory[0],
        "victory1":resulvictory[1],
        "draw":resuldraw[0],
        "draw1":resuldraw[1],
        "defeat":resuldefeat[0],
        "defeat1":resuldefeat[1] 
      });
    }
    
  } 
  return data;
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
